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
               data-autoplay  (muted, looping — used for the home reel)
               data-url    (figma / iframe providers)
               data-src    (file provider: path to an .mp4)               */
  function embedUrl(el) {
    const d = el.dataset;
    const id = (d.id || "").trim();
    const auto = "autoplay" in d;
    switch (d.provider) {
      case "vimeo": {
        if (!id) return "";
        const p = new URLSearchParams({ dnt: "1", title: "0", byline: "0", portrait: "0", playsinline: "1" });
        if (d.hash) p.set("h", d.hash);
        if (auto) { p.set("autoplay", "1"); p.set("muted", "1"); p.set("loop", "1"); }
        return "https://player.vimeo.com/video/" + encodeURIComponent(id) + "?" + p;
      }
      case "youtube": {
        if (!id) return "";
        const p = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
        if (auto) { p.set("autoplay", "1"); p.set("mute", "1"); p.set("loop", "1"); p.set("playlist", id); }
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
    const f = document.createElement("iframe");
    f.src = src;
    f.title = label;
    f.loading = "autoplay" in d ? "eager" : "lazy";
    f.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    el.append(f);
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

  /* ---- 4. Lightbox ------------------------------------------------------ */
  const galleries = document.querySelectorAll(".gallery");
  if (galleries.length && "HTMLDialogElement" in window) {
    const dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.innerHTML = '<button type="button" aria-label="Close">×</button><img alt=""><p></p>';
    document.body.append(dlg);
    const big = dlg.querySelector("img");
    const cap = dlg.querySelector("p");
    dlg.querySelector("button").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

    galleries.forEach((g) => {
      g.querySelectorAll("img").forEach((img) => {
        img.setAttribute("data-zoomable", "");
        img.addEventListener("click", () => {
          if (!img.naturalWidth) return; // still a placeholder
          big.src = img.currentSrc || img.src;
          big.alt = img.alt;
          const fc = img.closest("figure")?.querySelector("figcaption");
          cap.textContent = fc ? fc.textContent.trim().replace(/\s+/g, " ") : img.alt;
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
})();
