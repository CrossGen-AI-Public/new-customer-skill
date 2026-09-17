---
name: new-customer
description: One-shot a pitch-ready rebuild of a prospect's website with a real AI assistant, the way the Kind Lending mock-up (2026-09-02) and the ContentHub landing (2026-09-10) were built. Give it a company and a URL, nothing else; it crawls their current site, derives their industry and audience from what it finds, researches how that industry uses AI, pulls layout references for that industry from Dribbble and follows one as the lead, builds a single-file mobile-first site in the client's own brand with a three.js hero derived from their world and an assistant whose numbers come from a deterministic engine and whose words come from CrossGen's hosted model, then runs a full test gate (dead links, console errors, overflow, screenshots, chat drive) before publishing an artifact, pushing a repo to CrossGen-AI-Public, and deploying to sparky and the public droplet. Use when someone says "new customer", "we have a first meeting with X, build them something", "recreate their site with AI", or "do what we did for Kind Lending / the ContentHub landing".
---

# New customer

You are handed a company and a URL. A few hours later there is a site their CEO can open on any
device, an AI assistant that is genuinely a model answering, a repo, and links. This is the Kind
Lending run and the ContentHub landing turned into one procedure. Five rules sit above everything:

1. **Nothing is mocked or pretended.** The assistant is always a real model. There is no scripted
   fallback that looks like chat. If no model is reachable, the assistant says it is offline and points
   at a person. Numbers come from an engine you wrote, never from the model.
2. **Everything derives from this client.** Industry, colors, type, motif, the hero scene, copy, the AI
   feature, the engine's domain, the design references: each one traces to a file under `research/` or
   `scrape/` for this client. Nothing is carried from Kind Lending, ContentHub, or any earlier build,
   and nothing in this skill assumes an industry. The templates are shapes, not content.
3. **Real links only.** Every link resolves: external URLs answer, routes exist, anchors exist. Anything
   you cannot verify is left out, not guessed. Demo-only surfaces (forms that do not submit) are labeled
   on screen. `scripts/links.sh` proves it; you do not.
4. **The bar is the ContentHub landing, for its originality.** `references/quality-bar.md` and
   `references/examples/contenthub-landing-1440.png`. A Dribbble layout leads, the copy is theirs, the
   type has hierarchy, and the three.js hero is exotic, unique and state of the art: a scene that could
   only be this client's, built with a named 2026 technique, matching no WebGL cliché and never the
   composition of an earlier run (`references/three-hero.md` §0). Not "a clean site": that one.
5. **One shot, no questions.** The user runs the skill and comes back to links. Every judgment call is
   made from the research and written into `BRIEF.md` as an assumption. Ask nothing mid-run; list the
   two or three shakiest assumptions in the report instead.

Usage: `/new-customer <Company> <https://their-site> [design reference URL] [--deploy] [--hours N]`

## Phase 0. Set up (2 minutes)

- Project dir `~/<slug>/` with `research/ scrape/ site/`. Write `BRIEF.md` (who, why, the one thing
  the page must do, hard constraints, deadline). Update it at every phase.
- Budget: research 25%, build 45%, gate and fixes 15%, delivery 15%.
- Screenshots come from headless Chrome with WebGL on (`scripts/shot.sh`) and the multi-width sweep
  (`scripts/sweep.sh`). Test real phone widths (320, 360, 390, 430) through the iframe runner, not just
  Chrome's 500px floor.

## Phase 1. Research, in parallel (15 minutes wall clock)

Run these yourself first, in this order; the second depends on the first:
1. `scripts/crawl.sh <url> <project>/scrape` (sitemap, core pages to text, brand assets, colors, fonts).
2. **Derive the industry.** Read `scrape/pages/home.md` and the nav, then write
   `research/industry.md`: the industry as a designer would type it into a search box (two or three
   words: "education platform", "residential landscaping", "marine electronics"), the audience, the
   region, what they sell, and the three verbatim lines that told you so. Every later step reads this
   file; nothing in the skill supplies an industry of its own.
3. `scripts/dribbble.sh "<industry from research/industry.md>" <project>/research/dribbble` (searches
   "<industry> landing page", "<industry> website", "<industry> web design", "<industry> hero section":
   results screenshots, shot list with URLs, full-size images).
4. `scripts/shot.sh <url> <project>/research/current-site.png 1440x3000` (their site as it is today).

Then launch four agents at once with the prompts in `references/research-prompts.md`, substituting the
company, URL, industry and region from `research/industry.md`: crawl-to-inventory, evidence pass, AI
in this industry, domain facts and demo data. Save every report under `research/` with sources.
Nothing enters the site without one.

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
promises, human path on every screen, whatever proof this industry publishes (licences, certifications,
ratings) visible.

## Phase 3. Design direction (10 minutes)

1. **Pick the lead shot.** Open `research/dribbble/results-*.png` and the images in
   `research/dribbble/img/`. Choose ONE shot whose layout the homepage will follow (the way the "Lumina"
   hillside shot led ContentHub) and one or two supporting shots for section treatments. Record URLs
   and, per shot, what is borrowed: hero composition, where the copy and the floating card sit, section
   rhythm, one detail. Borrow structure and craft; never colors or type. If the user handed a reference
   URL, it is the lead.
2. **Derive the hero scene.** Write three candidate concepts per `references/three-hero.md` §1
   (source, picture, technique, one motion), reject clichés and anything that resembles an earlier
   run, and build the most exotic survivor. The scene must read as unique to this client and state of
   the art; a landscape with an object on it, particles, a network or a globe fails before it is built.
3. The palette, the font, the motif come from the client's own site and brand (`scrape/inventory/brand.md`,
   `research/` evidence). Execute them at the level of detail in `references/craft-checklist.md`.
4. Write the plan as tokens before code: 4-6 named hex values with where each came from, the type family
   and four weights (a display or serif face for the headline if the lead shot uses one), the radius
   language, the one motion idea, the mascot only if the brand has one.
5. Run the plan through the site-spike references (`references/site-spike/`, copied from the site-spike skill) and the
   client-derivation audit: for every decision, one sentence "why this, for them". A decision without a
   sentence is a default; replace it.

Record the lead shot, the hero scene lines and the audit in `BRIEF.md` under "Direction".

## Phase 4. Build (the bulk of the time)

Copy `templates/` into the project and fill them for this client, in this order:
1. `site/data.js`: every string verbatim from `research/` and `scrape/`. No lorem, no placeholders,
   no invented reviews or numbers.
2. `site/engine.js`: this client's domain math, tested with node before anything renders.
3. `site/index.html`: tokens, then the shell: header with mega menus built from their nav, mobile
   sheet, footer with their full legal line and every real external link. One `<title>`, one `<h1>`
   per page. The `kind-guide-api` meta tag becomes `<name>.crossgen-ai.com`. The hero section holds a
   `<canvas id="scene">` over a finished CSS fallback, and loads three r160 UMD before `hero.js`.
4. `site/hero.js`: the winning concept, built to `references/three-hero.md` §2 (two budgets, custom
   shaders, reduced-motion still, pause off-screen, quiet fallback). Read
   `references/examples/contenthub-hero.js` for mechanics only; its composition is banned. Write this
   client's scene from scratch and answer §4's honest question before moving on.
5. `site/app.js`: hash router and one renderer per page type in the feature inventory. The homepage
   follows the lead shot's layout, with the craft checklist's architecture filling in what the shot
   leaves out.
6. `site/brain.js` and the matching prompt in `site/guide.js`: the assistant's rules for this client.
   Two run modes only: claude.ai artifact (`sample`) and the server API. Offline notice otherwise.
7. `server.js`, `Dockerfile`, `scripts/`, `ops/`: from the templates, names replaced.
8. `build.sh` inlines everything into `dist/index.html` and the root `index.html`.

## Phase 4b. Gate (not optional, not shortened)

`scripts/gate.sh <project> "<routes>"` runs everything and prints one PASS/FAIL table:
- `scripts/test.sh` (engine) green.
- `scripts/links.sh`: every href and src on every route. External URLs answer, hash routes exist,
  anchors exist, no `href="#"`, no placeholder domains, no missing files. Zero failures.
- `scripts/console.sh`: every route at 1440 and 500 with WebGL on. Zero console errors, zero THREE
  messages, zero failed resources.
- `scripts/sweep.sh`: every route from 320 to 1300 inside the iframe runner. Zero overflow.
- Screenshots of every route at 1440 and 500 with the hero rendered, plus 390 through the runner.
- `slop_scan.py` findings fixed or recorded as deliberate exceptions.

Then look, with `references/quality-bar.md` open: the 1440 home screenshot next to the lead shot and
next to `references/examples/contenthub-landing-1440.png`; the 390 screenshots of home and every inner
page. Fix what falls short of the bar, re-run the gate, repeat until the table is all PASS and the look
holds. Then drive a real chat turn through the deployed page (`scripts/chat-drive.js`) and read the
answer: the model must call the engine and the reply must be plain text with the engine's numbers.
After deploy, run `scripts/links.sh <deployed-url> "<routes>"` again; a link that works from a file
and fails from the droplet is still dead.

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
  assumptions you are least sure about, named. Then what is demo-only (forms, handoff) in one line.
  Attach the gate table and the `research/gate/` folder path.
- Save a project memory: repo, URLs, engine constants and dates, lead shot, where the research lives.

## What this skill does not do

- Run without a real URL to crawl. A page built on invented specifics is worse than no page.
- Ask the user anything mid-run. Assume, record, report.
- Ship a chat that answers without a model, ever.
- Ship a page with a red row in the gate table, or a hero that is a WebGL cliché, a re-skin of an earlier run, or decoration rather than the client's world.
- Reuse a previous client's palette, type, mascot, engine, hero scene, or copy.
- Commit files it did not create; other sessions may write into `research/`.
