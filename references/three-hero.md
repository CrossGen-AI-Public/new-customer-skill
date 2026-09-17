# The three.js hero: exotic, unique, state of the art

Every site this skill produces opens on a three.js scene that could not exist for any other client and
does not look like anything on a template site. That is what made the ContentHub landing (2026-09-10)
worth remembering: not the hill, not the mark on the crest, but that a custom WebGL piece was built
from scratch for that subject. `examples/contenthub-hero.js` is here for technique only. **Its
composition is banned:** no landscape with an object standing on a crest, no dusk sky with a glowing
thing in the middle, no ring of nodes on a hill. A run that reproduces that shape with different parts
has failed the brief (2026-09-13, after the CrossGen run did exactly that).

## 0. The brief, in three words

**Exotic.** The viewer has not seen this before. If the concept could be described as "particles",
"a network", "floating shapes", "a globe", "a grid of dots", "a gradient blob", or "a landscape",
it is not exotic. Those are the WebGL clichés of every AI-built site.

**Unique.** It could only belong to this client. Someone who knows the company should recognise
their world in it within a second; a competitor could not reuse it by changing the colours.

**State of the art.** It uses a technique that shows real craft in 2026: custom GLSL, GPGPU or
instanced simulation, signed-distance raymarching, procedural or data-driven geometry, a
post-processing look (bloom, depth of field, chromatic edge), physically plausible light. A
`MeshStandardMaterial` on primitives with a point light is not enough.

## 1. Derive three concepts, build the most exotic one that is still theirs

Write three candidate concepts in `BRIEF.md` under "Hero scene", each in four lines:
- **Source:** the thing in the client's world this comes from, citing a `research/` or `scrape/`
  file. Their product, their process, their material, their instrument, their data, their
  place, their mark. Not their industry in general.
- **The picture:** one sentence a designer could sketch. Say what the viewer is looking at and
  from where.
- **The technique:** the specific state-of-the-art method, named (e.g. "raymarched SDF of the
  mark with subsurface scattering", "GPGPU flow field of 200k particles following the process
  map", "instanced procedural geometry with a custom vertex deformation", "displacement-mapped
  surface lit by an HDR-style gradient with bloom").
- **The one motion:** what changes over time, and what the pointer does. One idea.

Then reject: any concept that matches the cliché list in §0; any concept whose picture could
serve another company in the same industry; any concept whose picture resembles a previous
run's hero (ContentHub's hill, CrossGen's ring on foothills). Build the most exotic of what
survives. If nothing survives, write three more. Record the winner and why the other two lost.

Composition follows the lead Dribbble shot for where the copy, CTAs and the floating card sit;
the scene itself does not follow the shot's imagery.

## 2. Build rules (the mechanics; the look comes from §0 and §1)

- **Loader:** three r160 UMD from cdnjs (`three.js/0.160.0/three.min.js`) for the single-file
  build, loaded before `hero.js`. If `window.THREE` is missing or `WebGLRenderer` throws, return
  quietly: the CSS behind the canvas (a gradient in the brand's deep colour) must already look
  finished. Screenshot that fallback once to prove it.
- **Two budgets:** `small = innerWidth < 720` picks the phone camera (wider FOV, higher, looking
  further up) and the phone counts (ContentHub: 36k blades desktop, 14k phone). Cap
  `setPixelRatio` at 1.75.
- **Sky as a shader dome:** a back-side sphere with a vertex-direction gradient (zenith, horizon,
  glow side) and fbm clouds driven by `uTime`. Fog matched to the horizon colour hides the ground
  plane's edge.
- **Ground as a displaced plane** with vertex colours from a height function, `MeshStandardMaterial`
  roughness 1. Keep the height function pure: the object's position is computed from it, so the
  object sits exactly on the surface.
- **Fields as InstancedMesh** with a custom vertex shader: sway by `uTime` + world position + a
  per-instance `aPhase`, bend weighted by `uv.y * uv.y` so roots stay planted, a pointer uniform
  that pushes instances aside. Flowers or particles in the client's secondary colours as a second
  instanced mesh (`#define FLOWER` branch in the same shader).
- **Lighting:** hemisphere (sky colour over ground colour), one directional key from behind for rim
  light, one point light in the accent colour at the object. Additive sprite halo behind the object.
- **Loop discipline:** `prefers-reduced-motion` renders one still frame (`render(2.5)`) and returns.
  An `IntersectionObserver` on the hero section stops the loop when it scrolls out and restarts on
  return. Resize re-fits the camera. Pointer moves lerp toward a target; nothing snaps.
- **Copy sits on the scene, not in it.** Kicker, display headline, lede, two CTAs, and a floating
  card (a real object from `engine.js`, never decorative numbers) placed where the lead shot puts
  them; below the fold on phones.
- **Post-processing is allowed and usually wanted:** three r160 UMD ships EffectComposer,
  UnrealBloomPass and RenderPass under `THREE.` only when their example files are loaded; in a
  single-file build, write the bloom or glow as a second render target and a custom fragment
  shader, or bake the glow into additive sprites and emissive shading. Budget it for phones.

## 3. Gotchas learned on ContentHub

- three r160 UMD defines `USE_INSTANCING_COLOR` in the vertex stage only; a custom fragment shader
  must declare its own `varying vec3 vColor` and guard with `#ifdef`.
- `#include <fog_pars_vertex>` / `<fog_vertex>` in custom shaders, or instanced things ignore the fog
  and float in front of the sky.
- Headless Chrome needs `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
  to render WebGL; `scripts/shot.sh` and `scripts/console.sh` already pass them. Without them the
  screenshot shows the fallback, which is useful exactly once.
- A shader compile error is silent on screen (black canvas) and loud in the console:
  `scripts/console.sh` fails on any `THREE.` line, so run it before looking at screenshots.
- The hero must be finished on a phone at 390 wide before it is finished at all: the object cannot
  hide behind the headline, the card cannot cover the CTAs, and the frame rate cannot stutter (drop
  instance counts, not the effect).

## 4. Acceptance for the hero

1. Still frame with reduced motion reads as a complete design.
2. Zero console lines from THREE at 1440 and 500.
3. Screenshot at 1440 and at 390 (iframe runner): the copy and card sit where the lead shot puts
   them; the scene is unmistakably this client's and matches nothing in §0's cliché list.
4. The three-concept derivation is in `BRIEF.md` with sources, the rejected two named, and the
   technique of the winner stated in one line a WebGL engineer would recognise.
5. The honest question, answered in `BRIEF.md`: "Would a designer who has seen a hundred
   AI-generated hero sections stop on this one?" If the answer is no, build the next concept.
