#!/usr/bin/env bash
# Pull web-design references for the client's industry from Dribbble.
#   dribbble.sh "<industry>" <out-dir> [count=8]
# Dribbble blocks curl and WebFetch but renders fine in headless Chrome, so this drives Chrome:
# searches "<industry> website" (and "<industry> landing page"), saves a screenshot of the results grid,
# lists the top shots (title + URL), and downloads their full-size images so the agent can look at them.
# Output: <out>/results-*.png, <out>/shots.md, <out>/img/*.png|jpg
set -euo pipefail
Q="${1:?industry, e.g. mortgage}"; OUT="${2:?out dir}"; N="${3:-8}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
[ -n "$CH" ] || { echo "no chrome found; set CHROME=" >&2; exit 1; }
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
mkdir -p "$OUT/img"; : > "$OUT/shots.md"
slug() { echo "$1" | tr 'A-Z' 'a-z' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g'; }
i=0
for term in "$Q website" "$Q landing page" "$Q web design"; do
  s="$(slug "$term")"; url="https://dribbble.com/search/$s"
  echo "== $url"
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,2200 --virtual-time-budget=9000 --user-agent="$UA" --screenshot="$OUT/results-$s.png" "$url" 2>/dev/null || true
  dom="$("$CH" --headless=new --disable-gpu --virtual-time-budget=9000 --user-agent="$UA" --dump-dom "$url" 2>/dev/null || true)"
  echo "## $term" >> "$OUT/shots.md"; echo "" >> "$OUT/shots.md"
  echo "$dom" | grep -oE 'href="/shots/[0-9]+-[^"]+"' | sed -E 's/href="//; s/"$//' | awk '!seen[$0]++' | awk -v n="$N" 'NR<=n' | while read -r path; do
    id="${path#/shots/}"; title="$(echo "${id#*-}" | tr '-' ' ')"
    echo "- $title — https://dribbble.com$path" >> "$OUT/shots.md"
  done
  echo "" >> "$OUT/shots.md"
  # full-size images in results order; skip video
  echo "$dom" | grep -oE 'https://cdn\.dribbble\.com/userupload/[^"? ]+\.(png|jpg|jpeg|webp)' | grep -E '/original-|/large-' | awk '!seen[$0]++' | awk -v n="$N" 'NR<=n' | while read -r img; do
    i=$((i+1)); f="$OUT/img/$s-$(printf '%02d' "$i").${img##*.}"
    curl -sfL -m 30 -A "$UA" -e "https://dribbble.com/" "$img" -o "$f" 2>/dev/null && echo "   saved $(basename "$f")" || true
  done
done
echo "== done: $(ls "$OUT/img" | wc -l | tr -d ' ') images, $(grep -c '^- ' "$OUT/shots.md") shots listed → $OUT"
