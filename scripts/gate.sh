#!/usr/bin/env bash
# The whole test gate in one command. Nothing ships with a red line here.
#   gate.sh <project-dir> "<route1> <route2> ..." [https://deployed-url]
# Runs: engine tests, dead links, console errors, overflow sweep at 320-1300, WebGL screenshots of
# every route at 1440 and 500, the slop scan on the built HTML. Prints one PASS/FAIL table.
set -uo pipefail
P="${1:?project dir}"; ROUTES="${2:-}"; URL="${3:-}"
S="$(cd "$(dirname "$0")" && pwd)"; DIST="$P/dist/index.html"; OUT="$P/research/gate"; mkdir -p "$OUT/shots"
[ -f "$DIST" ] || { echo "no $DIST; run build.sh first" >&2; exit 1; }
RES="$OUT/results.txt"; : > "$RES"
run() { local name="$1"; shift; echo; echo "===== $name"; if "$@" > "$OUT/$name.log" 2>&1; then echo "$name PASS" >> "$RES"; else echo "$name FAIL" >> "$RES"; fi; tail -n 12 "$OUT/$name.log"; }
[ -x "$P/scripts/test.sh" ] && run engine bash "$P/scripts/test.sh"
run links bash "$S/links.sh" "$DIST" "$ROUTES" "$OUT/links-report.md"
run console bash "$S/console.sh" "$DIST" "$ROUTES"
run overflow bash "$S/sweep.sh" "$DIST" "$ROUTES"
shots() { local ok=0; for r in "" $ROUTES; do for sz in 1440x1600 500x1400; do
  n="${r:-home}-${sz%x*}"; bash "$S/shot.sh" "$DIST${r:+#/$r}" "$OUT/shots/$n.png" "$sz" >/dev/null || ok=1; done; done
  ls "$OUT/shots" | wc -l; return $ok; }
run screenshots shots
slop() { python3 "$S/slop_scan.py" "$DIST"; }
run slop slop
if [ -n "$URL" ]; then run deployed-links bash "$S/links.sh" "$URL" "$ROUTES" "$OUT/links-deployed.md"; fi
echo; echo "===== GATE"; fail=0
sort "$RES" | while read -r k v; do printf '%-16s %s\n' "$k" "$v"; done; grep -q FAIL "$RES" && fail=1
echo "logs and screenshots: $OUT"
exit $fail
