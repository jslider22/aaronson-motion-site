/* ==========================================================================
   Aaronson Motion — shared behavior (no dependencies)
   1. Mobile nav toggle (+ collapsible Design/About on phones)
   2. Video embeds  (Vimeo / YouTube / Figma / iframe / self-hosted file)
   3. Image placeholders for files that haven't been added yet
   4. Gallery lightbox
   5. Carousel buttons
   6. Jump-nav highlighting
   7. Lottie animations (home logo)
   8. Back-to-top button
   9. Home intro (zoom in on the logo, then pull out)
  10. GIFs that take turns animating
  11. Section labels: motion trail scrubbed by scrolling
   ========================================================================== */
(() => {
  "use strict";

  /* ---- 1. Mobile nav ---------------------------------------------------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    // Close the phone menu on a tap outside the header, or with Escape.
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("is-open") && !e.target.closest(".site-header")) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });

    // Phone menu: Design and About collapse behind a chevron button so the menu
    // stays short. The section holding the current page starts open.
    // (Hidden on wider screens, where these are hover/tap dropdowns instead.)
    nav.classList.add("nav-js");
    nav.querySelectorAll(".has-submenu").forEach((li, i) => {
      const link = li.firstElementChild;
      const sub = li.querySelector(".submenu");
      if (!sub) return;
      sub.id = sub.id || "submenu-" + i;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sub-toggle";
      btn.setAttribute("aria-controls", sub.id);
      btn.setAttribute("aria-label", "Show " + link.textContent.trim() + " pages");
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const setExpanded = (open) => {
        li.classList.toggle("is-expanded", open);
        btn.setAttribute("aria-expanded", String(open));
      };
      setExpanded(li.classList.contains("is-active") || !!li.querySelector('[aria-current="page"]'));
      btn.addEventListener("click", () => setExpanded(!li.classList.contains("is-expanded")));
      link.after(btn);
    });
  }

  /* ---- 1b. Dropdowns on touch screens (iPad) -----------------------------
     No hover on a touchscreen, so the first tap on "Design" / "About" opens
     its submenu and a second tap follows the link. Tapping elsewhere closes. */
  const subParents = document.querySelectorAll(".has-submenu");
  const wideNav = window.matchMedia("(min-width: 768px)");
  const noHover = window.matchMedia("(hover: none)");
  const closeMenus = (except) => subParents.forEach((li) => {
    if (li === except) return;
    li.classList.remove("is-open");
    li.firstElementChild.setAttribute("aria-expanded", "false");
  });
  subParents.forEach((li) => {
    const link = li.firstElementChild;
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("click", (e) => {
      if (!wideNav.matches || !noHover.matches || li.classList.contains("is-open")) return;
      e.preventDefault();
      closeMenus(li);
      li.classList.add("is-open");
      link.setAttribute("aria-expanded", "true");
    });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".has-submenu")) closeMenus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenus(); });

  /* ---- Shared placeholder builder --------------------------------------- */
  function makeSlot(tag, name, hint) {
    const box = document.createElement("div");
    box.className = "slot";
    const t = document.createElement("span");
    t.className = "slot__tag slot__tag--" + tag.toLowerCase();
    t.textContent = tag;
    const n = document.createElement("span");
    n.className = "slot__name";
    n.textContent = name;
    box.append(t, n);
    if (hint) {
      const h = document.createElement("span");
      h.className = "slot__hint";
      h.textContent = hint;
      box.append(h);
    }
    return box;
  }

  /* ---- 2. Video embeds --------------------------------------------------
     Markup:  <div class="embed" data-provider="vimeo" data-id="123456789"
                   data-slot="motion/celtics-hype-intro"></div>
     Optional: data-hash   (Vimeo unlisted "h=" key)
               data-ratio  ("9:16", "4:3"… default 16:9)
               data-poster (own still image, when Vimeo's pick is a bad frame)
               data-autoplay  (muted, looping — used for the home reel)
               data-background (Vimeo: silent loop with no controls — for
                               short banners too thin for the control bar)
               data-url    (figma / iframe providers)
               data-src    (file provider: path to an .mp4)
     Thumbnail-first: put data-lite-embeds on a parent (e.g. <main>) and each
     Vimeo/YouTube video shows its still image + a play button; the real
     player only loads when pressed (much faster pages). Use
     data-lite-embeds="stage" to open a full-width player above or below the
     card's row instead (the grid itself never moves).                     */
  function embedUrl(el, play) {
    const d = el.dataset;
    const id = (d.id || "").trim();
    const auto = "autoplay" in d || "background" in d;
    switch (d.provider) {
      case "vimeo": {
        if (!id) return "";
        const p = new URLSearchParams({ dnt: "1", title: "0", byline: "0", portrait: "0", playsinline: "1" });
        if (d.hash) p.set("h", d.hash);
        if ("background" in d) p.set("background", "1");
        else if (auto) { p.set("autoplay", "1"); p.set("muted", "1"); p.set("loop", "1"); }
        else if (play) p.set("autoplay", "1");
        return "https://player.vimeo.com/video/" + encodeURIComponent(id) + "?" + p;
      }
      case "youtube": {
        if (!id) return "";
        const p = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
        if (auto) { p.set("autoplay", "1"); p.set("mute", "1"); p.set("loop", "1"); p.set("playlist", id); }
        else if (play) { p.set("autoplay", "1"); p.set("enablejsapi", "1"); p.set("origin", location.origin); }
        return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?" + p;
      }
      case "figma":
        return d.url ? "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(d.url) : "";
      case "iframe":
        return d.url || "";
      default:
        return "";
    }
  }

  function makeFrame(src, label, eager) {
    const f = document.createElement("iframe");
    f.src = src;
    f.title = label;
    f.loading = eager ? "eager" : "lazy";
    f.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    return f;
  }

  // Find out when a video someone pressed play on finishes, through the
  // Vimeo and YouTube players' postMessage APIs.
  const endWatch = new Map(); // iframe -> { provider, onEnd }
  function watchEnd(f, provider, onEnd) {
    const w = { provider, onEnd, heard: false };
    endWatch.set(f, w);
    // YouTube ignores the request if its player isn't ready yet, so repeat
    // it until the player answers (as YouTube's own embed script does).
    if (provider === "youtube") f.addEventListener("load", () => {
      let tries = 0;
      const ask = () => {
        if (w.heard || !f.isConnected || !f.contentWindow || ++tries > 40) return;
        f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
        f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
        setTimeout(ask, 250);
      };
      ask();
    });
  }
  window.addEventListener("message", (e) => {
    let hit = null;
    endWatch.forEach((v, f) => { if (f.contentWindow === e.source) hit = [f, v]; });
    if (!hit) return;
    const [f, v] = hit;
    if (!f.isConnected) { endWatch.delete(f); return; }
    let d = e.data;
    try { if (typeof d === "string") d = JSON.parse(d); } catch (err) { return; }
    if (!d) return;
    v.heard = true;
    let ended = false;
    if (v.provider === "vimeo") {
      if (d.event === "ready") f.contentWindow.postMessage(JSON.stringify({ method: "addEventListener", value: "finish" }), "https://player.vimeo.com");
      ended = d.event === "finish";
    } else {
      ended = (d.event === "onStateChange" && d.info === 0) || (d.event === "infoDelivery" && d.info && d.info.playerState === 0);
    }
    if (ended) { endWatch.delete(f); v.onEnd(); }
  });

  // Thumbnail-first: still image + play button; the player loads on press.
  const thumbIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { thumbIO.unobserve(en.target); loadThumb(en.target); } });
  }, { rootMargin: "800px 0px" }) : null;

  function loadThumb(el) {
    const img = el.querySelector(".embed__poster img");
    if (el.dataset.poster) { img.src = el.dataset.poster; return; } // our own still
    const id = el.dataset.id.trim();
    if (el.dataset.provider === "youtube") {
      img.src = "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg";
      return;
    }
    const url = "https://vimeo.com/" + id + (el.dataset.hash ? "/" + el.dataset.hash : "");
    fetch("https://vimeo.com/api/oembed.json?width=1280&url=" + encodeURIComponent(url))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (j.thumbnail_url) img.src = j.thumbnail_url; })
      .catch(() => {}); // no still: the black box with a play button still works
  }

  function makePoster(el, label, mode) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "embed__poster";
    b.setAttribute("aria-label", "Play " + label);
    b.innerHTML = '<img alt="" decoding="async"><span class="embed__play" aria-hidden="true"></span>';
    b.querySelector("img").addEventListener("load", (e) => e.target.classList.add("is-loaded"));
    b.addEventListener("click", () => {
      if (mode === "stage") openStage(el, b, label);
      else playInline(el, b, label);
    });
    el.append(b);
    if (thumbIO) thumbIO.observe(el); else loadThumb(el);
  }

  // One video at a time: starting any video puts every other one that is
  // playing in place back to its still image (silent background loops stay).
  function stopOthers(keep) {
    document.querySelectorAll(".embed[data-playing]").forEach((e) => {
      if (e === keep) return;
      const f = e.querySelector("iframe");
      if (f && e.posterEl) f.replaceWith(e.posterEl);
      delete e.dataset.playing;
    });
  }
  function playInline(el, poster, label) {
    stopOthers(el);
    if (stage) closeStage();
    el.posterEl = poster;
    el.dataset.playing = "";
    const f = makeFrame(embedUrl(el, true), label, true);
    poster.replaceWith(f);
    // When it finishes, go back to the still image, ready to play again
    watchEnd(f, el.dataset.provider, () => {
      if (!f.isConnected) return;
      f.replaceWith(poster);
      delete el.dataset.playing;
    });
  }
  function playInStage(el, label, box) {
    const f = makeFrame(embedUrl(el, true), label, true);
    box.replaceChildren(f);
    watchEnd(f, el.dataset.provider, () => {
      if (!f.isConnected) return;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "embed__poster";
      again.setAttribute("aria-label", "Play " + label + " again");
      again.innerHTML = '<img alt="" class="is-loaded"><span class="embed__play" aria-hidden="true"></span>';
      const still = el.querySelector(".embed__poster img");
      if (still && still.src) again.querySelector("img").src = still.src;
      again.addEventListener("click", () => playInStage(el, label, box));
      f.replaceWith(again);
    });
  }

  // data-lite-embeds="stage": a full-width player opens under (or over) the
  // row of the card that was pressed, whichever side has more room, with a
  // notch pointing at it. The picked card stays put on screen. Cards that already fill the row
  // (featured pieces, phones) just play where they are.
  let stage = null, stageCard = null, stageAbove = false;
  // First / last card in the same grid row as `card`
  function rowEdge(card, dir) {
    let edge = card;
    for (let n = card[dir]; n; n = n[dir]) {
      if (n === stage) continue;
      if (Math.abs(n.offsetTop - card.offsetTop) > 2) break;
      edge = n;
    }
    return edge;
  }
  function placeStage() {
    if (!stage || !stageCard) return;
    if (stageAbove) rowEdge(stageCard, "previousElementSibling").before(stage);
    else rowEdge(stageCard, "nextElementSibling").after(stage);
    stage.classList.toggle("stage--above", stageAbove);
    const g = stageCard.parentElement.getBoundingClientRect();
    const c = stageCard.getBoundingClientRect();
    stage.style.setProperty("--notch-x", Math.round(c.left - g.left + c.width / 2) + "px");
  }
  // Run a layout change without the given card moving on screen
  function holdStill(card, change) {
    const before = card ? card.getBoundingClientRect().top : 0;
    change();
    if (!card) return;
    const by = card.getBoundingClientRect().top - before;
    if (Math.abs(by) > 1) window.scrollBy({ top: by, behavior: "instant" });
  }
  function closeStage() {
    if (!stage) return;
    const card = stageCard;
    withGlide(card && card.parentElement, () => holdStill(card, () => {
      stage.remove();
      stage = null;
      if (card) card.classList.remove("is-staged");
      stageCard = null;
    }));
    const btn = card && card.querySelector(".embed__poster");
    if (btn) btn.focus({ preventScroll: true });
  }
  function withGlide(grid, change, after) {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!grid || !document.startViewTransition || still) { change(); if (after) after(); return; }
    const items = [...grid.children];
    items.forEach((c, i) => { c.style.viewTransitionName = "am-card-" + i; });
    const vt = document.startViewTransition(change);
    vt.ready.catch(() => {}); // a skipped transition is fine; don't log it as an error
    vt.finished.finally(() => {
      items.forEach((c) => { c.style.viewTransitionName = ""; });
      if (stage) stage.style.viewTransitionName = "";
      if (after) after();
    });
  }
  function openStage(el, poster, label) {
    const card = el.closest("article") || el;
    const grid = card.parentElement;
    // Already as wide as its grid (featured piece, phone layout): play in place
    if (card.offsetWidth > grid.clientWidth * 0.8) {
      playInline(el, poster, label);
      return;
    }
    stopOthers(null);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Open on whichever side of the card has more room on screen
    const cr = card.getBoundingClientRect();
    const above = cr.top - 70 > window.innerHeight - cr.bottom;
    const change = () => holdStill(card, () => {
      if (!stage) {
        stage = document.createElement("div");
        stage.className = "stage";
        stage.innerHTML = '<button type="button" class="stage__close" aria-label="Close video">×</button><div class="embed"></div><div class="stage__text"></div>';
        stage.querySelector(".stage__close").addEventListener("click", closeStage);
      }
      if (stageCard) stageCard.classList.remove("is-staged");
      stageCard = card;
      stageAbove = above;
      card.classList.add("is-staged");
      const box = stage.querySelector(".embed");
      const [w, h] = (el.dataset.ratio || "16:9").split(":").map(Number);
      box.style.setProperty("--ratio", w + " / " + h);
      box.style.maxWidth = "calc((88vh - 140px) * " + (w / h).toFixed(4) + ")"; // tall videos fit the window
      playInStage(el, label, box);
      // The title/description already sit on the card, so only video-only
      // cards (Social, Educational) get a caption in the player.
      const text = stage.querySelector(".stage__text");
      text.replaceChildren();
      const h3 = card.querySelector("h3");
      text.hidden = !!h3;
      if (!h3) {
        const t = document.createElement("h3");
        t.textContent = label;
        text.append(t);
      }
      placeStage();
      stage.style.viewTransitionName = "am-stage";
    });
    const settle = () => {
      if (!stage) return;
      // Bring the whole player into view, keeping as much of the picked card
      // on screen as fits: a player below sits at the bottom of the window,
      // a player above sits at the top.
      const r = stage.getBoundingClientRect();
      const topLine = 70, bottomLine = window.innerHeight - 16;
      let by = 0;
      if (stageAbove) { if (r.top < topLine) by = r.top - topLine; else if (r.bottom > bottomLine) by = r.bottom - bottomLine; }
      else { if (r.bottom > bottomLine) by = r.bottom - bottomLine; if (r.top - by < topLine) by = r.top - topLine; }
      if (Math.abs(by) > 2) window.scrollBy({ top: by, behavior: still ? "auto" : "smooth" });
    };
    withGlide(grid, change, settle);
  }
  let stageResize = 0;
  window.addEventListener("resize", () => { clearTimeout(stageResize); stageResize = setTimeout(placeStage, 150); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && stage) closeStage(); });

  document.querySelectorAll(".embed").forEach((el) => {
    const d = el.dataset;
    if (d.ratio) el.style.setProperty("--ratio", d.ratio.replace(":", " / "));
    const label = d.title || d.slot || "video";

    if (d.provider === "file") {
      if (!d.src) {
        el.append(makeSlot("video file", d.slot || "", "set data-src to an .mp4 path"));
        return;
      }
      const v = document.createElement("video");
      v.src = d.src;
      v.playsInline = true;
      if ("autoplay" in d) { v.autoplay = v.muted = v.loop = true; } else { v.controls = true; }
      v.preload = "metadata";
      v.addEventListener("error", () => { v.replaceWith(makeSlot("video file", d.src, "file not found yet")); });
      el.append(v);
      return;
    }

    const src = embedUrl(el);
    if (!src) {
      const need = d.provider === "figma" || d.provider === "iframe" ? "add data-url" : "add data-id";
      el.append(makeSlot(d.provider || "video", d.slot || "", need));
      return;
    }
    const lite = el.closest("[data-lite-embeds]");
    const ambient = "autoplay" in d || "background" in d;
    if (lite && !ambient && (d.provider === "vimeo" || d.provider === "youtube")) {
      makePoster(el, label, lite.dataset.liteEmbeds);
      return;
    }
    el.append(makeFrame(src, label, ambient));
  });

  /* ---- 3. Image placeholders ---------------------------------------------
     Any <img> whose file is missing becomes a labelled grey box showing the
     exact path to save the real file at. Set the box shape with
     style="--ar: 3/4" on the <img> (defaults to 4:3).                    */
  function toSlot(img) {
    if (img.dataset.slotted) return;
    img.dataset.slotted = "1";
    const src = img.getAttribute("src") || "";
    const cut = src.lastIndexOf("/") + 1;
    // name = file to add, hint = folder it goes in
    const box = makeSlot("image", src.slice(cut), src.slice(0, cut));
    box.title = src + (img.alt ? " — " + img.alt : "");
    box.classList.add("slot--img", ...img.classList); // keep grid classes (wide/big…)
    box.style.cssText = img.style.cssText; // keeps --ar, max-width, margins
    img.hidden = true;
    img.after(box);
    // If the file shows up later (e.g. dev server reload), swap back.
    img.addEventListener("load", () => { img.hidden = false; box.remove(); delete img.dataset.slotted; }, { once: true });
  }
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) toSlot(img);
    else img.addEventListener("error", () => toSlot(img), { once: true });
  });

  /* ---- 4. Lightbox ------------------------------------------------------
     Click any image in a .gallery to open it large. Step through that
     gallery with the arrow buttons, the ← → keys, or a swipe; "3 / 17"
     shows where you are. Caption = the image's <figcaption>, else its alt. */
  const galleries = document.querySelectorAll(".gallery");
  if (galleries.length && "HTMLDialogElement" in window) {
    const dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.innerHTML =
      '<button type="button" class="lightbox__close" aria-label="Close">×</button>' +
      '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">‹</button>' +
      '<figure class="lightbox__fig"><img alt=""><figcaption><span class="lightbox__cap"></span><span class="lightbox__count"></span></figcaption></figure>' +
      '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next image">›</button>';
    document.body.append(dlg);
    const big = dlg.querySelector("img");
    const cap = dlg.querySelector(".lightbox__cap");
    const count = dlg.querySelector(".lightbox__count");
    let set = [], idx = 0;
    const show = (i) => {
      idx = (i + set.length) % set.length;
      const img = set[idx];
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      const fc = img.closest("figure")?.querySelector("figcaption");
      // Line breaks and the small tool name become " · " separators
      cap.textContent = fc ? fc.innerText.trim().split(/\s*\n+\s*/).join(" · ") : img.alt;
      count.textContent = set.length > 1 ? (idx + 1) + " / " + set.length : "";
      dlg.classList.toggle("is-single", set.length < 2);
    };
    dlg.querySelector(".lightbox__close").addEventListener("click", () => dlg.close());
    dlg.querySelector(".lightbox__nav--prev").addEventListener("click", () => show(idx - 1));
    dlg.querySelector(".lightbox__nav--next").addEventListener("click", () => show(idx + 1));
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.classList.contains("lightbox__fig")) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
    });
    // Swipe left/right on touch screens
    let x0 = null;
    dlg.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    dlg.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });

    galleries.forEach((g) => {
      g.querySelectorAll("img").forEach((img) => {
        img.setAttribute("data-zoomable", "");
        img.addEventListener("click", () => {
          if (!img.naturalWidth) return; // still a placeholder
          set = [...g.querySelectorAll("img[data-zoomable]")].filter((i) => i.naturalWidth);
          show(set.indexOf(img));
          dlg.showModal();
        });
      });
    });
  }

  /* ---- 5. Carousels ----------------------------------------------------- */
  document.querySelectorAll(".carousel").forEach((c) => {
    const track = c.querySelector(".carousel__track");
    c.querySelector(".carousel__btn--prev")?.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth, behavior: "smooth" }));
    c.querySelector(".carousel__btn--next")?.addEventListener("click", () => track.scrollBy({ left: track.clientWidth, behavior: "smooth" }));
  });

  /* ---- 7. Lottie animations ---------------------------------------------
     <div class="lottie" data-src="assets/lottie/file.json" data-loop="true">
     Needs the lottie_light script on that page (see index.html <head>).
     With "reduce motion" turned on, shows the finished logo without animating. */
  document.querySelectorAll(".lottie[data-src]").forEach((el) => {
    if (!window.lottie) {
      el.append(makeSlot("lottie", el.dataset.src.split("/").pop(), "player didn't load"));
      return;
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anim = window.lottie.loadAnimation({
      container: el,
      renderer: "svg",
      path: el.dataset.src,
      loop: el.dataset.loop !== "false" && !still,
      autoplay: !still,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });
    el.anim = anim;
    if (still) anim.addEventListener("DOMLoaded", () => anim.goToAndStop(anim.totalFrames - 1, true));
    anim.addEventListener("data_failed", () => el.append(makeSlot("lottie", el.dataset.src, "file not found")));
  });

  /* ---- 6. Jump-nav: highlight the section in view ------------------------ */
  const jumpLinks = document.querySelectorAll(".jump-nav a[href^='#']");
  if (jumpLinks.length && "IntersectionObserver" in window) {
    const map = new Map();
    jumpLinks.forEach((a) => {
      const sec = document.getElementById(a.getAttribute("href").slice(1));
      if (sec) map.set(sec, a);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        jumpLinks.forEach((a) => a.classList.remove("is-current"));
        const a = map.get(en.target);
        a.classList.add("is-current");
        // Keep the active chip visible in the horizontal mobile bar
        // (scrolls only the bar, never the page).
        const bar = a.closest(".jump-nav");
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    map.forEach((_, sec) => io.observe(sec));
  }
  /* ---- 8. Back-to-top button --------------------------------------------- */
  // Appears once you've scrolled about a screen and a half; one per page,
  // built here so no page needs extra markup.
  const toTop = document.createElement("button");
  toTop.type = "button";
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  toTop.addEventListener("click", () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    const skip = document.querySelector(".brand");
    if (skip) skip.focus({ preventScroll: true });
  });
  document.body.append(toTop);
  let ticking = false;
  const showTop = () => {
    toTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 1.5);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(showTop); }
  }, { passive: true });
  showTop();
  /* ---- 9. Home intro ------------------------------------------------------
     The <head> of index.html adds class "intro" on the first Home visit of a
     session. The page starts scaled up around the logo (everything else
     hidden) and pulls back to normal size a beat after the logo's
     "AARONSONMOTION" wordmark has faded in (PULL_AT_FRAME of the Lottie).
     Any tap, key or scroll skips straight to the end. */
  const root = document.documentElement;
  const introMain = document.getElementById("main");
  const introLogo = document.querySelector(".home-logo .lottie");
  if (root.classList.contains("intro") && introMain && introLogo && introMain.animate) {
    try { sessionStorage.setItem("am-intro", "1"); } catch (e) { /* private mode: play every time */ }
    // The logo runs at 30fps; its wordmark fades in over frames 73-90 (2.4-3.0s)
    const PULL_AT_FRAME = 105;   // ~3.5s: half a second after the wordmark is in
    const PULL = 1000;           // length of the pull-out, ms
    const MAX_WAIT = 5000;       // pull out anyway if the logo is slow or fails to load, ms

    root.style.overflow = "hidden";
    const m = introMain.getBoundingClientRect();
    const l = introLogo.getBoundingClientRect();
    const viewH = window.innerHeight - m.top;
    const k = Math.min(window.innerWidth * 0.9, viewH * 0.85) / l.width;
    // Map the logo's centre to the centre of the visible area under the header
    const px = l.left - m.left + l.width / 2, py = l.top - m.top + l.height / 2;
    let tx = window.innerWidth / 2 - m.left - k * px, ty = viewH / 2 - k * py;
    introMain.style.transformOrigin = "0 0";
    introMain.style.transform = `translate(${tx}px, ${ty}px) scale(${k})`;
    // Correct any drift from layout changes (e.g. the scrollbar disappearing)
    const l2 = introLogo.getBoundingClientRect();
    tx += window.innerWidth / 2 - (l2.left + l2.width / 2);
    ty += m.top + viewH / 2 - (l2.top + l2.height / 2);
    const start = `translate(${tx}px, ${ty}px) scale(${k})`;
    introMain.style.transform = start;
    introMain.classList.add("intro-hold");
    introMain.style.opacity = "1";
    root.classList.remove("intro");

    let pull = null, done = false;
    const timers = [];
    const events = ["pointerdown", "keydown", "wheel", "touchmove"];
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      events.forEach((t) => window.removeEventListener(t, skip));
      introMain.classList.remove("intro-hold");
      introMain.style.transform = "";
      introMain.style.transformOrigin = "";
      root.style.overflow = "";
    };
    const skip = () => { if (pull) pull.finish(); else finish(); };
    events.forEach((t) => window.addEventListener(t, skip, { passive: true }));

    const go = () => {
      if (done || pull) return;
      introMain.classList.remove("intro-hold");
      pull = introMain.animate(
        [{ transform: start }, { transform: "none" }],
        { duration: PULL, easing: "cubic-bezier(.65, 0, .2, 1)" }
      );
      introMain.style.transform = "";
      pull.onfinish = finish;
    };

    const anim = introLogo.anim;
    if (anim) anim.addEventListener("enterFrame", function check() {
      if (anim.currentFrame >= PULL_AT_FRAME) { anim.removeEventListener("enterFrame", check); go(); }
    });
    timers.push(setTimeout(go, MAX_WAIT));
  } else {
    root.classList.remove("intro");
  }
  /* ---- 10. GIFs that take turns ------------------------------------------
     <div class="gif-grid" data-take-turns>
       <img src="x-still.webp" data-anim="x.webp" data-ms="4000"> …
     Every GIF shows a still of its finished design; one at a time plays
     through (at least ~3.5s) and fades back to its still, then the next one
     goes. Hover or tap one to play it now. Only runs while the grid is on
     screen; with "reduce motion" they stay still unless tapped. */
  document.querySelectorAll("[data-take-turns]").forEach((grid) => {
    const items = [...grid.querySelectorAll("img[data-anim]")];
    if (!items.length) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = -1, timer = 0, onScreen = false, plays = 0;
    // Wrap each still so the animation can sit on top of it and fade away
    items.forEach((img, i) => {
      const box = document.createElement("span");
      box.className = "gif-turn";
      img.before(box);
      box.append(img);
      box.addEventListener("mouseenter", () => play(i));
      box.addEventListener("click", () => play(i));
    });
    function stop(i) {
      const top = items[i] && items[i].parentElement.querySelector(".gif-turn__anim");
      if (items[i]) items[i].parentElement.classList.remove("is-turn");
      if (!top) return;
      top.classList.remove("is-on");
      setTimeout(() => top.remove(), 450);
    }
    function play(i) {
      clearTimeout(timer);
      if (current >= 0 && current !== i) stop(current);
      current = i;
      const img = items[i];
      const box = img.parentElement;
      box.classList.add("is-turn"); // blue outline: this one is playing
      if (box.querySelector(".gif-turn__anim")) box.querySelector(".gif-turn__anim").remove();
      const top = new Image();
      top.className = "gif-turn__anim";
      top.alt = "";
      // A fresh URL each time so the animation starts from its first frame
      top.src = img.dataset.anim + "#play" + ++plays;
      top.addEventListener("load", () => top.classList.add("is-on"), { once: true });
      box.append(top);
      const ms = Number(img.dataset.ms) || 4000;
      const length = ms * Math.max(1, Math.ceil(3500 / ms)); // short loops play twice
      timer = setTimeout(() => {
        stop(i);
        if (!still && onScreen) timer = setTimeout(() => play((i + 1) % items.length), 500);
      }, length);
    }
    if (still || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(([en]) => {
      onScreen = en.isIntersecting;
      if (onScreen && !grid.querySelector(".gif-turn__anim")) timer = setTimeout(() => play((current + 1) % items.length), 600);
      if (!onScreen) { clearTimeout(timer); if (current >= 0) stop(current); }
    }, { threshold: 0.35 }).observe(grid);
  });
  /* ---- 11. Section labels: motion trail scrubbed by scrolling ----------
     Each .rule-label's trail is tied to scroll position: it draws outward
     from the word (blue, then mint, then dark blue) as the label rises from
     near the bottom of the window to just above the middle, and draws back
     in if you scroll up. site.js sets --trail (0 to 1); CSS
     clips the trail to match. Without JS, or with "reduce motion", the full
     trail simply shows. */
  const labels = [...document.querySelectorAll(".rule-label")];
  if (labels.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("reveal-labels");
    let queued = false;
    const playing = new Set(); // labels doing their opening draw
    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      labels.forEach((l) => {
        if (playing.has(l)) return;
        const top = l.getBoundingClientRect().top;
        // 0 while the label is in the bottom 10% of the window, 1 once it's
        // just above the middle (40% from the top) — eased so it starts and
        // settles smoothly
        const t = Math.min(1, Math.max(0, (vh * 0.9 - top) / (vh * 0.5)));
        const p = t * t * (3 - 2 * t);
        l.style.setProperty("--trail", p.toFixed(3));
      });
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    // On Home, wait until the zoom intro has finished so the motion is seen
    const start = () => {
      const m = document.getElementById("main");
      const zooming = m && (m.classList.contains("intro-hold") || m.style.transform || (m.getAnimations && m.getAnimations().length));
      if (zooming) { setTimeout(start, 200); return; }
      update();
      // Labels already on screen (e.g. Home's "Demo Reel") would otherwise
      // just appear drawn, so they play the draw once, then follow the scroll.
      labels.forEach((l) => {
        const end = parseFloat(l.style.getPropertyValue("--trail")) || 0;
        if (!end) return;
        playing.add(l);
        const t0 = performance.now(), dur = 900;
        const step = (now) => {
          const t = Math.min(1, (now - t0) / dur);
          l.style.setProperty("--trail", (end * t * t * (3 - 2 * t)).toFixed(3));
          if (t < 1) requestAnimationFrame(step); else { playing.delete(l); onScroll(); }
        };
        l.style.setProperty("--trail", "0");
        requestAnimationFrame(step);
      });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };
    start();
  }
})();
