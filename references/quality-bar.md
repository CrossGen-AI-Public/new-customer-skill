# The quality bar

The finished site must stand next to `examples/contenthub-landing-1440.png` (and `-390.png`) without
looking like the cheaper one. That page is the bar because it was built with this method: a Dribbble
layout led, a three.js scene was derived from the brand, copy came verbatim from the source, and every
link was real. Nothing about it is a template; only its standard carries over.

What "the same quality" means, checked one by one at the gate:

| Quality | How it is checked |
|---|---|
| A layout borrowed from a chosen reference, executed fully, not approximated | `BRIEF.md` "Direction" names the lead shot; the 1440 screenshot is compared to it side by side |
| A hero scene that is exotic, unique and state of the art: built from this client's world with a named 2026 technique, matching no WebGL cliché and no earlier run's composition | `references/three-hero.md` §0, §1 and §4 |
| Display type with real hierarchy: serif or display face for the headline, one accent phrase, a kicker | craft checklist "Type"; no default 400/700 weights |
| Colour from the brand, deep and lit, never flat grey or black sections | craft checklist "Color"; tokens listed with their sources |
| Copy that is theirs: verbatim headlines, their numbers, their names | `slop_scan.py` clean; every string traces to `research/` or `scrape/` |
| Every link goes somewhere real | `scripts/links.sh` zero failures on the built file and on the deployed URL |
| No console errors anywhere, WebGL included | `scripts/console.sh` zero at 1440 and 500 |
| No horizontal overflow from 320 to 1300 | `scripts/sweep.sh` zero |
| Phone-first: hero, nav sheet, cards and footer all composed at 390, not squeezed | 390 screenshots of home and every inner page, looked at |
| Motion that helps: hero entrance stagger, scroll reveals from a visible state, reduced-motion respected | craft checklist "Motion"; still frame screenshot |
| A floating card or proof strip carrying real engine output | `engine.js` tests green; the card's numbers appear in `scripts/test.sh` output |
| An assistant that is a real model answering with engine numbers | `chat-drive.js` transcript read |

If any row cannot be checked, the site is not done. If a row is checked and the page still looks
worse than the bar, the usual cause is one of: a reference chosen but not followed, a hero that is
decoration rather than the client's world, or type set at defaults. Fix that before adding anything.
