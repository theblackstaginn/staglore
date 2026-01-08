/* =========================================================
   Stag Lore — Constant Ember Hum + Hover Surge
   - Canvas stays transparent (no black panel)
   - Always-on slow embers around top + right side
   - Hover: book "breathes in" (CSS) and
     embers get faster, denser, brighter
   ========================================================= */

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  if (!anchor || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let raf = 0;

  const sparks = [];
  const MAX = 90;

  // Base + boosted “modes”
  const BASE = {
    spawn: 0.5,   // ~0–1 sparks per frame
    speed: 0.45,  // slower drift
    alphaBoost: 0.6
  };

  const BOOST = {
    spawn: 2.4,   // multiple sparks per frame
    speed: 1.0,
    alphaBoost: 1.1
  };

  let target = {
    spawn: BASE.spawn,
    speed: BASE.speed,
    alphaBoost: BASE.alphaBoost
  };

  let current = {
    spawn: BASE.spawn,
    speed: BASE.speed,
    alphaBoost: BASE.alphaBoost
  };

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
    let x, y, vx, vy;

    if (r < 0.5) {
      // RIGHT EDGE band
      x  = rand(w * 0.82, w * 0.99);
      y  = rand(h * 0.18, h * 0.88);
      vx = rand(0.02, 0.16);
      vy = rand(-0.70, -0.30);
    } else if (r < 0.8) {
      // TOP EDGE band
      x  = rand(w * 0.18, w * 0.88);
      y  = rand(h * 0.06, h * 0.16);
      vx = rand(-0.10, 0.10);
      vy = rand(-0.60, -0.24);
    } else {
      // PLUME above / to the right
      x  = rand(w * 0.60, w * 0.98);
      y  = rand(h * -0.05, h * 0.45);
      vx = rand(-0.06, 0.10);
      vy = rand(-0.45, -0.18);
    }

    sparks.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: rand(0.8, 2.1),
      a: rand(0.35, 0.8),
      life: rand(36, 80),
      t: 0,
      tw: rand(0.004, 0.012)
    });

    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);

    // Smoothly lerp current mode toward target (breathing)
    const k = 0.05;
    current.spawn      += (target.spawn      - current.spawn)      * k;
    current.speed      += (target.speed      - current.speed)      * k;
    current.alphaBoost += (target.alphaBoost - current.alphaBoost) * k;

    // Transparent clear — no box
    ctx.clearRect(0, 0, w, h);

    // Spawn based on current.spawn (can be fractional)
    const baseSpawns = current.spawn;
    const whole = Math.floor(baseSpawns);
    const extra = baseSpawns - whole;

    for (let i = 0; i < whole; i++) spawnOne();
    if (Math.random() < extra) spawnOne();

    // Update + draw
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      // Apply speed factor
      const spd = current.speed;

      s.x += (s.vx * spd) + Math.sin((s.t * 0.08) + s.x * 0.01) * 0.06 * spd;
      s.y += (s.vy * spd);

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;
      const aFinal = alpha * tw * current.alphaBoost;

      if (aFinal <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      // Outer ember (cool blue)
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(118, 192, 255, " + aFinal + ")";
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
        ctx.fillStyle = "rgba(200, 235, 255, " + (aFinal * 0.7) + ")";
        ctx.fill();
      }

      if (s.t >= s.life || s.y < -30 || s.x < -30 || s.x > w + 30) {
        sparks.splice(i, 1);
      }
    }
  }

  function goBase() {
    target.spawn      = BASE.spawn;
    target.speed      = BASE.speed;
    target.alphaBoost = BASE.alphaBoost;
    anchor.classList.remove("book-boosted");
  }

  function goBoost() {
    target.spawn      = BOOST.spawn;
    target.speed      = BOOST.speed;
    target.alphaBoost = BOOST.alphaBoost;
    anchor.classList.add("book-boosted");
  }

  // Hover / focus → boost
  anchor.addEventListener("mouseenter", goBoost);
  anchor.addEventListener("mouseleave", goBase);
  anchor.addEventListener("focusin", goBoost);
  anchor.addEventListener("focusout", goBase);

  // Click placeholder for future open-book
  anchor.addEventListener("click", function () {
    anchor.classList.add("clicked");
    setTimeout(function () {
      anchor.classList.remove("clicked");
    }, 240);
  });

  // Init
  resize();
  step();

  window.addEventListener("resize", function () {
    resize();
  }, { passive: true });
})();