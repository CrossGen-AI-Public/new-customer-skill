# Deploying a mock-up to sparky through the cg pipeline

What was done for Kind Lending on 2026-09-02. Sparky = `ssh sparky@100.117.164.79` (Tailscale,
`spark-ec58`). It has Claude Code installed and logged in (`~/.local/bin/claude`), node 24 via nvm
at `~/.nvm/versions/node/v24.11.1/bin`, the handoff bot at `~/.crossgen-handoff/`, and no Anthropic
API key in the environment. Internal apps run as user systemd services from `~/CrossGen/apps/<name>`.

## Contributor side (laptop), once per repo
1. Templates already include `crossgen-handoff.yml`, `.github/PULL_REQUEST_TEMPLATE.md`,
   `docs/adr/`, `CLAUDE.md`, the standard `.gitignore` (carve out real brand assets with `!scrape/assets/**`),
   `scripts/test.sh`, `scripts/deploy.sh`, `ops/<name>.service`. Fill `<name>`, `<slug>`, port.
2. Labels: `gh label create ready-to-ship --color 0E8A16` and `needs-attention --color D93F0B`.
3. Work on a branch. `bash scripts/test.sh` green locally. Commit by path (never `git add -A`;
   other sessions write into `research/`). Push. `CG_YES=1 bash <cg-ship script>` or `/cg:ship`.

## Admin side (sparky), once per repo, over ssh
```
export PATH=$HOME/.nvm/versions/node/v24.11.1/bin:$HOME/.local/bin:$PATH
gh repo clone CrossGen-AI-Public/<Repo> ~/CrossGen/apps/<name> ; cd there; git checkout main; git pull --ff-only   # prod checkout, clean, on main
gh repo clone CrossGen-AI-Public/<Repo> ~/.crossgen-handoff/repos/<name>                                       # bot's own clone
cd ~/.crossgen-handoff/repos/<name> && git checkout -B verify origin/<branch> && bash scripts/test.sh && git checkout main && git branch -D verify   # verify test_cmd
cat > ~/.crossgen-handoff/repos.d/<name>.env   # REPO_SLUG, PERMISSIONS=none, TEST_CMD, DEPLOY_CMD, DEPLOY_TARGET=sparky, SPARKY_PATH=~/CrossGen/apps/<name>, DANGER_NOTE, ESCALATION_CONTACT
curl http://100.117.164.79:8767/health   # ok
systemctl --user enable --now crossgen-handoff-poll@<name>.timer   # per-repo poll; enabling it also starts the first run
bash ~/.crossgen-handoff/bin/orchestrator.sh run <name>            # or wait for the timer
```
The bot reviews (claude -p, opus), runs `test_cmd` in its clone, self-heals, merges on green,
refreshes `SPARKY_PATH` to origin/main, runs `deploy_cmd` there. `scripts/deploy.sh` builds,
installs `ops/<name>.service` into `~/.config/systemd/user/`, restarts it, and fails unless
`/health` answers within 10s.

## Result
`http://100.117.164.79:<port>/` on the tailnet. The AI chat runs through sparky's Claude login
(`claude -p`, ~20s a turn). Drop `ANTHROPIC_API_KEY=` into `~/.config/<name>.env` and restart the
service to switch to the API (~3s a turn); the unit file already reads that EnvironmentFile.

## Public copy on the droplet (so GitHub Pages and the artifact hit a real model)
The droplet (crossgen-ai.com, ssh alias `crossgen-droplet` from sparky) runs Docker apps behind Caddy
(`/root/proxy/Caddyfile`, containers by name on the `web` network, no host ports). Wildcard DNS
`*.crossgen-ai.com` already points there, so a new subdomain needs no DNS work. An Anthropic API key
lives in `/srv/apps/codehawk/.env`; copy the line on the box into `/srv/apps/<name>/.env` (chmod 600,
never print it). `templates/scripts/deploy-droplet.sh` clones, builds the Dockerfile, swaps the
container, appends the Caddy block, reloads Caddy and health-checks. `scripts/deploy.sh` calls it over
ssh after the sparky restart, so the bot redeploys both copies on every merge. The page carries
`<meta name="kind-guide-api" content="https://<name>.crossgen-ai.com">`; `guide.js` probes same-origin
first, then that, and the server's CORS allowlist covers github.io, claude.ai, claudeusercontent.com
and *.crossgen-ai.com. Result: every copy of the site, including Pages and the artifact, talks to Claude
through the API in about 3s a turn, and the guided form only appears when no model is reachable and
says so on screen.
