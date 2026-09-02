#!/usr/bin/env bash
# Headless Chrome screenshots + horizontal-overflow check.
#   shot.sh <file-or-url> <out.png> [WIDTHxHEIGHT=1440x1400] [--overflow]
# Notes learned the hard way: headless Chrome's minimum window width is 500px, so mobile means 500.
# Hash routes work with file:// URLs. --overflow prints elements wider than the viewport.
set -euo pipefail
SRC="${1:?file or url}"; OUT="${2:?out.png}"; SIZE="${3:-1440x1400}"; FLAG="${4:-}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
[ -n "$CH" ] || { echo "no chrome found; set CHROME=" >&2; exit 1; }
url="$SRC"; case "$SRC" in http*) ;; *) url="file://$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")";; esac
"$CH" --headless=new --disable-gpu --hide-scrollbars --window-size="${SIZE/x/,}" --virtual-time-budget=5000 --screenshot="$OUT" "$url" 2>/dev/null
echo "wrote $OUT ($SIZE)"
if [ "$FLAG" = "--overflow" ]; then
  tmp="$(mktemp -d)"; f="$tmp/dbg.html"
  case "$SRC" in http*) curl -sL "$SRC" -o "$f";; *) cp "$SRC" "$f";; esac
  python3 - "$f" <<'PY'
import sys; p=sys.argv[1]; s=open(p).read()
dbg='<script>setTimeout(()=>{const vw=document.documentElement.clientWidth;const clipped=(e)=>{for(let a=e.parentElement;a;a=a.parentElement){const o=getComputedStyle(a);if(o.overflow==="hidden"||o.overflowX==="hidden"||o.overflowX==="clip")return true}return false};const bad=[];document.querySelectorAll("*").forEach(e=>{const r=e.getBoundingClientRect();if(r.right>vw+1&&r.width>0&&getComputedStyle(e).display!=="none"&&!clipped(e))bad.push((e.tagName+"."+[...e.classList].join(".")).slice(0,50)+" right="+Math.round(r.right))});console.log("VW",vw,"scrollW",document.documentElement.scrollWidth,"OVERFLOW",bad.slice(0,12).join(" | "))},2500)</script></body>'
open(p,'w').write(s.replace('</body>',dbg))
PY
  "$CH" --headless=new --disable-gpu --window-size="${SIZE/x/,}" --virtual-time-budget=5000 --enable-logging=stderr --v=0 --dump-dom "file://$f" 2>&1 >/dev/null | grep -oE 'VW.*' | sed 's/".*//' | head -1
fi
