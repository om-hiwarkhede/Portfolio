console.log("BRUTAL PORTFOLIO v2.7 + Anime.js v4 loaded.");

// ---------- Base (no animation dependency) ----------
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  menuBtn.textContent = open ? "CLOSE [x]" : "MENU [+]";
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "MENU [+]";
  })
);

// Experience accordion (click + keyboard)
const expItems = [...document.querySelectorAll(".exp-item")];
expItems.forEach((item, i) => {
  const head = item.querySelector(".exp-top");
  if (i === 0) item.classList.add("open");
  const toggle = () => {
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".exp-item.open").forEach((o) => o.classList.remove("open"));
    if (!wasOpen) {
      item.classList.add("open");
      popPlus(item);
    }
  };
  head.addEventListener("click", toggle);
  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
});
function popPlus(item) {
  // Upgraded with Anime if present, otherwise no-op (CSS handles open state)
  if (!window.__anime) return;
  const { animate } = window.__anime;
  const plus = item.querySelector(".exp-plus");
  if (plus) animate(plus, { scale: [0.6, 1], rotate: ["90deg", "0deg"], duration: 350, ease: "outBack(2)" });
}

// Active nav link
const sections = [...document.querySelectorAll("main section[id]")];
const links = [...document.querySelectorAll(".nav-links a")];
const navIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => navIO.observe(s));

// Contact form: validate, then POST to Formspree (or mailto fallback until configured)
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  const status = document.getElementById("formStatus");
  const showStatus = (msg, ok) => {
    status.textContent = msg;
    status.className = "form-status " + (ok ? "ok" : "err");
    status.hidden = false;
  };
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    if (data.get("_gotcha")) return; // honeypot: silently drop bots
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (name.length < 2) return showStatus("ERR — please enter your name.", false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showStatus("ERR — that email doesn't look valid.", false);
    if (message.length < 10) return showStatus("ERR — message needs at least 10 characters.", false);
    const action = contactForm.getAttribute("action") || "";
    if (action.includes("YOUR_FORM_ID")) {
      // Endpoint not configured yet: open the visitor's mail app with a prefilled email
      window.location.href =
        "mailto:hiwarkhedeo@gmail.com?subject=" + encodeURIComponent("Portfolio contact — " + name) +
        "&body=" + encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      return showStatus("NOTE — form endpoint not configured yet, opened your mail app instead.", true);
    }
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "SENDING…";
    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("bad response");
      contactForm.reset();
      showStatus("OK ● MESSAGE SENT — expect a reply within 24 hrs.", true);
    } catch (err) {
      showStatus("ERR — send failed. Email hiwarkhedeo@gmail.com directly.", false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Send message ↗";
    }
  });
}

// ---------- Motion (Anime.js v4, progressive enhancement) ----------
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const loader = document.getElementById("loader");

function fallbackReveal() {
  // Old CSS behaviour: reveal everything via IO, drop loader
  document.documentElement.classList.remove("anim");
  if (loader) loader.remove();
  document.documentElement.classList.add("loader-done");
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("in")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".brut-card, .exp-item, .skill-box, .proj-card, .cert-card, .edu-card, .faq-item, .blog-post, .photo-frame, .contact-big, .contact-box, .contact-form").forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
}

function splitHeroChars(h1) {
  // Split text nodes into per-char spans grouped in word spans (no mid-word breaks).
  // Element nodes (e.g. .sr-only) are preserved as-is, never exploded into chars.
  const label = h1.textContent.replace(/\s+/g, " ").trim();
  const nodes = [...h1.childNodes];
  h1.innerHTML = "";
  h1.setAttribute("aria-label", label);
  let w = null;
  const newWord = () => {
    w = document.createElement("span");
    w.className = "word";
    w.setAttribute("aria-hidden", "true");
    h1.appendChild(w);
  };
  newWord();
  nodes.forEach((node) => {
    if (node.nodeName === "BR") {
      h1.appendChild(document.createElement("br"));
      newWord();
      return;
    }
    if (node.nodeType !== Node.TEXT_NODE) {
      node.setAttribute("aria-hidden", "true");
      h1.appendChild(node);
      newWord();
      return;
    }
    [...node.textContent].forEach((ch) => {
      if (ch === "\n") return;
      if (ch === " ") {
        h1.appendChild(document.createTextNode(" "));
        newWord();
        return;
      }
      if (ch === "­") {
        // soft hyphen: allow a wrap opportunity here without showing a hyphen
        newWord();
        return;
      }
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch;
      w.appendChild(s);
    });
  });
  h1.querySelectorAll(".word:empty").forEach((el) => el.remove());
  return h1.querySelectorAll(".char");
}

(async () => {
  if (reduced) {
    fallbackReveal();
    return;
  }

  let mod = null;
  try {
    mod = await import("animejs");
  } catch (e) {
    console.warn("Anime.js CDN failed, using CSS fallback.", e);
    fallbackReveal();
    return;
  }

  const { animate, stagger, onScroll } = mod;
  window.__anime = mod;
  document.documentElement.classList.add("anim");

  try {
  // --- Split hero title ---
  const h1 = document.querySelector("[data-split]");
  const chars = h1 ? splitHeroChars(h1) : [];

  // --- Loader + hero entrance (transform/opacity only) ---
  const heroIn = () => {
    animate(".topbar", { y: ["-100%", "0%"], opacity: [0, 1], duration: 500, ease: "outExpo" });
    animate(".nav-wrap", { y: ["-100%", "0%"], opacity: [0, 1], duration: 550, delay: 60, ease: "outExpo" });
    animate(".eyebrow .sticker", { scale: [0, 1], rotate: ["-10deg", "-2deg"], duration: 550, delay: 150, ease: "outBack(1.8)" });
    animate(".eyebrow samp", { y: [12, 0], opacity: [0, 1], duration: 450, delay: 220, ease: "outExpo" });
    if (chars.length) {
      animate(chars, { y: ["110%", "0%"], opacity: [0, 1], duration: 700, delay: stagger(28, { start: 200 }), ease: "outExpo" });
    }
    animate(".role-strip", { y: [18, 0], opacity: [0, 1], duration: 550, delay: 450, ease: "outExpo" });
    animate(".hero-description", { y: [16, 0], opacity: [0, 1], duration: 550, delay: 540, ease: "outExpo" });
    animate(".hero-buttons .btn", { y: [16, 0], opacity: [0, 1], scale: [0.94, 1], duration: 450, delay: stagger(80, { start: 620 }), ease: "outBack(1.6)" });
    animate(".hero-meta div", { y: [14, 0], opacity: [0, 1], duration: 450, delay: stagger(70, { start: 720 }), ease: "outExpo" });
    animate(".photo-frame", { y: [28, 0], opacity: [0, 1], scale: [0.94, 1], duration: 750, delay: 350, ease: "outExpo" });
    animate(".stamp", { scale: [0, 1], rotate: ["-30deg", "12deg"], duration: 600, delay: 750, ease: "outBack(1.7)" });
    animate(".sticker-card", { scale: [0, 1], rotate: ["4deg", "-8deg"], duration: 550, delay: 880, ease: "outBack(1.8)" });
    animate(".crosshair-note", { opacity: [0, 0.6], duration: 600, delay: 950, ease: "outExpo" });
    // Gentle idle life on sticker only (brutalist restraint: one loop)
    animate(".sticker-card", { y: [0, -6], duration: 1400, alternate: true, loop: true, loopDelay: 200, ease: "inOutSine", delay: 1600 });
  };

  if (loader) {
    animate(".loader-box", { scale: [0.8, 1], rotate: ["4deg", "-2deg"], duration: 350, ease: "outBack(1.8)" });
    animate(loader, {
      y: ["0%", "-100%"], duration: 550, delay: 550, ease: "inOutQuint",
      onComplete: () => {
        loader.remove();
        document.documentElement.classList.add("loader-done");
      },
    });
    // Start hero slightly before loader fully gone for overlap
    setTimeout(heroIn, 550);
  } else {
    heroIn();
  }

  // --- Scroll progress bar (scrub) ---
  const bar = document.getElementById("progressBar");
  if (bar) {
    animate(bar, {
      scaleX: [0, 1], ease: "linear",
      autoplay: onScroll({ container: document.documentElement, sync: true }),
    });
  }

  // --- Section headers ---
  document.querySelectorAll(".sec-head").forEach((head) => {
    animate(head.querySelector(".sec-index"), { scale: [0, 1], rotate: ["-12deg", "0deg"], duration: 450, ease: "outBack(1.8)", autoplay: onScroll({ target: head, enter: "bottom 88%" }) });
    animate(head.querySelector("h2"), { y: [36, 0], opacity: [0, 1], duration: 650, ease: "outExpo", autoplay: onScroll({ target: head, enter: "bottom 88%" }) });
    const tag = head.querySelector(".sec-tag");
    if (tag) animate(tag, { x: [24, 0], opacity: [0, 1], duration: 500, ease: "outExpo", autoplay: onScroll({ target: head, enter: "bottom 88%" }) });
  });

  // --- Scroll reveals (grouped stagger) ---
  const reveal = (targets, trigger, extra = {}) => {
    const els = document.querySelectorAll(targets);
    if (!els.length) return;
    animate(els, {
      y: [28, 0], opacity: [0, 1], duration: 700, ease: "outExpo",
      delay: stagger(80), autoplay: onScroll({ target: trigger, enter: "bottom 86%" }), ...extra,
    });
  };
  reveal(".about-cards .brut-card", ".about-grid");
  reveal(".exp-item", ".exp-list", { delay: stagger(90) });
  reveal(".skills-grid .skill-box", ".skills-grid");
  reveal(".proj-grid .proj-card", ".proj-grid");
  animate(".cert-card", { y: [28, 0], opacity: [0, 1], duration: 750, ease: "outExpo", autoplay: onScroll({ target: ".cert-card", enter: "bottom 85%" }) });
  reveal(".edu-grid .edu-card", ".edu-grid");
  reveal(".blog-grid .blog-post", ".blog-grid");
  reveal(".contact-form", "#contact");
  reveal(".faq-list .faq-item", "#faq");
  reveal(".contact-big", "#contact");
  reveal(".contact-box", "#contact", { delay: stagger(60) });
  animate(".resume-inner > *", { y: [22, 0], opacity: [0, 1], duration: 600, delay: stagger(70), ease: "outExpo", autoplay: onScroll({ target: ".resume-inner", enter: "bottom 85%" }) });

  // --- Parallax (scrub, linear, transform only — separate targets to avoid fighting entrances) ---
  animate(".hero-visual", {
    y: [0, 60], ease: "linear",
    autoplay: onScroll({ target: ".hero", enter: "top top", leave: "bottom top", sync: 0.6 }),
  });
  const giant = document.querySelector(".giant");
  if (giant) {
    animate(giant, {
      y: [40, -40], ease: "linear",
      autoplay: onScroll({ target: "#contact", enter: "bottom bottom", leave: "top top", sync: 0.5 }),
    });
  }

  // --- Magnetic buttons (subtle, brutalist-safe: max 6px) ---
  if (finePointer) {
    document.querySelectorAll(".btn").forEach((btn) => {
      let raf = false;
      btn.addEventListener("mousemove", (e) => {
        if (raf) return;
        raf = true;
        requestAnimationFrame(() => {
          const r = btn.getBoundingClientRect();
          const x = Math.max(-6, Math.min(6, (e.clientX - r.left - r.width / 2) * 0.12));
          const y = Math.max(-6, Math.min(6, (e.clientY - r.top - r.height / 2) * 0.18));
          animate(btn, { x, y, duration: 200, ease: "outQuart", overwrite: true });
          raf = false;
        });
      });
      btn.addEventListener("mouseleave", () => animate(btn, { x: 0, y: 0, duration: 350, ease: "outExpo", overwrite: true }));
      btn.addEventListener("mousedown", () => animate(btn, { scale: 0.96, duration: 120, ease: "outQuart", overwrite: true }));
      btn.addEventListener("mouseup", () => animate(btn, { scale: 1, duration: 200, ease: "outBack(2)", overwrite: true }));
    });

    // --- Photo tilt ---
    const frame = document.querySelector("[data-tilt]");
    if (frame) {
      frame.addEventListener("mousemove", (e) => {
        const r = frame.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        animate(frame, { rotateX: rx, rotateY: ry, duration: 300, ease: "outQuart", overwrite: true });
      });
      frame.addEventListener("mouseleave", () => animate(frame, { rotateX: 0, rotateY: 0, duration: 500, ease: "outExpo", overwrite: true }));
    }

    // --- Square brutalist cursor ---
    const cursor = document.getElementById("cursor");
    if (cursor) {
      let cx = -100, cy = -100, tx = -100, ty = -100, on = false;
      window.addEventListener("mousemove", (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!on) { on = true; cursor.classList.add("is-on"); }
      });
      document.addEventListener("mouseleave", () => { on = false; cursor.classList.remove("is-on"); });
      (function loop() {
        cx += (tx - cx) * 0.22;
        cy += (ty - cy) * 0.22;
        cursor.style.translate = `${cx - 9}px ${cy - 9}px`;
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll("a, button, .exp-top").forEach((el) => {
        el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
      });
    }
  }
  } catch (err) {
    console.warn("Animation setup failed, using CSS fallback.", err);
    fallbackReveal();
  }
})();
