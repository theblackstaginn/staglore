/* =========================================================
   Stag Lore — Embers (top & right edge)
   - Canvas sized to .embers box
   - Only runs on hover / focus
   ========================================================= */

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 70; // a few more for a denser veil

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
    // Inverted "L" along right edge + top edge of this canvas box
    let x, y;

    if (Math.random() < 0.6) {
      // Right vertical band (pages)
      x = rand(w * 0.72, w * 0.96);
      y = rand(h * 0.18, h * 0.98);
    } else {
      // Top band (upper book edge)
      x = rand(w * 0.10, w * 0.96);
      y = rand(h * 0.05, h * 0.30);
    }

    const s = {
      x,
      y,
      vx: rand(-0.10, 0.22),      // small horizontal drift
      vy: rand(-0.85, -0.25),     // rise upward
      r: rand(0.8, 2.4),
      a: rand(0.35, 0.80),
      life: rand(32, 70),
      t: 0,
      tw: rand(0.004, 0.012)
    };

    sparks.push(s);
    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);

    // Fade previous frame — very light so we keep trails, not a panel
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, w, h);

    // Spawn a couple per frame
    const spawns = 2;
    for (let i = 0; i < spawns; i++) spawn();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Motion: slight curl as they rise
      s.x += s.vx + Math.sin((s.t * 0.07) + s.x * 0.01) * 0.12;
      s.y += s.vy;

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);

      // Twinkle factor
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;

      const finalAlpha = alpha * tw;
      if (finalAlpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      // Outer ember
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(134, 202, 255, ${finalAlpha})`; // outer blue
      ctx.fill();

      // Hot inner core
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.4, s.r * 0.45), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214, 242, 255, ${finalAlpha * 0.80})`;
      ctx.fill();

      // Remove when out of zone
      if (
        s.t >= s.life ||
        s.y < -15 ||
        s.x < -20 ||
        s.x > w + 20
      ) {
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

    // gentle clear so it doesn't pop off
    setTimeout(() => {
      if (!running) ctx.clearRect(0, 0, w, h);
    }, 140);
  }

  // Click placeholder for future open-book mode
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
    () => { if (running) resize(); },
    { passive: true }
  );
})();