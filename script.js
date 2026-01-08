function spawnOne() {
  const t = Math.random();

  let nx, ny;

  if (Math.random() < 0.6) {
    // TOP BAR of the 7
    nx = 0.10 + 0.80 * t; // 10% → 90%
    ny = 0.15;            // slight down from top
  } else {
    // SLANTED RIGHT LEG of the 7 (leans INWARD)
    // from (0.90, 0.15) down to (0.65, 0.70)
    const t2 = t;
    nx = 0.90 + (0.65 - 0.90) * t2; // 0.90 → 0.65
    ny = 0.15 + (0.70 - 0.15) * t2; // 0.15 → 0.70
  }

  // tiny jitter so it's not ruler-perfect
  nx += (Math.random() - 0.5) * 0.04;
  ny += (Math.random() - 0.5) * 0.04;

  // clamp to book area
  nx = Math.min(0.98, Math.max(0.02, nx));
  ny = Math.min(0.98, Math.max(0.02, ny));

  // convert to px inside canvas
  const x = nx * w;
  const y = ny * h;

  // ember motion
  const vx = (Math.random() - 0.5) * 0.15;
  const vy = rand(-0.65, -0.40); // rises up

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