#!/usr/bin/env bash
# Full suite for the Kind Lending mock-up. Self-contained, no network, no secrets.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "1/4 syntax"; for f in server.js site/engine.js site/data.js site/dog.js site/guide.js site/app.js; do node --check "$f"; done
echo "2/4 engine"; node -e '
const E=require("./site/engine.js");
const r=E.match({price:1100000,downPayment:110000,fico:740,income:240000,monthlyDebts:900,veteran:false,selfEmployed:false,investor:false,firstTime:true});
const ok=r.programs.filter(p=>p.ok).map(p=>p.id);
if(!ok.includes("conventional")||!ok.includes("fha")) throw new Error("expected conventional+fha to fit: "+ok);
if(r.programs.find(p=>p.id==="usda").ok) throw new Error("usda must not fit in OC");
if(Math.abs(E.pmt(990000,6.66,30)-6362)>5) throw new Error("pmt drifted: "+E.pmt(990000,6.66,30));
const a=E.affordability({income:240000,monthlyDebts:900,downPayment:110000}); if(a.maxPrice<900000||a.maxPrice>1300000) throw new Error("affordability out of range "+a.maxPrice);
console.log("   engine ok");'
echo "3/4 build"; ./build.sh >/dev/null && test -s dist/index.html && grep -q "KIND_DOG" dist/index.html && grep -q "id=\"chat\"" dist/index.html && echo "   dist ok"
echo "4/4 server smoke"; PORT=3799 node server.js >/tmp/kl-test.log 2>&1 & pid=$!; sleep 1
trap 'kill $pid 2>/dev/null || true' EXIT
test "$(curl -sf http://127.0.0.1:3799/health)" = ok
curl -sf http://127.0.0.1:3799/ -o /tmp/kl-index.html && grep -q "Kind Lending" /tmp/kl-index.html
curl -sf http://127.0.0.1:3799/api/guide/health -o /tmp/kl-gh.json && grep -q backend /tmp/kl-gh.json
test "$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:3799/api/guide -H 'content-type: application/json' -d '{"messages":[]}')" = 400
echo "   server ok"
# CORS must survive a concurrent request (the droplet HEALTHCHECK sends no Origin every 30s while a chat is in flight).
cat >/tmp/kl-stub-claude.sh <<'STUB'
#!/usr/bin/env bash
cat >/dev/null
sleep 2
printf '{"result":"{\\"say\\":\\"hi\\",\\"call\\":null}"}\n'
STUB
chmod +x /tmp/kl-stub-claude.sh
ANTHROPIC_API_KEY= CLAUDE_BIN=/tmp/kl-stub-claude.sh PORT=3798 node server.js >/tmp/kl-test-cors.log 2>&1 & cpid=$!; sleep 1
trap 'kill $pid $cpid 2>/dev/null || true' EXIT
kill -0 $cpid 2>/dev/null || { echo "   FAIL: cors test server did not start"; cat /tmp/kl-test-cors.log; exit 1; }
curl -s -D /tmp/kl-cors.h -o /tmp/kl-cors.json -w "%{http_code}" -X POST http://127.0.0.1:3798/api/guide -H 'content-type: application/json' -H 'Origin: https://claude.ai' -d '{"messages":[{"role":"user","content":"hi"}]}' >/tmp/kl-cors.code & qpid=$!
sleep 1; curl -sf http://127.0.0.1:3798/health >/dev/null
wait $qpid
test "$(cat /tmp/kl-cors.code)" = 200
grep -qi '^access-control-allow-origin: https://claude.ai' /tmp/kl-cors.h || { echo "   FAIL: cross-origin response lost its CORS header while another request was in flight"; exit 1; }
echo "   cors ok"
echo "all green"
