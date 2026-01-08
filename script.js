/* =========================================================
   Stag Lore — Snap + Embers (Phase 1)
   - Snaps hot-book.png to baked book location in stag-study.png
   - Uses object-fit: cover math to align precisely on any screen
   - Runs embers only on hover/focus
   ========================================================= */

(() => {
  const bgImg   = document.getElementById("bgImg");
  const anchor  = document.getElementById("bookAnchor");
  const canvas  = document.getElementById("embers");
  const ctx     = canvas.getContext("2d", { alpha: true });

  // === PHOTOPEA MAP (from your screenshot) =================
  // Background image pixels (natural size)
  const BG_W = 1536;
  const BG_H = 1024;

  // Book bounding box inside that image (pixels)
  // X/Y are top-left of selection, W/H are selection width/height.
  const BOOK_BOX = { x: 1302, y: 863, w: 411, h: 610 };
  // =========================================================

  // -----------------------------
  // SNAP MATH (cover)
  // -----------------------------
  function getCoverMapping() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // object-fit: cover scale
    const scale = Math.max(vw / BG_W, vh / BG_H);

    const drawnW = BG_W * scale;
    const drawnH = BG_H * scale;

    // centered crop offsets
    const offsetX = (vw - drawnW) / 2;
    const offsetY = (vh - drawnH) / 2;

    return { scale, offsetX, offsetY };
  }

  function snapAnchorToBook() {
    // Wait until bg is fully decoded so size is reliable
    if (!bgImg.complete) return;

    const { scale, offsetX, offsetY } = getCoverMapping();

    const left = offsetX + BOOK_BOX.x * scale;
    const top  = offsetY + BOOK_BOX.y * scale;
    const w    = BOOK_BOX.w * scale;
    const h    = BOOK_BOX.h * scale;

    // Position the anchor EXACTLY to baked-book box
    anchor.style.left = `${left}px`;
    anchor.style.top = `${top}px`;
    anchor.style.width = `${w}px`;
    anchor.style.height = `${h}px`;

    // IMPORTANT: remove fallback translate once JS is live
    anchor.style.transform = "none";

    // Resize embers canvas to match anchor
    resizeCanvas();
  }

  // -----------------------------
  // EMBERS
  // -----------------------------
  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;
  const sparks = [];
  const MAX = 56;

  function resizeCanvas() {
    const rect = anchor.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawn() {
    // Spawn from lower-middle area, drift upward
    const x = rand(w * 0.38, w * 0.62);
    const y = rand(h * 0.62, h * 0.78);

    sparks.push({
      x, y,
      vx: rand(-0.18, 0.18),
      vy: rand(-0.85, -0.35),
      r: rand(0.8, 2.2),
      a: rand(0.35, 0.78),
      life: rand(28, 64),
      t: 0,
      tw: rand(0.004, 0.012)
    });

    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);

    // Spawn a couple per frame
    for (let i = 0; i < 2; i++) spawn();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      s.x += s.vx + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.08;
      s.y += s.vy;

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 165, 80, ${alpha * tw})`;
      ctx.fill();

      if (Math.random() < 0.22) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.4, s.r * 0.42), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 170, ${alpha * 0.65})`;
        ctx.fill();
      }

      if (s.t >= s.life || s.y < -10 || s.x < -20 || s.x > w + 20) {
        sparks.splice(i, 1);
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    resizeCanvas();
    ctx.clearRect(0, 0, w, h);
    sparks.length = 0;
    cancelAnimationFrame(raf);
    step();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    setTimeout(() => {
      if (!running) ctx.clearRect(0, 0, w, h);
    }, 120);
  }

  // -----------------------------
  // EVENTS
  // -----------------------------
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  // Re-snap on resize
  window.addEventListener("resize", () => {
    snapAnchorToBook();
  }, { passive: true });

  // Ensure snap after image loads/decodes
  async function init() {
    try {
      if (bgImg.decode) await bgImg.decode();
    } catch (_) {
      // decode can fail on some browsers; ignore
    }
    snapAnchorToBook();
  }

  init();
})();