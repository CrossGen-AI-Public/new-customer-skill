#!/usr/bin/env bash
# Overflow sweep: load every route of the built site inside an iframe at real phone and desktop widths
# and report any route whose document is wider than the viewport, with the offending elements.
#   sweep.sh <dist/index.html> "<route1> <route2> ..." [widths="320 360 390 430 600 768 900 1024 1100 1200 1300"]
# Chrome's own window floor is 500px; the iframe is how we get below it. Routes are hash routes ("" = home).
set -euo pipefail
FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; ROUTES="${2:-}"; WIDTHS="${3:-320 360 390 430 600 768 900 1024 1100 1200 1300}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"; [ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
tmp="$(mktemp -d)"; runner="$tmp/runner.html"
python3 - "$runner" "$FILE" "$ROUTES" <<'PY'
import sys,json; runner,file,routes=sys.argv[1],sys.argv[2],sys.argv[3].split()
open(runner,'w').write('''<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe id="f" style="border:0;display:block"></iframe><script>
const W=+new URLSearchParams(location.search).get('w')||375; const routes=%s; const FILE=%s;
const f=document.getElementById('f'); f.width=W; f.height=900; let i=0;
function check(){ const d=f.contentDocument, w=f.contentWindow; const vw=d.documentElement.clientWidth, sw=Math.max(d.documentElement.scrollWidth,d.body.scrollWidth);
 const clipped=(e)=>{for(let a=e.parentElement;a&&a!==d.body&&a!==d.documentElement;a=a.parentElement){const o=w.getComputedStyle(a);if(/hidden|clip/.test(o.overflowX)||/hidden|clip/.test(o.overflow))return true}return false};
 const bad=[]; d.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect(); const cs=w.getComputedStyle(e); if(cs.display==='none'||cs.position==='fixed')return; if((r.right>vw+1||r.left<-1)&&r.width>0&&!clipped(e)) bad.push((e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+[...e.classList].slice(0,3).join('.'))+' R'+Math.round(r.right))});
 console.log(`RT #/${routes[i]} vw=${vw} scrollW=${sw} ${sw>vw?'OVERFLOW':'ok'} :: ${bad.slice(0,6).join(' | ')}`);
 i++; if(i<routes.length){ f.src='file://'+FILE+'?r='+i+'#/'+routes[i]; } else console.log('DONE'); }
f.onload=()=>setTimeout(check,900); f.src='file://'+FILE+'?r=0#/'+routes[0];
</script></body>''' % (json.dumps(routes), json.dumps(file)))
PY
total=0
for w in $WIDTHS; do
  r=$("$CH" --headless=new --disable-gpu --allow-file-access-from-files --window-size=1400,1000 --virtual-time-budget=120000 --enable-logging=stderr --v=0 --dump-dom "file://$runner?w=$w" 2>&1 >/dev/null | grep -oE 'RT #/[^"]*' | grep -v 'routes\[i\]' || true)
  bad=$(echo "$r" | grep -c OVERFLOW || true); total=$((total+bad))
  echo "width $w: $(echo "$r" | grep -c RT || true) routes, $bad overflow"; echo "$r" | grep OVERFLOW | sed 's/^/   /' || true
done
rm -rf "$tmp"; echo "total overflow: $total"; [ "$total" = 0 ]
