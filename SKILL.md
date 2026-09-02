---
name: new-customer
description: One-shot a pitch-ready rebuild of a prospect's website with a real AI assistant, the way the Kind Lending mock-up was built on 2026-09-02. Give it a company and a URL; it crawls their current site for every page, feature and verbatim line, researches their industry and how competitors use AI, pulls web-design references for that industry from Dribbble, builds a single-file mobile-first site in the client's own brand with an assistant whose numbers come from a deterministic engine and whose words come from CrossGen's hosted model, screenshots it, publishes an artifact, pushes a repo to CrossGen-AI-Public, and deploys to sparky and the public droplet. Use when someone says "new customer", "we have a first meeting with X, build them something", "recreate their site with AI", or "do what we did for Kind Lending".
---

# New customer

You are handed a prospect. A few hours later there is a site their CEO can open on any device, an AI
assistant that is genuinely a model answering, a repo, and links. This skill is the Kind Lending run
turned into a procedure. Three rules sit above everything else:

1. **Nothing is mocked or pretended.** The assistant is always a real model. There is no scripted
   fallback that looks like chat. If no model is reachable, the assistant says it is offline and points
   at a person. Numbers come from an engine you wrote, never from the model.
2. **Everything derives from this client.** Colors, type, motif, mascot, copy, the AI feature, the
   engine's domain, the industry references: each one traces to a file under `research/` or `scrape/`
   for this client. Nothing is carried from Kind Lending or any earlier build. The templates are shapes,
   not content.
3. **Real links only.** Every external link resolves to the client's actual page or portal. Anything you
   cannot verify is left out, not guessed. Demo-only surfaces (forms that do not submit) are labeled on screen.

Usage: `/new-customer <Company> <https://their-site> [design reference URL] [--deploy] [--hours N]`

## Phase 0. Set up (2 minutes)

- Project dir `~/<slug>/` with `research/ scrape/ site/`. Write `BRIEF.md` (who, why, the one thing
  the page must do, hard constraints, deadline). Update it at every phase.
- Budget: research 25%, build 50%, polish and delivery 25%.
- Screenshots come from headless Chrome (`scripts/shot.sh`) and the multi-width sweep in
  `references/craft-checklist.md`. Test real phone widths (320, 360, 390, 430) through the iframe runner,
  not just Chrome's 500px floor.

## Phase 1. Research, in parallel (15 minutes wall clock)

Run these yourself first, they need no agent:
- `scripts/crawl.sh <url> <project>/scrape` (sitemap, core pages to text, brand assets, colors, fonts).
- `scripts/dribbble.sh "<industry>" <project>/research/dribbble` (Dribbble web-design references for
  the client's industry: results screenshots, shot list with URLs, full-size images).
- `scripts/shot.sh <url> <project>/research/current-site.png 1440x3000` (their site as it is today).

Then launch four agents at once with the prompts in `references/research-prompts.md`, substituting the
company, URL, industry and region: crawl-to-inventory, evidence pass, AI in this industry, domain facts
and demo data. Save every report under `research/` with sources. Nothing enters the site without one.

## Phase 2. Decide the AI feature (5 minutes)

Pick one feature for this client and write the decision into `BRIEF.md` with the three reasons their CEO
would buy it:
- It attacks a pain point the research documented, with a number next to it.
- **A rules engine computes, the model only talks.** Write `site/engine.js` first for this client's
  domain: pure functions, constants at the top with dates and sources, a smoke test in `scripts/test.sh`.
- It ends with a person: a named human handoff, never a dead end.

The model is CrossGen's hosted one, the same endpoint and model crossgen-ai.com uses, configured by
`GUIDE_AI_URL`, `GUIDE_AI_KEY`, `GUIDE_AI_MODEL` (see `references/ai-feature.md`). Do not build a
"form mode", a canned-answer mode, or any path that answers without a model.

Guardrails from `references/ai-feature.md` apply per industry: disclose it is AI, label estimates, no
promises, human path on every screen, licence numbers visible.

## Phase 3. Design direction (10 minutes)

1. Open the Dribbble output: look at `research/dribbble/results-*.png` and the images in
   `research/dribbble/img/`. Pick two or three shots that fit this client's positioning and note their
   URLs and what specifically to borrow (a hero structure, a product-mock treatment, a section rhythm).
   Borrow structure and craft; never borrow their colors or type. If the user handed a reference URL,
   it joins the set.
2. The palette, the font, the motif come from the client's own site and brand (`scrape/inventory/brand.md`,
   `research/` evidence). Execute them at the level of detail in `references/craft-checklist.md`.
3. Write the plan as tokens before code: 4-6 named hex values with where each came from, the type family
   and four weights, the radius language, the one motion idea, the mascot only if the brand has one.
4. Run the plan through the site-spike references (`~/.claude/skills/site-spike/references/`) and the
   client-derivation audit: for every decision, one sentence "why this, for them". A decision without a
   sentence is a default; replace it.

Record the chosen references and the audit in `BRIEF.md` under "Direction".

## Phase 4. Build (the bulk of the time)

Copy `templates/` into the project and fill them for this client, in this order:
1. `site/data.js`: every string verbatim from `research/` and `scrape/`. No lorem, no placeholders,
   no invented reviews or numbers.
2. `site/engine.js`: this client's domain math, tested with node before anything renders.
3. `site/index.html`: tokens, then the shell: header with mega menus built from their nav, mobile
   sheet, footer with their full legal line and every real external link. One `<title>`, one `<h1>`
   per page. The `kind-guide-api` meta tag becomes `<name>.crossgen-ai.com`.
4. `site/app.js`: hash router and one renderer per page type in the feature inventory. The homepage
   follows the architecture in the craft checklist, mapped onto their content and the Dribbble picks.
5. `site/brain.js` and the matching prompt in `site/guide.js`: the assistant's rules for this client.
   Two run modes only: claude.ai artifact (`sample`) and the server API. Offline notice otherwise.
6. `server.js`, `Dockerfile`, `scripts/`, `ops/`: from the templates, names replaced.
7. `build.sh` inlines everything into `dist/index.html` and the root `index.html`.

Gate: `scripts/test.sh` green; `slop_scan.py` findings fixed or recorded as deliberate exceptions;
overflow sweep at 320 to 1300 with zero overflow; screenshots of home plus three inner pages at 1440
and at phone width; one look, one pass of fixes. Then drive a real chat turn through the deployed page
(the CDP script in `references/craft-checklist.md`) and read the answer: the model must call the engine
and the reply must be plain text with the engine's numbers.

## Phase 5. Deliver (15 minutes)

- Repo in `CrossGen-AI-Public/<Name>-Mockup`, README, commit by path, push, enable GitHub Pages.
- Model credentials: copy the three `GUIDE_AI_*` lines on the boxes (sparky `~/.config/<name>.env`,
  droplet `/srv/apps/<name>/.env`), never through the laptop. `references/sparky-deploy.md` has the
  commands.
- Deploy both copies from sparky: `bash scripts/deploy.sh`. Confirm `/api/guide/health` on sparky and
  on `https://<name>.crossgen-ai.com` both report the hosted model. GitHub Pages and the artifact then
  talk to the public endpoint.
- Publish `dist/index.html` as an artifact with `capabilities: {sample: {}}`.
- `docs/RUNBOOK.md` for the client-facing owner: URLs, redeploy, model switch, health checks.
- Report in the client-brief voice: results, decisions, blockers. Links first. Then the two or three
  decisions you are least sure about, named. Then what is demo-only (forms, handoff) in one line.
- Save a project memory: repo, URLs, engine constants and dates, where the research lives.

## What this skill does not do

- Run without a real URL to crawl. A page built on invented specifics is worse than no page.
- Ship a chat that answers without a model, ever.
- Reuse a previous client's palette, type, mascot, engine, or copy.
- Commit files it did not create; other sessions may write into `research/`.
