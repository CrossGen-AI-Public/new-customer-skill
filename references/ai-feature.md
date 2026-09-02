# The AI feature: engine computes, model talks

The pattern that made Kind Guide credible to a mortgage CEO, and the one Betterment shipped in 2026
for compliance reasons. Reuse it in every industry.

## Architecture
1. `site/engine.js`: pure functions, no DOM, no network. Constants at the top with the date and
   source of each (limits, rates, prices, rules of thumb). Exports `match(...)` (rank options with
   reasons and blockers), one affordability/sizing function, and `fmt`. A node smoke test runs in
   `scripts/test.sh` and fails if the math drifts.
2. `site/brain.js` (server) and the same text in `site/guide.js` (page): the SYSTEM prompt and
   three tools. The prompt's rules never change shape:
   - Never state a figure from memory; only report tool results. Ask for missing inputs instead.
   - Collect inputs in a fixed order; parse "10%", "800k", "$9,000 a month" sensibly.
   - Call the ranking tool as soon as the required inputs exist; call sizing first if they don't know the headline number.
   - After a result: top one or two options, the headline monthly/total figure, one reason, then the next step.
   - Every figure is an estimate. No approved/qualified/guaranteed. The human makes every decision.
   - Off-topic: one sentence, steer back. When ready: `handoff` with a two-sentence summary for the human.
3. Three run modes, chosen at load in `guide.js`, identical numbers in all three:
   - **artifact**: `claude.use("sample")` with tools executed in the page.
   - **api**: `POST /api/guide {messages}` to `server.js`, tools executed on the server; response `{text, toolResults:[{name,args,result}]}` rendered by the page.
   - **form**: six questions, same engine, when neither is available (GitHub Pages).
4. `server.js`: zero dependencies, three backends in priority order:
   - `GUIDE_AI_URL` + `GUIDE_AI_KEY` + `GUIDE_AI_MODEL`: any OpenAI-compatible chat-completions endpoint with function calling. This is what the crossgen-ai site uses (a hosted vLLM Qwen 3.6 35B at llm.agents-r-here.ai; the values live in the crossgen-site-api container env on the droplet and in `~/.config/<name>.env` on sparky). About 2-5s a turn. Thinking is disabled per request and tool inputs are validated server-side because the model sometimes emits empty arguments.
   - `ANTHROPIC_API_KEY`: Messages API with native tool use. About 3s.
   - neither: `claude -p --output-format json` on the host's Claude login with a JSON `{"say","call"}` protocol. About 20s. Fine for a demo, not for a public site.
   The default for a CrossGen demo is the first one: same model as our own site, one config file, no per-token bill.

## Guardrails by industry (put them on every screen, not in a footer)
- Any regulated advice (money, health, law, insurance): disclose AI up front; label every number an estimate, not an offer or diagnosis; licence or registration numbers visible wherever the assistant solicits; a human path on every screen; the licensed person makes the decision.
- Mortgage specifically: no rate or payment without APR-style disclosure language (Reg Z), company and originator NMLS visible (SAFE Act), no credit pull or lock, declines need specific reasons (ECOA), no paid referrals inside the flow (RESPA §8), AI disclosure laws in UT and CO.
- Healthcare: no diagnosis, no dosage, appointment or clinician handoff, HIPAA-safe (no PHI in prompts or logs).
- Legal: no advice on a specific matter, attorney handoff, jurisdiction stated.
- Ecommerce/services: prices and availability from the engine or a live feed only; never quote a price the model made up.

## Picking the feature (what a CEO buys)
- Attack a documented, unsolved pain with a number next to it (Kind: 40% of leads never contacted; after-hours leads wait 14h).
- Do the first ten minutes of the expert's job, then hand to the expert with the work already done.
- Show the architecture on the page: "every number is computed, not guessed" is the sentence that lands.
- Work after hours. That's where the lead volume is in every service business.

## What the research agents look for
- Named competitors' AI features with claimed results and URLs.
- Three unsolved pain points with sources.
- The compliance checklist for this industry.
- The engine's constants: limits, rates, prices, eligibility rules, with dates.
- Five UX patterns from adjacent industries (Zillow BuyAbility, Rocket AI-to-banker, Lemonade Maya, Wealthfront Path, Betterment's rules-then-LLM).
