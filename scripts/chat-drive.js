// Drive a real chat turn on the deployed page over CDP and screenshot it.
//   chrome --headless=new --remote-debugging-port=9333 about:blank &  then  node chat-drive.js <out-dir> <base-url>
// Edit the two questions for the client first. Node 22+ (built-in WebSocket), no deps.
// Minimal CDP driver: no deps, Node's built-in WebSocket.
const base = process.argv[3] || "http://127.0.0.1:3700"; const out = process.argv[2];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fs = require("fs");
(async () => {
  const list = await (await fetch("http://127.0.0.1:9333/json")).json();
  const page = list.find(p => p.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = {};
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params })); });
  const shot = async (name, full) => { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!full }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, "base64")); console.log("shot", name); };
  const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  // desktop home
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: base + "/#/" }); await sleep(3500);
  await shot("1-sparky-home-desktop");
  // guide page with a live turn
  await send("Page.navigate", { url: base + "/?x=1#/guide" }); await sleep(2500);
  await evalJs(`(()=>{const i=document.querySelector('#chatIn'); i.value="We are looking at a REPLACE WITH A FULL-FACTS QUESTION FOR THIS CLIENT"; i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); return 'sent'})()`);
  for (let i = 0; i < 30; i++) { await sleep(1000); const done = await evalJs(`!!document.querySelector('#chat .card')`); if (done) break; }
  await sleep(800);
  await evalJs(`document.querySelector('#chat').scrollTop = 1e6`); await sleep(300); await shot("2-sparky-kind-guide-live-turn");
  // phone width
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Page.navigate", { url: base + "/?x=2#/" }); await sleep(3500);
  await shot("3-sparky-home-phone");
  await send("Page.navigate", { url: base + "/?x=3#/guide" }); await sleep(2500);
  await evalJs(`(()=>{const i=document.querySelector('#chatIn'); i.value="REPLACE WITH A PARTIAL QUESTION FOR THIS CLIENT"; i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); return 'sent'})()`);
  for (let i = 0; i < 30; i++) { await sleep(1000); const done = await evalJs(`!!document.querySelector('#chat .card')`); if (done) break; }
  await sleep(800); await evalJs(`document.querySelector('#guidePhone').scrollIntoView({block:"start"}); document.querySelector('#chat').scrollTop = 1e6`); await sleep(500);
  await shot("4-sparky-kind-guide-phone");
  ws.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
