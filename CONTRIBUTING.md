# Start contributing

Use Node 24.21.0 / npm 11.19.0. With mise installed, `mise install` resolves the repository pins. Otherwise install those versions using your normal runtime manager.

```sh
npm ci --prefix prototype
npm run check --prefix prototype
npm run dev --prefix prototype -- --host 127.0.0.1
```

Open the URL printed by Vite. Routes: `/`, `/community/`, `/engineering/`, `/agency-use/`. All new interactions are local and reversible.

## Files to edit

- Homepage: `prototype/src/lib/content/home.svelte.md`
- Community layout: `prototype/src/lib/components/CommunityHub.svelte` (Open House branch) and `CommunityFrame.svelte`
- Community sources: `prototype/src/lib/community/data.json`; retain dates and direct comment links. The inherited article Markdown supports source details. Narrative weekly summaries are in the dataset; do not imply a feed refresh when editing a summary.
- New placeholders: `prototype/src/lib/components/PlanningPage.svelte` and `prototype/src/lib/styles/planning.css`
- Overview: root `index.html` and `style.css`
- Theme initialization: `prototype/src/app.html`; preserve base-path handling in links.

## Build the Pages version

```sh
npm run build
npm run preview
```

Preview at http://127.0.0.1:4115/fedramp-design-concepts/ . The build script checks and builds the prototype with the repository prefix, then replaces only `i13-open-house/`. Review both source and generated changes. Pushing to main publishes; use a branch/PR unless direct publication is authorized. Do not restore retired builds unless requested.

## Review checklist

Inspect phone and desktop, light and dark. Try task/stage selection, outline disclosures, checkboxes and Clear choices; reload to confirm no saved answers. Check keyboard focus, sticky Top links, official exits, navigation between home/community/resources, no-JS reading, reduced motion and 200% text. Keep placeholder status visible. Existing inherited-page compiler warnings must remain visible; no new warnings should be introduced.

## Design hypotheses and next work

Recognition through a stable Radiance landing page; participation before the feed in Open House; weekly synthesis over a raw stream; direct source trails down to comments; provider tasks versus agency decision context; disclosure for depth without burying orientation. These are hypotheses, not measured outcomes.

Next: review the two outlines with intended users, choose the first worked example and agency worksheet, source and review substantive copy, define editorial ownership for weekly editions, then test complete navigation tasks. No participant findings have been collected in this iteration.

Validation results are recorded in the overview at delivery. Automated checks are not an accessibility certification or physical-device study.

## Iteration 13 delivery checks — October 8, 2026

19 root-path browser cases and 53 public-path/overview cases passed. Chromium, Firefox and WebKit covered phone/desktop themes, keyboard skip links, local selection/reset, outline disclosure, Top navigation, no-JS reading and 200% text. Static link review resolved 71,763 destinations across 1,545 built HTML pages. Compiler check: zero errors, 73 inherited warnings. Repository tooling: 26 tests passed. A clean copy of the included contributor source installed and rebuilt successfully using the documented commands.

A separate self-review inspected complete phone/desktop captures. No participant or physical-device testing; no claim of production readiness. The original lab retains detailed reports and screenshots. Iteration 12 was subsequently removed from the repository and Pages at the user’s request; the validation above describes the Iteration 13 delivery.
