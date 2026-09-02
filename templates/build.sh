#!/bin/bash
# Inline the JS into one self-contained HTML. Writes dist/index.html and the root
# index.html (GitHub Pages) from the same bytes so the two never drift.
set -e
cd "$(dirname "$0")/site"
mkdir -p ../dist
python3 - <<'PY'
html=open('index.html').read()
for f in ['engine.js','data.js','dog.js','guide.js','app.js']:
    js=open(f).read().replace('</script>','<\\/script>')
    html=html.replace(f'<script src="{f}"></script>', f'<script>\n{js}\n</script>')
open('../dist/index.html','w').write(html)
open('../index.html','w').write(html)
print('dist/index.html + index.html', len(html), 'bytes')
PY
