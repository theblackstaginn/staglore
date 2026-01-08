/* =========================================================
   Stag Lore — Embers (Phase 1) (FIXED)
   - Only runs while hovered/focused
   - Canvas is only VISIBLE when JS adds .embers-on
   - No full-canvas dark fade (prevents rectangle “sheet” effect)
   ========================================================= */

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 56;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
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
    if (!running) return;
    raf = requestAnimationFrame(step);

    // Fully clear each frame (no rectangle tint)
    ctx.clearRect(0, 0, w, h);

    // Spawn a few per frame
    for (let i = 0; i < 2; i++) spawn();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Drift + gentle swirl
      s.x += s.vx + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.08;
      s.y += s.vy;

      // Fade out
      const p = s.t / s.life;
      const alpha = s.a * (1 - p);

      // Twinkle brightness
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;

      // Ember
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,165,80,${alpha * tw})`;
      ctx.fill();

      // Hot core sometimes
      if (Math.random() < 0.22) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.4, s.r * 0.42), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,170,${alpha * 0.65})`;
        ctx.fill();
      }

      // Cull
      if (s.t >= s.life || s.y < -10 || s.x < -20 || s.x > w + 20) {
        sparks.splice(i, 1);
      }
    }
  }

  function start() {
    if (running) return;
    running = true;

    anchor.classList.add("embers-on");

    resize();
    ctx.clearRect(0, 0, w, h);
    sparks.length = 0;

    cancelAnimationFrame(raf);
    raf = 0;
    step();
  }

  function stop() {
    running = false;

    anchor.classList.remove("embers-on");

    cancelAnimationFrame(raf);
    raf = 0;

    // Clear after a beat so it doesn’t “pop”
    setTimeout(() => {
      if (!running) ctx.clearRect(0, 0, w, h);
    }, 120);
  }

  // Click placeholder (no open-book mode yet)
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  // Start/stop on hover + keyboard focus
  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  // Resize safety
  window.addEventListener("resize", () => {
    if (running) resize();
  }, { passive: true });
})();