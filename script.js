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
  // choose segment: 0 = top bar, 1 = right leg
  const seg = Math.random() < 0.6 ? 0 : 1;
  const t = Math.random();

  let nx, ny;

  if (seg === 0) {
    // top bar of 7 (left→right)
    nx = 0.15 + (0.80 * t); // 15% → 95%
    ny = 0.18;              // ~18% down from top
  } else {
    // right leg of 7 (downward)
    nx = 0.78;              // fixed near right edge
    ny = 0.18 + (0.75 * t); // 18% → 93%
  }

  // jitter so it doesn’t look plotted
  nx += (Math.random() - 0.5) * 0.05; // ±5% width
  ny += (Math.random() - 0.5) * 0.05; // ±5% height

  // clamp to avoid bleeding off the book on weird aspect ratios
  nx = Math.min(0.98, Math.max(0.02, nx));
  ny = Math.min(0.98, Math.max(0.02, ny));

  // convert book-local → canvas px
  const x = nx * w;
  const y = ny * h;

  // upward drift (embers rise)
  const vx = (Math.random() - 0.5) * 0.20;    // slight lateral wander
  const vy = -rand(0.55, 0.85);               // rise speed

  sparks.push({
    x, y,
    vx, vy,
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

    // Clear without any background — canvas stays transparent
    ctx.clearRect(0, 0, w, h);

    // Spawn a few embers each frame
    const spawns = 3;
    for (let i = 0; i < spawns; i++) spawnOne();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Drift + subtle swirl
      s.x += s.vx + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.06;
      s.y += s.vy;

      const p = s.t / s.life;
      const alphaBase = s.a * (1 - p);

      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;
      const aFinal = alphaBase * tw;

      if (aFinal <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      // Outer ember (cooler blue glow)
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(118, 192, 255, ${aFinal})`;
      ctx.fill();

      // Occasional hotter core
      if (Math.random() < 0.30) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.5, s.r * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 235, 255, ${aFinal * 0.7})`;
        ctx.fill();
      }

      // Kill once off-screen or out of life
      if (s.t >= s.life || s.y < -12 || s.x < -12 || s.x > w + 12) {
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

  // Click placeholder (for future open-book magic)
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  window.addEventListener("resize", () => {
    if (running) resize();
  });
})();