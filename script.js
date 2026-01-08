/* =========================================================
   Stag Lore — Embers (right page edge + top edge)
   - Canvas sized to the book anchor
   - Transparent background (no black rectangle)
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
    // Two “emitters”:
    //  - right page edge (main)
    //  - top edge (occasional)
    const region = Math.random();

    let x, y, vx, vy;

    if (region < 0.75) {
      // 🔥 Right page edge: narrow vertical band on the right side
      x  = rand(w * 0.72, w * 0.88);
      y  = rand(h * 0.32, h * 0.78);
      vx = rand(-0.4, 0.05);   // drift slightly left/outward
      vy = rand(-0.85, -0.35); // rise
    } else {
      // 🔥 Top edge: thin band across upper part of the book
      x  = rand(w * 0.40, w * 0.82);
      y  = rand(h * 0.16, h * 0.30);
      vx = rand(-0.15, 0.15);
      vy = rand(-0.75, -0.25);
    }

    const s = {
      x, y,
      vx, vy,
      r: rand(0.8, 2.2),
      a: rand(0.35, 0.78),
      life: rand(28, 64),
      t: 0,
      tw: rand(0.004, 0.012) // twinkle
    };

    sparks.push(s);
    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);

    // HARD CLEAR: keep canvas transparent, no accumulating black box
    ctx.clearRect(0, 0, w, h);

    // Spawn a couple per frame
    const spawns = 2;
    for (let i = 0; i < spawns; i++) spawn();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Drift + gentle swirl
      s.x += s.vx + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.08;
      s.y += s.vy;

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);

      // Twinkle brightness
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;

      // Draw ember
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      // Warm ember palette
      ctx.fillStyle = `rgba(255, 165, 80, ${alpha * tw})`;
      ctx.fill();

      // Occasional hotter core
      if (Math.random() < 0.22) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.4, s.r * 0.42), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 170, ${alpha * 0.65})`;
        ctx.fill();
      }

      // Cull dead sparks
      if (s.t >= s.life || s.y < -10 || s.x < -20 || s.x > w + 20) {
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

  // Click placeholder (until open-book mode exists)
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