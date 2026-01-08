/* =========================================================
   Stag Lore — Desk Grimoire (CLOSED BOOK ONLY)
   - Embers on hover/focus
   - “Armed” state after intentional hover beat
   - Click triggers a pickup micro-lift (no reader yet)
   ========================================================= */

const bookBtn = document.getElementById("bookBtn");
const embers = document.getElementById("embers");

let emberTimer = null;
let armTimer = null;

const HOVER_BEAT_MS = 520;  // intentional pause so it never looks like lag
const PICKUP_BEAT_MS = 520; // pickup motion length

function spawnEmber(){
  const e = document.createElement("span");
  e.className = "ember";

  // Spawn region around the book’s lower half
  const x = 18 + Math.random() * 64; // %
  const y = 52 + Math.random() * 30; // %

  const dx = (Math.random() * 56 - 28).toFixed(0) + "px";
  const lift = (70 + Math.random() * 110).toFixed(0) + "px";
  const dur = (1200 + Math.random() * 900).toFixed(0) + "ms";

  e.style.left = x + "%";
  e.style.top = y + "%";
  e.style.setProperty("--dx", dx);
  e.style.setProperty("--lift", lift);
  e.style.setProperty("--dur", dur);
  e.style.setProperty("--x", (Math.random() * 10 - 5).toFixed(0) + "px");
  e.style.setProperty("--y", (Math.random() * 10 - 5).toFixed(0) + "px");

  embers.appendChild(e);
  window.setTimeout(() => e.remove(), parseInt(dur, 10) + 200);
}

function startEmbers(){
  if (emberTimer) return;
  emberTimer = window.setInterval(() => {
    spawnEmber();
    if (Math.random() > 0.65) spawnEmber();
  }, 170);
}

function stopEmbers(){
  if (!emberTimer) return;
  window.clearInterval(emberTimer);
  emberTimer = null;
}

function armAfterBeat(){
  clearTimeout(armTimer);
  bookBtn.classList.remove("armed");
  armTimer = window.setTimeout(() => {
    bookBtn.classList.add("armed");
  }, HOVER_BEAT_MS);
}

function disarm(){
  clearTimeout(armTimer);
  bookBtn.classList.remove("armed");
}

bookBtn.addEventListener("mouseenter", () => {
  startEmbers();
  armAfterBeat();
});
bookBtn.addEventListener("mouseleave", () => {
  stopEmbers();
  disarm();
  bookBtn.classList.remove("picking");
});
bookBtn.addEventListener("focus", () => {
  startEmbers();
  armAfterBeat();
});
bookBtn.addEventListener("blur", () => {
  stopEmbers();
  disarm();
  bookBtn.classList.remove("picking");
});

bookBtn.addEventListener("click", (e) => {
  e.preventDefault();

  // If they click before armed, we still honor the ritual beat:
  // arm immediately, then run pickup.
  bookBtn.classList.add("armed");

  bookBtn.classList.add("picking");
  window.setTimeout(() => {
    bookBtn.classList.remove("picking");
  }, PICKUP_BEAT_MS);
});