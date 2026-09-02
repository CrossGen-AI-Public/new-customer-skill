#!/usr/bin/env node
// CLIENT mock-up server. Zero dependencies, Node 18+.
//   GET  /               the built site (dist/index.html)
//   GET  /health         "ok"
//   GET  /api/guide/health   {backend:"api"|"claude-cli"}
//   POST /api/guide      {messages:[{role,content}]} -> {text, toolResults:[{name,args,result}]}
// The assistant's math runs HERE (site/engine.js). The model only decides what to say and which
// engine function to call. Backend: Anthropic Messages API when ANTHROPIC_API_KEY is set,
// otherwise the local `claude -p` CLI (sparky's own Claude login).
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), { spawn } = require("child_process");
const E = require("./site/engine.js");

const PORT = +(process.env.PORT || 3700), HOST = process.env.HOST || "0.0.0.0";
// Backend order: OpenAI-compatible endpoint (GUIDE_AI_*, the same variables the crossgen-ai site uses),
// then the Anthropic Messages API (ANTHROPIC_API_KEY), then the local `claude -p` CLI.
const OAI_URL = (process.env.GUIDE_AI_URL || "").replace(/\/$/, ""), OAI_KEY = process.env.GUIDE_AI_KEY || "", OAI_MODEL = process.env.GUIDE_AI_MODEL || "";
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const API_MODEL = process.env.GUIDE_MODEL || "claude-sonnet-5";
const CLI = process.env.CLAUDE_BIN || "claude";
const CLI_MODEL = process.env.GUIDE_CLI_MODEL || "sonnet";
const MAX_PARALLEL = +(process.env.GUIDE_MAX_PARALLEL || 3);
const MAX_QUEUE = +(process.env.GUIDE_MAX_QUEUE || 20);
const ALLOW_ORIGINS = (process.env.GUIDE_ALLOW_ORIGINS || "https://crossgen-ai-public.github.io,https://claude.ai,https://*.claude.ai,https://*.claudeusercontent.com,https://*.crossgen-ai.com").split(",").map(s => s.trim()).filter(Boolean);
const originOk = (o) => !!o && ALLOW_ORIGINS.some(a => a === "*" || a === o || (a.includes("*") && new RegExp("^" + a.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$").test(o)));
const DIST = path.join(__dirname, "dist", "index.html");

// ---------- the assistant's brain lives in site/brain.js: {SYSTEM, TOOLS, runTool} ----------
const { SYSTEM, TOOLS, runTool } = require("./site/brain.js");

// ---------- backend 0: OpenAI-compatible chat completions with function calling (vLLM, Qwen, etc.) ----------
async function viaOpenAI(messages) {
  const toolResults = [];
  const msgs = [{ role: "system", content: SYSTEM() }, ...messages.map(m => ({ role: m.role, content: m.content }))];
  const tools = TOOLS.map(t => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } }));
  for (let round = 0; round < 4; round++) {
    const res = await fetch(OAI_URL + "/chat/completions", { method: "POST", headers: { authorization: "Bearer " + OAI_KEY, "content-type": "application/json" }, body: JSON.stringify({ model: OAI_MODEL, messages: msgs, tools, tool_choice: "auto", max_tokens: 1200, temperature: 0.3, chat_template_kwargs: { enable_thinking: false } }) });
    if (!res.ok) throw new Error("model " + res.status + " " + (await res.text()).slice(0, 200));
    const data = await res.json();
    const choice = (data.choices || [])[0] || {}; const m = choice.message || {};
    const calls = m.tool_calls || [];
    let text = (m.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();   // Qwen may think out loud; never show it
    if (!calls.length) return { text, toolResults };
    msgs.push({ role: "assistant", content: m.content || "", tool_calls: calls });
    for (const c of calls) {
      let args = {}; try { args = JSON.parse(c.function.arguments || "{}"); } catch { }
      const r = runTool(c.function.name, args);
      if (r.forPage) toolResults.push({ name: c.function.name, args, result: r.forPage });
      msgs.push({ role: "tool", tool_call_id: c.id, name: c.function.name, content: JSON.stringify(r.forModel) });
    }
  }
  return { text: "Here are your numbers. A Kind loan officer can take it from here.", toolResults };
}

// ---------- backend A: Anthropic Messages API with native tool use ----------
async function viaApi(messages) {
  const toolResults = []; let msgs = messages.map(m => ({ role: m.role, content: m.content }));
  for (let round = 0; round < 4; round++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: API_MODEL, max_tokens: 600, system: SYSTEM(), tools: TOOLS, messages: msgs }) });
    if (!res.ok) throw new Error("api " + res.status + " " + (await res.text()).slice(0, 200));
    const data = await res.json();
    const text = data.content.filter(c => c.type === "text").map(c => c.text).join("").trim();
    const uses = data.content.filter(c => c.type === "tool_use");
    if (!uses.length) return { text, toolResults };
    msgs.push({ role: "assistant", content: data.content });
    const results = uses.map(u => { const r = runTool(u.name, u.input || {}); if (r.forPage) toolResults.push({ name: u.name, args: u.input, result: r.forPage }); return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify(r.forModel) }; });
    msgs.push({ role: "user", content: results });
  }
  return { text: "Let me hand this to a loan officer to finish up.", toolResults };
}

// ---------- backend B: local claude -p, JSON protocol, tool loop in this process ----------
let running = 0; const queue = [];
function slot() { return new Promise((res, rej) => { const go = () => { running++; res(() => { running--; const n = queue.shift(); if (n) n(); }); }; if (running < MAX_PARALLEL) go(); else if (queue.length >= MAX_QUEUE) rej(Object.assign(new Error("busy, try again in a moment"), { status: 429 })); else queue.push(go); }); }
function cli(prompt) {
  return new Promise((resolve, reject) => {
    const p = spawn(CLI, ["-p", "--output-format", "json", "--model", CLI_MODEL, "--max-turns", "1"], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, CLAUDECODE: "" } });
    let out = "", err = ""; const t = setTimeout(() => { p.kill("SIGKILL"); reject(new Error("claude -p timeout")); }, 90000);
    p.stdout.on("data", d => out += d); p.stderr.on("data", d => err += d);
    p.on("close", code => { clearTimeout(t); if (code !== 0 && !out) return reject(new Error("claude -p exit " + code + " " + err.slice(0, 200))); try { const j = JSON.parse(out); resolve(String(j.result ?? j.content ?? out)); } catch { resolve(out); } });
    p.stdin.end(prompt);
  });
}
function extractJSON(s) { const m = s.match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch { return null; } }
async function viaCli(messages) {
  const release = await slot();
  try {
    const toolResults = []; const transcript = messages.map(m => `${m.role === "user" ? "Visitor" : "Kind Guide"}: ${m.content}`);
    const toolDoc = TOOLS.map(t => `- ${t.name}(${Object.keys(t.input_schema.properties).join(", ")}): ${t.description} Required: ${t.input_schema.required.join(", ")}.`).join("\n");
    for (let round = 0; round < 3; round++) {
      const prompt = `${SYSTEM()}\n\nYou have these tools. To use one, put it in "call". You will receive the result and be asked again.\n${toolDoc}\n\nRespond with ONLY a JSON object, no prose outside it:\n{"say": "<what Kind Guide says to the visitor now; empty string if you are calling a tool and will speak after the result>", "call": {"name": "<tool name>", "args": {…}} or null}\n\nConversation so far:\n${transcript.join("\n")}\n\nKind Guide:`;
      const raw = await cli(prompt);
      const j = extractJSON(raw) || { say: raw.trim(), call: null };
      if (j.call && j.call.name) {
        const r = runTool(j.call.name, j.call.args || {});
        if (r.forPage) toolResults.push({ name: j.call.name, args: j.call.args, result: r.forPage });
        transcript.push(`Kind Guide (tool ${j.call.name} result): ${JSON.stringify(r.forModel)}`);
        if (j.say) transcript.push(`Kind Guide: ${j.say}`);
        continue;
      }
      return { text: String(j.say || "").trim(), toolResults };
    }
    return { text: "Here are your numbers. A Kind loan officer can take it from here.", toolResults };
  } finally { release(); }
}

// ---------- http ----------
function cors(req) { const o = req.headers.origin || ""; return originOk(o) ? { "access-control-allow-origin": o, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "600", "vary": "origin" } : {}; }
function json(res, code, obj) { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise((res, rej) => { let s = ""; req.on("data", d => { s += d; if (s.length > 64000) { rej(new Error("too large")); req.destroy(); } }); req.on("end", () => res(s)); }); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  for (const [k, v] of Object.entries(cors(req))) res.setHeader(k, v); // per-response, never shared across concurrent requests
  try {
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (url.pathname === "/health") { res.writeHead(200, { "content-type": "text/plain" }); return res.end("ok"); }
    if (url.pathname === "/api/guide/health") return json(res, 200, OAI_URL ? { backend: "openai-compatible", model: OAI_MODEL, host: OAI_URL.replace(/^https?:\/\//, "").split("/")[0] } : { backend: API_KEY ? "api" : "claude-cli", model: API_KEY ? API_MODEL : CLI_MODEL });
    if (url.pathname === "/api/guide" && req.method === "POST") {
      let b; try { b = JSON.parse(await body(req) || "{}"); } catch { return json(res, 400, { error: "body must be JSON" }); }
      const messages = (b.messages || []).filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map(m => ({ role: m.role, content: m.content.slice(0, 2000) })).slice(-24);
      if (!messages.length || messages[messages.length - 1].role !== "user") return json(res, 400, { error: "messages must end with a user turn" });
      const out = OAI_URL ? await viaOpenAI(messages) : API_KEY ? await viaApi(messages) : await viaCli(messages);
      return json(res, 200, out);
    }
    if (url.pathname === "/" || url.pathname === "/index.html") { res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" }); return fs.createReadStream(DIST).pipe(res); }
    res.writeHead(404, { "content-type": "text/plain" }); res.end("not found");
  } catch (e) { console.error(new Date().toISOString(), req.method, url.pathname, e.message); json(res, e.status || 500, { error: e.message }); }
});
server.listen(PORT, HOST, () => console.log(`APPNAME on http://${HOST}:${PORT} guide backend=${OAI_URL ? "openai-compatible:" + OAI_MODEL + "@" + OAI_URL : API_KEY ? "api:" + API_MODEL : "claude-cli:" + CLI_MODEL}`));
