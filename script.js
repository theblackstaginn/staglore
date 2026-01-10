// scene.js

// --------------
// 1. Layout config
// --------------
// All positions are % of scene box (0–100). Easy to tweak.
// Desktop and mobile can diverge if you need tighter tuning later.

const BUTTON_LAYOUT = {
  desktop: {
    book:  { x: 50, y: 57, size: 18 }, // main stag book on stand
    skull: { x: 80, y: 59, size: 13 }, // skull on right
    scroll:{ x: 18, y: 60, size: 15 }, // scroll/open book cluster left
    beaker:{ x: 69, y: 44, size: 11 }  // bottle cluster behind skull
  },
  mobile: {
    // start same as desktop; tweak later as needed
    book:  { x: 50, y: 57, size: 20 },
    skull: { x: 80, y: 60, size: 15 },
    scroll:{ x: 18, y: 62, size: 17 },
    beaker:{ x: 69, y: 45, size: 13 }
  }
};

function isMobileLayout() {
  return window.matchMedia("(max-width: 768px)").matches;
}

// --------------
// 2. Apply layout to buttons
// --------------

function applyButtonLayout() {
  const mode = isMobileLayout() ? "mobile" : "desktop";
  const config = BUTTON_LAYOUT[mode];

  const map = {
    book:  document.getElementById("btn-book"),
    skull: document.getElementById("btn-skull"),
    scroll:document.getElementById("btn-scroll"),
    beaker:document.getElementById("btn-beaker")
  };

  Object.entries(config).forEach(([key, cfg]) => {
    const el = map[key];
    if (!el) return;
    el.style.setProperty("--x", cfg.x + "%");
    el.style.setProperty("--y", cfg.y + "%");
    el.style.setProperty("--size", cfg.size + "%");
  });
}

// adjust layout on load + resize
window.addEventListener("load", () => {
  // swap background for mobile
  const bg = document.getElementById("scene-bg");
  if (isMobileLayout()) {
    bg.src = "./lore-assets/stag-study-mobile.png";
  }

  applyButtonLayout();
});

window.addEventListener("resize", () => {
  applyButtonLayout();
});

// --------------
// 3. Book modal wiring
// --------------

const bookButton   = document.getElementById("btn-book");
const bookModal    = document.getElementById("book-modal");
const bookCloseBtn = document.getElementById("book-modal-close");
const backdrop     = document.querySelector(".book-modal-backdrop");

// simple demo content; you will replace with real lore later
const pageLeft  = document.getElementById("page-left");
const pageRight = document.getElementById("page-right");

pageLeft.textContent = `
In the dim light of the Stag King's study, every page carries a cost.
Some debts are paid in coin. Others are paid in memory.
`;

pageRight.textContent = `
Those who open this book are bound to remember what they read.
The ink is older than the kingdom, and it does not forgive the idle.
`;

// open / close helpers
function openBookModal() {
  bookModal.classList.add("is-open");
  bookModal.setAttribute("aria-hidden", "false");
}

function closeBookModal() {
  bookModal.classList.remove("is-open");
  bookModal.setAttribute("aria-hidden", "true");
}

if (bookButton) {
  bookButton.addEventListener("click", openBookModal);
}

[bookCloseBtn, backdrop].forEach(el => {
  if (!el) return;
  el.addEventListener("click", closeBookModal);
});

// --------------
// 4. Other buttons: stubs for now
// --------------
// These are separated so you can easily swap behavior later.

const skullBtn  = document.getElementById("btn-skull");
const scrollBtn = document.getElementById("btn-scroll");
const beakerBtn = document.getElementById("btn-beaker");

if (skullBtn) {
  skullBtn.addEventListener("click", () => {
    console.log("Skull clicked – hook up skull modal or effect here.");
  });
}

if (scrollBtn) {
  scrollBtn.addEventListener("click", () => {
    console.log("Scroll clicked – hook up scroll lore here.");
  });
}

if (beakerBtn) {
  beakerBtn.addEventListener("click", () => {
    console.log("Beaker clicked – hook up potion effect here.");
  });
}