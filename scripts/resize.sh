#!/usr/bin/env bash
# Live-resize test: load each route ONCE, then change the viewport width in place (no reload) down from
# desktop to the smallest phone and back up, checking at every step that the layout followed. Fails on
# horizontal overflow at any step, on elements left outside the viewport, or on a hero canvas
# (#scene) that did not refit to the new width. This is what "adjusts to window width changes" means;
# sweep.sh only proves fixed widths at load time.
#   resize.sh <dist/index.html> "<route1> <route2> ..." [widths="1300 1024 768 430 320 430 768 1024 1300"]
set -euo pipefail
FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; ROUTES="${2:-}"; WIDTHS="${3:-1300 1024 768 430 320 430 768 1024 1300}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"; [ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
tmp="$(mktemp -d)"; runner="$tmp/runner.html"
python3 - "$runner" "$FILE" "$ROUTES" "$WIDTHS" <<'PY'
import sys,json; runner,file,routes,widths=sys.argv[1],sys.argv[2],[""]+sys.argv[3].split(),[int(w) for w in sys.argv[4].split()]
open(runner,'w').write('''<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe id="f" style="border:0;display:block"></iframe><script>
const routes=%s, widths=%s, FILE=%s; const f=document.getElementById('f'); f.height=900; let ri=0, wi=0;
function step(){ const d=f.contentDocument, w=f.contentWindow, W=widths[wi]; const vw=d.documentElement.clientWidth, sw=Math.max(d.documentElement.scrollWidth,d.body.scrollWidth);
 const clipped=(e)=>{for(let a=e.parentElement;a&&a!==d.body&&a!==d.documentElement;a=a.parentElement){const o=w.getComputedStyle(a);if(/hidden|clip/.test(o.overflowX)||/hidden|clip/.test(o.overflow))return true}return false};
 const bad=[]; d.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect(); const cs=w.getComputedStyle(e); if(cs.display==='none'||cs.position==='fixed')return; if((r.right>vw+1||r.left<-1)&&r.width>0&&!clipped(e)) bad.push(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+[...e.classList].slice(0,3).join('.')+' R'+Math.round(r.right))});
 const c=d.querySelector('canvas#scene'); let canvas='no-canvas'; if(c){const cr=c.getBoundingClientRect(); const hostW=(c.parentElement||d.body).getBoundingClientRect().width; canvas=Math.abs(cr.width-hostW)<=2?'canvas-ok':'CANVAS-STALE '+Math.round(cr.width)+'/'+Math.round(hostW);}
 const fails=(sw>vw?'OVERFLOW ':'')+(bad.length?'OUTSIDE ':'')+(canvas.startsWith('CANVAS')?'CANVAS ':'');
 console.log(`RS #/${routes[ri]} w=${W} vw=${vw} scrollW=${sw} ${canvas} ${fails||'ok'} :: ${bad.slice(0,5).join(' | ')}`);
 wi++; if(wi<widths.length){ f.width=widths[wi]; setTimeout(step,700); } else { ri++; wi=0; if(ri<routes.length){ f.width=widths[0]; f.src='file://'+FILE+'?r='+ri+'#/'+routes[ri]; } else console.log('DONE'); } }
f.onload=()=>setTimeout(step,1200); f.width=widths[0]; f.src='file://'+FILE+'?r=0#/'+routes[0];
</script></body>''' % (json.dumps(routes), json.dumps(widths), json.dumps(file)))
PY
r=$("$CH" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files --window-size=1400,1000 --virtual-time-budget=300000 --enable-logging=stderr --v=0 --dump-dom "file://$runner" 2>&1 >/dev/null | grep -oE 'RS #/[^"]*' | grep -v 'routes\[ri\]' || true)
rm -rf "$tmp"
steps=$(echo "$r" | grep -c '^RS' || true); fails=$(echo "$r" | grep -cE 'OVERFLOW|OUTSIDE|CANVAS-STALE' || true)
echo "$r" | sed -E 's/ :: $//'
echo "resize steps: $steps, failing steps: $fails"
[ "$steps" -gt 0 ] && [ "$fails" = 0 ]
