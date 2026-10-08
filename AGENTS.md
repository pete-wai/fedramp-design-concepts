# Contributing to the FedRAMP planning prototypes

This is basic prototyping for interactive planning, not the official FedRAMP service. Iteration 13 develops **Open House** from Iteration 12. The Radiance homepage, participation-led Community Hub, and clearly labeled Engineering Resources / Agency Use placeholders form one connected experiment.

## Start here

Read README.md and CONTRIBUTING.md. Edit `prototype/src/` and `prototype/static/`; edit root `index.html` / `style.css` for the overview. `i13-open-house/` is generated output. `i12-*` and `archive/iteration-12/` are frozen comparisons. Earlier iterations live in Git history, not this checkout.

Use Node 24.21.0 and npm 11.19.0 (mise.toml). Run `npm ci --prefix prototype`, then `npm run check --prefix prototype`. Preview with `npm run dev --prefix prototype -- --host 127.0.0.1`. `npm run build` regenerates only the current Pages build. `npm run preview` serves the complete collection locally. Commit source and regenerated output together; pushing main publishes through GitHub Pages. Do not publish unless the task authorizes it.

## Skills and working context

The original lab uses these skills; their intent also applies to human contributors:

- **Impeccable:** preserve the selected design, make hierarchy and interactions purposeful, inspect complete mobile/desktop renders and both themes.
- **Svelte code writer + core best practices:** Svelte 5 runes, semantic markup, scoped styles, accessible controls; run compiler checks and analyze changed components when the skill is available.
- **FedRAMP public writing:** plain language, clear provider/agency paths, exact source links. Use the FedRAMP MCP status and full source documents for new factual claims when available. Record source date and authority; if unavailable, keep text explicitly illustrative instead of inventing requirements.

These skills were project-local authoring aids, not runtime dependencies. No skill installation is needed to build. Do not use subagents in this project. Complete a separate self-review and describe it honestly.

## Boundaries

Preserve official logos and purple/orange light/dark styles. Keep homepage landscape and Open House community structure unless the task names them for revision. Community data is frozen as of October 4, 2026; weekly editions are examples, not an active publishing service. Keep placeholder labels next to proposed content. Checkboxes are local demonstrations, not readiness or authorization results.

Do not change inherited Marketplace/RFC bodies or data semantics. Link to official documentation rather than copying or restyling it. Do not add analytics, collect user data, fabricate endorsements, or imply certification. Keep source evidence notes and private research out of published files.

Before delivery: check build, keyboard, links, responsive reflow, both themes, no-JS reading and reduced motion. Record actual checks and remaining limitations in CONTRIBUTING.md. Freeze delivered comparisons; make a successor for a new iteration.
