#!/usr/bin/env bash
# Redeploy after a merge. Runs on sparky in the production checkout, which the bot has already
# refreshed to origin/main. Two targets, both idempotent:
#   1. sparky: rebuild the single-file site, refresh the user service on :PORT (Tailscale only)
#   2. droplet: ssh to crossgen-droplet and run scripts/deploy-droplet.sh (public kind.crossgen-ai.com)
# Fails loudly if either copy does not answer /health.
set -euo pipefail
cd "$(dirname "$0")/.."
./build.sh
mkdir -p "$HOME/.config/systemd/user"
cp ops/APPNAME.service "$HOME/.config/systemd/user/APPNAME.service"
systemctl --user daemon-reload
systemctl --user enable --now APPNAME.service >/dev/null 2>&1 || true
systemctl --user restart APPNAME.service
ok=0; for i in $(seq 1 10); do sleep 1; if curl -sf "http://127.0.0.1:${PORT:-PORT}/health" | grep -q ok; then ok=1; break; fi; done
[ "$ok" = 1 ] || { echo "APPNAME: sparky service did not become healthy" >&2; systemctl --user status APPNAME.service --no-pager | tail -20 >&2; exit 1; }
echo "APPNAME: sparky healthy on :${PORT:-PORT} ($(git rev-parse --short HEAD))"

if [ "${SKIP_DROPLET:-}" != 1 ]; then
  ssh -o BatchMode=yes -o ConnectTimeout=15 crossgen-droplet 'bash -s' < scripts/deploy-droplet.sh
fi
