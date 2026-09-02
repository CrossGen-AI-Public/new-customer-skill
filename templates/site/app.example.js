// Router + page renderers. Hash routes so the whole site ships as one file.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const L = KIND.links, E = KIND_ENGINE, fmt = E.fmt;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ext = (href, cls, text) => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${text}</a>`;
  const arr = `<span class="arr">&rarr;</span>`;

  // ---------- shared blocks ----------
  const triCTA = () => `
  <section><div class="wrap">
    <div class="sec-head"><div class="stack"><span class="eyebrow">ready to get started?</span><h2>Three ways in. Pick the one that feels right.</h2></div><p class="lede">Apply online, get a quote from a person, or just send a message. Every path ends with a Kind Ambassador.</p></div>
    <div class="tri">
      <a class="rv" href="${L.apply}" target="_blank" rel="noopener"><span class="bub sky" style="width:140px;height:140px;right:-40px;top:-40px"></span><b>Apply for a loan</b><span>Start your application online. About 15 minutes, no paperwork to print.</span><span class="go">&rarr;</span></a>
      <a class="rv" href="#/rate-quote"><span class="bub yellow" style="width:120px;height:120px;right:-30px;top:-40px;opacity:.5"></span><b>Quick rate quote</b><span>Tell us a little and a Kind loan officer gets back to you with real options.</span><span class="go">&rarr;</span></a>
      <a class="rv" href="#/contact"><span class="bub mint" style="width:140px;height:140px;right:-50px;top:-50px;opacity:.7"></span><b>Send us a message</b><span>New loan, existing loan, or servicing. Monday to Friday, 8am to 5pm PT.</span><span class="go">&rarr;</span></a>
    </div>
  </div></section>`;

  const statesBlock = () => `<div class="stack"><span class="eyebrow">we lend in the following states</span><div class="row">${KIND.states.map(([n, a]) => `<span class="chip">${n}</span>`).join("")}<span class="chip">+ 30 more, and DC</span></div><p class="small muted">Kind Lending is licensed to offer you mortgage options in 49 states plus the District of Columbia. See <a href="#/licensing" style="text-decoration:underline">state licenses</a>.</p></div>`;

  const guideEmbed = () => `
  <div class="phone" id="guidePhone"><div class="phone-in">
    <div class="ph-top"><span class="logo" style="font-size:16px;padding-top:0"><span class="dots" style="position:static"><i></i><i></i><i></i></span></span><div class="who">Kind Guide<small>AI assistant · estimates only</small></div><span class="dot" title="online"></span></div>
    <div class="chat" id="chat"></div>
    <div class="quick" id="quick"></div>
    <div class="ph-in"><input id="chatIn" placeholder="Tell Kind Guide about your situation" aria-label="Message Kind Guide" autocomplete="off"><button id="chatSend" aria-label="Send">&uarr;</button></div>
    <div class="disc" style="background:#fff;padding-bottom:10px">Not an offer, pre-approval, or commitment to lend. NMLS #3925.</div>
  </div></div>`;

  const reviewsMarquee = () => { const items = KIND.reviews.concat(KIND.reviews); return `<div class="marq"><div class="marq-in">${items.map(r => `<div class="rev"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><q>${esc(r.text)}</q><span class="who">${esc(r.who)}, ${esc(r.where)}</span></div>`).join("")}</div></div>`; };

  // The neighborhood: flat cartoon street in Kind's colors. Biscuit runs along the road at the bottom.
  const townSVG = () => `
  <svg class="town" viewBox="0 0 1400 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="hill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cfe6f8"/><stop offset="1" stop-color="#bfdcf3"/></linearGradient>
    </defs>
    <!-- sun -->
    <circle cx="1180" cy="60" r="34" fill="#fcc900"/><circle cx="1180" cy="60" r="48" fill="#fcc900" opacity=".18"/>
    <!-- distant hills -->
    <ellipse cx="220" cy="300" rx="420" ry="120" fill="url(#hill)"/>
    <ellipse cx="1150" cy="310" rx="520" ry="130" fill="url(#hill)"/>
    <ellipse cx="700" cy="330" rx="380" ry="110" fill="#d6e9f8"/>
    <!-- trees back row -->
    ${[120, 330, 560, 760, 1010, 1290].map((x, i) => `<g><rect x="${x - 4}" y="${228}" width="8" height="30" rx="4" fill="#0b2a4a" opacity=".55"/><circle cx="${x}" cy="${216}" r="${22 + (i % 3) * 5}" fill="${["#b0ebb9", "#8fd7a3", "#a5e3b1"][i % 3]}"/></g>`).join("")}
    <!-- houses -->
    ${[
      { x: 40, w: 150, h: 96, c: "#ff671d", roof: "#004987" },
      { x: 225, w: 120, h: 76, c: "#65b2e8", roof: "#0b2a4a" },
      { x: 385, w: 170, h: 110, c: "#004987", roof: "#ff671d" },
      { x: 600, w: 130, h: 84, c: "#fcc900", roof: "#004987" },
      { x: 780, w: 160, h: 100, c: "#ffffff", roof: "#ff671d" },
      { x: 985, w: 120, h: 78, c: "#ffbba6", roof: "#0b2a4a" },
      { x: 1150, w: 170, h: 108, c: "#65b2e8", roof: "#004987" },
    ].map(h => { const base = 262, top = base - h.h, cx = h.x + h.w / 2; const win = (wx) => `<rect x="${wx}" y="${top + 26}" width="20" height="22" rx="5" fill="#fff8d6" stroke="#fff" stroke-width="2"/>`; return `
      <g>
        <rect x="${h.x}" y="${top}" width="${h.w}" height="${h.h}" rx="14" fill="${h.c}"/>
        <path d="M${h.x - 12} ${top + 6} L${cx} ${top - 44} L${h.x + h.w + 12} ${top + 6} Z" fill="${h.roof}"/>
        <rect x="${cx + h.w * 0.18}" y="${top - 30}" width="14" height="26" rx="4" fill="${h.roof === "#ff671d" ? "#0b2a4a" : "#ff671d"}"/>
        ${win(h.x + 18)}${win(h.x + h.w - 38)}
        <rect x="${cx - 13}" y="${base - 40}" width="26" height="40" rx="12" fill="${h.roof}"/>
        <circle cx="${cx + 7}" cy="${base - 20}" r="2.2" fill="#fcc900"/>
      </g>`; }).join("")}
    <!-- picket fence bits -->
    ${[200, 570, 960].map(x => `<g fill="#fff" opacity=".9">${[0, 10, 20, 30].map(o => `<rect x="${x + o}" y="240" width="6" height="22" rx="3"/>`).join("")}<rect x="${x - 2}" y="248" width="40" height="4" rx="2"/></g>`).join("")}
    <!-- trees front -->
    ${[10, 370, 745, 1120, 1370].map((x, i) => `<g><rect x="${x - 5}" y="230" width="10" height="34" rx="5" fill="#0b2a4a"/><circle cx="${x}" cy="222" r="${26 + (i % 2) * 6}" fill="${i % 2 ? "#8fd7a3" : "#b0ebb9"}"/><circle cx="${x - 12}" cy="230" r="14" fill="${i % 2 ? "#b0ebb9" : "#8fd7a3"}"/></g>`).join("")}
    <!-- sidewalk + road -->
    <rect x="0" y="262" width="1400" height="14" fill="#e6eef6"/>
    <rect x="0" y="276" width="1400" height="44" fill="#d9e3ee"/>
    <path d="M0 298 H1400" stroke="#fff" stroke-width="3" stroke-dasharray="22 18" opacity=".9"/>
  </svg>`;

  const pages = {};

  // ---------- HOME ----------
  pages.home = () => `
  <section class="hero" id="hero">
    <span class="bub sky float" style="width:340px;height:340px;left:-120px;top:40px;opacity:.7"></span>
    <span class="bub yellow float d1" style="width:26px;height:26px;left:12%;top:110px"></span>
    <span class="bub red float d2" style="width:18px;height:18px;left:18%;top:60px"></span>
    <span class="bub navy float d1" style="width:40px;height:40px;right:14%;top:70px"></span>
    <span class="bub orange float" style="width:22px;height:22px;right:9%;top:150px"></span>
    <span class="bub skyd float d2" style="width:14px;height:14px;right:22%;top:40px"></span>
    <div class="cloud drift" style="width:120px;height:34px;top:60px;left:-10vw;animation-duration:95s"></div>
    <div class="cloud drift" style="width:90px;height:26px;top:130px;left:-10vw;animation-duration:120s;animation-delay:-60s;opacity:.7"></div>
    <div class="wrap hero-in">
      <span class="eyebrow rise">home loans, the kind way</span>
      <h1 class="rise">Home is more <span class="hl">cuddly</span> with a Kind loan.</h1>
      <p class="lede rise">Apply online in about 15 minutes, or tell Kind Guide what you're looking for and get real numbers back. Faster, easier, and, well, kinder.</p>
      <form class="hero-form rise" onsubmit="return KIND_APP.heroGo(this)"><input id="heroQ" placeholder="Where are you looking? City or zip" aria-label="City or zip"><button class="btn btn-orange" type="submit">Get started ${arr}</button></form>
      <div class="hero-proof rise"><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span>${KIND.reviewStats.rating} on ${KIND.reviewStats.count} reviews</span><i></i><span>49 states + DC</span><i></i><span>NMLS #3925</span><i></i><a class="link" href="#/guide">Or ask Kind Guide ${arr}</a></div>
    </div>
    <div class="scene" id="scene">${townSVG()}<div class="track" id="dogTrack"></div></div>
  </section>

  <section><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">everything about your home loan</span><h2>All in one place. All in plain English.</h2></div><p class="lede">Find the right program, see what it costs, apply, and track it through closing. Then pay it from the same place. No bank-speak anywhere.</p></div>
    <div class="cards4">
      <a class="fcard rv" href="#/loan-options"><span class="bub sky" style="width:160px;height:160px;right:-60px;top:-60px"></span><div class="glyph" style="background:var(--sky-soft);color:var(--navy)">6</div><h3>Six loan programs, and then some</h3><p>Conventional, FHA, VA, Jumbo, USDA and Kind Non-QM, plus down payment assistance in 48 states, CalHFA, GSFA, buydowns, reverse and 203(k).</p><span class="link">Explore loans ${arr}</span></a>
      <a class="fcard rv" href="#/guide"><span class="bub yellow" style="width:160px;height:160px;right:-60px;top:-60px;opacity:.5"></span><div class="glyph" style="background:var(--yellow);color:var(--navy-ink)">AI</div><h3>Kind Guide answers first</h3><p>Describe the home you want. Kind Guide works out which programs could fit, what each costs per month, and hands the summary to a loan officer.</p><span class="link">Ask Kind Guide ${arr}</span></a>
      <a class="fcard rv" href="${L.apply}" target="_blank" rel="noopener"><span class="bub orange" style="width:160px;height:160px;right:-60px;top:-60px;opacity:.18"></span><div class="glyph" style="background:#ffe3d3;color:var(--orange)">15</div><h3>Apply in about 15 minutes</h3><p>Apply online, upload documents from your phone, and follow every step in your Loan in Progress portal. Fetch &amp; Close verifies employment and income automatically.</p><span class="link">Apply today ${arr}</span></a>
      <a class="fcard rv" href="${L.account}" target="_blank" rel="noopener"><span class="bub mint" style="width:160px;height:160px;right:-60px;top:-60px;opacity:.6"></span><div class="glyph" style="background:#dcf5e3;color:#136a3a">$</div><h3>Pay and manage in MyKindPay</h3><p>Once you close, your loan lives in MyKindPay. Payments, statements and tax documents in one account, with customer service Monday to Friday.</p><span class="link">Log in ${arr}</span></a>
    </div>
  </div></section>

  <section style="padding-top:0"><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">customer reviews</span><h2>Loved by ${KIND.reviewStats.count} borrowers, and counting.</h2></div><p class="lede">${KIND.reviewStats.rating} out of 5 on ${KIND.reviewStats.source}. Real people, real closings, mostly about how fast someone called them back.</p></div>
    <div class="testi">
      ${[[KIND.reviews[3], "var(--orange)"], [KIND.reviews[5], "var(--navy)"], [KIND.reviews[7], "var(--sky)"]].map(([r, c]) => `<div class="tcard rv"><div class="port" style="background:${c}">${r.who[0]}</div><span class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span><q>${esc(r.text)}</q><span class="who">${esc(r.who)} · ${esc(r.where)}</span></div>`).join("")}
    </div>
  </div>
  <div style="margin-top:var(--s5)">${reviewsMarquee()}</div></section>

  <section class="dark" style="position:relative;overflow:hidden"><span class="bub skyd" style="width:600px;height:600px;right:-260px;top:-300px;opacity:.08"></span><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">a home loan used to be a headache</span><h2>Now it's a conversation.</h2></div><p class="lede">Four things that make a Kind loan feel different, from the first question to the last signature.</p></div>
    <div class="stack" style="gap:var(--s9)">
      <div class="feature rv">
        <div class="copy"><span class="eyebrow">kind guide</span><h3 style="font-size:clamp(26px,1rem + 1.6vw,36px);color:#fff">Ask in plain words. Get numbers you can trust.</h3><p class="lede">Kind Guide is an AI assistant that works like the first ten minutes with a loan officer. It asks what it needs, runs Kind's calculator with this year's Orange County limits and current rates, and shows which programs could fit and why.</p>
          <ul style="color:var(--on-dark-2)"><li style="color:var(--on-dark-2)">Every number is computed by the calculator, never guessed by the AI</li><li style="color:var(--on-dark-2)">Six programs ranked with the reason each fits or doesn't</li><li style="color:var(--on-dark-2)">Ends with a named loan officer, not a form</li></ul>
          <div class="row"><a class="btn btn-yellow" href="#/guide">Open Kind Guide ${arr}</a></div></div>
        <div class="ui sky"><span class="bub yellow float" style="width:90px;height:90px;left:20px;top:24px"></span><span class="bub orange float d1" style="width:40px;height:40px;right:40px;bottom:40px"></span>
          <div class="win"><div class="bar"><i></i><i></i><i></i><span style="margin-left:6px">Kind Guide</span><span class="pill info" style="margin-left:auto">AI · estimates only</span></div><div class="body">
            <div class="msg me">$1.1M in Irvine, 10% down, credit around 740, we make $240k.</div>
            <div class="msg ai">Got it. Here's what fits and what it would run each month.</div>
            <div class="kv"><div><b>$7,646</b><span>FHA, est. monthly</span></div><div><b>$7,819</b><span>Conventional, est. monthly</span></div></div>
            <div class="rowi"><span>Loan amount</span><b>$990,000</b></div>
            <div class="rowi"><span>Within OC conforming limit</span><span class="pill ok">Yes, $1,249,125</span></div>
            <div class="lo"><div class="av">RR</div><div style="font-size:13px"><b style="color:var(--navy)">Ramil Reyes</b> · Producing Area Manager<br><span class="muted">NMLS# 352842 · Irvine</span></div></div>
          </div></div>
        </div>
      </div>
      <div class="feature flip rv">
        <div class="copy"><span class="eyebrow">loan in progress</span><h3 style="font-size:clamp(26px,1rem + 1.6vw,36px);color:#fff">Watch your loan move. Every step, in your portal.</h3><p class="lede">Apply online, then follow the file from application to clear-to-close in your Loan in Progress portal. Upload a document from your phone and it attaches to the right task. Nothing gets asked for twice.</p>
          <ul><li style="color:var(--on-dark-2)">Fetch &amp; Close verifies employment, income and W-2s automatically, with up to $200 in fees waived</li><li style="color:var(--on-dark-2)">Purchase loans close in about five weeks industry-wide. Kind borrowers say "closed within a couple of weeks"</li><li style="color:var(--on-dark-2)">A person answers: (714) 844-1000, Monday to Friday</li></ul>
          <div class="row">${ext(L.apply, "btn btn-orange", "Apply today " + arr)}${ext(L.inProgress, "btn btn-ghost-dark", "Loan in progress")}</div></div>
        <div class="ui peach"><span class="bub navy float d2" style="width:70px;height:70px;right:30px;top:30px;opacity:.9"></span><span class="bub skyd float" style="width:40px;height:40px;left:30px;bottom:50px"></span>
          <div class="win"><div class="bar"><i></i><i></i><i></i><span style="margin-left:6px">Loan in Progress</span><span class="pill wait" style="margin-left:auto">Underwriting</span></div><div class="body">
            <div class="steps"><span class="done"></span><span class="done"></span><span class="now"></span><span></span><span></span></div>
            <div class="rowi"><span>Application</span><span class="pill ok">Done</span></div>
            <div class="rowi"><span>Documents</span><span class="pill ok">8 of 8 received</span></div>
            <div class="doc"><i></i>2024 W-2 · Fetch &amp; Close<span class="pill ok">Verified</span></div>
            <div class="doc"><i></i>Bank statements, 2 months<span class="pill ok">Attached</span></div>
            <div class="rowi"><span>Appraisal</span><span class="pill wait">Scheduled Thu</span></div>
            <div class="prog"><i style="--w:58%"></i></div>
            <div class="small muted" style="font-size:12px">Estimated closing: 19 days. Your loan officer will confirm.</div>
          </div></div>
        </div>
      </div>
      <div class="feature rv">
        <div class="copy"><span class="eyebrow">find a loan officer</span><h3 style="font-size:clamp(26px,1rem + 1.6vw,36px);color:#fff">A Kind Ambassador in 18 branches and 49 states.</h3><p class="lede">Search by name, city or zip. Every loan officer has a profile with their NMLS number, reviews, and a direct line. If there's no branch near you, call (714) 844-1000 and we'll put you in touch.</p>
          <ul><li style="color:var(--on-dark-2)">Irvine headquarters plus branches from Honolulu to Charlotte</li><li style="color:var(--on-dark-2)">Licensed in 49 states and the District of Columbia</li><li style="color:var(--on-dark-2)">Apply with your loan officer's link so they have your file from day one</li></ul>
          <div class="row"><a class="btn btn-yellow" href="#/find-a-loan-officer">Find a loan officer ${arr}</a></div></div>
        <div class="ui mintg"><span class="bub orange float" style="width:60px;height:60px;left:24px;top:30px"></span><span class="bub yellow float d1" style="width:100px;height:100px;right:-20px;bottom:-20px;opacity:.7"></span>
          <div class="win"><div class="bar"><i></i><i></i><i></i><span style="margin-left:6px">Find a loan officer</span></div><div class="body">
            <div class="rowi" style="background:#fff;box-shadow:inset 0 0 0 1.5px var(--line)"><span class="muted">Irvine, CA</span><span class="pill info">9 nearby</span></div>
            ${KIND.officers.slice(0, 3).map(o => `<div class="lo" style="padding:8px 4px"><div class="av" style="background:${["var(--sky)", "var(--orange)", "var(--navy)"][KIND.officers.indexOf(o)]}">${o.name.split(" ").map(w => w[0]).join("")}</div><div style="font-size:13px;flex:1"><b style="color:var(--navy)">${o.name}</b><br><span class="muted">${o.title}${o.nmls ? " · NMLS# " + o.nmls : ""}</span></div><span class="pill ok">Apply</span></div>`).join("")}
            <div class="small muted" style="font-size:12px">4.91 average on 11,898 Experience.com reviews</div>
          </div></div>
        </div>
      </div>
      <div class="feature flip rv">
        <div class="copy"><span class="eyebrow">mykindpay</span><h3 style="font-size:clamp(26px,1rem + 1.6vw,36px);color:#fff">After closing, it stays kind.</h3><p class="lede">Your loan is serviced by Kind, not sold off to a stranger. Pay, see statements, and download tax documents in MyKindPay. Servicing questions go to a real team at 1-800-906-3831.</p>
          <ul><li style="color:var(--on-dark-2)">Autopay, one-time payments, and payoff quotes</li><li style="color:var(--on-dark-2)">Year-end tax documents in the same account</li><li style="color:var(--on-dark-2)">servicing@kindlending.com, Monday to Friday, 8am to 5pm PT</li></ul>
          <div class="row">${ext(L.account, "btn btn-yellow", "Log in to MyKindPay " + arr)}</div></div>
        <div class="ui lemon"><span class="bub skyd float d1" style="width:80px;height:80px;right:24px;top:24px"></span><span class="bub red float" style="width:30px;height:30px;left:40px;bottom:60px"></span>
          <div class="win"><div class="bar"><i></i><i></i><i></i><span style="margin-left:6px">MyKindPay</span><span class="pill ok" style="margin-left:auto">Autopay on</span></div><div class="body">
            <div class="kv"><div><b>$7,819</b><span>Next payment · Oct 1</span></div><div><b>$983,412</b><span>Principal balance</span></div></div>
            <div class="rowi"><span>September payment</span><span class="pill ok">Paid Sep 1</span></div>
            <div class="rowi"><span>Escrow: taxes and insurance</span><b>$1,160</b></div>
            <div class="rowi"><span>2025 Form 1098</span><span class="pill info">Download</span></div>
            <div class="prog"><i style="--w:34%;background:linear-gradient(90deg,var(--yellow),var(--orange))"></i></div>
            <div class="small muted" style="font-size:12px">34% of the way there. Extra principal welcome any time.</div>
          </div></div>
        </div>
      </div>
    </div>
  </div></section>

  <section><div class="wrap bigq rv">
    <blockquote>"I hope I can help change the industry and make it not so callous."</blockquote>
    <div class="who"><span class="av">GS</span><span>Glenn Stearns, Founder and CEO of Kind Lending, to National Mortgage News</span></div>
  </div></section>

  <section style="padding-top:0"><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">loan options</span><h2>Moving up? Refinancing? First home?</h2></div><p class="lede">You want a loan that's the best fit with your finances, and that's what we want for you. Everyday language instead of bank-speak.</p></div>
    <div class="ledger rv">${KIND.programs.map(p => `<div class="li"><h3>${p.name}</h3><div><p>${esc(p.short)}</p><ul class="kf">${p.features.slice(0, 3).map(f => `<li>${esc(f)}</li>`).join("")}</ul></div><a class="btn btn-paper btn-sm" href="#/loan-options/${p.id}">Details ${arr}</a></div>`).join("")}</div>
    <div class="row" style="margin-top:var(--s6)"><a class="btn btn-navy" href="#/loan-options">All loan options ${arr}</a><a class="btn btn-paper" href="#/guide">Not sure? Ask Kind Guide</a></div>
  </div></section>

  <section class="dark"><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">built to last</span><h2>You're buying a home to stand the test of time. So are we.</h2></div><p class="lede">Founded in Irvine in 2020 by Glenn Stearns, who built and sold one of the largest private lenders in the country and came back to do it kinder.</p></div>
    <div class="stats rv">
      <div class="stat"><b>$1B+</b><span>funded in a single month, May 2025, a company record</span></div>
      <div class="stat"><b>${KIND.reviewStats.rating}</b><span>average of ${KIND.reviewStats.count} verified borrower reviews</span></div>
      <div class="stat"><b>49+DC</b><span>states where Kind is licensed to lend</span></div>
      <div class="stat"><b>18</b><span>branch offices, Honolulu to Charlotte</span></div>
    </div>
  </div></section>

  <section><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">protection that goes further</span><h2>Licensed, insured, and answerable to a person.</h2></div><p class="lede">A mortgage is the biggest financial decision most people make. Here's who's standing behind yours.</p></div>
    <div class="trust">
      <div class="panel rv"><div class="glyph" style="background:var(--navy)">N</div><h3>NMLS #3925, in 49 states and DC</h3><p class="muted">Every Kind loan officer carries their own NMLS number on their profile and every document. Verify anyone at nmlsconsumeraccess.org.</p></div>
      <div class="panel rv"><div class="glyph" style="background:var(--orange)">F</div><h3>FHA approved, Equal Housing Lender</h3><p class="muted">Kind Lending is an FHA Approved Lending Institution and offers VA, USDA, CalHFA and GSFA programs alongside conventional and jumbo.</p></div>
      <div class="panel rv"><div class="glyph" style="background:var(--sky)">K</div><h3>Serviced by Kind, not sold to a stranger</h3><p class="muted">Servicing questions go to servicing@kindlending.com or 1-800-906-3831. Complaints go to Complaints@KindLending.com and get read.</p></div>
    </div>
  </div></section>

  <section style="padding-top:0"><div class="wrap">
    <div class="sec-head rv"><div class="stack"><span class="eyebrow">kind in the spotlight</span><h2>What people keep saying about us.</h2></div></div>
    <div class="press">
      <div class="pcard rv"><span class="src">USA Today</span><b>Top Workplaces, 2024, 2025 and 2026</b></div>
      <div class="pcard rv"><span class="src">Scotsman Guide</span><b>#6 wholesale lender, fastest growing in America</b></div>
      <div class="pcard rv"><span class="src">Mortgage Professional America</span><b>5-Star Wholesale Lender 2025</b></div>
      <div class="pcard rv"><span class="src">Orange County Register</span><b>Top Workplace, and "Glenn Stearns returns to mortgages"</b></div>
    </div>
  </div></section>

  <section style="padding-top:0"><div class="wrap"><div class="final rv">
    <span class="bub skyd" style="width:420px;height:420px;left:-160px;top:-200px;opacity:.25"></span>
    <span class="bub orange" style="width:260px;height:260px;right:-100px;bottom:-120px;opacity:.5"></span>
    <span class="bub yellow float" style="width:34px;height:34px;right:14%;top:30px"></span>
    <span class="eyebrow" style="color:var(--yellow);position:relative">stressful home buying process? that's so over.</span>
    <h2 style="position:relative">Home loans, redesigned from the front door up.</h2>
    <p style="position:relative">Apply online today, get a quick rate quote from a Kind Ambassador, or ask Kind Guide and see your numbers in a minute.</p>
    <div class="row" style="justify-content:center;position:relative">${ext(L.apply, "btn btn-orange btn-lg", "Apply today " + arr)}<a class="btn btn-ghost-dark btn-lg" href="#/rate-quote">Quick rate quote</a><a class="btn btn-ghost-dark btn-lg" href="#/guide">Ask Kind Guide</a></div>
  </div></div></section>`;

  pages.guide = () => `
  <section class="dark" style="min-height:80vh"><div class="wrap">
    <div class="guide-wrap">
      <div class="stack">
        <p class="eyebrow">kind guide</p>
        <h1 style="font-size:clamp(36px,5.5vw,68px)">Ask about a home. Get <span class="hl-y">real numbers</span> back.</h1>
        <p class="lede">Kind Guide is an AI assistant that works like the first conversation with a loan officer. It asks what it needs, runs Kind's calculator, and shows which programs could fit and why. It never promises a rate or a decision.</p>
        <div class="panel stack" style="gap:var(--s3)">
          <b>What it uses</b>
          <p class="muted">2026 conforming and FHA limit for Orange County: ${fmt(E.LIMITS.conformingHighCost)}. Indicative 30-year rates as of ${E.RATES.asOf}: conventional ${E.RATES.conv30}%, FHA ${E.RATES.fha30}%, VA ${E.RATES.va30}%, jumbo ${E.RATES.jumbo30}%. Property tax about 1.1% and insurance about ${fmt(E.OC.insuranceAnnual)}/yr, typical for Orange County.</p>
          <b>What it will not do</b>
          <p class="muted">Lock a rate, pull credit, approve or pre-approve anyone, or recommend a specific loan product. A licensed Kind loan officer does that.</p>
          <b>Try saying</b>
          <p class="muted">"We're looking at a $1.1M house in Irvine with 10% down, our credit is around 740 and we make $240k." Or "I'm a veteran, what can I afford on $9,000 a month?"</p>
        </div>
        <div class="row"><a class="btn btn-ghost-dark" href="#/find-a-loan-officer">Prefer a person? Find a loan officer</a></div>
      </div>
      ${guideEmbed()}
    </div>
  </div></section>`;

  pages["loan-options"] = (id) => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">loan options</p><h1>Moving up? Refinancing? First home? Kind can help you.</h1><p class="lede">You want a loan that's the best fit with your finances, and that's what we want for you. Our kind approach includes going over all your options with you, and sticking to everyday language instead of bank-speak. While you won't be tested on these later, below are details about our main loan options.</p>
  <div class="row">${ext(L.apply, "btn btn-ink", "Get a purchase loan")}${ext(L.apply, "btn btn-paper", "Refinance my home")}<a class="btn btn-paper" href="#/guide">Not sure? Ask Kind Guide</a></div></div></section>
  <section style="padding-top:0"><div class="wrap stack" style="gap:var(--s5)">
    ${KIND.programs.map(p => `<div class="panel grid-2" id="${p.id}" style="align-items:start;${id === p.id ? "outline:3px solid var(--orange)" : ""}"><div class="stack"><h2 style="font-size:36px">${p.name} loans</h2><p>${esc(p.blurb)}</p>${ext(L.apply, "btn btn-ink btn-sm", "Get started")}</div><div><p class="eyebrow" style="margin-bottom:8px">key features</p><ul class="kf" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">${p.features.map(f => `<li>&#10003;&nbsp; ${esc(f)}</li>`).join("")}</ul></div></div>`).join("")}
    <h2 style="margin-top:var(--s6)">More Kind options</h2>
    ${KIND.morePrograms.map(p => `<div class="panel grid-2" style="align-items:start"><div class="stack"><h3>${esc(p.name)}</h3>${p.blurb ? `<p>${esc(p.blurb)}</p>` : ""}${p.note ? `<p class="small muted">${esc(p.note)}</p>` : ""}${ext(L.apply, "btn btn-paper btn-sm", "Get started")}</div><ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">${p.features.map(f => `<li>&#10003;&nbsp; ${esc(f)}</li>`).join("")}</ul></div>`).join("")}
    ${statesBlock()}
    <p class="small muted">Kind Lending, LLC is an FHA Approved Lending Institution and is not acting on behalf of, or at the direction of HUD/FHA or the federal government. Mortgage insurance may be required on loans greater than 80% LTV and will increase your monthly payment. ARM loans: interest rate will increase over the term of the loan which will increase the monthly payment. VA loans do not need mortgage insurance but do require a one-time VA Funding Fee. USDA eligibility: <a href="${L.usdaCheck}" target="_blank" rel="noopener" style="text-decoration:underline">check if a property is zoned rural</a>.</p>
  </div></section>${triCTA()}`;

  pages.calculator = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">mortgage calculator</p><h1>What would the payment be?</h1><p class="lede">Move the sliders. Taxes and insurance are added at typical Orange County levels so the number is closer to real.</p></div></section>
  <section style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
    <form class="panel form" id="calc" onsubmit="return false">
      <div class="range"><label for="cPrice">Home price</label><output id="oPrice">$1,100,000</output><input type="range" id="cPrice" min="200000" max="3000000" step="5000" value="1100000"></div>
      <div class="range"><label for="cDown">Down payment</label><output id="oDown">$110,000 (10%)</output><input type="range" id="cDown" min="0" max="50" step="0.5" value="10"></div>
      <div class="range"><label for="cTerm">Loan term</label><output id="oTerm">30 years</output><input type="range" id="cTerm" min="10" max="30" step="5" value="30"></div>
      <div class="range"><label for="cRate">Interest rate</label><output id="oRate">${E.RATES.conv30}%</output><input type="range" id="cRate" min="3" max="10" step="0.01" value="${E.RATES.conv30}"></div>
      <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="cTI" checked> Include estimated taxes and insurance</label>
    </form>
    <div class="stack">
      <div class="panel"><div class="calc-out"><div><b id="rPay">$0</b><span>Estimated monthly payment</span></div><div><b id="rLoan">$0</b><span>Loan amount</span></div><div><b id="rDown">0%</b><span>Down payment</span></div></div>
      <p class="small muted" style="margin-top:var(--s4)" id="rNote"></p></div>
      <div class="panel stack" style="gap:var(--s3)"><b>Want the full picture?</b><p class="muted">Kind Guide compares all six programs on your numbers, including mortgage insurance and funding fees.</p><a class="btn btn-ink btn-sm" href="#/guide" style="align-self:flex-start">Ask Kind Guide</a></div>
      <form class="panel form" onsubmit="return KIND_APP.fakeSubmit(this,'Results sent. A Kind loan officer will follow up.')"><b>Email me these results</b><div class="two"><div class="field"><label>First name</label><input required></div><div class="field"><label>Last name</label><input required></div></div><div class="two"><div class="field"><label>Phone</label><input type="tel"></div><div class="field"><label>Email</label><input type="email" required></div></div><div class="field"><label>Zip code</label><input inputmode="numeric"></div><button class="btn btn-paper" style="justify-self:start">Send</button></form>
    </div>
  </div></section>
  <section style="padding-top:0"><div class="wrap"><p class="small muted">The information provided by this calculator is intended for illustrative purposes only. The calculated results shown are hypothetical and may not be applicable to your individual situation. Be sure to consult a financial professional. Kind Lending is not responsible for the content and/or accuracy of rates, APRs or any other loan information factored in the calculations.</p></div></section>`;

  pages["rate-quote"] = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">quick rate quote</p><h1>request a quick rate quote</h1><p class="lede">Tell us a little about what you're after. A Kind loan officer will reach out with real options, not a robo-quote.</p></div></section>
  <section style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
    <form class="panel form" onsubmit="return KIND_APP.fakeSubmit(this,'Thanks. A Kind loan officer will be in touch shortly.')">
      <div class="field"><label>Are you looking to buy a home or refinance?</label><div class="opts"><label><input type="radio" name="goal" value="buy" checked> Buy a home</label><label><input type="radio" name="goal" value="refi"> Refinance</label></div></div>
      <div class="field"><label>Are you already working with a Loan Officer at Kind Lending?</label><div class="opts"><label><input type="radio" name="lo" value="yes"> I sure am!</label><label><input type="radio" name="lo" value="no" checked> Nope, not yet</label></div></div>
      <div class="field"><label>If yes, please let us know who</label><input></div>
      <b>Contact information</b>
      <div class="two"><div class="field"><label>First name</label><input placeholder="John" required></div><div class="field"><label>Last name</label><input placeholder="Doe" required></div></div>
      <div class="two"><div class="field"><label>Email address</label><input type="email" placeholder="example@domain.com" required></div><div class="field"><label>Phone number</label><input type="tel" required></div></div>
      <div class="two"><div class="field"><label>City</label><input></div><div class="field"><label>State</label><input></div></div>
      <div class="field"><label>Comments / extra details</label><textarea rows="4"></textarea></div>
      <button class="btn btn-ink" style="justify-self:start">Submit</button>
    </form>
    <div class="stack"><div class="panel stack" style="gap:var(--s3)"><b>Rather see numbers right now?</b><p class="muted">Kind Guide gives you an estimated payment and program fit in about a minute, then sends the summary to a loan officer.</p><a class="btn btn-yellow btn-sm" href="#/guide" style="align-self:flex-start">Ask Kind Guide</a></div>
    <div class="panel stack" style="gap:var(--s3)"><b>Or just call</b><p class="muted">${KIND.phones.office}, Monday to Friday, 8am to 5pm PT.</p></div></div>
  </div></section>`;

  pages["find-a-loan-officer"] = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">find a loan officer</p><h1>Connect with a Kind Ambassador today.</h1><p class="lede">We're excited to help you explore your Kind financing options! If you're unable to find a branch office near you, please call <a href="tel:17148441000"><u>${KIND.phones.office}</u></a>. We'll put you in touch with a Loan Officer that can assist you.</p>
  <form class="row" onsubmit="return KIND_APP.searchLO(this)"><input class="field" id="loQ" style="border:1px solid var(--line);border-radius:var(--pill);padding:14px 20px;background:#fff;flex:1;min-width:240px" placeholder="First name, last name, city or zip code" aria-label="Search loan officers"><button class="btn btn-ink">Search</button></form></div></section>
  <section style="padding-top:0"><div class="wrap stack" style="gap:var(--s6)">
    <div id="loResults"></div>
    <div><p class="eyebrow" style="margin-bottom:var(--s3)">branch locations by state</p><div class="states">${KIND.states.map(([n, a]) => `<a href="#/find-a-loan-officer" data-state="${a}">${n}<small>${a}</small></a>`).join("")}</div></div>
    <div><p class="eyebrow" style="margin-bottom:var(--s3)">branch offices</p><div class="states">${KIND.branches.map(b => `<a href="#/branch/${b.slug}">${b.city}${b.hq ? "<small>HQ</small>" : ""}</a>`).join("")}</div></div>
    <div><p class="eyebrow" style="margin-bottom:var(--s3)">irvine headquarters team</p>${peopleGrid(KIND.officers.filter(o => o.branch === "irvine"))}</div>
    <p class="lede">Did you know Kind Lending is licensed to offer you mortgage options in 49 states plus the District of Columbia?</p>
  </div></section>${triCTA()}`;

  function peopleGrid(list) { return `<div class="people">${list.map(o => `<div class="person"><div class="av">${o.name.split(" ").map(w => w[0]).join("")}</div><b>${esc(o.name)}</b><span>${esc(o.title)}</span>${o.nmls ? `<span>NMLS# ${o.nmls}</span>` : ""}<div class="row"><a class="btn btn-ink btn-sm" href="#/mlo/${o.slug}">Profile</a>${ext(L.apply + (o.nmls ? "apply?nmlsid=" + o.nmls : ""), "btn btn-paper btn-sm", "Apply now")}</div></div>`).join("")}</div>`; }

  pages.branch = (slug) => { const b = KIND.branches.find(x => x.slug === slug) || KIND.branches[0]; const team = KIND.officers.filter(o => o.branch === b.slug); return `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">branch</p><h1>Welcome to ${esc(b.city)}</h1>${b.addr ? `<p class="lede">${esc(b.addr)}${b.nmls ? `<br>Branch NMLS #${b.nmls}` : ""}</p>` : ""}<p class="lede">Learn more about ${esc(b.city.split(",")[0])} and surrounding areas by contacting a Kind Lending Ambassador located at our local ${esc(b.city.split(",")[0])} branch.</p></div></section>
  <section style="padding-top:0"><div class="wrap stack"><h2>Connect with a Kind Ambassador today!</h2>${team.length ? peopleGrid(team) : `<div class="panel"><p>Call <a href="tel:17148441000"><u>${KIND.phones.office}</u></a> and we'll connect you with the ${esc(b.city)} team.</p></div>`}</div></section>${triCTA()}`; };

  pages.mlo = (slug) => { const o = KIND.officers.find(x => x.slug === slug) || KIND.officers[9]; const br = KIND.branches.find(b => b.slug === o.branch); return `
  <section class="pg-head"><div class="wrap grid-2" style="align-items:start">
    <div class="stack"><div class="av" style="width:96px;height:96px;border-radius:50%;background:var(--sky);display:grid;place-items:center;color:#fff;font-weight:700;font-size:32px">${o.name.split(" ").map(w => w[0]).join("")}</div><h1 style="font-size:clamp(36px,5vw,60px)">${esc(o.name)}</h1><p class="lede">${esc(o.title)}${o.nmls ? ` · NMLS ID# ${o.nmls}` : ""}</p>
      <p class="muted">${br ? esc(br.addr || br.city) : ""}${br && br.nmls ? `<br>Branch NMLS ID# ${br.nmls}` : ""}</p>
      ${o.phone ? `<p><a href="tel:${o.phone}"><u>${o.phone}</u></a> · <a href="mailto:${o.email}"><u>${o.email}</u></a></p>` : ""}
      ${o.licensed ? `<p class="small muted">Licensed in: ${o.licensed}</p>` : ""}
      <div class="row">${ext(L.apply + (o.nmls ? "apply?nmlsid=" + o.nmls : ""), "btn btn-ink", "Apply now")}${ext("https://pro.experience.com/reviews/" + o.slug, "btn btn-paper", "My reviews")}<a class="btn btn-paper" href="#/guide">Ask Kind Guide</a></div></div>
    <div class="panel stack"><h2 style="font-size:30px">Get to know ${esc(o.name.split(" ")[0])}</h2>${(o.bio || ["Ask " + o.name.split(" ")[0] + " about Conventional, FHA, VA, Jumbo, USDA and Non-QM options, first-time buyer programs, and down payment assistance."]).map(p => `<p>${esc(p)}</p>`).join("")}</div>
  </div></section>
  <section class="dark"><div class="wrap grid-2"><div class="stack"><p class="eyebrow">who is kind lending?</p><h2>Home loans the <span class="hl-y">Kind</span> way.</h2><p class="lede">We are an upbeat, fun, and collaborative company fiercely dedicated to serving our homebuyers through personalized service and of course, kindness. Our family of Kind Ambassadors bring you an array of competitively priced products, top-notch service by experienced and friendly professionals throughout your journey and strive to simplify the loan process. Get your Kind Mortgage today.</p></div>
  <div class="stack"><p class="eyebrow">mortgage 101</p>${[["W05kBnM5WaE", "What is a down payment?"], ["tgRxM2wVgC0", "The real cost of waiting"], ["vEpQA0VGpDo", "The 4 C's of home buying"], ["Xg1qbSzp6R4", "Mortgage 101"]].map(([id, t]) => ext("https://www.youtube.com/watch?v=" + id, "panel", `<b>&#9654; ${t}</b><span class="muted small" style="display:block">YouTube · Kind Lending</span>`)).join("")}</div></div></section>
  <section><div class="wrap"><h2 style="margin-bottom:var(--s5)">Home loans the Kind way</h2><div class="row">${KIND.programs.map(p => `<a class="chip" href="#/loan-options/${p.id}">${p.name}</a>`).join("")}<a class="chip" href="#/loan-options">Reverse</a><a class="chip" href="#/loan-options">Renovation</a><a class="chip" href="#/loan-options">First-time buyer</a></div></div></section>${triCTA()}`; };

  pages.contact = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">contact us</p><h1>kind headquarters</h1><p class="lede">Kind Lending, LLC<br>1920 Main Street, Suite 1200<br>Irvine, CA 92614</p></div></section>
  <section style="padding-top:0"><div class="wrap grid-2" style="align-items:start">
    <div class="stack">
      <div class="panel stack" style="gap:8px"><h3>Need a new loan?</h3><p class="muted">Purchase, second home, investment property or refinance.</p><div class="row">${ext(L.apply, "btn btn-ink btn-sm", "Apply online")}<a class="btn btn-paper btn-sm" href="#/find-a-loan-officer">Find a loan officer</a><a class="btn btn-paper btn-sm" href="tel:17148441000">Call ${KIND.phones.office}</a></div></div>
      <div class="panel stack" style="gap:8px"><h3>Questions about an existing Kind loan?</h3><p class="muted">Customer service: ${KIND.phones.servicing}, Monday to Friday, 8am to 5pm PST.</p>${ext(L.account, "btn btn-paper btn-sm", "Log into your account")}</div>
      <div class="panel stack" style="gap:8px"><h3>Questions about an in-process application?</h3><p class="muted">Monday to Friday. Email <a href="mailto:${KIND.emails.complaints}"><u>${KIND.emails.complaints}</u></a> or call ${KIND.phones.office}.</p></div>
      <div class="panel stack" style="gap:8px"><h3>Questions about the servicing of your loan?</h3><p class="muted">Email <a href="mailto:${KIND.emails.servicing}"><u>${KIND.emails.servicing}</u></a> or call ${KIND.phones.servicing}. Mailing address: Kind Lending, LLC, 1920 Main Street, Suite 1200, Irvine, CA 92614.</p></div>
    </div>
    <form class="panel form" id="send-us-a-message" onsubmit="return KIND_APP.fakeSubmit(this,'Message sent. We reply within one business day.')"><h2 style="font-size:30px">send us a message</h2>
      <div class="field"><label>What is this about?</label><select><option>This is about an existing loan</option><option>I have questions about servicing of my loan</option><option>I want a loan officer to contact me</option><option>I am interested in career opportunities</option><option>I have questions about media and PR</option></select></div>
      <div class="two"><div class="field"><label>First name</label><input required></div><div class="field"><label>Last name</label><input required></div></div>
      <div class="field"><label>Communication preference</label><div class="opts"><label><input type="radio" name="pref" value="phone"> Phone</label><label><input type="radio" name="pref" value="email" checked> Email</label></div><p class="small muted">By selecting Phone you consent to receive SMS messages from Kind Lending. Reply STOP to opt out.</p></div>
      <div class="two"><div class="field"><label>Phone</label><input type="tel"></div><div class="field"><label>Email address</label><input type="email" required></div></div>
      <div class="field"><label>Message</label><textarea rows="5" required></textarea></div>
      <button class="btn btn-ink" style="justify-self:start">Submit</button>
    </form>
  </div></section>`;

  pages["our-story"] = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">our story</p><h1>Stressful home buying process? <span class="hl">That's so over.</span></h1><p class="lede">We started with an upbeat team of sharp minds who wanted to do things a little differently. Then we added an array of products, top-notch service, and built an even bigger squad of experienced and friendly professionals ready to assist you with superior resources.</p><p class="lede">We're here to simplify the process for our borrowers. Faster, easier, and, well, kinder.</p><div class="row">${ext(L.apply, "btn btn-ink", "Get started today")}<a class="btn btn-paper" href="#/find-a-loan-officer">Find a loan officer</a></div></div></section>
  <section class="dark"><div class="wrap stack" style="gap:var(--s6)"><div><p class="eyebrow">the kind movement</p><h2>The launch of a new legacy.</h2></div>
    <div class="grid-2" style="align-items:start"><div class="stack"><p class="lede">Glenn Stearns founded Stearns Lending in 1989 at 25 and built it into one of the largest privately held lenders in the country. After selling to Blackstone and starring in Discovery's Undercover Billionaire, he came back to the industry on March 4, 2020, with Kind Lending. In May 2025 Kind funded more than $1 billion in a single month, the highest in its history.</p>${ext("https://www.youtube-nocookie.com/embed/CzNnmQE1NEw", "btn btn-yellow btn-sm", "&#9654; Watch Glenn's welcome")}</div>
    <div class="stack">${KIND.glenn.quotes.slice(0, 3).map(q => `<div class="panel"><p style="font-size:19px">"${esc(q.t)}"</p><p class="small muted" style="margin-top:8px">Glenn Stearns, ${esc(q.s)}</p></div>`).join("")}</div></div>
    <div><p class="eyebrow" style="margin-bottom:var(--s3)">leadership team</p><div class="people">${KIND.leadership.map(([n, t]) => `<div class="person" style="background:var(--dark-2)"><div class="av">${n.split(" ").map(w => w[0]).join("")}</div><b>${n}</b><span>${t}</span></div>`).join("")}</div></div>
  </div></section>
  <section><div class="wrap grid-2"><div class="stack"><p class="eyebrow">our people</p><h2>People before profits.</h2><p class="lede">At Kind Lending, our family of diverse and talented Kind Ambassadors are the driving force behind our new approach to the mortgage experience. They're the heart and soul of the organization and our "People Before Profits" mentality shines through in every department.</p><a class="btn btn-ink" href="#/careers" style="align-self:flex-start">Explore open positions</a></div><div class="panel" style="padding:0;overflow:hidden;border-radius:var(--r-lg)"><img src="https://cdn.prod.website-files.com/5e4737f29415a6913a8c024f/610dd767d67d89db35d06f24_Our-People.png" alt="Illustration of the Kind Lending team waving" loading="lazy"></div></div></section>${triCTA()}`;

  pages["why-kind"] = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">why kind?</p><h1>Kindness is our currency.</h1><p class="lede">Eight things we say to each other, and mean.</p></div></section>
  <section class="dark" style="padding-top:0"><div class="wrap" style="padding-top:var(--s8)"><div class="values">${KIND.values.map(v => `<div>${esc(v)}</div>`).join("")}</div></div></section>
  <section><div class="wrap grid-2"><div class="stack"><h2>What does it mean to have a Chief Kindness Officer?</h2><p class="lede">"${esc(KIND.glenn.quotes[1].t)}"</p><p class="small muted">Glenn Stearns, ${esc(KIND.glenn.quotes[1].s)}</p></div><div class="stack"><p class="eyebrow">recognition</p><ul style="padding-left:20px;display:flex;flex-direction:column;gap:8px">${KIND.awards.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div></div></section>${triCTA()}`;

  pages.careers = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">careers</p><h1>America's fastest growing mortgage company.</h1><p class="lede">Join the Kind Movement today. "At Kind, our people are the driving force behind our new approach to the mortgage experience." Glenn Stearns, CEO and Founder.</p><div class="row">${ext(L.careersATS, "btn btn-ink", "Learn about career opportunities")}<a class="btn btn-paper" href="#/why-kind">Why Kind</a></div></div></section>
  <section style="padding-top:0"><div class="wrap grid-2" style="align-items:start"><div class="stack"><p class="eyebrow">awards</p><div class="row">${KIND.awards.map(a => `<span class="chip">${esc(a)}</span>`).join("")}</div></div>
  <div class="stack"><p class="eyebrow">verified testimonials, glassdoor</p>${KIND.glassdoor.map(g => `<div class="panel"><p>"${esc(g.text)}"</p><p class="small muted" style="margin-top:8px">${esc(g.who)}</p></div>`).join("")}</div></div></section>
  <section class="dark"><div class="wrap stack"><h2>Why Kind</h2><div class="values">${KIND.values.map(v => `<div>${esc(v)}</div>`).join("")}</div></div></section>
  <section><div class="wrap"><div class="notice">Kind Lending will never ask for payment or banking details as part of a job application. All openings are listed on our careers portal. Questions: <a href="mailto:${KIND.emails.peopleops}"><u>${KIND.emails.peopleops}</u></a> or ${KIND.phones.office}.</div><p style="margin-top:var(--s4)"><a href="#/mentorship-program"><u>Mentorship Program by Glenn Stearns</u></a> · <a href="#/recruiting"><u>Recruiting</u></a></p></div></section>`;

  pages.events = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">events</p><h1>Kind events</h1><p class="lede">Broker trainings, industry expos, and the VIBE mindset event. Register on the event's own site.</p></div></section>
  <section style="padding-top:0"><div class="wrap"><div class="tbl"><table><thead><tr><th>When</th><th>Event</th><th>Where</th><th></th></tr></thead><tbody>${KIND.events.map(e => `<tr><td>${esc(e.when)}</td><td><b>${esc(e.what)}</b></td><td>${esc(e.where)}</td><td><a class="btn btn-paper btn-sm" href="#/events">Register</a></td></tr>`).join("")}</tbody></table></div>
  <div class="panel grid-2" style="margin-top:var(--s6)"><div class="stack" style="gap:8px"><h3>Real estate agent newsletter</h3><p class="muted">Retail Real Estate Agent Newsletter sign up.</p></div><form class="form" onsubmit="return KIND_APP.fakeSubmit(this,'You are on the list.')"><div class="two"><div class="field"><label>Full name</label><input required></div><div class="field"><label>Email address</label><input type="email" required></div></div><button class="btn btn-ink" style="justify-self:start">Submit</button></form></div></div></section>`;

  pages.blog = (cat) => { cat = cat ? decodeURIComponent(cat) : ""; const list = cat ? KIND.posts.filter(p => p.cat === cat) : KIND.posts; return `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">explore & learn</p><h1>Blog</h1><p class="lede">We're excited to help you navigate the mortgage process with ease, and provide you with resources to make your homeownership journey a success.</p>
  <div class="cats"><a href="#/blog" class="${cat ? "" : "on"}">All</a>${KIND.blogCats.map(c => `<a href="#/blog/${encodeURIComponent(c)}" class="${cat === c ? "on" : ""}">${esc(c)}</a>`).join("")}</div></div></section>
  <section style="padding-top:0"><div class="wrap"><div class="posts">${list.map(p => `<a class="post" href="#/blog/${encodeURIComponent(p.cat)}"><time>${esc(p.date)} · ${esc(p.cat)}</time><b>${esc(p.title)}</b>${p.excerpt ? `<p class="muted">${esc(p.excerpt)}</p>` : ""}<span class="small" style="font-weight:600;margin-top:auto">Read more &rarr;</span></a>`).join("") || `<p class="muted">No posts in this category yet.</p>`}</div><p class="small muted" style="margin-top:var(--s5)">245 posts on kindlending.com. This mock-up shows a sample.</p></div></section>`; };

  pages.partners = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">kind tpo · partners</p><h1>Partner with Kind.</h1><p class="lede">Wholesale lending for mortgage brokers. Fast underwriting, a full product mix, and Kwikie, the broker portal our engineers built because the old ones were too slow.</p><div class="row">${ext(L.kwikie, "btn btn-ink", "Kwikie login")}<a class="btn btn-paper" href="#/partners">Partner with us</a>${ext(L.topDog, "btn btn-paper", "Top Dog program")}</div></div></section>
  <section style="padding-top:0"><div class="wrap grid-3">
    <div class="panel stack" style="gap:8px"><b>Why brokers choose Kind</b><p class="muted">MPA 5-Star Wholesale Lender 2025. Voted Top Non-QM Lender in the 2025 Originator Choice Awards. Scotsman Guide #6 wholesale lender 2024.</p></div>
    <div class="panel stack" style="gap:8px"><b>Program highlights</b><p class="muted">Conventional, FHA, VA, USDA, Jumbo, Kind Non-QM (bank statement, DSCR, DSCR Max), National DPA, HELOC and closed-end seconds, 3-2-1 / 2-1 / 1-0 buydowns, VA IRRRL, FHA streamline, 15-day locks.</p></div>
    <div class="panel stack" style="gap:8px"><b>Broker media</b><p class="muted">Del Talk podcast, Kind Broker Connect monthly call, VIBE events, and training webinars.</p><a class="btn btn-paper btn-sm" href="#/events" style="align-self:flex-start">See events</a></div>
  </div></section>
  <section class="dark"><div class="wrap grid-2"><div class="stack"><p class="eyebrow">from the chief production officer</p><h2>Top-five wholesale lender in five years.</h2><p class="lede">Delfino Aguilar led Kind TPO from launch to a top-five wholesale ranking and was named Chief Production Officer in November 2025.</p></div><div class="panel stack"><b>Partner with us</b><form class="form" onsubmit="return KIND_APP.fakeSubmit(this,'Thanks. A Kind account executive will reach out.')"><div class="two"><div class="field"><label>First name</label><input required></div><div class="field"><label>Last name</label><input required></div></div><div class="two"><div class="field"><label>Email</label><input type="email" required></div><div class="field"><label>Phone</label><input type="tel"></div></div><div class="field"><label>Company and NMLS</label><input></div><button class="btn btn-yellow" style="justify-self:start">Send</button></form></div></div></section>
  <section><div class="wrap"><p class="small muted">Partners phone: ${KIND.phones.office}. TPO blog, product guides, tax documents and legal pages live under kindlending.com/tpo.</p></div></section>`;

  pages.licensing = () => `
  <section class="pg-head"><div class="wrap stack"><p class="eyebrow">legal</p><h1>State licensing</h1><p class="lede">Kind Lending, LLC, NMLS #3925. Verify any license at ${ext(L.nmls, "", "<u>NMLS Consumer Access</u>")}. Not all programs are available in all areas. Program restrictions apply.</p></div></section>
  <section style="padding-top:0"><div class="wrap"><div class="tbl"><table><thead><tr><th>State</th><th>License type</th><th>Licensing agency</th><th>License number</th></tr></thead><tbody>${KIND.licensing.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}<tr><td colspan="4" class="muted">Plus licenses in 45 more states and the District of Columbia. The full table (about 80 rows) is on kindlending.com/legal/licensing.</td></tr></tbody></table></div></div></section>`;

  const simple = (eyebrow, title, body) => () => `<section class="pg-head"><div class="wrap stack"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div></section><section style="padding-top:0"><div class="wrap prose">${body}</div></section>`;
  pages.privacy = simple("legal", "Privacy policy", `<p>Kind Lending's privacy policy, and 20 state-specific privacy disclosures (California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, Virginia), are published at kindlending.com/legal. This mock-up links to them rather than reproducing legal text.</p><p><a class="btn btn-paper btn-sm" href="https://www.kindlending.com/legal/privacy-policy" target="_blank" rel="noopener">Read the privacy policy</a></p>`);
  pages.terms = simple("legal", "Terms of use", `<p>Published at kindlending.com/legal/terms-of-use.</p><p><a class="btn btn-paper btn-sm" href="https://www.kindlending.com/legal/terms-of-use" target="_blank" rel="noopener">Read the terms of use</a></p>`);
  pages["tax-documents"] = simple("documents", "Tax documents", `<p>Form 1095-C and other tax documents. Questions to <a href="mailto:${KIND.emails.peopleops}"><u>${KIND.emails.peopleops}</u></a> or ${KIND.phones.office}.</p>`);
  pages["builder-services"] = simple("builder services", "Build kinder.", `<p>Financing partnerships for home builders. Call ${KIND.phones.office} to talk to the builder services team.</p>`);
  pages["mentorship-program"] = simple("mentorship program", "Mentorship Program by Glenn Stearns", `<p>Join the early bird list.</p><form class="form" style="max-width:480px" onsubmit="return KIND_APP.fakeSubmit(this,'You are on the early bird list.')"><div class="field"><label>Full name</label><input required></div><div class="field"><label>Email</label><input type="email" required></div><button class="btn btn-ink" style="justify-self:start">Join the early bird list</button></form>`);
  pages.recruiting = simple("recruiting", "Join the #KindMovement", `<p>A powerful product mix, a culture with kindness in its name, and technology partners including Blue Sage, CompenSafe and Experience.com.</p><p><a class="btn btn-ink btn-sm" href="${L.careersATS}" target="_blank" rel="noopener">See open positions</a></p>`);
  pages.search = () => `<section class="pg-head"><div class="wrap stack"><p class="eyebrow">search</p><h1>Search</h1><form class="row" onsubmit="return KIND_APP.siteSearch(this)"><input id="sq" style="border:1px solid var(--line);border-radius:var(--pill);padding:14px 20px;background:#fff;flex:1;min-width:240px" placeholder="Search…" aria-label="Search"><button class="btn btn-ink">Search</button></form><div id="sres"></div></div></section>`;
  pages["about-demo"] = simple("about this demo", "What you're looking at", `<p>A concept rebuild of kindlending.com by CrossGen AI, built September 2, 2026. Every headline, product description, review, phone number, and legal line was taken from the live site. Nothing was invented.</p><h2>What changed</h2><ul><li>One page weight instead of 2.5 MB of assets and six font families. Mobile first, no layout collapse.</li><li>Design: Kind's own Montserrat, navy, orange, sky blue and yellow, and their bubble motif, set with the level of detail of mercury.com: fluid type scale, non-default weights, hairline elevation, a shine on the primary button, orchestrated entrances, and product mocks with real numbers. Biscuit, the Boston terrier from Kind's hero photo, runs the street and chases your cursor.</li><li>Every feature of the current site is preserved: apply, loan in progress, MyKindPay, quick rate quote, calculator, find a loan officer by state and branch, loan officer profiles, contact, careers, events, blog with categories, partners (TPO) with Kwikie, legal and licensing.</li><li>Kind Guide: an AI loan guide where a rules engine does the math and the AI only talks. Same architecture Betterment shipped in 2026 for compliance reasons.</li></ul><h2>Why an AI guide</h2><ul><li>Rocket reports AI-assisted borrowers are 3x more likely to close, and its AI-to-banker handoff converts 4x.</li><li>Roughly 40% of mortgage leads are never contacted and after-hours leads wait about 14 hours for a reply.</li><li>J.D. Power 2025: 71% of borrowers say AI disclosure is very important. Kind Guide discloses on every screen.</li><li>Glenn Stearns, 2023: "We are also getting into AI technologies for underwriting."</li></ul><h2>Guardrails</h2><ul><li>Labeled as AI. Every figure labeled an estimate. No rate, APR or approval promised. No credit pull, no rate lock.</li><li>NMLS #3925 and Equal Housing Lender on every page. Human path on every screen.</li><li>Program selection stays with a licensed loan officer.</li></ul>`);

  // ---------- Router ----------
  let dog = null;
  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [name, ...rest] = hash.split("/");
    const fn = pages[name || "home"] || pages.home;
    if (dog) { dog.destroy(); dog = null; }
    app.innerHTML = `<div class="view">${fn(rest.join("/"))}</div>`;
    document.title = (name ? name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + " · " : "") + "Kind Lending";
    $("#seg").querySelectorAll("a").forEach(a => a.classList.toggle("on", (name === "partners") === (a.dataset.aud === "partners")));
    $("#nav").querySelectorAll(":scope > a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#/" + name));
    $("#sheet").hidden = true;
    window.scrollTo({ top: 0 });
    if ($("#chat")) KIND_GUIDE.bind();
    if ($("#calc")) calcBind();
    if ($("#loResults")) loBind();
    if ($("#dogTrack") && typeof KIND_DOG !== "undefined") { dog = KIND_DOG.mount($("#dogTrack"), { startX: 60, speed: innerWidth < 640 ? 170 : 240, scale: innerWidth < 640 ? .8 : 1 }); heroParallax(); }
    reveal();
  }
  window.addEventListener("hashchange", route);

  // Reveal: everything is visible at rest. Elements below the fold get a gentle lift as they enter.
  function reveal() {
    const els = [...document.querySelectorAll(".rv")];
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vh = innerHeight;
    els.forEach(el => { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add("pre"); });
    const io = new IntersectionObserver((ents) => { ents.forEach((e, i) => { if (e.isIntersecting) { const el = e.target; setTimeout(() => el.classList.remove("pre"), (i % 4) * 70); io.unobserve(el); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(el => io.observe(el));
  }

  // Bubbles drift a little with the cursor. Cheap, and it makes the hero feel alive.
  function heroParallax() {
    const hero = $("#hero"); if (!hero || !matchMedia("(hover:hover)").matches) return;
    const bubs = [...hero.querySelectorAll(".bub")];
    let raf = 0, mx = 0, my = 0;
    hero.addEventListener("mousemove", (e) => { const r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(() => { raf = 0; bubs.forEach((b, i) => { const k = 8 + (i % 4) * 6; b.style.translate = `${mx * k}px ${my * k}px`; }); }); });
  }

  // Calculator
  function calcBind() {
    const g = (id) => $("#" + id);
    const upd = () => {
      const price = +g("cPrice").value, dp = +g("cDown").value, term = +g("cTerm").value, rate = +g("cRate").value, ti = g("cTI").checked;
      const down = price * dp / 100, loan = price - down;
      const pi = E.pmt(loan, rate, term), tax = price * E.OC.propertyTaxRate / 12, ins = E.OC.insuranceAnnual / 12;
      const mi = E.mi("conventional", loan, loan / price * 100, 740);
      const total = pi + (ti ? tax + ins + mi : 0);
      g("oPrice").textContent = fmt(price); g("oDown").textContent = `${fmt(down)} (${dp}%)`; g("oTerm").textContent = term + " years"; g("oRate").textContent = rate.toFixed(2) + "%";
      g("rPay").textContent = fmt(total); g("rLoan").textContent = fmt(loan); g("rDown").textContent = dp + "%";
      g("rNote").textContent = ti ? `Principal and interest ${fmt(pi)}, property tax about ${fmt(tax)}, insurance about ${fmt(ins)}${mi ? `, PMI about ${fmt(mi)} until 80% LTV` : ""}. ${loan > E.LIMITS.conformingHighCost ? "This loan is above the " + fmt(E.LIMITS.conformingHighCost) + " Orange County conforming limit, so it would be a jumbo." : "Within the " + fmt(E.LIMITS.conformingHighCost) + " Orange County conforming limit."}` : `Principal and interest only.`;
    };
    ["cPrice", "cDown", "cTerm", "cRate", "cTI"].forEach(id => g(id).addEventListener("input", upd));
    upd();
  }

  // LO search
  function loBind() {
    const box = $("#loResults");
    box.innerHTML = "";
    document.querySelectorAll("[data-state]").forEach(a => a.addEventListener("click", (e) => { e.preventDefault(); const st = a.dataset.state; const bs = KIND.branches.filter(b => b.city.endsWith(", " + st)); box.innerHTML = `<div class="panel stack"><b>${a.textContent.replace(st, "")} branches</b>${bs.length ? `<div class="row">${bs.map(b => `<a class="btn btn-paper btn-sm" href="#/branch/${b.slug}">${b.city}</a>`).join("")}</div>` : `<p class="muted">Loan officers in this state work from partner branches. Call ${KIND.phones.office} and we'll connect you.</p>`}</div>`; box.scrollIntoView({ behavior: "smooth", block: "center" }); }));
  }
  window.KIND_APP = {
    fakeSubmit(form, msg) { form.innerHTML = `<div class="notice">${msg} <span class="muted">(Demo: nothing was sent.)</span></div>`; return false; },
    heroGo(form) { const q = $("#heroQ").value.trim(); location.hash = "#/guide"; setTimeout(() => { const inp = $("#chatIn"); if (inp && q) { inp.value = `I'm looking in ${q}.`; inp.focus(); } }, 400); return false; },
    searchLO(form) { const q = $("#loQ").value.trim().toLowerCase(); const hits = KIND.officers.filter(o => (o.name + " " + (KIND.branches.find(b => b.slug === o.branch) || {}).city + " " + o.nmls).toLowerCase().includes(q)); $("#loResults").innerHTML = hits.length ? peopleGrid(hits) : `<div class="panel"><p>No match for "${esc(q)}". Call ${KIND.phones.office} and we'll put you in touch with a loan officer.</p></div>`; return false; },
    siteSearch(form) { const q = $("#sq").value.trim().toLowerCase(); const hits = []; KIND.programs.forEach(p => { if ((p.name + p.blurb).toLowerCase().includes(q)) hits.push([`#/loan-options/${p.id}`, p.name + " loans"]); }); KIND.posts.forEach(p => { if (p.title.toLowerCase().includes(q)) hits.push([`#/blog/${encodeURIComponent(p.cat)}`, p.title]); }); KIND.officers.forEach(o => { if (o.name.toLowerCase().includes(q)) hits.push([`#/mlo/${o.slug}`, o.name]); }); $("#sres").innerHTML = hits.length ? `<ul style="padding-left:20px">${hits.map(([h, t]) => `<li><a href="${h}"><u>${esc(t)}</u></a></li>`).join("")}</ul>` : `<p class="muted">No matching results.</p>`; return false; },
  };

  // Header behaviour
  $("#burger").onclick = () => { $("#sheet").hidden = false; };
  $("#sheetX").onclick = () => { $("#sheet").hidden = true; };
  window.addEventListener("scroll", () => $("#hdr").classList.toggle("scrolled", scrollY > 8), { passive: true });
  route();
})();
