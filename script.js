// =========================================================
// STAG LORE — STUDY SCENE
//
// Hotspot coordinates are percentages of the SOURCE ARTWORK.
// The scene container is resized to the image's natural aspect ratio,
// so browser viewport cropping can no longer move the art underneath
// the buttons.
// =========================================================

const MOBILE_MEDIA = window.matchMedia("(max-width: 768px)");
const CACHE_PARAM = "_cb";
const CACHE_BUST =
  window.__STAG_LORE_CACHE_BUST__ ||
  new URLSearchParams(window.location.search).get(CACHE_PARAM) ||
  "";

function withCacheBust(rawUrl) {
  if (!CACHE_BUST || !rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl, window.location.href);
    if (url.origin !== window.location.origin) return rawUrl;
    url.searchParams.set("v", CACHE_BUST);
    return url.href;
  } catch {
    return rawUrl;
  }
}

function applyCacheBust() {
  if (!CACHE_BUST) return;

  document.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    const busted = withCacheBust(src);
    if (busted && busted !== src) img.src = busted;
  });

  document.querySelectorAll("source[srcset]").forEach((source) => {
    const srcset = source.getAttribute("srcset");
    if (!srcset) return;

    source.setAttribute(
      "srcset",
      srcset
        .split(",")
        .map((candidate) => {
          const parts = candidate.trim().split(/\s+/);
          return [withCacheBust(parts[0]), ...parts.slice(1)].join(" ");
        })
        .join(", ")
    );
  });

  window.setTimeout(() => {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete(CACHE_PARAM);
    window.history.replaceState(
      {},
      document.title,
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
    );
  }, 180);
}

const BUTTON_LAYOUT = {
  desktop: {
    book:   { x: 50, y: 48,   size: 28 },
    skull:  { x: 85, y: 56,   size: 14 },
    scroll: { x: 11, y: 70.5, size: 22 },
    beaker: { x: 93, y: 85,   size: 14 }
  },

  mobile: {
    // Tuned against the locked mobile artwork.
    book:   { x: 53, y: 44, size: 32 },
    skull:  { x: 91, y: 46.5, size: 16 },
    scroll: { x: 10, y: 49.5, size: 19 },
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

  applyCacheBust();
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

function initPullToRefresh() {
  if (!window.matchMedia("(pointer: coarse)").matches) return;

  const shell = document.querySelector(".scene-shell");
  const scene = document.getElementById("scene");

  if (!shell || !scene) return;

  const indicator = document.createElement("div");
  indicator.className = "stag-ptr";
  indicator.setAttribute("aria-hidden", "true");
  indicator.innerHTML =
    '<span class="stag-ptr-mark">↻</span><span class="stag-ptr-label">Pull to refresh</span>';
  document.body.appendChild(indicator);

  const label = indicator.querySelector(".stag-ptr-label");
  const threshold = 74;
  const maxPull = 118;

  let startX = 0;
  let startY = 0;
  let pullDistance = 0;
  let tracking = false;
  let verticalPull = false;
  let refreshing = false;

  function resetPull() {
    tracking = false;
    verticalPull = false;
    pullDistance = 0;

    scene.classList.remove("ptr-pulling");
    scene.classList.add("ptr-settling");
    scene.style.transform = "";

    indicator.classList.remove(
      "is-pulling",
      "is-ready",
      "is-refreshing"
    );
    indicator.style.transform = "translate3d(-50%, -68px, 0)";
    indicator.style.setProperty("--stag-ptr-rotation", "0deg");
    indicator.setAttribute("aria-hidden", "true");

    if (label) label.textContent = "Pull to refresh";

    window.setTimeout(() => {
      scene.classList.remove("ptr-settling");
    }, 200);
  }

  shell.addEventListener(
    "touchstart",
    (event) => {
      if (refreshing || event.touches.length !== 1) return;

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      pullDistance = 0;
      tracking = true;
      verticalPull = false;
    },
    { passive: true }
  );

  shell.addEventListener(
    "touchmove",
    (event) => {
      if (!tracking || refreshing || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (!verticalPull) {
        if (dy <= 0) {
          resetPull();
          return;
        }

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          if (dy < Math.abs(dx) * 1.2) {
            resetPull();
            return;
          }
          verticalPull = true;
        } else {
          return;
        }
      }

      event.preventDefault();

      pullDistance = Math.min(maxPull, dy * 0.56);
      const progress = Math.min(1, pullDistance / threshold);
      const sceneY = pullDistance * 0.7;
      const indicatorY = -68 + pullDistance * 0.82;

      scene.classList.remove("ptr-settling");
      scene.classList.add("ptr-pulling");
      scene.style.transform = `translate3d(0, ${sceneY}px, 0)`;

      indicator.classList.add("is-pulling");
      indicator.classList.toggle("is-ready", pullDistance >= threshold);
      indicator.style.transform =
        `translate3d(-50%, ${indicatorY}px, 0)`;
      indicator.style.setProperty(
        "--stag-ptr-rotation",
        Math.round(progress * 260) + "deg"
      );
      indicator.setAttribute("aria-hidden", "false");

      if (label) {
        label.textContent =
          pullDistance >= threshold
            ? "Release to refresh"
            : "Pull to refresh";
      }
    },
    { passive: false }
  );

  function finishPull() {
    if (!tracking || refreshing) return;

    if (verticalPull && pullDistance >= threshold) {
      refreshing = true;
      tracking = false;

      scene.classList.remove("ptr-pulling");
      scene.classList.add("ptr-settling");
      scene.style.transform = "translate3d(0, 42px, 0)";

      indicator.classList.remove("is-pulling", "is-ready");
      indicator.classList.add("is-refreshing");
      indicator.style.transform = "translate3d(-50%, 10px, 0)";
      indicator.setAttribute("aria-hidden", "false");

      if (label) label.textContent = "Refreshing";

      window.setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set(CACHE_PARAM, Date.now().toString(36));
        window.location.replace(url.toString());
      }, 220);

      return;
    }

    resetPull();
  }

  shell.addEventListener("touchend", finishPull, { passive: true });
  shell.addEventListener("touchcancel", resetPull, { passive: true });
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

window.addEventListener("DOMContentLoaded", () => {
  initScene();
  initPullToRefresh();
});

if (typeof MOBILE_MEDIA.addEventListener === "function") {
  MOBILE_MEDIA.addEventListener("change", handleLayoutModeChange);
} else {
  MOBILE_MEDIA.addListener(handleLayoutModeChange);
}
