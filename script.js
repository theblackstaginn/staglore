/* =========================================================
   Stag Lore — Realistic violet embers at page seam
   - Emits from right page edge + top bevel
   - No black box (canvas stays transparent)
   ========================================================= */

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  if (!anchor || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 60;

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

  function spawn(){
  const r = Math.random();
  let x, y, vx, vy;

  if(r < 0.55){
    // Corner hotspot (true NE corner of pages)
    x  = rand(w * 0.70, w * 0.90);
    y  = rand(h * 0.00, h * 0.20);
    vx = rand(-0.15, 0.10);
    vy = rand(-0.70, -0.35);
  }
  else if(r < 0.85){
    // Right sidebar (taller)
    x  = rand(w * 0.80, w * 0.95);
    y  = rand(h * 0.05, h * 0.85);
    vx = rand(-0.20, 0.02);
    vy = rand(-0.55, -0.25);
  }
  else {
    // Top bevel (horizontal)
    x  = rand(w * 0.35, w * 0.95);
    y  = rand(h * 0.00, h * 0.15);
    vx = rand(-0.20, 0.20);
    vy = rand(-0.80, -0.35);
  }

  sparks.push({
    x, y, vx, vy,
    r: rand(0.9, 1.8),
    a: rand(0.45, 0.9),
    life: rand(32, 72),
    t: 0,
    tw: rand(0.004, 0.010)
  });

  if(sparks.length > MAX) sparks.shift();
}

  function step() {
    raf = requestAnimationFrame(step);

    // IMPORTANT: no black fill — keep canvas transparent
    ctx.clearRect(0, 0, w, h);

    // Spawn a couple per frame
    for (let i = 0; i < 2; i++) spawn();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Slight swirl + upward drift
      s.x += s.vx + Math.sin((s.t * 0.07) + s.x * 0.01) * 0.05;
      s.y += s.vy + 0.01; // tiny "gravity" so they arc

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);     // fades over life
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;

      if (alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      // ===== Realistic violet ember (core + halo) =====
      const coreAlpha = alpha * tw;
      const haloAlpha = alpha * 0.35;

      const radius = s.r * 3;
      const g = ctx.createRadialGradient(
        s.x, s.y, 0,
        s.x, s.y, radius
      );

      // center: near-white violet
      g.addColorStop(0.0, `rgba(237, 230, 255, ${coreAlpha})`);
      // mid halo: soft violet
      g.addColorStop(0.4, `rgba(178, 158, 255, ${haloAlpha})`);
      // edge: fully transparent
      g.addColorStop(1.0, `rgba(20, 10, 40, 0)`);

      ctx.fillStyle = g;
      ctx.fillRect(s.x - radius, s.y - radius, radius * 2, radius * 2);

      // Kill if off-canvas or past life
      if (s.t >= s.life || s.y < -20 || s.x < -30 || s.x > w + 30) {
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

  // Start / stop on hover + focus
  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  window.addEventListener(
    "resize",
    () => { if (running) resize(); },
    { passive: true }
  );
})();