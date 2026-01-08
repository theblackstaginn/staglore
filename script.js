(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 80;

  // canvas-space region where sparks exist, fixed proportions
  const spawnBox = {
    x: 0.20,  // 20% from left of canvas
    y: 0.00,  // top
    w: 0.60,  // 60% width slice (book area)
    h: 0.50   // 50% height slice (book area)
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    let rect = canvas.getBoundingClientRect();
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

  // =============================
  // TOP + RIGHT SPAWN PATH SPLIT
  // =============================
  function spawnOne() {
    const pick = Math.random();
    const t = Math.random();
    let nx, ny;

    if (pick < 0.65) {
      // ========== TOP BAR ==========
      // old: ~0.70 -> ~0.85
      // new: ~0.65 -> ~0.96 (reaches book's top-right corner)
      nx = 0.65 + (0.96 - 0.65) * t; 
      ny = 0.17;  // just below canvas-top
    } else {
      // ========== RIGHT LEG ==========
      const t2 = t;
      nx = 0.90 + (0.84 - 0.90) * t2; // slight inward lean
      ny = 0.15 + (0.80 - 0.15) * t2; // vertical descent
    }

    // jitter reduced so endpoint stays crisp on the top-right
    nx += (Math.random() - 0.5) * 0.008;
    ny += (Math.random() - 0.5) * 0.012;

    // clamp normalized UV in shape space
    nx = Math.min(0.98, Math.max(0.02, nx));
    ny = Math.min(0.98, Math.max(0.02, ny));

    // map into canvas pixels via spawnBox
    const x = (spawnBox.x * w) + (nx * spawnBox.w * w);
    const y = (spawnBox.y * h) + (ny * spawnBox.h * h);

    // motion + appearance
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
    for (let i = 0; i < 3; i++) spawnOne();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

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

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(118,192,255,${aFinal})`;
      ctx.fill();

      if (Math.random() < 0.30) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.5, s.r * 0.45), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,235,255,${aFinal * 0.7})`;
        ctx.fill();
      }

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