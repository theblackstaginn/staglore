/* =========================================================
   Stag Lore — Embers (Phase 1, grid-aligned book)
   - Only runs while hovered / focused
   - Canvas sized to the .embers element (upper-right of book)
   ========================================================= */

(() => {
  const anchor  = document.getElementById("bookAnchor");
  const canvas  = document.getElementById("embers");
  const ctx     = canvas.getContext("2d", { alpha: true });

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

    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // -----------------------
  // Ember spawning zones
  // -----------------------
  // Uses three bands:
  //  - Corner hotspot (top-right)
  //  - Full right edge
  //  - Full top edge
  function spawn() {
    const r = Math.random();
    let x, y, vx, vy;

    if (r < 0.25) {
      // 25% — hot CORNER where top + right meet
      x  = rand(w * 0.70, w * 0.98);  // near right edge
      y  = rand(h * 0.00, h * 0.25);  // top zone
      vx = rand(-0.20, 0.08);
      vy = rand(-0.80, -0.40);
    } else if (r < 0.65) {
      // 40% — FULL RIGHT EDGE band
      x  = rand(w * 0.80, w * 1.02);  // hug right edge, slight overhang
      y  = rand(h * 0.00, h * 1.00);  // entire height
      vx = rand(-0.25, 0.02);
      vy = rand(-0.60, -0.25);
    } else {
      // 35% — FULL TOP EDGE band
      x  = rand(w * 0.00, w * 1.00);      // entire width
      y  = rand(h * -0.02, h * 0.22);     // thin strip hugging the top
      vx = rand(-0.22, 0.22);
      vy = rand(-0.90, -0.40);
    }

    sparks.push({
      x,
      y,
      vx,
      vy,
      r: rand(0.9, 1.8),
      a: rand(0.45, 0.9),
      life: rand(32, 72),
      t: 0,
      tw: rand(0.004, 0.010) // twinkle rate
    });

    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);

    // Fade the previous frame slightly to create trails
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);

    // Spawn a couple per frame
    const spawns = 2;
    for (let i = 0; i < spawns; i++) spawn();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Motion: upward drift + gentle sideways sway
      s.x += s.vx + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.08;
      s.y += s.vy;

      const p = s.t / s.life;
      const alpha = s.a * (1 - p); // fade out over life

      // Twinkle brightness
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;

      // Main ember
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(185, 220, 255, ${alpha * tw})`; // cool blue-white ember
      ctx.fill();

      // Hot core
      if (Math.random() < 0.22) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.4, s.r * 0.42), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.70})`;
        ctx.fill();
      }

      // Cull dead / off-screen
      if (s.t >= s.life || s.y < -20 || s.x < -40 || s.x > w + 40) {
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

  // Click placeholder (for now)
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  // Start / stop on hover + keyboard focus
  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  // Resize safety
  window.addEventListener(
    "resize",
    () => {
      if (running) resize();
    },
    { passive: true }
  );
})();