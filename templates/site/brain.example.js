// The assistant's brain: system prompt + tools. The engine does the math; this only describes it to the model.
"use strict";
const E = require("./engine.js");
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
Today's indicative rates (Freddie Mac PMMS, week of ${E.RATES.asOf}): 30yr fixed ${E.RATES.conv30}%. Orange County 2026 conforming and FHA limit: ${E.fmt(E.LIMITS.conformingHighCost)}.`;

const TOOLS = [
  { name: "match_programs", description: "Rank Kind's loan programs for this buyer and compute estimated monthly payment, DTI and mortgage insurance for each, using Orange County 2026 limits and current indicative rates.",
    input_schema: { type: "object", properties: { price: { type: "number" }, downPayment: { type: "number", description: "dollars" }, fico: { type: "number" }, income: { type: "number", description: "annual household income" }, monthlyDebts: { type: "number" }, veteran: { type: "boolean" }, selfEmployed: { type: "boolean" }, investor: { type: "boolean" }, firstTime: { type: "boolean" } }, required: ["price", "downPayment", "fico", "income"] } },
  { name: "affordability", description: "Estimate the maximum purchase price for this buyer at a 43% debt-to-income ratio using a conventional 30-year loan.",
    input_schema: { type: "object", properties: { income: { type: "number" }, monthlyDebts: { type: "number" }, downPayment: { type: "number" }, fico: { type: "number" } }, required: ["income", "downPayment"] } },
  { name: "handoff", description: "Send the conversation summary to a Kind loan officer and show the visitor the handoff card.",
    input_schema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] } },
];

function runTool(name, args) {
  const tool = TOOLS.find(t => t.name === name);
  if (tool) { const missing = (tool.input_schema.required || []).filter(k => args[k] === undefined || args[k] === null || args[k] === "" || (tool.input_schema.properties[k].type === "number" && !(Number(args[k]) > 0))); if (missing.length) return { forModel: { error: "missing or invalid required inputs: " + missing.join(", ") + ". Ask the visitor for them, then call again." }, forPage: null }; for (const k of Object.keys(args)) if (tool.input_schema.properties[k] && tool.input_schema.properties[k].type === "number") args[k] = Number(args[k]); }
  if (name === "match_programs") { const r = E.match({ monthlyDebts: 0, veteran: false, selfEmployed: false, investor: false, firstTime: true, ...args }); return { forModel: compact(r), forPage: r }; }
  if (name === "affordability") { const r = E.affordability({ monthlyDebts: 0, fico: 720, ...args }); return { forModel: { maxPrice: r.maxPrice, monthlyBudget: Math.round(r.monthlyBudget) }, forPage: r }; }
  if (name === "handoff") return { forModel: { ok: true }, forPage: { summary: String(args.summary || "") } };
  return { forModel: { error: "unknown tool" }, forPage: null };
}
function compact(r) { return { loan: Math.round(r.loan), ltv: +r.ltv.toFixed(1), programs: r.programs.map(p => ({ program: p.name, fits: p.ok, rate: p.rate, estMonthlyTotal: Math.round(p.totalMonthly), principalAndInterest: Math.round(p.principalAndInterest), mortgageInsurance: Math.round(p.mortgageInsurance), dti: p.dti ? +p.dti.toFixed(1) : null, upfrontFee: Math.round(p.upfront), reasons: p.reasons, blockers: p.blockers })) }; }


module.exports = { SYSTEM, TOOLS, runTool };
