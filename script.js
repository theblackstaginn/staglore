(() => {
  const zone = document.querySelector(".book-zone");
  const book = document.getElementById("book");
  const embers = document.getElementById("embers");
  const reader = document.getElementById("reader");

  // --- State machine ---
  // idle -> hover(rotating) -> armed -> picking -> open
  let state = "idle";
  let rotateTimer = null;

  // Timing tuned to feel intentional, not lag
  const ROTATE_MS = 620;      // matches CSS transition
  const ARM_DELAY_MS = 120;   // tiny “ritual beat” after rotation completes
  const PICKUP_MS = 520;

  // -------------------------
  // Embers (lightweight canvas)
  // -------------------------
  const ctx = embers.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0;
  let particles = [];
  let raf = 0;
  let running = false;

  function resizeCanvas(){
    const rect = embers.getBoundingClientRect();
    W = Math.floor(rect.width * DPR);
    H = Math.floor(rect.height * DPR);
    embers.width = W;
    embers.height = H;
  }

  function spawn(){
    // spawn near the book’s approximate area (left-ish lower)
    const x = (W * 0.30) + (Math.random() * W * 0.18);
    const y = (H * 0.64) + (Math.random() * H * 0.14);

    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 0.18 * DPR,
      vy: (-0.55 - Math.random() * 0.55) * DPR,
      life: 1,
      r: (1.2 + Math.random() * 2.6) * DPR,
      heat: Math.random()
    });

    if (particles.length > 160) particles.splice(0, particles.length - 160);
  }

  function tick(){
    raf = requestAnimationFrame(tick);

    ctx.clearRect(0,0,W,H);

    // gentle spawns while hovering/armed/picking
    if (state === "hover" || state === "armed" || state === "picking") {
      for (let i=0;i<3;i++) spawn();
    }

    // draw
    for (let i = particles.length - 1; i >= 0; i--){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.995;
      p.vy *= 0.998;
      p.life -= 0.012;

      // flicker
      const a = Math.max(0, p.life);
      const g = 0.65 + Math.sin((1-a)*10 + p.heat*6) * 0.18;

      // ember color (warm)
      const r = Math.floor(255 * (0.80 + p.heat*0.20));
      const gch = Math.floor(165 * (0.55 + p.heat*0.35));
      const b = Math.floor(60 * (0.25 + p.heat*0.20));

      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${gch},${b},${a * g})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // tiny trailing smear
      ctx.fillStyle = `rgba(${r},${gch},${b},${a * 0.10})`;
      ctx.fillRect(p.x - p.r*0.6, p.y + p.r*0.4, p.r*1.2, p.r*0.6);

      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function startEmbers(){
    if (running) return;
    running = true;
    resizeCanvas();
    tick();
  }
  function stopEmbers(){
    running = false;
    cancelAnimationFrame(raf);
    ctx.clearRect(0,0,W,H);
    particles = [];
  }

  // -------------------------
  // Interaction (ritual timing)
  // -------------------------
  function setState(next){
    state = next;
  }

  function armAfterRotation(){
    clearTimeout(rotateTimer);
    rotateTimer = setTimeout(() => {
      if (state !== "hover") return;
      setState("armed");
      zone.classList.add("is-armed");
    }, ROTATE_MS + ARM_DELAY_MS);
  }

  function onEnter(){
    if (state === "open") return;

    zone.classList.add("is-hover");
    zone.classList.remove("is-armed","is-picking");
    setState("hover");

    startEmbers();
    armAfterRotation();
  }

  function onLeave(){
    if (state === "open") return;

    clearTimeout(rotateTimer);
    zone.classList.remove("is-hover","is-armed","is-picking");
    setState("idle");

    // let embers fade naturally for a breath
    setTimeout(() => {
      if (state === "idle") stopEmbers();
    }, 300);
  }

  function openReader(){
    reader.hidden = false;
    reader.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    setState("open");
  }

  function closeReader(){
    reader.hidden = true;
    reader.classList.remove("open");
    document.documentElement.style.overflow = "";
    zone.classList.remove("is-hover","is-armed","is-picking");
    setState("idle");
    stopEmbers();
  }

  function pickUp(){
    // pickup only after rotation (armed)
    if (state !== "armed") return;

    zone.classList.add("is-picking");
    setState("picking");

    setTimeout(() => {
      openReader();
    }, PICKUP_MS);
  }

  // Hover + focus for keyboard users
  zone.addEventListener("mouseenter", onEnter);
  zone.addEventListener("mouseleave", onLeave);
  book.addEventListener("focus", onEnter);
  book.addEventListener("blur", onLeave);

  // Click pickup
  book.addEventListener("click", () => {
    // If user clicks too early, we honor the ritual:
    // trigger hover tilt and arm, then pick up when armed.
    if (state === "idle") {
      onEnter();
      // after arm completes, pick up automatically (feels intentional)
      clearTimeout(rotateTimer);
      rotateTimer = setTimeout(() => {
        if (state === "hover") {
          setState("armed");
          zone.classList.add("is-armed");
        }
        pickUp();
      }, ROTATE_MS + ARM_DELAY_MS);
      return;
    }

    if (state === "hover") {
      // wait for the arm, then pick up
      clearTimeout(rotateTimer);
      rotateTimer = setTimeout(() => {
        if (state === "hover") {
          setState("armed");
          zone.classList.add("is-armed");
        }
        pickUp();
      }, ROTATE_MS + ARM_DELAY_MS);
      return;
    }

    pickUp();
  });

  // Reader close
  reader.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "1") closeReader();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state === "open") closeReader();
  });

  // Canvas sizing
  window.addEventListener("resize", () => {
    if (running) resizeCanvas();
  });
})();