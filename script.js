function spawn() {
  const r = Math.random();
  let x, y, vx, vy;

  if (r < 0.25) {
    // 25% — hot corner where top + right meet
    x  = rand(w * 0.70, w * 0.98);  // near right edge
    y  = rand(h * 0.00, h * 0.25);  // very top zone
    vx = rand(-0.20, 0.08);
    vy = rand(-0.80, -0.40);
  } else if (r < 0.65) {
    // 40% — FULL right side band
    x  = rand(w * 0.80, w * 1.02);  // hug the right edge, even slightly beyond
    y  = rand(h * 0.00, h * 1.00);  // entire height of the canvas
    vx = rand(-0.25, 0.02);
    vy = rand(-0.60, -0.25);
  } else {
    // 35% — FULL top edge band
    x  = rand(w * 0.00, w * 1.00);  // entire top width of the canvas
    y  = rand(h * -0.02, h * 0.22); // thin strip hugging the top
    vx = rand(-0.22, 0.22);
    vy = rand(-0.90, -0.40);
  }

  sparks.push({
    x,
    y,
    vx,
    vy,
    r: rand(0.9, 1.8),
    a: rand(0.45, 0.9),
    life: rand(32, 72),
    t: 0,
    tw: rand(0.004, 0.010)
  });

  if (sparks.length > MAX) sparks.shift();
}