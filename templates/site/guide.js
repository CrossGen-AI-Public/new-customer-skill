// Kind Guide. A real model talks; KIND_ENGINE does the math. Two modes, picked at load:
//   1. artifact  — claude.ai `sample` capability, tools run in the page
//   2. api       — POST /api/guide on the hosting server (server.js) or the public endpoint; tools run on the server
// There is no scripted fallback. If no model is reachable the assistant says it is offline and points at a person.
(() => {
  const E = KIND_ENGINE;
  const fmt = E.fmt;
  const state = { turns: [], profile: {}, mode: "offline", sample: null, busy: false, lastResult: null, api: "" };
  // Where the chat server lives. Same origin when served by server.js; a public endpoint otherwise
  // (set window.KIND_GUIDE_API before this script, or a <meta name="kind-guide-api">).
  const API_BASE = () => (window.KIND_GUIDE_API || (document.querySelector('meta[name="kind-guide-api"]') || {}).content || "").replace(/\/$/, "");

  const SYSTEM = () => `You are Kind Guide, the AI home-loan guide on the Kind Lending website (Irvine, CA, NMLS #3925). Kind's tagline: "faster, easier, and, well, kinder."
Voice: warm, plain English, no bank-speak, short messages (max 3 short sentences or a short list). One question at a time. Plain text only: no markdown, no asterisks, no headings; use short lines. Never use emojis or em dashes.
You help a visitor figure out (1) which Kind loan programs could fit, (2) roughly what a home would cost per month, (3) roughly how much home they can afford, then (4) connect them with a Kind loan officer.
Programs Kind offers: Conventional, FHA, VA, Jumbo, USDA, Non-QM (bank statement, DSCR), plus National DPA, GSFA, CalHFA, buydowns, HECM reverse, FHA 203(k).
RULES:
- NEVER state a dollar figure, rate, DTI, or program fit from memory. Only report numbers returned by your tools. If you do not have a tool result yet, ask for the missing input instead.
- Required inputs, ask for whichever is missing, one at a time: purchase price (or "not sure" for affordability), down payment (dollars or percent), credit score (a range is fine), annual household income. Optional: monthly debt payments, veteran, self-employed, investment property. Never ask for optional inputs before calling a tool; call match_programs as soon as the four required inputs exist, then mention afterwards that VA (veterans) or Non-QM (self-employed, investors) could change the picture if that applies. Parse sensibly: "10%" is percent of price; "800k" is 800000; "$9,000 a month" is 108000 a year.
- As soon as you have price, down payment, credit score and income, call match_programs. If they do not know a price, call affordability first.
- After a tool result, summarize in plain words: the top one or two fitting programs, the estimated total monthly payment, and one reason. Then offer the next step: talk to a loan officer, or adjust a number.
- Always call every figure an estimate. Never say approved, pre-approved, qualified, or guaranteed. You cannot lock a rate or pull credit. A licensed Kind loan officer makes every decision.
- If asked something outside home loans, answer in one sentence and steer back.
- When the visitor is ready, call handoff with a two-sentence summary for the loan officer.
- HARD RULE: if the visitor's message already contains a price, a down payment, a credit score and an income, your first and only action is to call match_programs. Do not ask about veteran, self-employed, investment or debts first; ask about those only after the results, and only if they could change the answer.
- HARD RULE: if the visitor asks what they can afford (or has no price) and has given income and a down payment, call affordability immediately with what you have (credit score optional). Do not ask for a price first.
Today's indicative rates (Freddie Mac PMMS, week of ${E.RATES.asOf}): 30yr fixed ${E.RATES.conv30}%. Orange County 2026 conforming and FHA limit: ${fmt(E.LIMITS.conformingHighCost)}.`;

  // Tools for artifact mode (run in the page). The server has the same three.
  const tools = [
    { name: "match_programs", description: "Rank Kind's loan programs for this buyer and compute estimated monthly payment, DTI, and mortgage insurance for each, using Orange County 2026 limits and current indicative rates.",
      inputSchema: { type: "object", properties: { price: { type: "number" }, downPayment: { type: "number", description: "dollars" }, fico: { type: "number" }, income: { type: "number", description: "annual household income" }, monthlyDebts: { type: "number" }, veteran: { type: "boolean" }, selfEmployed: { type: "boolean" }, investor: { type: "boolean" }, firstTime: { type: "boolean" } }, required: ["price", "downPayment", "fico", "income"] },
      execute: (i) => { const r = E.match({ monthlyDebts: 0, veteran: false, selfEmployed: false, investor: false, firstTime: true, ...i }); state.profile = { ...state.profile, ...i }; state.lastResult = r; renderCards(r); return compact(r); } },
    { name: "affordability", description: "Estimate the maximum purchase price for this buyer at a 43% debt-to-income ratio using a conventional 30-year loan.",
      inputSchema: { type: "object", properties: { income: { type: "number" }, monthlyDebts: { type: "number" }, downPayment: { type: "number" }, fico: { type: "number" } }, required: ["income", "downPayment"] },
      execute: (i) => { const r = E.affordability({ monthlyDebts: 0, fico: 720, ...i }); state.profile = { ...state.profile, ...i }; renderAfford(r); return { maxPrice: r.maxPrice, monthlyBudget: Math.round(r.monthlyBudget) }; } },
    { name: "handoff", description: "Send the conversation summary to a Kind loan officer and show the visitor the handoff card.",
      inputSchema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
      execute: (i) => { renderHandoff(i.summary); return { ok: true }; } },
  ];
  function compact(r) { return { loan: Math.round(r.loan), ltv: +r.ltv.toFixed(1), programs: r.programs.map(p => ({ program: p.name, fits: p.ok, rate: p.rate, estMonthlyTotal: Math.round(p.totalMonthly), principalAndInterest: Math.round(p.principalAndInterest), mortgageInsurance: Math.round(p.mortgageInsurance), dti: p.dti ? +p.dti.toFixed(1) : null, upfrontFee: Math.round(p.upfront), reasons: p.reasons, blockers: p.blockers })) }; }

  // ---------- DOM ----------
  const $ = (s, r = document) => r.querySelector(s);
  let chatEl, inputEl, sendEl, quickEl;
  // Keep the newest message in view. Any change inside the pane (new bubble, streamed text, a card
  // growing) pins the scroll to the bottom on the next frame. Instant, not smooth: a smooth scroll
  // that is still in flight swallows the next request, which is how messages ended up out of view.
  let pinRaf = 0, observer = null;
  function pinToEnd() { if (!chatEl) return; cancelAnimationFrame(pinRaf); pinRaf = requestAnimationFrame(() => { chatEl.scrollTop = chatEl.scrollHeight; }); }
  function bind() {
    chatEl = $("#chat"); inputEl = $("#chatIn"); sendEl = $("#chatSend"); quickEl = $("#quick");
    if (!chatEl) return;
    chatEl.style.scrollBehavior = "auto";
    if (observer) observer.disconnect();
    observer = new MutationObserver(pinToEnd); observer.observe(chatEl, { childList: true, subtree: true, characterData: true });
    inputEl.addEventListener("focus", () => setTimeout(pinToEnd, 250));
    sendEl.onclick = () => send(inputEl.value);
    inputEl.onkeydown = (e) => { if (e.key === "Enter") send(inputEl.value); };
    quickEl.onclick = (e) => { const b = e.target.closest("button"); if (b) send(b.dataset.say || b.textContent); };
    start();
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Models sometimes answer in markdown; the chat renders plain text, so tidy the common bits.
  const plain = (t) => String(t || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/^\s*[*-]\s+/gm, "• ").replace(/^\s*#{1,6}\s+/gm, "").replace(/`([^`]+)`/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
  function bubble(kind, text) { const d = document.createElement("div"); d.className = "msg " + kind; d.textContent = kind === "ai" ? plain(text) : text; chatEl.appendChild(d); pinToEnd(); return d; }
  function addCard(html) { const d = document.createElement("div"); d.innerHTML = html; while (d.firstChild) chatEl.appendChild(d.firstChild); pinToEnd(); }
  function renderCards(r) {
    state.lastResult = r;
    const top = r.programs.slice(0, 3);
    addCard(top.map(p => `<div class="card ${p.ok ? "ok" : "no"}"><div class="t"><span>${esc(p.name)} <span class="chip ${p.ok ? "ok" : "no"}">${p.ok ? "could fit" : "not a fit"}</span></span><b>${fmt(p.totalMonthly)}/mo</b></div><ul>${(p.ok ? p.reasons : p.blockers).slice(0, 3).map(x => `<li>${esc(x)}</li>`).join("")}<li>Est. ${p.rate}% rate, P&I ${fmt(p.principalAndInterest)}${p.mortgageInsurance ? ", MI " + fmt(p.mortgageInsurance) : ""}${p.dti ? ", DTI " + p.dti.toFixed(0) + "%" : ""}</li></ul></div>`).join(""));
  }
  function renderAfford(r) { addCard(`<div class="card ok"><div class="t"><span>Estimated max purchase price</span><b>${fmt(r.maxPrice)}</b></div><ul><li>Keeps total housing plus debts near 43% of income</li><li>Monthly budget about ${fmt(r.monthlyBudget)}</li><li>Estimate only, not an offer</li></ul></div>`); }
  function renderHandoff(summary) {
    const lo = KIND.officers[1];
    addCard(`<div class="card ok"><div class="t"><span>Sent to a Kind loan officer</span><b>Irvine</b></div><p style="margin:8px 0 6px;color:var(--ink-2)">${esc(summary || "")}</p><ul><li>${esc(lo.name)}, ${esc(lo.title)}, NMLS# ${lo.nmls}</li><li>Kind replies during business hours, Monday to Friday 8am to 5pm PT</li></ul><div class="row" style="margin-top:10px"><a class="btn btn-navy btn-sm" href="${KIND.links.apply}" target="_blank" rel="noopener">Start my application</a><a class="btn btn-paper btn-sm" href="tel:17148441000">Call (714) 844-1000</a></div></div>`);
    quickEl.innerHTML = "";
  }
  function renderToolResults(list) { for (const t of list || []) { if (t.name === "match_programs" && t.result) renderCards(t.result); else if (t.name === "affordability" && t.result) renderAfford(t.result); else if (t.name === "handoff") renderHandoff(t.result && t.result.summary); } }
  function setQuick(items) { quickEl.innerHTML = items.map(t => `<button>${esc(t)}</button>`).join(""); }

  async function probe(base) { try { const r = await fetch(base + "/api/guide/health", { cache: "no-store", mode: "cors" }); if (r.ok) { const j = await r.json(); if (j && j.backend) return j; } } catch { } return null; }
  async function detectMode() {
    // 1. claude.ai artifact: the viewer's own Claude
    try { if (window.claude) { state.sample = await claude.use("sample"); if (state.sample) return "artifact"; } } catch { }
    // 2. a server: same origin first (server.js), then the public endpoint
    for (const base of [...new Set(["", API_BASE()])]) { const j = await probe(base); if (j) { state.api = base; state.backend = j; return "api"; } }
    return "offline";
  }
  function setBadge() {
    const el = document.querySelector("#guidePhone .who small"); if (!el) return;
    const b = state.backend || {}; const name = b.backend === "openai-compatible" ? (b.model || "").split("/").pop().replace(/-FP8$/, "") : b.model || "Claude"; el.textContent = state.mode === "offline" ? "Assistant offline" : "AI assistant · estimates only";
    const dot = document.querySelector("#guidePhone .dot"); if (dot) dot.style.background = state.mode === "offline" ? "#c33" : "#34c76a";
  }

  async function start() {
    state.turns = []; state.lastResult = null;
    chatEl.innerHTML = "";
    bubble("sys", "Kind Guide is an AI assistant. Estimates only, not an offer. A licensed loan officer reviews everything.");
    state.mode = await detectMode(); setBadge();
    if (state.mode === "offline") { offline(); return; }
    bubble("ai", "Hi, I'm Kind Guide. Tell me a little about the home you have in mind and I'll show you which Kind loans could fit and what it might cost each month. Do you have a price in mind, or would you rather find out what you could afford?");
    setQuick(["I'm looking at a $1.1M house in Irvine", "Not sure, what can I afford?", "I'm a veteran", "I'm self-employed"]);
  }

  async function send(text) {
    text = (text || "").trim(); if (!text || state.busy) return;
    inputEl.value = ""; bubble("me", text); quickEl.innerHTML = "";
    if (state.mode === "offline") { offline(); return; }
    state.turns.push({ role: "user", content: text });
    state.busy = true; sendEl.disabled = true;
    const ai = bubble("ai", ""); ai.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    try {
      let reply = "";
      if (state.mode === "artifact") {
        const input = [{ role: "user", content: SYSTEM() + "\n\n(Conversation begins. Greet only once; the greeting already happened.)" }, { role: "assistant", content: "Understood." }, ...state.turns];
        const res = await state.sample(input, { tools, cache: false, modelTier: "default", onText: ({ text }) => { ai.textContent = plain(text); pinToEnd(); } });
        reply = res.text || ai.textContent;
      } else {
        const res = await fetch(state.api + "/api/guide", { method: "POST", mode: "cors", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: state.turns }) });
        if (!res.ok) throw Object.assign(new Error("server " + res.status), { code: "server" });
        const j = await res.json();
        renderToolResults(j.toolResults);
        reply = j.text || "";
        if (!reply && (j.toolResults || []).length) reply = "Here's what I found.";
      }
      ai.textContent = plain(reply); chatEl.appendChild(ai); pinToEnd();
      state.turns.push({ role: "assistant", content: reply });
      if (state.turns.length > 24) state.turns = state.turns.slice(-24);
      if (state.lastResult && !/loan officer|handoff/i.test(reply)) setQuick(["Talk to a loan officer", "What if I put 20% down?", "Show me FHA vs conventional"]);
    } catch (err) {
      state.turns.pop();
      ai.textContent = err && err.text ? err.text : "I hit a snag reaching the model. Try again in a moment, or call (714) 844-1000.";
      if (err && err.code === "not_granted") { state.sample = null; state.mode = await detectMode(); setBadge(); if (state.mode === "offline") offline(); }
    } finally { state.busy = false; sendEl.disabled = false; }
  }

  // ---------- no model reachable: say so, never pretend ----------
  function offline() {
    bubble("ai", "Kind Guide is offline right now, so I can't run your numbers. A Kind loan officer can: call (714) 844-1000, Monday to Friday, 8am to 5pm PT, or request a quick rate quote and we'll get back to you.");
    quickEl.innerHTML = "";
    addCard(`<div class="card"><div class="row"><a class="btn btn-navy btn-sm" href="#/rate-quote">Quick rate quote</a><a class="btn btn-paper btn-sm" href="tel:17148441000">Call (714) 844-1000</a><a class="btn btn-paper btn-sm" href="#/calculator">Mortgage calculator</a></div></div>`);
    inputEl.disabled = true; inputEl.placeholder = "Assistant offline"; sendEl.disabled = true;
  }

  window.KIND_GUIDE = { bind, start };
})();
