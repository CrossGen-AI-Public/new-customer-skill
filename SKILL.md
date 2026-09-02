---
name: new-customer
description: One-shot a pitch-ready rebuild of a prospect's website with an AI feature, the way the Kind Lending mock-up was built on 2026-09-02. Give it a company and a URL; it crawls their current site for every page, feature and verbatim line, researches the industry and how competitors use AI, picks a design direction (their own brand at Mercury-level craft, or a reference you hand it), builds a single-file mobile-first site with an AI assistant whose numbers come from a deterministic engine, screenshots it, publishes an artifact, pushes a repo to CrossGen-AI-Public, and can deploy to sparky through the cg pipeline. Use when someone says "new customer", "we have a first meeting with X, build them something", "recreate their site with AI", or "do what we did for Kind Lending".
---

# New customer

You are handed a prospect. Three hours later there is a site their CEO can open, an AI feature that
does something real, a repo, and a link. This skill is the Kind Lending run turned into a procedure.
Do not skip phases; do not invent facts; every number the AI shows must come from code you wrote.

Usage: `/new-customer <Company> <https://their-site> [design reference URL] [--deploy] [--hours N]`

## Phase 0. Set up (2 minutes)

- Project dir `~/<slug>/` with `research/ scrape/ site/`. Write `BRIEF.md` (who, why, the one thing
  the page must do, hard constraints, deadline). Update it at every phase; decisions that live only
  in the conversation die with the context window.
- If the user gave a deadline, budget: research 25%, build 50%, polish and delivery 25%.
- Screenshots come from headless Chrome (`scripts/shot.sh`). Its minimum window width is 500px, so
  "mobile" means 500, not 390. Do not chase overflow bugs below 500.

## Phase 1. Research, in parallel (15 minutes wall clock)

Launch four agents at once with the prompts in `references/research-prompts.md`, substituting the
company, URL and industry:

1. **Crawl** — run `scripts/crawl.sh <url> <project>/scrape` yourself first (it needs no agent),
   then send the agent to turn `scrape/pages/*.md` into `inventory/features.md` (every page type,
   every form with exact fields, every third-party embed, every external portal link),
   `inventory/nav-and-footer.md`, `inventory/brand.md` (hex colors by frequency, fonts, logo), and
   `assets/` (logo, favicon, hero imagery).
2. **Evidence pass** — verbatim headlines, product copy, CTAs, legal footer, founder quotes with
   sources, review counts and 3-4 verbatim reviews, leadership, tech stack, recent news.
3. **AI in this industry** — who does what with AI on their site or app, claimed results,
   unsolved customer pain points with sources, the compliance guardrails an AI feature must respect.
4. **Domain facts and demo data** — the numbers a deterministic engine needs (limits, rates, rules
   of thumb, local market figures), and the best interactive-AI UX patterns from adjacent industries.

While they run, look at the prospect's site yourself (`scripts/shot.sh`) and, if a design reference
was given, screenshot or fetch it. Dribbble blocks fetches; DesignRush write-ups usually carry the
images.

Save every report under `research/` with sources. Nothing enters the site without a source.

## Phase 2. Decide the AI feature (5 minutes)

Pick one feature and write the decision into `BRIEF.md` with the three reasons a CEO would buy it:

- It attacks a pain point the research documented, with a number.
- **A rules engine computes, the model only talks.** Write `site/engine.js` first: pure functions,
  constants at the top with their dates and sources, a smoke test. This is the compliance story
  and the reason the demo cannot hallucinate a price, rate, dose, or deadline.
- It ends with a person: a named human handoff, never a dead end.

Guardrails from `references/ai-feature.md` apply to every industry: disclose it is AI, label
estimates, no promises, human path on every screen, industry-specific licence numbers visible.

## Phase 3. Design direction (5 minutes)

Default: the prospect's own font, palette and motif, executed at the level of detail in
`references/craft-checklist.md` (distilled from mercury.com's shipped CSS). If the user hands a
reference, take its structure and craft, never its colors. Write the plan as tokens before code:
4-6 named hex values, the type family and four weights, the radius language, the one motion idea.
Keep their real photography where it exists; a mascot (see `templates/site/dog.js`) only if the
brand already has one or the user asks.

Run every visual and verbal decision past the site-spike references
(`~/.claude/skills/site-spike/references/`): no purple gradients, no icon rows, no invented
metrics, sentence case, real sentences.

## Phase 4. Build (the bulk of the time)

Copy `templates/` into the project and fill them in this order:

1. `site/data.js` — every string verbatim from `research/` and `scrape/`. Programs, reviews,
   people, locations, legal, links to their real portals. No lorem, no placeholders.
2. `site/engine.js` — the domain math. Test it with node before anything renders.
3. `site/index.html` — tokens, then the shell: header with mega menus, mobile sheet, footer with
   the full legal line and every external portal link. One `<title>`, one `<h1>` per page.
4. `site/app.js` — hash router and page renderers. The homepage follows the Mercury architecture
   mapped onto their content: thesis hero, four-card overview, portrait testimonials, alternating
   product rows with UI mocks showing real numbers, founder quote, three-step getting started,
   stats, trust, press, final CTA. Every inner page from the feature inventory gets a renderer,
   even if short: the promise is "not one feature missing".
5. `site/guide.js` — the AI assistant, three modes picked at load: claude.ai artifact (`sample`),
   the server's `/api/guide`, or a guided form on the same engine. Same numbers in all three.
6. `server.js` + `site/brain.js` — the zero-dependency proxy. Anthropic API if a key exists,
   `claude -p` otherwise.
7. `build.sh` inlines everything into `dist/index.html` and the root `index.html`.

Then the gate: `scripts/test.sh` green, `slop_scan.py` findings fixed or recorded as deliberate
exceptions, `scripts/shot.sh` at 1440 and 500 on home plus three inner pages, one look, one pass of
fixes. Class-name collisions and `const` globals that never reach `window` were the two bugs that
bit the Kind build; check both.

## Phase 5. Deliver (10 minutes)

- Repo in `CrossGen-AI-Public/<Name>-Mockup` (that is the org the team's accounts can create in),
  `README.md`, commit, push, enable GitHub Pages from `main` root.
- Publish `dist/index.html` as an artifact with `capabilities: {sample: {}}` so the AI runs live.
- `--deploy`: `/cg:repo-init` files are already in the templates; register on sparky exactly as the
  Kind run did (`references/sparky-deploy.md`), ship with `/cg:ship`, enable the poll timer.
- Report in the client-brief voice: results, decisions, blockers. Links first. Then the two or
  three decisions you are least sure about, named, so the honing round has something to push on.
- Save a project memory: repo, artifact, engine constants and their dates, where the research lives.

## What this skill does not do

- It does not run without a real URL to crawl. A page built on invented specifics is worse than no page.
- It does not commit files it did not create. Other sessions may write into `research/`.
- It does not deploy to sparky without the user saying so; the artifact and Pages are enough for a first meeting.
