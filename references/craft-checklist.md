# Craft checklist (what "Mercury-level detail" actually means)

Distilled from mercury.com's shipped CSS bundle on 2026-09-02 (research/mercury/ in the Kind repo).
Apply these to the prospect's own brand. None of them are a look; all of them are care.

## Type
- One family, four deliberate weights, none of them 400/700 defaults. Kind used Montserrat at 500 body, 640 UI, 740 headings, 780 display via `wght@100..900`.
- Fluid display sizes: `clamp(38px, .75rem + 4.4vw, 76px)`. Headings step across breakpoints; body steps once.
- Tracking tightens as size grows: +2% at 12px labels, 0 at 24px, -2.5% at 52px, -3.5% at 76px.
- Line height 1 on display, 1.06 on h2, 1.2 on h3, 1.5 on body. `text-wrap: balance` on headings, `pretty` on body.
- Eyebrows: 12.5px, uppercase, +10% tracking, `font-feature-settings: "liga" 0, "clig" 0`, a dot before them.
- Sentence case everywhere. Running text 58-65ch. Tabular numerals wherever digits align.
- Metric-matched fallback stack so nothing shifts while the webfont loads.

## Color and elevation
- 4-6 named tokens from the client's world. Neutrals biased toward the accent hue, never pure grey.
- Elevation from hairlines and alpha surfaces, not shadows: `inset 0 0 0 1px var(--line-2)` on cards; one real shadow reserved for the single floating object (a phone, a window mock).
- Dark sections in a deep version of the brand's primary, not black.
- Semantic colors (ok/warn/bad) separate from the accent and never counted as it.

## Layout
- Container 1200px, gutters 32px desktop 24px mobile, one spacing scale (4/8/12/16/24/32/48/64/96/128) used everywhere.
- Section rhythm 96px desktop, 64px mobile. Radius language: 14/24/32/40 plus pill.
- Every repeated object composed once: same padding, same corner, same place for the recurring element.
- Wide content scrolls inside its own container; the body never scrolls sideways.

## Components
- Header 76px, sticky, hairline appears on scroll. Mega menus with icon, title, one-line description; open on hover and focus-within, 250ms ease-out from `translateY(8px) scale(.98)`.
- Primary button: pill, brand accent, a slow shine sweep (`4.5s linear`, one pass every cycle), lifts 2px on hover, arrow nudges 3px.
- Secondary: paper with hairline; ghost on dark with alpha surface.
- Forms: 14px radius inputs, focus ring in the soft accent, radio chips that fill when checked.
- Product mocks: a window with three dots, real data rows, pills for state, a progress bar that fills once on load. Real numbers from the engine, never "1,234".

## Motion
- Hero entrance: eyebrow, headline, lede, form, proof rise in at 80ms intervals with `cubic-bezier(.28,1.1,.74,1)` over .8s, from opacity .001 (never 0: the still frame must read).
- Scroll reveals from a visible resting state: add `.pre` only to elements below the fold, remove it on intersection, stagger siblings 70ms.
- One ambient idea, not five: floating bubbles with cursor parallax, a marquee that pauses on hover, a mascot with a real run cycle.
- `prefers-reduced-motion`: everything static, mascot sits.

## Page architecture (homepage)
1. Thesis hero: one line that is theirs, one action, one proof strip.
2. "Everything in one place": four cards, each ending in a link.
3. Testimonials: three, verbatim, with a portrait or initial.
4. Alternating product rows with UI mocks; the AI feature first.
5. Founder quote with source.
6. Loan/product ledger or equivalent catalogue.
7. Stats on dark, hairline dividers, tabular numerals.
8. Trust: licences, insurance, who answers the phone.
9. Press: four cards, source in caps, headline in brand.
10. Final CTA on the primary color with three routes.
11. Footer: five columns, every external portal, the full legal line, the industry seal.

## The gate
- `scripts/sweep.sh dist/index.html "<routes>"` runs every route at 320 to 1300 inside an iframe (Chrome's own floor is 500px) and fails on any horizontal overflow. Zero is the bar; Kind needed grid minimums capped at the container, buttons allowed to wrap under 420px, mega menus capped at the viewport and right-aligned near the edge, and `overflow-x: clip` on html as well as body (iOS ignores body-only).
- `scripts/chat-drive.js` types two real questions into the deployed page over CDP and screenshots the answers. Read them: the engine must have been called and the reply must be plain text with the engine's numbers.
- `slop_scan.py` from site-spike, fix or record exceptions.
- Swap test, hand test, source test, read-aloud test (site-spike Step 4).
- Two bugs that bit the Kind build: a class name reused for two things (`.rev`), and a module declared with `const` that never reached `window`. Grep for both.
