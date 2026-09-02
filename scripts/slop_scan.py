#!/usr/bin/env python3
"""Scan an HTML page for the mechanical AI-design tells.

Usage: python3 slop_scan.py page.html [more.html ...]

FAIL findings are the twenty tells and the copy tells that can be matched
mechanically. NOTE findings are heuristics that need your eyes. Exit code is 1
if any FAIL survives, so this can be used as a gate.

Every FAIL is allowed to become a deliberate exception - but only in writing, with
a client-specific reason, in the build notes. See references/design-tells.md.
"""
import re
import sys
from collections import Counter

# ---------- helpers ----------

def strip_blocks(html, tag):
    return re.sub(r"<%s\b.*?</%s>" % (tag, tag), " ", html, flags=re.S | re.I)

def visible_text(html):
    t = strip_blocks(strip_blocks(html, "script"), "style")
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"&nbsp;?", " ", t)
    return re.sub(r"\s+", " ", t)

def css_text(html):
    return " ".join(re.findall(r"<style\b[^>]*>(.*?)</style>", html, flags=re.S | re.I)) + " " + \
           " ".join(re.findall(r'style="([^"]*)"', html))

def headings(html):
    return [visible_text(m) for m in re.findall(r"<h[1-6]\b[^>]*>(.*?)</h[1-6]>", html, flags=re.S | re.I)]

def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) not in (6, 8):
        return None
    try:
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None

def luminance(rgb):
    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def hue(rgb):
    r, g, b = (c / 255.0 for c in rgb)
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d == 0:
        return None
    if mx == r:
        h = ((g - b) / d) % 6
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return h * 60

EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F900-\U0001F9FF✨✅⚡⭐]")

BUZZWORDS = [
    "seamless", "seamlessly", "leverage", "leveraging", "cutting-edge", "best-in-class",
    "unlock", "unlocking", "empower", "empowering", "elevate", "transform your",
    "revolutioniz", "revolutionis", "game-chang", "next-generation", "state-of-the-art",
    "world-class", "holistic", "robust", "streamline", "streamlining", "supercharge",
    "delve", "tapestry", "testament to", "pivotal", "in today's fast-paced",
    "take it to the next level", "at the end of the day", "trusted by teams",
    "industry-leading", "one-stop shop", "bespoke", "curated", "synerg",
]

AVOID_IS = ["serves as", "stands as", "boasts", "designed to empower", "built to empower"]

FONT_TELLS = {
    "Inter": "the default of every generated page",
    "Space Grotesk": "half of the signature pairing",
    "Instrument Serif": "the other half of the signature pairing",
    "Geist": "Inter's successor as the default",
    "Satoshi": "stock generated-page display face",
    "Cal Sans": "stock generated-page display face",
    "Plus Jakarta Sans": "stock generated-page body face",
}

# ---------- checks ----------

def scan(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    css = css_text(html)
    text = visible_text(html)
    low = html.lower()
    lcss = css.lower()
    fails, notes = [], []

    def fail(n, msg):
        fails.append((n, msg))

    def note(n, msg):
        notes.append((n, msg))

    # 1 / 2 - gradients and gradient text
    grads = re.findall(r"(?:linear|radial|conic)-gradient\([^;{}]*\)", lcss)
    purple = []
    for g in grads:
        for h in re.findall(r"#[0-9a-f]{3,8}", g):
            rgb = hex_to_rgb(h)
            hu = hue(rgb) if rgb else None
            if hu is not None and 225 <= hu <= 295:
                purple.append(h)
        for named in ("purple", "violet", "indigo", "blueviolet", "rebeccapurple"):
            if named in g:
                purple.append(named)
    if purple:
        fail(1, "purple/blue gradient (%s) - tell #1, the strongest one" % ", ".join(sorted(set(purple))[:5]))
    elif grads:
        note(1, "%d gradient(s) present - make sure the colours came from the client, not the default" % len(grads))
    if re.search(r"background-clip\s*:\s*text", lcss):
        fail(2, "gradient hero text (background-clip: text) - tell #2")

    # 3 - emoji in headings
    for h in headings(html):
        if EMOJI.search(h):
            fail(3, "emoji in heading: %r - tell #3" % h.strip()[:60])
    if EMOJI.search(text) and not any(EMOJI.search(h) for h in headings(html)):
        note(3, "emoji in body text - usually still worth cutting")

    # 4 / 19 - typefaces
    norm = html.replace("+", " ").replace("%20", " ")
    found_fonts = [f for f in FONT_TELLS if re.search(r"\b" + re.escape(f) + r"\b", norm, re.I)]
    for f in found_fonts:
        fail(4, "%s - %s (tells #4/#19)" % (f, FONT_TELLS[f]))
    if "Space Grotesk" in found_fonts and "Instrument Serif" in found_fonts:
        fail(19, "Space Grotesk + Instrument Serif - the exact signature pairing")

    # 5 - colored border cards
    lb = re.findall(r"border-(?:left|inline-start)\s*:\s*\d+px\s+solid", lcss) + re.findall(r"\bborder-l-\d", low)
    if len(lb) >= 2:
        fail(5, "%d coloured left-border cards - tell #5" % len(lb))

    # 6 - glassmorphism
    if "backdrop-filter" in lcss or "backdrop-blur" in low:
        fail(6, "backdrop-filter / glassmorphism - tell #6")

    # 7 - contrast on explicit pairs
    for block in re.findall(r"\{([^{}]*)\}", css):
        b = block.lower()
        fg = re.search(r"(?<!-)\bcolor\s*:\s*(#[0-9a-f]{3,8})", b)
        bg = re.search(r"background(?:-color)?\s*:\s*(#[0-9a-f]{3,8})", b)
        if fg and bg:
            a, c = hex_to_rgb(fg.group(1)), hex_to_rgb(bg.group(1))
            if a and c:
                r = contrast(a, c)
                if r < 4.5:
                    fail(7, "contrast %.1f:1 (%s on %s) - below 4.5:1, tell #7" % (r, fg.group(1), bg.group(1)))

    # 8 - three icon boxes
    svgs = len(re.findall(r"<svg\b", low))
    if re.search(r"repeat\(\s*3\s*,", lcss) and svgs >= 3:
        note(8, "3-column grid with %d inline SVGs - is this the three-icon-boxes row? (tell #8)" % svgs)

    # 9 - badge above the headline
    head = low.split("<h1", 1)[0][-1200:] if "<h1" in low else ""
    if re.search(r'class="[^"]*\b(badge|pill|chip|eyebrow|tagline|kicker)\b', head):
        fail(9, "badge/pill element above the h1 - tell #9")

    # 10 - lucide
    if "lucide" in low:
        fail(10, "Lucide icon set referenced - tell #10")
    if svgs >= 8:
        note(10, "%d inline SVG icons - icons multiply because they are easy (tell #10)" % svgs)

    # 11 - untouched shadcn
    shad = re.findall(r"\b(bg-background|text-foreground|bg-card|text-muted-foreground|ring-offset-background|bg-primary)\b", low)
    if shad:
        fail(11, "untouched shadcn tokens (%s) - tell #11" % ", ".join(sorted(set(shad))[:4]))

    # 12 - fade-in on scroll
    if "intersectionobserver" in low and re.search(r"opacity|translatey", low):
        fail(12, "IntersectionObserver fade/rise on scroll - tell #12")

    # 13 - cursor-following beam
    if "mousemove" in low and ("radial-gradient" in lcss or "--mouse" in low or "--x" in lcss):
        fail(13, "cursor-following beam - tell #13")

    # 14 - hover opacity
    if re.search(r"hover:opacity-", low) or re.search(r":hover\s*\{[^}]*opacity\s*:", lcss):
        fail(14, "buttons fading on hover - tell #14")
    if ":focus-visible" not in lcss and ":focus" not in lcss:
        note(14, "no focus style defined - keyboard users get the browser default")

    # 15 - spacing scale
    vals = [int(v) for v in re.findall(r"(?:padding|margin|gap|row-gap|column-gap)[^:;{}]*:\s*([0-9]{1,3})px", lcss)]
    vals += [int(v) for v in re.findall(r"(?:padding|margin|gap)[^:;{}]*:[^;{}]*?\s([0-9]{1,3})px", lcss)]
    off = sorted({v for v in vals if v % 4 and v not in (1, 2, 3)})
    distinct = len(set(vals))
    if off:
        fail(15, "spacing values off a 4px scale: %s - tell #15" % ", ".join(map(str, off[:10])))
    elif distinct > 10:
        note(15, "%d distinct spacing values - declare a scale and use only it (tell #15)" % distinct)

    # 16 - em dashes
    ems = text.count("—") + text.count("–")
    if ems >= 2:
        fail(16, "%d em/en dashes in visible copy - tell #16" % ems)
    elif ems == 1:
        note(16, "one em dash - fine alone, a tell when stacked with others")

    # 17 - buzzwords
    hits = Counter()
    tl = text.lower()
    for w in BUZZWORDS:
        n = tl.count(w)
        if n:
            hits[w] = n
    for w in AVOID_IS:
        if w in tl:
            hits[w] = tl.count(w)
    if hits:
        fail(17, "buzzword copy: %s - tell #17, see copy-tells.md" %
             ", ".join("%s x%d" % (w, n) for w, n in hits.most_common(8)))

    # 18 - serif italic accent in a heading
    for h in re.findall(r"<h[1-3]\b[^>]*>(.*?)</h[1-3]>", html, flags=re.S | re.I):
        if re.search(r"<(em|i)\b", h, re.I) or "italic" in h.lower():
            fail(18, "italic accent inside a headline - tell #18")
            break

    # 20 - grain over gradient
    if ("feturbulence" in low or "noise" in low) and grads:
        fail(20, "grain/noise over a gradient - tell #20")

    # copy + hygiene
    stop = {"a", "an", "and", "the", "of", "for", "to", "in", "on", "or", "with", "at", "by"}
    tc = []
    for h in headings(html):
        w = [x for x in re.findall(r"[A-Za-z']+", h)]
        big = [x for x in w if x.lower() not in stop]
        if len(w) >= 4 and len(big) >= 3 and all(x[:1].isupper() for x in big):
            tc.append(h)
    if tc:
        note(0, "Title Case heading(s): %r - sentence case unless the brand says otherwise" % tc[0][:60])
    for pat, msg in [
        (r"\bnot just\b.{0,40}\bit'?s\b", "\"not just X, it's Y\" (h.9)"),
        (r"\bin order to\b", "filler \"in order to\" (h.23)"),
        (r"\bit is important to note\b", "filler \"it is important to note\" (h.23)"),
        (r"\bstudies show\b|\bexperts agree\b", "vague source (h.5)"),
        (r"\blet'?s (?:explore|dive|be honest)\b", "announcing the next point / fake candour (h.28, h.33)"),
        (r"\bthe (?:real )?question isn'?t\b", "false profundity (h.27)"),
    ]:
        if re.search(pat, tl):
            fail(17, "copy tell: %s" % msg)
    if "lorem ipsum" in tl:
        fail(0, "lorem ipsum - the spike must be built on the client's real material")
    if not re.search(r"<title\b", low):
        fail(0, "no <title>")
    h1s = len(re.findall(r"<h1\b", low))
    if h1s != 1:
        fail(0, "%d <h1> elements - want exactly 1" % h1s)
    if not re.search(r'name=["\']description["\']', low):
        fail(0, "no meta description")
    if "prefers-reduced-motion" not in lcss and re.search(r"@keyframes|transition\s*:", lcss):
        note(0, "motion present with no prefers-reduced-motion block")

    return fails, notes


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    bad = 0
    for path in sys.argv[1:]:
        fails, notes = scan(path)
        print("\n=== %s ===" % path)
        if not fails and not notes:
            print("PASS - no mechanical tells found. Now do the four manual checks in SKILL.md.")
        for n, m in fails:
            print("  FAIL  [%02d] %s" % (n, m))
        for n, m in notes:
            print("  NOTE  [%02d] %s" % (n, m))
        print("  %d fail, %d note" % (len(fails), len(notes)))
        bad += len(fails)
    if bad:
        print("\nFix each FAIL, or record it as a deliberate exception with a client-specific reason.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
