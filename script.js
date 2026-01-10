// ---------- CONFIG ----------
// All positions are percentages in scene space (0–100)
// so they are easy to tweak without touching CSS.
//
// These numbers are *approximate* to get you close.
// You can nudge them later.

const BUTTON_LAYOUT = {
  desktop: {
    // Center book on stand
    book:  { x: 50, y: 53, size: 18 },

    // Skull on the right (a bit right & up from where it was)
    skull: { x: 82, y: 54, size: 15 },

    // Rolled scrolls (NOT the open notebook)
    scroll:{ x: 38, y: 64, size: 18 },

    // Beaker hanging just right of the book
    beaker:{ x: 66, y: 44, size: 11 }
  },

  mobile: {
    // Mobile we’ll rough in now and tune after you send a phone pic
    book:  { x: 50, y: 60, size: 24 },
    skull: { x: 80, y: 60, size: 22 },
    scroll:{ x: 38, y: 68, size: 22 },
    beaker:{ x: 66, y: 46, size: 17 }
  }
};

function isMobileLayout() {
  return window.innerWidth <= 768;
}

// ---------- LAYOUT APPLY ----------

function applyButtonLayout() {
  const mode = isMobileLayout() ? "mobile" : "desktop";
  const cfg = BUTTON_LAYOUT[mode];

  const map = {
    book:  document.getElementById("btn-book"),
    skull: document.getElementById("btn-skull"),
    scroll:document.getElementById("btn-scroll"),
    beaker:document.getElementById("btn-beaker")
  };

  Object.entries(cfg).forEach(([key, pos]) => {
    const el = map[key];
    if (!el) return;
    el.style.setProperty("--x", pos.x + "%");
    el.style.setProperty("--y", pos.y + "%");
    el.style.setProperty("--size", pos.size + "%");
  });
}

// ---------- BACKGROUND SWAP (desktop vs mobile image) ----------

function updateBackground() {
  const bg = document.getElementById("scene-bg");
  if (!bg) return;

  if (isMobileLayout()) {
    // only use this if you actually have stag-study-mobile.png
    bg.src = "./lore-assets/stag-study-mobile.png";
  } else {
    bg.src = "./lore-assets/stag-study.png";
  }
}

// ---------- BOOTSTRAP ----------

function initScene() {
  updateBackground();
  applyButtonLayout();

  // hook up click handlers (you can replace these with modals later)
  const bookBtn = document.getElementById("btn-book");
  const skullBtn = document.getElementById("btn-skull");
  const scrollBtn = document.getElementById("btn-scroll");
  const beakerBtn = document.getElementById("btn-beaker");

  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      console.log("Book clicked – open book modal here.");
    });
  }
  if (skullBtn) {
    skullBtn.addEventListener("click", () => {
      console.log("Skull clicked – hook lore or effect.");
    });
  }
  if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      console.log("Scroll clicked – hook lore or effect.");
    });
  }
  if (beakerBtn) {
    beakerBtn.addEventListener("click", () => {
      console.log("Beaker clicked – hook potion effect.");
    });
  }
}

window.addEventListener("load", initScene);
window.addEventListener("resize", () => {
  updateBackground();
  applyButtonLayout();
});