# new-customer

A Claude Code skill that one-shots a pitch-ready rebuild of a prospect's website with an AI assistant, the way the Kind Lending mock-up was built (CrossGen-AI-Public/Kindlending-Mockup, 2026-09-02).

Install: clone into `~/.claude/skills/new-customer` (laptop or sparky). Run: `/new-customer <Company> <https://their-site> [design reference] [--deploy]`.

- `SKILL.md`: the five-phase procedure.
- `scripts/`: crawl (sitemap, core pages to text, brand assets), headless screenshots with an overflow check, the slop scanner.
- `references/`: craft checklist (from mercury.com's CSS), the engine-computes-model-talks AI pattern with guardrails by industry, research prompts, the sparky and droplet deploy runbook.
- `templates/`: server with three model backends (OpenAI-compatible, Anthropic, claude -p), three-mode assistant, mascot, tests, deploy scripts, service unit, handoff manifest, and Kind's real files as worked examples.
