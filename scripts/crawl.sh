#!/usr/bin/env bash
# Crawl a prospect's site for DATA, not design.
#   crawl.sh <https://site> <out-dir> [max-core-pages]
# Produces: urls.txt (from sitemap or homepage links), sitemap-summary.txt (counts per top-level
# path), pages/<slug>.html + .md for the core pages, assets/ (logo, favicon, og image, hero images).
set -euo pipefail
SITE="${1:?site url}"; OUT="${2:?out dir}"; MAX="${3:-40}"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT/pages" "$OUT/assets" "$OUT/inventory"
cd "$OUT"
host="$(echo "$SITE" | sed -E 's#https?://##; s#/.*##')"

echo "== sitemap"
: > urls.txt
for sm in "$SITE/sitemap.xml" "$SITE/sitemap_index.xml" "$SITE/sitemap-index.xml"; do
  if curl -sfL -m 20 -A "$UA" "$sm" -o sitemap.xml 2>/dev/null && grep -q '<loc>' sitemap.xml; then
    grep -o '<loc>[^<]*</loc>' sitemap.xml | sed -E 's#</?loc>##g' > urls.txt
    # sitemap index: pull each child sitemap
    if grep -q '<sitemapindex' sitemap.xml; then
      : > urls.txt
      for child in $(grep -o '<loc>[^<]*</loc>' sitemap.xml | sed -E 's#</?loc>##g'); do
        curl -sfL -m 20 -A "$UA" "$child" 2>/dev/null | grep -o '<loc>[^<]*</loc>' | sed -E 's#</?loc>##g' >> urls.txt || true
      done
    fi
    break
  fi
done
if [ ! -s urls.txt ]; then
  echo "   no sitemap; harvesting homepage links"
  curl -sfL -m 20 -A "$UA" "$SITE" -o pages/home.html
  grep -oE 'href="[^"#?]+' pages/home.html | sed 's/href="//' | grep -E "^/|^$SITE|^https?://(www\.)?$host" | sed -E "s#^/#$SITE/#" | sort -u > urls.txt
fi
echo "   $(wc -l < urls.txt) urls"
awk -F"$host" '{print $2}' urls.txt | awk -F/ '{print "/"$2}' | sort | uniq -c | sort -rn > sitemap-summary.txt
awk 'NR<=25' sitemap-summary.txt

echo "== core pages"
# Prefer shallow, non-blog pages; always include the homepage.
{ echo "$SITE"; grep -vE '/(blog|news|post|article|tag|category|author|page)/|\?|\.(pdf|jpg|png|xml)$' urls.txt | awk -F/ 'NF<=5' | awk -v m="$MAX" 'NR<=m'; } | awk '!seen[$0]++' > core.txt
fetch() { url="$1"; slug="$(echo "$url" | sed -E "s#https?://[^/]+/?##; s#/#__#g; s#[^A-Za-z0-9_.-]#_#g")"; [ -z "$slug" ] && slug=home
  curl -sfL -m 25 -A "$UA" "$url" -o "pages/$slug.html" 2>/dev/null && python3 "$HERE/html2md.py" "pages/$slug.html" "pages/$slug.md" && echo "   ok  $slug" || echo "   FAIL $url"; }
while read -r url; do [ -n "$url" ] && fetch "$url" & while [ "$(jobs -r | wc -l | tr -d ' ')" -ge 8 ]; do sleep 0.2; done; done < core.txt; wait

echo "== assets"
home="pages/home.html"
grep -oE '(https?:)?//[^"'"'"' )]+\.(svg|png|jpg|jpeg|webp|ico)' "$home" | sed -E 's#^//#https://#' | sort -u | grep -iE 'logo|brand|favicon|icon|hero|og|banner' | awk 'NR<=12' > assets/list.txt || true
grep -oE 'property="og:image" content="[^"]+' "$home" | sed 's/.*content="//' >> assets/list.txt || true
grep -oE '<link[^>]+rel="[^"]*icon[^"]*"[^>]+href="[^"]+' "$home" | sed 's/.*href="//' | sed -E "s#^/#$SITE/#" >> assets/list.txt || true
sort -u assets/list.txt | while read -r u; do [ -n "$u" ] && curl -sfL -m 20 -A "$UA" "$u" -o "assets/$(basename "$u" | cut -c1-80)" 2>/dev/null && echo "$u" >> assets/manifest.txt || true; done
echo "   $(ls assets | wc -l) files"

echo "== stylesheet + fonts"
grep -oE '<link[^>]+rel="stylesheet"[^>]+href="[^"]+' "$home" | sed 's/.*href="//' | sed -E "s#^/#$SITE/#; s#^//#https://#" | awk 'NR<=3' > inventory/css-urls.txt || true
first="$(awk 'NR==1' inventory/css-urls.txt || true)"
if [ -n "$first" ]; then curl -sfL -m 30 -A "$UA" "$first" -o inventory/main.css 2>/dev/null || true
  { echo "# colors by frequency"; grep -oE '#[0-9a-fA-F]{6}\b' inventory/main.css | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn | awk 'NR<=25'
    echo; echo "# font-family declarations"; grep -oE "font-family:[^;}]+" inventory/main.css | sort | uniq -c | sort -rn | awk 'NR<=12'; } > inventory/brand.md
  awk 'NR<=30' inventory/brand.md
fi
echo "== done: $OUT"
