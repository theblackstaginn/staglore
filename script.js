// =========================================================
// STAG LORE — STUDY SCENE
//
// Hotspot coordinates are percentages of the SOURCE ARTWORK.
// The scene container is resized to the image's natural aspect ratio,
// so browser viewport cropping can no longer move the art underneath
// the buttons.
// =========================================================

const MOBILE_MEDIA = window.matchMedia("(max-width: 768px)");

const BUTTON_LAYOUT = {
  desktop: {
    book:   { x: 50, y: 48,   size: 28 },
    skull:  { x: 85, y: 56,   size: 14 },
    scroll: { x: 11, y: 70.5, size: 22 },
    beaker: { x: 93, y: 85,   size: 14 }
  },

  mobile: {
    // Existing mobile coordinates preserved for the first geometry test.
    // Once the artwork is locked, these can be tuned once and stay put.
    book:   { x: 50, y: 60, size: 24 },
    skull:  { x: 80, y: 60, size: 22 },
    scroll: { x: 38, y: 68, size: 22 },
    beaker: { x: 66, y: 46, size: 17 }
  }
};

function currentMode() {
  return MOBILE_MEDIA.matches ? "mobile" : "desktop";
}

function applyButtonLayout(mode = currentMode()) {
  const cfg = BUTTON_LAYOUT[mode];

  const elements = {
    book: document.getElementById("btn-book"),
    skull: document.getElementById("btn-skull"),
    scroll: document.getElementById("btn-scroll"),
    beaker: document.getElementById("btn-beaker")
  };

  Object.entries(cfg).forEach(([key, pos]) => {
    const el = elements[key];
    if (!el) return;

    el.style.setProperty("--x", pos.x + "%");
    el.style.setProperty("--y", pos.y + "%");
    el.style.setProperty("--size", pos.size + "%");
  });
}

function syncSceneToArtwork() {
  const scene = document.getElementById("scene");
  const bg = document.getElementById("scene-bg");

  if (!scene || !bg || !bg.naturalWidth || !bg.naturalHeight) return;

  const width = bg.naturalWidth;
  const height = bg.naturalHeight;
  const ratio = width / height;

  /*
   * Both values are set because:
   * - --scene-ratio is used by the viewport-height width constraint.
   * - --scene-aspect gives the scene its exact image proportions.
   */
  scene.style.setProperty("--scene-ratio", String(ratio));
  scene.style.setProperty("--scene-aspect", width + " / " + height);
  scene.dataset.mode = currentMode();

  applyButtonLayout();
}

function initScene() {
  const bg = document.getElementById("scene-bg");

  applyButtonLayout();

  if (bg) {
    bg.addEventListener("load", syncSceneToArtwork);

    if (bg.complete && bg.naturalWidth) {
      syncSceneToArtwork();
    }
  }

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

/*
 * Crossing the mobile breakpoint changes the <picture> source.
 * The image load event will then resync the scene's natural ratio.
 * We still apply the new coordinate set immediately so there is no
 * stale desktop/mobile hotspot layout during the source switch.
 */
function handleLayoutModeChange() {
  applyButtonLayout();

  requestAnimationFrame(() => {
    const bg = document.getElementById("scene-bg");
    if (bg && bg.complete && bg.naturalWidth) {
      syncSceneToArtwork();
    }
  });
}

window.addEventListener("DOMContentLoaded", initScene);

if (typeof MOBILE_MEDIA.addEventListener === "function") {
  MOBILE_MEDIA.addEventListener("change", handleLayoutModeChange);
} else {
  MOBILE_MEDIA.addListener(handleLayoutModeChange);
}
