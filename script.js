// --- Mobile viewport fix (sets --vh so 100vh is accurate) ---
(function () {
  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVh();
  window.addEventListener('resize', setVh);
})();

(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;
  let running = false;
  let raf = 0;

  const sparks = [];
  const MAX = 80;

  // ================================
  // FIXED SPAWN REGIONS IN CANVAS
  // ================================

  // Top lip band – now extended farther right
  const spawnTopBox = {
    x: 0.30, // was 0.34; move a bit left
    y: 0.20, // vertical position of top band (sitting on book top)
    w: 0.44, // was 0.36; wider so it reaches top-right corner
    h: 0.08  // thin vertical band
  };

  // Vertical band that hugs the right edge of the book
  const spawnRightBox = {
    x: 0.60,
    y: 0.14,
    w: 0.16,
    h: 0.55
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

  // =======================================
  // EMBER SPAWN LOGIC — TWO SEPARATE PATHS
  // =======================================
  function spawnOne() {
    const useTopPath = Math.random() < 0.6; // 60% top, 40% right

    let x, y;

    if (useTopPath) {
      // --------- TOP PATH ----------
      // Horizontal band across the top lip (inside spawnTopBox)

      const t = Math.random(); // 0 → 1 along the band
      let nx = t;
      let ny = 0.5;            // middle of band vertically

      // Light jitter so it's not a perfect line
      nx += (Math.random() - 0.5) * 0.10; // a bit narrower horizontally
      ny += (Math.random() - 0.5) * 0.12; // tightened vertical spread

      // Clamp within [0,1]
      nx = Math.min(0.98, Math.max(0.02, nx));
      ny = Math.min(0.98, Math.max(0.02, ny));

      x = (spawnTopBox.x + nx * spawnTopBox.w) * w;
      y = (spawnTopBox.y + ny * spawnTopBox.h) * h;

    } else {
      // --------- RIGHT PATH ----------
      // Mostly vertical band down the right edge (inside spawnRightBox)

      const t = Math.random(); // 0 → 1 down the band
      let nx = 0.5;            // center horizontally in right band
      let ny = t;              // 0 → 1 from top to bottom

      // Slight inward lean + jitter
      nx += (Math.random() - 0.5) * 0.20;
      ny += (Math.random() - 0.5) * 0.10;

      nx = Math.min(0.98, Math.max(0.02, nx));
      ny = Math.min(0.98, Math.max(0.02, ny));

      x = (spawnRightBox.x + nx * spawnRightBox.w) * w;
      y = (spawnRightBox.y + ny * spawnRightBox.h) * h;
    }

    // Ember motion: same for both paths
    const vx = (Math.random() - 0.5) * 0.15; // slight sideways drift
    const vy = rand(-0.65, -0.40);          // rise up

    sparks.push({
      x,
      y,
      vx,
      vy,
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