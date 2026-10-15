# Aaronson Motion — portfolio site

Static rebuild of aaronsonmotion.com (moving off Wix). Plain HTML, one CSS file and one
small JavaScript file. Nothing to install, no build step. Every page is a normal `.html`
file you can open and edit.

## Project layout

```
index.html                Home (animated Lottie logo, demo reel, client logos)
design.html               Design landing page (6 thumbnail cards)
motion-design.html        Motion Design (5 sections, jump links)
vfx-video-editing.html    VFX & Video Editing
ux-design.html            Design → UX Design (SkiPS, AutoExpreso, Navient.com, OpenToon)
2d-design.html            Design → 2D Design
storyboards.html          Design → Storyboards
line-drawings.html        Design → Line Drawings
3d-design.html            Design → 3D Design
fine-art.html             Design → Fine Art
about.html                About (bio + stat sheet)
now.html                  About → Now
resume.html               About → Resume
404.html                  "Page not found"

css/style.css             All styles (mobile-first; colors/fonts are variables at the top)
js/site.js                Menu toggle, video embeds, image placeholders, lightbox, carousel
assets/images/<page>/     Images, one folder per page
assets/files/             Resume PDF / DOCX downloads
assets/lottie/            Lottie animation files (home logo)
tools/asset-checklist.py  Lists every image/video slot and whether it's filled
ASSETS.md                 Output of the checklist
```

## Adding a video

Each video spot looks like this:

```html
<div class="embed" data-provider="vimeo" data-id="" data-slot="motion/celtics-hype-intro"></div>
```

Paste the video's ID between the quotes in `data-id=""`:

| Link | `data-provider` | `data-id` |
|---|---|---|
| `https://vimeo.com/123456789` | `vimeo` | `123456789` |
| `https://vimeo.com/123456789/abcdef1234` (unlisted) | `vimeo` | `123456789`, plus `data-hash="abcdef1234"` |
| `https://www.youtube.com/watch?v=AbC123xyz` or `https://youtu.be/AbC123xyz` | `youtube` | `AbC123xyz` |

Other options:
- `data-ratio="9:16"` for anything that isn't 16:9.
- `data-autoplay` plays muted and on loop. The home page reel uses this.
- `data-provider="figma" data-url="<Figma prototype link>"` for interactive prototypes.
- `data-provider="file" data-src="assets/video/clip.mp4"` for a self-hosted clip.

An empty slot shows a grey placeholder with its name, so you can always see what's missing.

## The animated logo (Lottie)

The home page logo plays `assets/lottie/aaronson-motion-logo.json`, a copy of your LottieFiles
animation saved in the project, so it keeps working if anything changes on LottieFiles.
To replace it, export a new Lottie JSON and save it at that path. To play it once instead
of looping, set `data-loop="false"` on the `.lottie` element in `index.html`.

## Adding images

Every image already points at its final path, for example
`assets/images/2d-design/got-creep-tshirt.jpg`. Save the real file at that exact path and
it shows up. Until then the page shows a grey box with the filename and folder.

Run this to see what's still missing (it also rewrites `ASSETS.md`):

```bash
python3 tools/asset-checklist.py
```

Image tips: export JPG for photos and renders, PNG for logos and line art. About 2000px on
the long side is plenty. Keep each file under about 500 KB where you can.

## Client logos

The home page logos are pre-balanced so they look equally weighted. Each file is the
same 320×120 canvas, with the logo sized by area (not by width or height) and nudged
smaller if it's very solid or dark. To add or swap a logo, put the original (named after
its slot, e.g. `navient.png`) in a folder and run
`python3 tools/balance-logos.py <that-folder> assets/images/home/clients`.
Don't just drop in a raw logo, or it will look too big or too small next to the others.

## Previewing locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. Opening the `.html` files directly also works, but video
embeds behave best through the local server.

## Phones, iPad and desktop

It's one site that adapts to screen width. There's no separate mobile version to maintain.
`css/style.css` has three layout ranges:

- **Phone** (under 768px): menu button, single-column layouts, about 44px tap targets.
- **Tablet / iPad portrait** (768–1023px): full menu bar, 2–4 column galleries.
  Tapping Design or About opens its submenu, and a second tap follows the link.
- **Desktop / iPad landscape** (1024px and up): the full layout.

## Editing the menu or footer

The header and footer are copied into every page. To change a menu item, social link or
the copyright year, use find-and-replace across all `.html` files.

## Hosting

The site is set up for GitHub Pages: the `.nojekyll` file is included and every path is
relative. To publish, go to repo Settings → Pages → Deploy from branch → `main` / root. To use
aaronsonmotion.com, add the domain under Settings → Pages → Custom domain, then point your
domain's DNS at GitHub Pages.
