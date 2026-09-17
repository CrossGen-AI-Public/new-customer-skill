# The 20 visual tells

Each is banned **as a default**. Deliberate use with a stated, client-specific reason is
allowed and must be written into the build notes. Reaching for one without a reason is the
failure this file exists to prevent.

"Why it reads AI" is the same answer every time at bottom: it is the highest-probability
choice, so it signals that no choice was made. The specific harm is listed anyway, because
knowing the harm tells you what to do instead.

---

### 1. Purple-to-blue gradient
The single strongest tell. Also the default of every AI product's own marketing, so it now
reads as "made by AI" rather than "made with taste".
**Instead:** pull colour from the client's actual world - their product, their materials, their
industry's documents, their photographs. Flat colour is not a downgrade. If you want depth, get
it from a photograph, a paper texture, or a real two-colour print logic.

### 2. Gradient hero text
`background-clip: text` on a headline. Costs contrast, costs legibility at small sizes, and
signals that the headline could not carry itself.
**Instead:** make the headline carry itself - size, weight, measure, and a line break in the
right place. One flat colour.

### 3. Emojis in headings
Reads as a chat message, not as a designed page. Screen readers announce them. They are also
the first thing a client's own marketing lead deletes.
**Instead:** nothing, usually. If a section genuinely needs a mark, use a real icon set that
matches the type, or a numeral, or a rule.

### 4. Inter everywhere
Inter is a good typeface. That is why it is on everything, and why it now carries no
information. Same problem, increasingly, with Geist.
**Instead:** choose type from the Step 2 source. A grotesk with actual character (Söhne, Untitled,
Neue Haas, National), a workhorse serif, a mono for a technical client, a humanist for a care
client. System stacks (`-apple-system`, `ui-serif`) are an honest choice and load instantly.
Always ship a real fallback stack.

### 5. Colored border cards
The `border-l-4 border-blue-500` callout box, usually four of them in different colours for no
semantic reason.
**Instead:** if the content is a list, set it as a list. If it is a table, set it as a table.
Colour should mean something - status, category, brand - or not appear.

### 6. Glassmorphism cards
`backdrop-filter: blur()` over a gradient. Costs contrast, costs paint performance, means nothing.
**Instead:** solid surfaces. Separate them with space, a hairline rule, or a genuine change of
background. Depth from a real shadow scale used sparingly, or from none at all.

### 7. Low-contrast dark mode
Grey text on near-black. It looks moody in a screenshot and is unreadable on a laptop in daylight.
**Instead:** 4.5:1 minimum for body text, measured, not eyeballed. The scanner checks explicit
pairs. Dark mode is a design of its own, not the light design with the values flipped.

### 8. Three icon boxes in a row
The universal "features" section. Three abstract icons, three two-word titles, three sentences of
nothing.
**Instead:** say the three things in prose, or in a real comparison table, or show one thing
properly with a screenshot or photo. If there are five things, show five. The count should come
from the content, not from the grid.

### 9. Badge above the headline
The little pill: "✨ Now in beta", "Backed by Y Combinator", "AI-powered". Almost always empty.
**Instead:** cut it. If the fact matters (a real award, a real customer count) put it in the
headline or immediately under it as a plain sentence.

### 10. Lucide icons everywhere
Nothing wrong with Lucide - but the default set, at the default weight, on every element, is a
signature. Icons multiply because they are easy, not because they help.
**Instead:** use far fewer. Where you do, make sure the weight and terminals match your type.
Consider none at all - a page with zero icons reads as more confident than one with twenty.

### 11. Untouched shadcn UI
Default radius, default border, default `bg-card`, default everything. Recognisable at a glance
to anyone who has seen a demo in the last two years.
**Instead:** if you use it, change the primitives first - radius, border colour, shadow scale,
type scale, spacing scale, focus ring. Or hand-write the twelve elements the page actually needs,
which for a one-page spike is usually less work.

### 12. Fade-in on scroll
Every section rising 20px and fading in. Delays content, fights the user's scroll, and is applied
uniformly precisely because no one decided where emphasis goes.
**Instead:** nothing moves by default. If motion earns its place, use it once, for one thing, for
a reason - and honour `prefers-reduced-motion`.

### 13. Cursor-following beam
The radial gradient chasing the mouse. Decoration with no relationship to the content, and it is
invisible on every touch device.
**Instead:** cut it. If the page needs energy, get it from type scale contrast, from a real image,
or from colour - things that survive a screenshot.

### 14. Buttons that fade on hover
`hover:opacity-80` on everything. It is the hover state you get when you did not design one.
**Instead:** design the state: a real colour change, a background fill, a border shift, a small
translation. Same for focus - keyboard users need a visible ring, and it should not be the browser
default if the rest of the page is considered.

### 15. Inconsistent spacing
`mt-4` here, `py-7` there, a random `mb-10`. Reads as arbitrary because it is.
**Instead:** declare a scale in custom properties at the top of the file and use only those values.
Vertical rhythm between sections should be one or two values, not seven.

### 16. Em dashes everywhere
The most-cited prose tell, and it shows up in headlines and captions too.
**Instead:** a comma, a full stop, or a colon. Rewrite the sentence so it does not need the pause.
See `copy-tells.md` #14.

### 17. Generic buzzword copy
"Seamlessly leverage cutting-edge solutions to unlock your potential." Says nothing, applies to
anyone, fails the swap test instantly.
**Instead:** the client's own sentences, real numbers, named customers, concrete nouns. See
`copy-tells.md` in full - it is the longer answer to this one line.

### 18. Serif italic accents
One italic serif word dropped into a sans headline for "elegance". It is a stock move now, and it
usually pairs two typefaces that were never designed to meet.
**Instead:** if you want emphasis, get it from weight, size, colour, or position. If you want two
typefaces, pair them for a reason and use the second one consistently, not as garnish.

### 19. Space Grotesk + Instrument Serif
The specific pairing that marks a page as generated. Same for Satoshi + Playfair, and Cal Sans
with anything.
**Instead:** see #4. Pick from the source. If you cannot say why the pairing fits this client,
use one typeface well.

### 20. Grain over a gradient
Noise overlay on a mesh gradient. It was a real technique, then it became the texture preset, and
now it is the tell.
**Instead:** if you want texture, use a real one - scanned paper, a halftone from the client's own
print material, a photograph. Or let flat colour be flat.

---

## What to reach for instead, generally

- **Real photographs**, even imperfect ones. One honest photo of the actual team, product, or
  place outperforms any illustration system.
- **Type doing the work.** A page can be one typeface, two sizes, and one colour and still be the
  best-looking thing the client has.
- **A structure borrowed from outside the web.** Index, ledger, spread, timetable, plate, form.
  This is where a page gets a point of view.
- **Density where it belongs.** Real information - specs, prices, dates, names - is more
  persuasive than whitespace around a slogan.
- **One asymmetry.** Something that does not sit on the obvious grid, on purpose, once.
- **Nothing at all.** Cutting a section is a design decision and usually the right one.
