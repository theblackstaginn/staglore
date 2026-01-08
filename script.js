/* =========================================================
   Stag Lore — Embers (Top + Right Plume, no panel)
   - Canvas stays fully transparent
   - Embers spawn along the right-page edge & top edge
   - Extra "plume" area above the top-right corner
   ========================================================= */

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 80;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnOne() {
    const r = Math.random();

    // We’ll use three bands:
    // 1) tight RIGHT EDGE band (pages)
    // 2) tight TOP EDGE band
    // 3) PLUME above the top-right (free-floating glow)

    let x, y, vx, vy;

    if (r < 0.5) {
      // 1) RIGHT EDGE: thin vertical strip along the page edge
      x  = rand(w * 0.82, w * 0.99);
      y  = rand(h * 0.18, h * 0.88);
      vx = rand(0.02, 0.16);    // slight outward drift
      vy = rand(-0.70, -0.30);  // rises up
    } else if (r < 0.8) {
      // 2) TOP EDGE: thin horizontal strip along the top of the cover
      x  = rand(w * 0.18, w * 0.88);
      y  = rand(h * 0.06, h * 0.16);
      vx = rand(-0.10, 0.10);
      vy = rand(-0.60, -0.24);
    } else {
      // 3) PLUME: above & to the right of the book
      //    This makes that cloud you drew on the sticky note
      x  = rand(w * 0.60, w * 0.98);
      y  = rand(h * -0.05, h * 0.45); // includes a bit above the top edge
      vx = rand(-0.06, 0.10);
      vy = rand(-0.45, -0.18);
    }

    sparks.push({
      x,
      y,
      vx,
      vy,
      r: rand(0.8, 2.2),
      a: rand(0.4, 0.9),
      life: rand(32, 70),
      t: 0,
      tw: rand(0.004, 0.012)
    });

    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);

    // *** Transparent clear — absolutely no fill panel ***
    ctx.clearRect(0, 0, w, h);

    // Spawn a few per frame
    const spawns = 3;
    for (let i = 0; i < spawns; i++) spawnOne();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Drift + gentle swirl
      s.x += s.vx + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.06;
      s.y += s.vy;

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;
      const aFinal = alpha * tw;

      if (aFinal <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      // Outer ember (cool blue glow)
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(118, 192, 255, ${aFinal})`;
      ctx.fill();

      // Hotter core
      if (Math.random() < 0.30) {
        ctx.beginPath();
        ctx.arc(
          s.x,
          s.y,
          Math.max(0.5, s.r * 0.45),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(200, 235, 255, ${aFinal * 0.7})`;
        ctx.fill();
      }

      // Kill once off-screen or out of life
      if (s.t >= s.life || s.y < -20 || s.x < -20 || s.x > w + 20) {
        sparks.splice(i, 1);
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    resize();
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

  // Click placeholder (for future open-book mode)
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  window.addEventListener(
    "resize",
    () => {
      if (running) resize();
    },
    { passive: true }
  );
})();