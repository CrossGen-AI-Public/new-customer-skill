// Biscuit, the Kind Boston terrier. Inline SVG, side view, with a run cycle, a sit pose, a bark, and a wag.
// KIND_DOG.mount(container, opts) returns a controller: run(), sit(), bark(), setX(px), flip(dir).
const KIND_DOG = (() => {
  const SVG = `
<svg class="dog" viewBox="0 0 200 140" width="200" height="140" aria-hidden="true">
  <defs><clipPath id="dogHead"><circle cx="146" cy="54" r="31"/></clipPath></defs>
  <g class="dog-shadow" style="transform-origin:100px 128px"><ellipse cx="100" cy="128" rx="54" ry="7" fill="#000" opacity=".12"/></g>
  <g class="dog-body" style="transform-origin:100px 100px">
    <!-- sit haunch (only in sit) -->
    <g class="haunch" opacity="0"><ellipse cx="72" cy="98" rx="30" ry="24" fill="#1f2024"/><rect x="60" y="106" width="34" height="14" rx="7" fill="#1f2024"/><ellipse cx="94" cy="121" rx="11" ry="6" fill="#fff"/></g>
    <!-- back legs -->
    <g class="leg leg-bl" style="transform-origin:66px 88px"><rect x="58" y="82" width="16" height="40" rx="8" fill="#1f2024"/><ellipse cx="66" cy="122" rx="10" ry="6" fill="#fff"/></g>
    <!-- tail -->
    <g class="tail" style="transform-origin:52px 70px"><path d="M52 72 C 40 62, 36 50, 44 44" stroke="#1f2024" stroke-width="10" stroke-linecap="round" fill="none"/></g>
    <!-- torso: compact, chesty -->
    <path d="M50 74 C 50 50, 76 44, 104 44 L 128 46 C 142 50, 144 96, 130 102 L 66 106 C 52 106, 48 92, 50 74 Z" fill="#1f2024"/>
    <!-- chest blaze -->
    <path d="M100 104 C 104 86, 118 74, 132 74 C 142 84, 142 100, 128 102 Z" fill="#fff"/>
    <!-- front legs -->
    <g class="leg leg-fr" style="transform-origin:122px 90px"><rect x="114" y="84" width="16" height="40" rx="8" fill="#1f2024"/><ellipse cx="122" cy="124" rx="10" ry="6" fill="#fff"/></g>
    <g class="leg leg-br" style="transform-origin:82px 88px"><rect x="74" y="84" width="16" height="40" rx="8" fill="#1f2024"/><ellipse cx="82" cy="124" rx="10" ry="6" fill="#fff"/></g>
    <g class="leg leg-fl" style="transform-origin:106px 90px"><rect x="98" y="86" width="16" height="40" rx="8" fill="#1f2024"/><ellipse cx="106" cy="126" rx="10" ry="6" fill="#fff"/></g>
    <!-- collar: band across the neck, in front of the torso, behind the head -->
    <path d="M118 62 C 126 78, 140 86, 154 84" stroke="#ff671d" stroke-width="10" stroke-linecap="round" fill="none"/>
    <circle cx="152" cy="86" r="7" fill="#fcc900" stroke="#1f2024" stroke-width="1.5"/>
    <!-- head -->
    <g class="head" style="transform-origin:146px 64px">
      <path class="ear ear-back" d="M124 40 L 116 8 L 144 28 Z" fill="#1f2024" style="transform-origin:130px 34px"/>
      <path class="ear ear-front" d="M156 30 L 170 0 L 178 34 Z" fill="#1f2024" style="transform-origin:164px 30px"/>
      <path d="M158 30 L 169 8 L 174 32 Z" fill="#ffbba6" opacity=".9"/>
      <circle cx="146" cy="54" r="31" fill="#1f2024"/>
      <g clip-path="url(#dogHead)"><path d="M146 22 C 152 36, 154 52, 160 86 L 118 86 C 132 62, 134 40, 146 22 Z" fill="#fff"/></g>
      <ellipse cx="163" cy="68" rx="20" ry="15" fill="#fff"/>
      <ellipse cx="174" cy="62" rx="8" ry="6" fill="#1f2024"/>
      <path d="M167 72 C 169 78, 175 78, 177 74" stroke="#1f2024" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path class="tongue" d="M167 78 c 2 9, 11 9, 11 0" fill="#ff8a8a" opacity="0"/>
      <g class="eyes">
        <circle cx="136" cy="52" r="7" fill="#fff"/><circle cx="137.5" cy="53" r="4" fill="#1f2024"/><circle cx="139" cy="51" r="1.5" fill="#fff"/>
        <circle cx="160" cy="50" r="7.5" fill="#fff"/><circle cx="161.5" cy="51" r="4.2" fill="#1f2024"/><circle cx="163" cy="49" r="1.6" fill="#fff"/>
      </g>
      <g class="lids" opacity="0"><rect x="128" y="44" width="16" height="9" rx="4" fill="#1f2024"/><rect x="152" y="42" width="17" height="9" rx="4" fill="#1f2024"/></g>
    </g>
  </g>
  <g class="woof" opacity="0" style="transform-origin:180px 20px">
    <rect x="160" y="-12" width="52" height="28" rx="14" fill="#fff" stroke="#1f2024" stroke-width="2"/>
    <text x="186" y="8" text-anchor="middle" font-family="Montserrat, system-ui, sans-serif" font-weight="800" font-size="14" fill="#1f2024">woof</text>
  </g>
</svg>`;

  const CSS = `
.dog-wrap{position:absolute;left:0;bottom:0;width:200px;height:140px;pointer-events:none;will-change:transform;transform:translate3d(0,0,0)}
.dog-wrap.hit{pointer-events:auto;cursor:pointer}
.dog-wrap .dog{overflow:visible;display:block}
.dog-wrap.flip .dog{transform:scaleX(-1)}
.dog-wrap .dog *{transition:opacity .15s}
/* run cycle */
.dog-wrap.run .leg-fr{animation:dogleg .42s ease-in-out infinite}
.dog-wrap.run .leg-bl{animation:dogleg .42s ease-in-out infinite}
.dog-wrap.run .leg-fl{animation:dogleg .42s ease-in-out infinite reverse}
.dog-wrap.run .leg-br{animation:dogleg .42s ease-in-out infinite reverse}
.dog-wrap.run .dog-body{animation:dogbob .42s ease-in-out infinite}
.dog-wrap.run .ear-front{animation:dogear .42s ease-in-out infinite}
.dog-wrap.run .ear-back{animation:dogear .42s ease-in-out infinite reverse}
.dog-wrap.run .tail{animation:dogtail .21s ease-in-out infinite alternate}
.dog-wrap.run .dog-shadow{animation:dogshadow .42s ease-in-out infinite}
@keyframes dogleg{0%{transform:rotate(38deg)}50%{transform:rotate(-38deg)}100%{transform:rotate(38deg)}}
@keyframes dogbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes dogear{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
@keyframes dogtail{from{transform:rotate(-14deg)}to{transform:rotate(18deg)}}
@keyframes dogshadow{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.82)}}
/* idle: sit, wag, blink */
.dog-wrap.sit .leg-bl,.dog-wrap.sit .leg-br,.dog-wrap.sit .tail{opacity:0}
.dog-wrap.sit .haunch{opacity:1}
.dog-wrap.sit .dog-body{transform:rotate(-14deg) translate(6px,2px)}
.dog-wrap.sit .leg-fr,.dog-wrap.sit .leg-fl{transform:rotate(12deg)}
.dog-wrap.sit .head{transform:rotate(8deg)}
.dog-wrap.sit .haunch{animation:none}
.dog-wrap.sit .tongue{opacity:1}
.dog-wrap .lids{animation:dogblink 4.2s infinite}
@keyframes dogblink{0%,94%,100%{opacity:0}96%,98%{opacity:1}}
/* bark */
.dog-wrap.bark .woof{animation:dogwoof .9s ease-out 1}
.dog-wrap.bark .head{animation:doghead .3s ease-out 2}
@keyframes dogwoof{0%{opacity:0;transform:scale(.4) translateY(6px)}20%{opacity:1;transform:scale(1.05) translateY(-2px)}70%{opacity:1;transform:scale(1) translateY(-4px)}100%{opacity:0;transform:scale(1) translateY(-10px)}}
@keyframes doghead{0%,100%{transform:rotate(0)}50%{transform:rotate(-10deg) translateY(-3px)}}
@media(prefers-reduced-motion:reduce){.dog-wrap *{animation:none!important}}`;

  function mount(container, opts = {}) {
    if (!document.getElementById("dog-css")) { const s = document.createElement("style"); s.id = "dog-css"; s.textContent = CSS; document.head.appendChild(s); }
    const el = document.createElement("div"); el.className = "dog-wrap hit"; el.innerHTML = SVG; container.appendChild(el);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = { x: opts.startX ?? 80, target: null, dir: 1, mode: "run", speed: opts.speed ?? 260, raf: 0, last: 0, idleAt: 0, bounds: () => [0, container.clientWidth - 200] };
    const scale = opts.scale ?? 1;
    const draw = () => { el.style.transform = `translate3d(${st.x}px,0,0) scale(${scale})`; el.classList.toggle("flip", st.dir < 0); };
    const setMode = (m) => { if (st.mode === m) return; st.mode = m; el.classList.toggle("run", m === "run"); el.classList.toggle("sit", m === "sit"); };
    const step = (t) => {
      const dt = Math.min(0.05, (t - st.last) / 1000 || 0); st.last = t;
      const [minX, maxX] = st.bounds();
      if (st.mode === "run") {
        if (st.target != null) {
          const d = st.target - st.x;
          if (Math.abs(d) < 6) { st.target = null; setMode("sit"); st.idleAt = t + 2600 + Math.random() * 2000; }
          else { st.dir = d > 0 ? 1 : -1; st.x += st.dir * st.speed * 1.35 * dt; }
        } else {
          st.x += st.dir * st.speed * dt;
          if (st.x > maxX) { st.x = maxX; st.dir = -1; } else if (st.x < minX) { st.x = minX; st.dir = 1; }
          if (Math.random() < 0.0025) { setMode("sit"); st.idleAt = t + 1800 + Math.random() * 2200; }
        }
      } else if (st.mode === "sit" && t > st.idleAt) { setMode("run"); }
      draw();
      st.raf = requestAnimationFrame(step);
    };
    const ctl = {
      el,
      run() { setMode("run"); },
      sit() { setMode("sit"); st.idleAt = Infinity; },
      bark() { el.classList.remove("bark"); void el.offsetWidth; el.classList.add("bark"); setTimeout(() => el.classList.remove("bark"), 1000); },
      goTo(px) { st.target = Math.max(0, Math.min(container.clientWidth - 200, px - 100)); setMode("run"); },
      setDir(d) { st.dir = d; },
      destroy() { cancelAnimationFrame(st.raf); el.remove(); },
    };
    el.addEventListener("click", (e) => { e.stopPropagation(); ctl.bark(); if (st.mode === "sit") { st.idleAt = 0; } });
    if (reduced) { setMode("sit"); st.x = Math.max(0, container.clientWidth * 0.62); draw(); return ctl; }
    setMode("run"); draw(); st.raf = requestAnimationFrame(step);
    if (opts.follow !== false && matchMedia("(hover:hover)").matches) {
      let lastCall = 0;
      container.addEventListener("click", (e) => { const r = container.getBoundingClientRect(); ctl.goTo(e.clientX - r.left); ctl.bark(); });
      container.addEventListener("mousemove", (e) => { const now = performance.now(); if (now - lastCall < 900) return; lastCall = now; const r = container.getBoundingClientRect(); if (e.clientY - r.top > r.height * 0.55) ctl.goTo(e.clientX - r.left); });
    }
    return ctl;
  }
  return { mount, SVG, CSS };
})();
window.KIND_DOG = KIND_DOG;
if (typeof module !== "undefined") module.exports = KIND_DOG;
