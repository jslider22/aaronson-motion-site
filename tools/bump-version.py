#!/usr/bin/env python3
"""
Cache-busting: stamp every page's  css/style.css  and  js/site.js  links with a
short fingerprint of the file's contents, e.g.  css/style.css?v=3f9a1c2e

Browsers (and GitHub Pages' 10-minute cache) treat a new ?v= as a new file, so
visitors get CSS/JS changes immediately instead of a stale saved copy.
Runs automatically before every commit via the git hook (see README); you can
also run it by hand:  python3 tools/bump-version.py
"""
import hashlib, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ["css/style.css", "js/site.js"]

def fingerprint(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]

def main():
    tags = {rel: fingerprint(rel) for rel in ASSETS}
    changed = []
    for page in sorted(ROOT.glob("*.html")):
        s = page.read_text(encoding="utf-8"); new = s
        for rel, v in tags.items():
            new = re.sub(r'(["\'])' + re.escape(rel) + r'(?:\?v=[\w.-]*)?\1', lambda m: f'{m.group(1)}{rel}?v={v}{m.group(1)}', new)
        if new != s:
            page.write_text(new, encoding="utf-8"); changed.append(page.name)
    print("versions:", ", ".join(f"{k}={v}" for k, v in tags.items()))
    print("updated:", ", ".join(changed) if changed else "nothing (already current)")

if __name__ == "__main__":
    main()
