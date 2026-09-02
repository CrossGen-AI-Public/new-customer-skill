# CLIENT mock-up

Concept rebuild of CLIENT-SITE for a CrossGen AI pitch, with the assistant, an AI loan advisor. One built HTML file (`dist/index.html`) plus a zero-dependency Node server that serves it and proxies the chat to Claude.

## CrossGen process
This repo follows the CrossGen shared dev process: `/cg:process` explains tiers and stages. Work on a branch, then `/cg:ship`; the bot on sparky reviews, tests, merges on green, and redeploys.
- Test command: `bash scripts/test.sh` (syntax, engine math, build, server smoke). No network, no secrets.
- Tier 2 changes (new feature or behaviour) need an ADR in `docs/adr/` via `/cg:adr` before shipping.
- Production: sparky, `~/CrossGen/apps/APPNAME`, user service `APPNAME.service` on port PORT (Tailscale only). `scripts/deploy.sh` is what the bot runs after every merge.

## Things the code cannot tell you
- Every string in `site/data.js` is verbatim from CLIENT-SITE or cited research in `research/`. Do not invent CLIENT facts, numbers, or reviews.
- the assistant never computes money. `site/engine.js` does (2026 Orange County limits, Freddie Mac rates as of the date in `RATES.asOf`). The model only talks and picks which engine function to call. Keep it that way; it is the compliance story.
- `site/guide.js` picks a mode at load: claude.ai artifact (`sample`), the server's `/api/guide`, or the guided form. All three produce the same numbers.
- `server.js` uses the Anthropic Messages API when `ANTHROPIC_API_KEY` is set, otherwise `claude -p` on the host's own login. Same JSON contract either way.
- `build.sh` inlines `site/*.js` into `dist/index.html`; `dist/` and the root `index.html` are committed so GitHub Pages and the artifact can serve them without a build step.
