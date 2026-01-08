(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 80;

  // === FIXED-SIZE SPAWN BOX INSIDE THE EXPANDED CANVAS ===
  // This prevents the 7-shape from scaling when the canvas is enlarged.
  const spawnBox = {
    x: 0.20, // left offset (fraction of canvas width)
    y: 0.00, // top offset
    w: 0.60, // width fraction of canvas for the 7-shape
    h: 0.50  // height fraction of canvas for the 7-shape
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    let rect = canvas.getBoundingClientRect();

    // fallback if zero (can happen during init or hidden layout)
    if (rect.width === 0 || rect.height === 0) {
      rect = {
        width: canvas.offsetWidth || anchor.offsetWidth,
        height: canvas.offsetHeight || anchor.offsetHeight
      };
    }

    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));

    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // === EMBER SPAWN LOGIC (SLANTED 7-SHAPE) ===
  function spawnOne() {
    const t = Math.random();
    let nx, ny;

    if (Math.random() < 0.6) {
      // Top bar of the 7
      nx = 0.10 + 0.80 * t;
      ny = 0.15;
    } else {
      // Slanted leg inward
      const t2 = t;
      nx = 0.90 + (0.65 - 0.90) * t2;
      ny = 0.15 + (0.70 - 0.15) * t2;
    }

    // Mild jitter for realism
    nx += (Math.random() - 0.5) * 0.04;
    ny += (Math.random() - 0.5) * 0.04;

    // Clamp normalized UV
    nx = Math.min(0.98, Math.max(0.02, nx));
    ny = Math.min(0.98, Math.max(0.02, ny));

    // === MAP NORMALIZED SHAPE INTO THE FIXED SPAWN BOX ===
    const x = (spawnBox.x * w) + (nx * spawnBox.w * w);
    const y = (spawnBox.y * h) + (ny * spawnBox.h * h);

    // Ember motion
    const vx = (Math.random() - 0.5) * 0.15;
    const vy = rand(-0.65, -0.40);

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
    ctx.clearRect(0, 0, w, h);

    // spawn a few per frame
    for (let i = 0; i < 3; i++) spawnOne();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // drift + swirl
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

      // outer ember
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(118, 192, 255, ${aFinal})`;
      ctx.fill();

      // hot core
      if (Math.random() < 0.30) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.5, s.r * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 235, 255, ${aFinal * 0.7})`;
        ctx.fill();
      }

      // bounds kill
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

  // click placeholder
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  // hover/focus triggers
  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  window.addEventListener("resize", () => {
    if (running) resize();
  });
})();