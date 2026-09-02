# Templates (from the Kind Lending build, 2026-09-02)

Copy the whole folder into the new project, then:
- Replace `APPNAME`, `REPO`, `PORT`, `CLIENT`, `CLIENT-SITE`, `ESCALATION_CONTACT` in the .service, .yml, CLAUDE.md, deploy.sh.
- `gitignore` → `.gitignore`.
- `site/*.example.*` are Kind's real files, kept as worked examples of the shape: engine (pure math with dated constants), data (verbatim content only), brain (system prompt + 3 tools), app (hash router + Mercury-architecture homepage + one renderer per inventory page), index (tokens + shell + CSS). Write the new ones from scratch against them; do not search-and-replace a mortgage lender into a dentist.
- `site/guide.js` and `site/dog.js` are generic and can be used as-is; edit the SYSTEM prompt and tools in guide.js to match brain.js exactly.
- `server.js` requires `./site/brain.js` exporting `{SYSTEM, TOOLS, runTool}`.
- `scripts/test.sh` engine assertions must be rewritten for the new engine.
