// Kind Guide loan engine. Pure functions, no DOM. Every number the AI shows comes from here.
// Limits and rates are constants at the top so they can be updated in one place.
const KIND_ENGINE = (() => {
  const LIMITS = {
    year: 2026,
    conformingBaseline: 832750,      // FHFA 2026 baseline, 1-unit
    conformingHighCost: 1249125,     // ceiling, 1-unit (Orange County is a ceiling county)
    fhaOrangeCounty: 1249125,        // FHA 2026 1-unit, Orange County
    vaLimit: null,                   // no limit with full entitlement
  };
  const RATES = {                    // indicative only; the page labels them as such
    asOf: "2026-08-27",
    conv30: 6.66, conv15: 5.98, fha30: 6.40, va30: 6.25, jumbo30: 6.90, nonqm30: 7.60,
  };
  const OC = { medianPrice: 1200000, propertyTaxRate: 0.0111, insuranceAnnual: 1700, hoaDefault: 0 };

  function pmt(principal, annualRate, years) {
    const r = annualRate / 100 / 12, n = years * 12;
    if (r === 0) return principal / n;
    return principal * r / (1 - Math.pow(1 + r, -n));
  }

  // Monthly mortgage insurance estimate by program.
  function mi(program, loan, ltv, fico) {
    if (program === "va" || program === "usda") return 0;
    if (program === "fha") return loan * 0.0055 / 12;               // annual MIP 0.55% for LTV>95%, 30yr
    if (program === "conventional") {
      if (ltv <= 80) return 0;
      let f = fico >= 760 ? 0.0025 : fico >= 720 ? 0.0040 : fico >= 680 ? 0.0065 : 0.0095;
      if (ltv > 95) f += 0.0015;
      return loan * f / 12;
    }
    return 0; // jumbo/non-qm typically priced into rate or require 80 LTV
  }

  function upfrontFee(program, loan, isFirstUseVA = true, downPct = 0) {
    if (program === "fha") return loan * 0.0175;                     // UFMIP
    if (program === "va") return loan * (downPct >= 10 ? 0.0125 : downPct >= 5 ? 0.015 : isFirstUseVA ? 0.0215 : 0.033);
    return 0;
  }

  // Which programs plausibly fit. Returns ranked list with reasons and blockers.
  function match({ price, downPayment, fico, income, monthlyDebts, veteran, selfEmployed, investor, firstTime }) {
    const loan = price - downPayment, ltv = loan / price * 100, downPct = downPayment / price * 100;
    const out = [];
    const check = (id, name, ok, reasons, blockers, rate) => {
      const p = pmt(loan, rate, 30);
      const tax = price * OC.propertyTaxRate / 12, ins = OC.insuranceAnnual / 12;
      const m = mi(id, loan, ltv, fico);
      const total = p + tax + ins + m;
      const dti = income > 0 ? (total + monthlyDebts) / (income / 12) * 100 : null;
      out.push({ id, name, ok, reasons, blockers, rate, principalAndInterest: p, mortgageInsurance: m, taxes: tax, insurance: ins, totalMonthly: total, dti, ltv, loan, upfront: upfrontFee(id, loan, true, downPct) });
    };

    // Conventional
    { const r = [], b = [];
      if (fico >= 620) r.push(`FICO ${fico} meets the 620 minimum`); else b.push(`FICO ${fico} is under the 620 minimum`);
      if (downPct >= 3) r.push(`${downPct.toFixed(1)}% down meets the 3% minimum${firstTime ? " for first-time buyers" : ""}`); else b.push("needs at least 3% down");
      if (loan > LIMITS.conformingHighCost) b.push(`loan of ${fmt(loan)} is over the ${fmt(LIMITS.conformingHighCost)} Orange County conforming limit`); else r.push(`loan is within the ${fmt(LIMITS.conformingHighCost)} conforming limit`);
      if (ltv > 80) r.push("PMI applies until 80% LTV, then drops off");
      check("conventional", "Conventional", b.length === 0, r, b, RATES.conv30); }
    // FHA
    { const r = [], b = [];
      if (fico >= 580 && downPct >= 3.5) r.push(`FICO ${fico} with ${downPct.toFixed(1)}% down qualifies at 3.5% minimum`);
      else if (fico >= 500 && downPct >= 10) r.push(`FICO ${fico} qualifies with 10% down`);
      else b.push(fico < 500 ? "FICO under 500" : "needs 3.5% down at 580+, or 10% down at 500 to 579");
      if (loan > LIMITS.fhaOrangeCounty) b.push(`over the ${fmt(LIMITS.fhaOrangeCounty)} FHA limit for Orange County`);
      if (investor) b.push("FHA is for a primary residence");
      r.push(downPct >= 10 ? "mortgage insurance drops off after 11 years at 10% or more down" : "mortgage insurance stays for the life of the loan at under 10% down");
      check("fha", "FHA", b.length === 0, r, b, RATES.fha30); }
    // VA
    { const r = [], b = [];
      if (!veteran) b.push("requires eligible military service");
      else { r.push("0% down with full entitlement"); r.push("no monthly mortgage insurance"); r.push("no loan limit with full entitlement"); }
      if (investor) b.push("VA is for a primary residence");
      check("va", "VA", b.length === 0, r, b, RATES.va30); }
    // Jumbo
    { const r = [], b = [];
      if (loan <= LIMITS.conformingHighCost) b.push("loan fits conforming, so jumbo is not needed");
      if (fico >= 700) r.push(`FICO ${fico} meets the typical 700 minimum`); else b.push("typically needs 700+ FICO");
      if (downPct >= 10) r.push(`${downPct.toFixed(1)}% down meets the typical 10% minimum`); else b.push("typically needs 10% or more down");
      check("jumbo", "Jumbo", b.length === 0, r, b, RATES.jumbo30); }
    // Non-QM
    { const r = [], b = [];
      if (selfEmployed) r.push("bank-statement income documentation instead of tax returns");
      if (investor) r.push("DSCR qualifies on the property's rent, not your income");
      if (!selfEmployed && !investor) b.push("usually only worth it when standard income documentation does not work");
      if (downPct < 10) b.push("typically needs 10% or more down");
      if (fico < 620) b.push("typically needs 620+ FICO");
      check("nonqm", "Non-QM", b.length === 0, r, b, RATES.nonqm30); }
    // USDA
    { const r = [], b = ["Orange County addresses are not USDA-eligible; USDA is for designated rural areas"];
      check("usda", "USDA", false, r, b, RATES.conv30); }

    out.sort((a, b) => (b.ok - a.ok) || (a.totalMonthly - b.totalMonthly));
    return { loan, ltv, downPct, programs: out, limits: LIMITS, rates: RATES, county: OC };
  }

  // Max purchase price for a target payment or DTI.
  function affordability({ income, monthlyDebts, downPayment, fico = 720, maxDti = 43, rate = RATES.conv30 }) {
    const budget = income / 12 * (maxDti / 100) - monthlyDebts;
    let lo = 100000, hi = 5000000;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2, loan = mid - downPayment;
      const total = pmt(loan, rate, 30) + mid * OC.propertyTaxRate / 12 + OC.insuranceAnnual / 12 + mi("conventional", loan, loan / mid * 100, fico);
      if (total > budget) hi = mid; else lo = mid;
    }
    return { maxPrice: Math.round(lo / 1000) * 1000, monthlyBudget: budget };
  }

  function fmt(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  return { LIMITS, RATES, OC, pmt, mi, upfrontFee, match, affordability, fmt };
})();
if (typeof module !== "undefined") module.exports = KIND_ENGINE;
