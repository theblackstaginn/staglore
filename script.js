/* =========================================================
   Stag Lore — Always-on embers + hover “breath”
   - Slow embers all the time
   - Hover/focus: more embers + book scales up
   - Canvas stays transparent (no black box)
   ========================================================= */

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  if (!anchor || !canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1;
  let rafId = 0;

  const sparks = [];
  const MAX = 90;

  const BASE = { spawn: 0.4, speed: 0.45, alphaBoost: 0.6 };
  const BOOST = { spawn: 2.2, speed: 1.0, alphaBoost: 1.15 };

  let target = { ...BASE };
  let current = { ...BASE };

  function resize() {
    // Tie ember canvas to its CSS box around the book
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
      // Right-page edge band
      x  = rand(w * 0.78, w * 0.98);
      y  = rand(h * 0.18, h * 0.92);
      vx = rand(0.01, 0.12);
      vy = rand(-0.70, -0.32);
    } else if (r < 0.8) {
      // Top edge band
      x  = rand(w * 0.16, w * 0.88);
      y  = rand(h * 0.02, h * 0.16);
      vx = rand(-0.10, 0.10);
      vy = rand(-0.60, -0.26);
    } else {
      // Plume above/right of the book
      x  = rand(w * 0.45, w * 0.98);
      y  = rand(h * -0.10, h * 0.40);
      vx = rand(-0.06, 0.10);
      vy = rand(-0.48, -0.20);
    }

    sparks.push({
      x, y,
      vx, vy,
      r: rand(0.8, 2.2),
      a: rand(0.35, 0.8),
      life: rand(38, 85),
      t: 0,
      tw: rand(0.004, 0.012)
    });

    if (sparks.length > MAX) sparks.shift();
  }

  function step() {
    rafId = requestAnimationFrame(step);

    // Ease current settings toward target (breathing intensity)
    const k = 0.05;
    current.spawn      += (target.spawn      - current.spawn)      * k;
    current.speed      += (target.speed      - current.speed)      * k;
    current.alphaBoost += (target.alphaBoost - current.alphaBoost) * k;

    ctx.clearRect(0, 0, w, h);

    // Fractional spawn
    const baseSpawns = current.spawn;
    const whole = Math.floor(baseSpawns);
    const extra = baseSpawns - whole;

    for (let i = 0; i < whole; i++) spawnOne();
    if (Math.random() < extra) spawnOne();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;

      const spd = current.speed;
      s.x += (s.vx * spd) +
             Math.sin((s.t * 0.08) + s.x * 0.01) * 0.06 * spd;
      s.y += (s.vy * spd);

      const p = s.t / s.life;
      const alpha = s.a * (1 - p);
      const tw = 0.65 + Math.sin(s.t * (10 * s.tw)) * 0.35;
      const aFinal = alpha * tw * current.alphaBoost;

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

      // Cull off-screen / dead
      if (s.t >= s.life || s.y < -40 || s.x < -40 || s.x > w + 40) {
        sparks.splice(i, 1);
      }
    }
  }

  function goBase() {
    target = { ...BASE };
    anchor.classList.remove("book-boosted");
  }

  function goBoost() {
    target = { ...BOOST };
    anchor.classList.add("book-boosted");
  }

  // Hover / focus → boost
  anchor.addEventListener("mouseenter", goBoost);
  anchor.addEventListener("mouseleave", goBase);
  anchor.addEventListener("focusin", goBoost);
  anchor.addEventListener("focusout", goBase);

  // Click placeholder (future open-book magic hook)
  anchor.addEventListener("click", () => {
    anchor.classList.add("clicked");
    setTimeout(() => anchor.classList.remove("clicked"), 240);
  });

  // Init
  resize();
  step();
  window.addEventListener("resize", resize, { passive: true });
})();