(() => {
  const anchor = document.getElementById("bookAnchor");
  const canvas = document.getElementById("embers");
  const ctx = canvas.getContext("2d");
  const bgImg = document.getElementById("bgImg");

  // === LOCKED MEASUREMENTS (FROM PHOTOPEA) ===
  const MAP = {
    IMG_W: 1536,
    IMG_H: 1024,
    X: 1302,
    Y: 863,
    W: 411,
    H: 610
  };

  function snapBook() {
    if (!bgImg.complete) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Same math as object-fit: cover
    const scale = Math.max(vw / MAP.IMG_W, vh / MAP.IMG_H);

    const scaledW = MAP.IMG_W * scale;
    const scaledH = MAP.IMG_H * scale;

    const offsetX = (vw - scaledW) / 2;
    const offsetY = (vh - scaledH) / 2;

    anchor.style.left = `${offsetX + MAP.X * scale}px`;
    anchor.style.top  = `${offsetY + MAP.Y * scale}px`;
    anchor.style.width  = `${MAP.W * scale}px`;
    anchor.style.height = `${MAP.H * scale}px`;

    resizeCanvas();
  }

  function resizeCanvas() {
    const rect = anchor.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // === EMBERS (unchanged logic, just wired correctly) ===
  let running = false;
  let raf = 0;
  const sparks = [];

  function rand(a,b){ return Math.random()*(b-a)+a; }

  function spawn() {
    sparks.push({
      x: rand(canvas.width*0.35, canvas.width*0.65),
      y: rand(canvas.height*0.6, canvas.height*0.8),
      vx: rand(-0.15,0.15),
      vy: rand(-0.9,-0.4),
      r: rand(0.8,2.2),
      life: rand(30,60),
      t: 0
    });
    if (sparks.length > 60) sparks.shift();
  }

  function step() {
    raf = requestAnimationFrame(step);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    spawn();
    sparks.forEach(s => {
      s.t++;
      s.x += s.vx;
      s.y += s.vy;

      const a = 1 - s.t / s.life;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,170,90,${a})`;
      ctx.fill();
    });

    for (let i=sparks.length-1;i>=0;i--) {
      if (sparks[i].t > sparks[i].life) sparks.splice(i,1);
    }
  }

  function start() {
    if (running) return;
    running = true;
    sparks.length = 0;
    step();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  // Events
  anchor.addEventListener("mouseenter", start);
  anchor.addEventListener("mouseleave", stop);
  anchor.addEventListener("focusin", start);
  anchor.addEventListener("focusout", stop);

  window.addEventListener("resize", snapBook, { passive:true });
  bgImg.addEventListener("load", snapBook);

  snapBook();
})();