#!/usr/bin/env bash
# Console gate. Loads every route at desktop and phone width in headless Chrome (WebGL on, so the
# three.js hero really runs) and fails on any console error, uncaught exception, failed resource, or
# WebGL/shader complaint. Usage: console.sh <dist/index.html | url> "<routes>" [widths="1440 500"]
set -uo pipefail
SRC="${1:?file or url}"; ROUTES="${2:-}"; WIDTHS="${3:-1440 500}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
[ -n "$CH" ] || { echo "no chrome found; set CHROME=" >&2; exit 1; }
case "$SRC" in http*) BASE="$SRC";; *) BASE="file://$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")";; esac
routes="__home__ $ROUTES"; total=0
for w in $WIDTHS; do
  for r in $routes; do
    [ "$r" = "__home__" ] && r=""
    url="$BASE#/$r"; [ -z "$r" ] && url="$BASE"
    out="$("$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist \
      --allow-file-access-from-files --window-size="$w,1000" --virtual-time-budget=10000 \
      --enable-logging=stderr --v=0 --dump-dom "$url" 2>&1 >/dev/null | grep -E 'CONSOLE|Uncaught' || true)"
    bad="$(echo "$out" | grep -E ':ERROR:CONSOLE|Uncaught|Failed to load resource|404|THREE\.|WebGL|SyntaxError|ReferenceError|TypeError' | grep -vE 'DevTools|GPU stall|Automatic fallback to software WebGL' || true)"
    n=$(echo "$bad" | grep -c . || true); total=$((total+n))
    printf 'width %-5s route %-12s %s\n' "$w" "/${r}" "$([ "$n" = 0 ] && echo clean || echo "$n errors")"
    [ "$n" = 0 ] || echo "$bad" | sed 's/^/   /' | head -8
  done
done
echo "console errors: $total"; [ "$total" = 0 ]
