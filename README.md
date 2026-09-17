# new-customer

A Claude Code skill that one-shots a pitch-ready rebuild of a prospect's website with an AI assistant, the way the Kind Lending mock-up (CrossGen-AI-Public/Kindlending-Mockup, 2026-09-02) and the ContentHub landing (2026-09-10) were built. Industry, layout reference, hero scene and copy are all derived from the prospect's own site; nothing is fixed to an industry.

## Install

```
git clone https://github.com/CrossGen-AI-Public/new-customer-skill.git ~/.claude/skills/new-customer
```

Restart Claude Code, then run `/new-customer <Company> <https://their-site> [design reference URL] [--deploy] [--hours N]`.

## Requirements

On the machine running the skill:

- Claude Code with the Chrome extension or headless Google Chrome installed (Chrome does the crawl, the Dribbble reference pull, and every screenshot; set `CHROME=` if it is not at the default Mac path).
- Python 3, Node, curl, git, and the `gh` CLI (for the repo push and GitHub Pages).
- Write access to the CrossGen-AI-Public GitHub org for the repo step.

Without `--deploy` the run ends with the published artifact, the local site, and the repo. `--deploy` additionally needs SSH access to sparky and the public droplet; the model credentials (`GUIDE_AI_*`) live on those boxes and are never in this repo. `references/sparky-deploy.md` has the runbook.

## Layout
- `SKILL.md`: the five-phase procedure.
- `scripts/`: crawl (sitemap, core pages to text, brand assets), Dribbble reference pull for the derived industry, headless WebGL screenshots, and the gate: `gate.sh` runs `links.sh` (dead links, placeholders, missing anchors), `console.sh` (console and THREE errors), `sweep.sh` (overflow 320-1300), `resize.sh` (live width changes 1300-320-1300 with no reload), screenshots, and the slop scanner.
- `references/`: the site-spike copy and design tells (`site-spike/`), the quality bar (the ContentHub landing, with its screenshots and hero.js under `examples/`), the three.js hero method, craft checklist (from mercury.com's CSS), Dribbble reference method, the engine-computes-model-talks AI pattern with guardrails by industry, research prompts, the sparky and droplet deploy runbook.
- `templates/`: server with three model backends (OpenAI-compatible, Anthropic, claude -p), three-mode assistant, mascot, tests, deploy scripts, service unit, handoff manifest, and Kind's real files as worked examples.
