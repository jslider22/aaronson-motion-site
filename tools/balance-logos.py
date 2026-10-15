#!/usr/bin/env python3
"""
Balance client logos so they all carry equal visual weight on the home page.

Each logo is trimmed of its white border, sized by AREA (so wide wordmarks and
square badges look equally important), nudged smaller if it's very solid/dark,
and centered on an identical 320x120 white canvas.

Usage (needs Pillow:  python3 -m pip install pillow):
    python3 tools/balance-logos.py <folder-of-originals> assets/images/home/clients

Name each original after its slot, e.g. "navient.png", "lee-company.jpg".
Pre-crop anything that needs it (taglines, captions) before running.
"""
import math, os, statistics, sys
from PIL import Image, ImageChops

W, H = 320, 120                 # canvas (8:3); shown ~90-115px wide, so ~2x for Retina
TARGET = 0.40 * W * H           # area each logo should cover
MAXW, MAXH = 0.96 * W, 0.92 * H

def load(path):
    im = Image.open(path); im.seek(0); im = im.convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    return bg.convert("RGB")

def trim(im):
    mask = ImageChops.difference(im, Image.new("RGB", im.size, "white")).convert("L").point(lambda v: 255 if v > 18 else 0)
    box = mask.getbbox()
    return im.crop(box) if box else im

def coverage(im):
    hist = im.convert("L").histogram()
    return sum(hist[:235]) / max(1, sum(hist))

def main(src, out):
    exts = (".png", ".jpg", ".jpeg", ".webp", ".gif")
    logos = {os.path.splitext(f)[0]: trim(load(os.path.join(src, f)))
             for f in sorted(os.listdir(src)) if f.lower().endswith(exts)}
    cov = {k: coverage(v) for k, v in logos.items()}
    med = statistics.median(cov.values())
    for k, im in logos.items():
        r = im.width / im.height
        dens = max(0.78, min(1.25, (med / cov[k]) ** 0.5))   # denser logo -> a bit smaller
        h = math.sqrt(TARGET * dens / r); w = r * h
        s = min(1, MAXW / w, MAXH / h)
        w, h = max(1, round(w * s)), max(1, round(h * s))
        canvas = Image.new("RGB", (W, H), "white")
        canvas.paste(im.resize((w, h), Image.LANCZOS), ((W - w) // 2, (H - h) // 2))
        canvas.save(os.path.join(out, k + ".png"), optimize=True)
        print(f"{k:30} -> {w}x{h}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
