import sys, re, html
from html.parser import HTMLParser

class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.out=[]; s.skip=0; s.stack=[]; s.cur_a=None; s.cur_btn=None; s.buf=''
    def flush(s):
        t=re.sub(r'\s+',' ',s.buf).strip()
        if t: s.out.append(t)
        s.buf=''
    def handle_starttag(s,tag,attrs):
        a=dict(attrs)
        if tag in ('script','style','noscript','svg'): s.skip+=1; return
        if s.skip: return
        if tag in ('h1','h2','h3','h4','h5','h6'):
            s.flush(); s.buf='#'*int(tag[1])+' '
        elif tag in ('p','div','section','li','tr','br','header','footer','nav','article','ul','ol','form','label','option','td','th','blockquote','main','aside'):
            s.flush()
            if tag=='li': s.buf='- '
            if tag=='form': s.out.append(f"[FORM id={a.get('id','')} name={a.get('name','')} action={a.get('action','')} method={a.get('method','')}]")
            if tag=='nav': s.out.append(f"[NAV role={a.get('role','')} class={a.get('class','')}]")
            if tag=='footer': s.out.append("[FOOTER]")
            if tag=='header': s.out.append("[HEADER]")
        elif tag=='a':
            s.cur_a=a.get('href',''); s.buf+='['
        elif tag=='img':
            s.flush(); s.out.append(f"![{a.get('alt','')}]({a.get('src','')})")
        elif tag=='input':
            s.flush(); s.out.append(f"[INPUT type={a.get('type','text')} name={a.get('name','')} id={a.get('id','')} placeholder={a.get('placeholder','')} value={a.get('value','')} required={'required' in a}]")
        elif tag=='select':
            s.flush(); s.out.append(f"[SELECT name={a.get('name','')} id={a.get('id','')}]")
        elif tag=='textarea':
            s.flush(); s.out.append(f"[TEXTAREA name={a.get('name','')} placeholder={a.get('placeholder','')}]")
        elif tag=='button':
            s.flush(); s.buf='[BUTTON] '
        elif tag=='iframe':
            s.flush(); s.out.append(f"[IFRAME src={a.get('src','')} title={a.get('title','')}]")
        elif tag=='video' or tag=='source':
            s.flush(); s.out.append(f"[{tag.upper()} src={a.get('src','')}]")
        if 'data-src' in a: s.out.append(f"[data-src={a['data-src']}]")
        if tag=='a' and 'w-dropdown' in a.get('class',''): s.out.append('[DROPDOWN]')
    def handle_endtag(s,tag):
        if tag in ('script','style','noscript','svg'):
            s.skip=max(0,s.skip-1); return
        if s.skip: return
        if tag=='a':
            s.buf+=f']({s.cur_a})'; s.cur_a=None
        elif tag in ('p','div','section','li','tr','h1','h2','h3','h4','h5','h6','button','label','option','td','th','ul','ol','form','blockquote','header','footer','nav'):
            s.flush()
    def handle_data(s,d):
        if not s.skip: s.buf+=d
src=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
t=re.search(r'<title[^>]*>(.*?)</title>',src,re.S|re.I)
desc=re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)',src,re.I)
p=P(); p.feed(src); p.flush()
lines=[]
lines.append(f"<!-- TITLE: {html.unescape(t.group(1).strip()) if t else ''} -->")
lines.append(f"<!-- DESCRIPTION: {html.unescape(desc.group(1)) if desc else ''} -->")
prev=None
for l in p.out:
    if l==prev: continue
    lines.append(l); prev=l
open(sys.argv[2],'w').write('\n'.join(lines)+'\n')
