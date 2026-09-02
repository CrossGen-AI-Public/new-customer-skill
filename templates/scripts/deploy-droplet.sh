#!/usr/bin/env bash
# Deploy the public copy to the crossgen-ai.com droplet. Run ON the droplet (root):
#   ssh crossgen-droplet 'bash -s' < scripts/deploy-droplet.sh
# Mirrors the codehawk pattern (2026-08-14 remediation): no host port published, Caddy reaches the
# container by name on the `web` network, secrets live only in /srv/apps/APPNAME/.env on the box.
set -euo pipefail
NAME=APPNAME
DIR=/srv/apps/$NAME
REPO=https://github.com/CrossGen-AI-Public/REPO.git
HOST=APPNAME.crossgen-ai.com
CADDYFILE=/root/proxy/Caddyfile

# 1. source of truth: a git clone on main
# The folder may already exist (it holds .env before the first deploy), so init in place instead of cloning.
if [ ! -d "$DIR/.git" ]; then mkdir -p "$DIR"; git -C "$DIR" init -q; git -C "$DIR" remote add origin "$REPO"; fi
cd "$DIR" && git fetch -q origin main && git checkout -q -B main origin/main && git reset -q --hard origin/main
echo "source: $(git rev-parse --short HEAD)"

# 2. secrets: ANTHROPIC_API_KEY must already be in $DIR/.env (never committed, never printed)
[ -f "$DIR/.env" ] && grep -q '^ANTHROPIC_API_KEY=.\+' "$DIR/.env" || { echo "missing $DIR/.env with ANTHROPIC_API_KEY" >&2; exit 1; }

# 3. build + swap, keeping the previous image for rollback
docker image tag "$NAME:latest" "$NAME:previous" 2>/dev/null || true
docker build -q -t "$NAME:latest" "$DIR" >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --restart unless-stopped --network web --env-file "$DIR/.env" \
  -e PORT=3700 -e HOST=0.0.0.0 -e GUIDE_MODEL="${GUIDE_MODEL:-claude-sonnet-5}" "$NAME:latest" >/dev/null

# 4. Caddy route (idempotent)
if ! grep -q "^$HOST {" "$CADDYFILE"; then
  printf '\n%s {\n    reverse_proxy %s:3700\n}\n' "$HOST" "$NAME" >> "$CADDYFILE"
  docker exec proxy-caddy-1 caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || docker restart proxy-caddy-1 >/dev/null
  echo "caddy: added $HOST"
fi

# 5. health, in-container then through Caddy
for i in $(seq 1 15); do sleep 1; docker exec "$NAME" wget -qO- http://127.0.0.1:3700/health 2>/dev/null | grep -q ok && break; [ "$i" = 15 ] && { echo "container unhealthy" >&2; docker logs --tail 20 "$NAME" >&2; exit 1; }; done
for i in $(seq 1 20); do sleep 2; curl -sf -m 5 "https://$HOST/api/guide/health" >/dev/null 2>&1 && break; [ "$i" = 20 ] && echo "warning: https://$HOST not answering yet (TLS may still be provisioning)"; done
echo "$NAME: $(curl -sf -m 5 "https://$HOST/api/guide/health" 2>/dev/null || echo 'container up, public URL pending')"
