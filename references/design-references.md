# Design references from Dribbble

Dribbble blocks curl and WebFetch but renders in headless Chrome, so `scripts/dribbble.sh "<industry>"
<out>` drives Chrome through three searches ("<industry> website", "<industry> landing page",
"<industry> web design") and saves:
- `results-<query>.png`: the results grid, one per search, for a fast visual scan.
- `shots.md`: title and URL of the top shots per search.
- `img/`: the full-size images of those shots, downloaded from Dribbble's CDN.

## How to use them
1. Read the three results screenshots first. Mark the shots that match the client's positioning
   (premium vs friendly, dense vs airy, photographic vs illustrated). Ignore anything that is a
   dashboard or a mobile app unless the client's product is one.
2. Open the two or three chosen images with Read and write, per shot, one line each: hero structure,
   how product UI is framed, section rhythm, one detail worth stealing (a stat strip, a testimonial
   treatment, a way of showing a process).
3. Borrow structure and craft only. The palette and the type come from the client's brand. If a shot's
   colors are what made it attractive, note the effect (contrast, warmth, one accent) and reproduce the
   effect with the client's colors.
4. Put the shot URLs and the notes in `BRIEF.md` under "Direction" so the honing round can point at them.

## When a user hands a reference
If the user gives a Dribbble URL (as with the Outcrowd "Deed" shot for Kind), it joins the set and
usually leads. DesignRush write-ups often carry the same images when a shot page will not load.

## What a reference is not
- A source of content, numbers, or product names.
- A palette.
- A licence to add a section the client's research does not support.
