#!/usr/bin/env bash
# Dead-link gate. Renders every route of the built site in headless Chrome (hash routes need JS), then
# checks every href / src / action it finds:
#   - external http(s) URLs must answer 2xx/3xx (HEAD, then GET on 403/405/000), with a browser UA
#   - hash routes ("#/x") must be in the route list you pass
#   - in-page anchors ("#id") must exist in that route's DOM
#   - placeholders fail outright: href="#", href="", javascript:, "TODO", "example.com", lorem
#   - relative asset paths must exist next to the file
#   - mailto: / tel: must be well formed
# Usage: links.sh <dist/index.html | https://url> "<route1> <route2> ..." [report.md]
# Exit 1 on any failure. Writes a markdown report (default: links-report.md next to the file).
set -uo pipefail
SRC="${1:?file or url}"; ROUTES="${2:-}"; REPORT="${3:-}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
[ -n "$CH" ] || { echo "no chrome found; set CHROME=" >&2; exit 1; }
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
case "$SRC" in
  http*) BASE="$SRC"; DIR="";;
  *) DIR="$(cd "$(dirname "$SRC")" && pwd)"; BASE="file://$DIR/$(basename "$SRC")";;
esac
[ -n "$REPORT" ] || REPORT="${DIR:-.}/links-report.md"
tmp="$(mktemp -d)"; fail=0; pass=0
: > "$tmp/all.tsv"      # route \t kind \t target
echo "# Link report: $SRC" > "$REPORT"; echo "" >> "$REPORT"; echo "| route | target | result |" >> "$REPORT"; echo "|---|---|---|" >> "$REPORT"
routes="__home__ $ROUTES"
for r in $routes; do
  [ "$r" = "__home__" ] && r=""
  url="$BASE#/$r"; [ -z "$r" ] && url="$BASE"
  dom="$("$CH" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=8000 --user-agent="$UA" --dump-dom "$url" 2>/dev/null)"
  echo "$dom" > "$tmp/dom-${r:-home}.html"
  # ids in this route, for anchor checks
  echo "$dom" | grep -oE ' id="[^"]+"' | sed 's/ id="//; s/"$//' | sort -u > "$tmp/ids-${r:-home}.txt"
  clean="$(printf '%s' "$dom" | perl -0pe 's#<script\b.*?</script>##gis; s#<template\b.*?</template>##gis; s#<style\b.*?</style>##gis; s#<link\b[^>]*rel="(preconnect|dns-prefetch|preload|modulepreload)"[^>]*>##gi')"
  echo "$clean" | grep -oE '(href|src|action|data-href)="[^"]*"' | sed -E 's/^[a-z-]+="//; s/"$//' | sort -u \
    | while read -r t; do printf '%s\t%s\n' "${r:-home}" "$t"; done >> "$tmp/all.tsv"
done
check_external() { # $1 url -> prints code (cached per run; bash 3.2 on macOS has no assoc arrays)
  local u="$1" c
  c="$(grep -F -- "$u"$'\t' "$tmp/ext.cache" 2>/dev/null | head -1 | cut -f2)"; [ -n "$c" ] && { echo "$c"; return; }
  c="$(curl -sIL -m 20 -A "$UA" -o /dev/null -w '%{http_code}' "$u" 2>/dev/null || echo 000)"
  case "$c" in 403|405|000|5*) c="$(curl -sL -m 25 -A "$UA" -o /dev/null -w '%{http_code}' "$u" 2>/dev/null || echo 000)";; esac
  case "$c" in 400|401|403|405|406|429|000|5*)
    # bot-blocked or curl-hostile hosts: let Chrome fetch it and judge the page itself
    page="$("$CH" --headless=new --disable-gpu --virtual-time-budget=8000 --user-agent="$UA" --dump-dom "$u" 2>/dev/null | perl -0pe 's#<script\b.*?</script>##gis; s#<[^>]+># #g' | tr -s ' \n' ' ')"
    if [ "${#page}" -gt 400 ] && ! echo "$page" | grep -qiE "access denied|403 forbidden|404 not found|page not found|isn.t available|not available right now|site can.t be reached|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION"; then c="200-chrome"; fi;;
  esac
  printf '%s\t%s\n' "$u" "$c" >> "$tmp/ext.cache"; echo "$c"
}
sort -u "$tmp/all.tsv" -o "$tmp/all.tsv"
while IFS=$'\t' read -r route t; do
  res=""
  [ -n "$t" ] && [ "$t" != " " ] || { t="(empty)"; res="FAIL placeholder"; }
  [ -n "$res" ] || case "$t" in
    "#"|"#!"|javascript:*|*TODO*|*lorem*|*example.com*|*yoursite*|*placeholder*) res="FAIL placeholder";;
    mailto:*) [[ "$t" =~ ^mailto:[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}(\?.*)?$ ]] && res="ok" || res="FAIL bad mailto";;
    tel:*) [[ "$t" =~ ^tel:\+?[0-9().[:space:]-]{7,}$ ]] && res="ok" || res="FAIL bad tel";;
    "#/"*) rr="${t#\#/}"; rr="${rr%%\?*}"; seg="${rr%%/*}"; ok=0; for k in $ROUTES; do [ "$k" = "$seg" ] && ok=1; done; [ -z "$rr" ] && ok=1
           if [ $ok = 1 ]; then res="ok route"; else
             # not in the list: render it and look for a not-found state
             body="$("$CH" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=6000 --user-agent="$UA" --dump-dom "$BASE#/$rr" 2>/dev/null | perl -0pe 's#<script\b.*?</script>##gis; s#<[^>]+># #g' | tr -s ' \n' ' ')"
             if echo "$body" | grep -qiE 'not found|404|no such page|page (does not|doesn.t) exist'; then res="FAIL route renders not-found"; elif [ "${#body}" -lt 200 ]; then res="FAIL route renders empty"; else res="ok rendered"; fi
           fi;;
    "#"*) id="${t#\#}"; grep -qx -- "$id" "$tmp/ids-$route.txt" && res="ok" || res="FAIL missing anchor #$id";;
    http://*|https://*) c="$(check_external "$t")"; case "$c" in 2*|3*) res="ok $c";; *) res="FAIL $c";; esac;;
    data:*|blob:*) res="ok";;
    *) if [ -n "$DIR" ]; then p="${t%%\?*}"; p="${p%%#*}"; [ -e "$DIR/$p" ] && res="ok file" || res="FAIL missing file";
       else c="$(check_external "${BASE%/}/${t#/}")"; case "$c" in 2*|3*) res="ok $c";; *) res="FAIL $c";; esac; fi;;
  esac
  if [[ "$res" == FAIL* ]]; then fail=$((fail+1)); echo "FAIL  [$route] $t  ($res)"; else pass=$((pass+1)); fi
  echo "| $route | \`${t//|/\\|}\` | $res |" >> "$REPORT"
done < "$tmp/all.tsv"
echo "" >> "$REPORT"; echo "$pass ok, $fail failed" >> "$REPORT"
rm -rf "$tmp"
echo "links: $pass ok, $fail failed -> $REPORT"
[ "$fail" = 0 ]
