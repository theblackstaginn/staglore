// =========================================================
// STAG LORE — STUDY SCENE
//
// Mechanics rule:
// The rendered artwork IS the coordinate system.
// CSS shrink-wraps the selected artwork and hotspot coordinates
// are percentages of that rendered image.
// =========================================================

const PORTRAIT_MEDIA = window.matchMedia("(orientation: portrait)");
const CACHE_PARAM = "_cb";

const CACHE_BUST =
  window.__STAG_LORE_CACHE_BUST__ ||
  new URLSearchParams(window.location.search).get(CACHE_PARAM) ||
  "";

const BUTTON_LAYOUT = {
  landscape: {
    book:   { x: 50, y: 48,   size: 28 },
    skull:  { x: 85, y: 56,   size: 14 },
    scroll: { x: 11, y: 70.5, size: 22 },
    beaker: { x: 93, y: 85,   size: 14 }
  },

  portrait: {
    // Tuned against the portrait study artwork.
    book:   { x: 53, y: 44,   size: 32 },
    skull:  { x: 91, y: 46.5, size: 16 },
    scroll: { x: 10, y: 49.5, size: 19 },
    beaker: { x: 66, y: 46,   size: 17 }
  }
};

const sceneState = {
  started: false,
  ready: false,
  refreshing: false,
  layoutEpoch: 0,
  suppressHotspotUntil: 0
};

function currentMode() {
  return PORTRAIT_MEDIA.matches ? "portrait" : "landscape";
}

function expectedArtworkFile(mode = currentMode()) {
  return mode === "portrait"
    ? "stag-study-mobile.png"
    : "stag-study.png";
}

function currentArtworkFile(bg) {
  if (!bg) return "";

  try {
    const url = new URL(
      bg.currentSrc || bg.src,
      window.location.href
    );

    return url.pathname.split("/").pop() || "";
  } catch {
    return "";
  }
}

function withCacheBust(rawUrl) {
  if (!CACHE_BUST || !rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl, window.location.href);

    if (url.origin !== window.location.origin) {
      return rawUrl;
    }

    url.searchParams.set("v", CACHE_BUST);
    return url.href;
  } catch {
    return rawUrl;
  }
}

function applyCacheBust() {
  if (!CACHE_BUST) return;

  /*
   * Update <source> first so <picture> has the correct cache-busted
   * candidate before the fallback <img> source is touched.
   */
  document.querySelectorAll("source[srcset]").forEach((source) => {
    const srcset = source.getAttribute("srcset");

    if (!srcset) return;

    source.setAttribute(
      "srcset",
      srcset
        .split(",")
        .map((candidate) => {
          const parts = candidate.trim().split(/\s+/);

          return [
            withCacheBust(parts[0]),
            ...parts.slice(1)
          ].join(" ");
        })
        .join(", ")
    );
  });

  document.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    const busted = withCacheBust(src);

    if (busted && busted !== src) {
      img.src = busted;
    }
  });

  window.setTimeout(() => {
    const cleanUrl = new URL(window.location.href);

    cleanUrl.searchParams.delete(CACHE_PARAM);

    window.history.replaceState(
      {},
      document.title,
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
    );
  }, 220);
}

function hotspotElements() {
  return {
    book: document.getElementById("btn-book"),
    skull: document.getElementById("btn-skull"),
    scroll: document.getElementById("btn-scroll"),
    beaker: document.getElementById("btn-beaker")
  };
}

function sceneImages() {
  return [
    document.getElementById("scene-bg"),
    ...document.querySelectorAll(".hotspot img")
  ].filter(Boolean);
}

function applyButtonLayout(mode = currentMode()) {
  const cfg = BUTTON_LAYOUT[mode];
  const elements = hotspotElements();

  Object.entries(cfg).forEach(([key, pos]) => {
    const el = elements[key];

    if (!el) return;

    el.style.setProperty("--x", pos.x + "%");
    el.style.setProperty("--y", pos.y + "%");
    el.style.setProperty("--size", pos.size + "%");
  });
}

function markSceneSwitching() {
  const scene = document.getElementById("scene");

  if (!scene) return;

  sceneState.ready = false;

  scene.classList.remove("is-ready");
  scene.classList.add("is-switching");
  scene.removeAttribute("data-error");
}

function markSceneReady() {
  const scene = document.getElementById("scene");
  const bg = document.getElementById("scene-bg");

  if (!scene || !bg) return;

  applyButtonLayout();

  scene.dataset.mode = currentMode();
  scene.dataset.artwork = bg.currentSrc || bg.src;

  scene.classList.remove("is-switching");
  scene.classList.add("is-ready");
  scene.removeAttribute("data-error");

  sceneState.ready = true;
}

function markSceneError(kind = "asset") {
  const scene = document.getElementById("scene");

  if (!scene) return;

  sceneState.ready = false;

  scene.classList.remove("is-ready", "is-switching");
  scene.dataset.error = kind;
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function waitForExpectedArtwork(bg, mode, epoch) {
  const expected = expectedArtworkFile(mode);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (epoch !== sceneState.layoutEpoch) {
      return false;
    }

    if (
      bg.complete &&
      bg.naturalWidth > 0 &&
      currentArtworkFile(bg) === expected
    ) {
      return true;
    }

    await wait(25);
  }

  return false;
}

function waitForImageLoad(img) {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const cleanup = () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
    };

    const onLoad = () => {
      cleanup();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      resolve(false);
    };

    img.addEventListener("load", onLoad, { once: true });
    img.addEventListener("error", onError, { once: true });
  });
}

async function decodeImage(img) {
  if (typeof img.decode !== "function") return;

  try {
    await img.decode();
  } catch {
    // A load event is enough to keep the scene functional.
  }
}

async function settleSceneForCurrentMode() {
  const scene = document.getElementById("scene");
  const bg = document.getElementById("scene-bg");

  if (!scene || !bg) return;

  const epoch = ++sceneState.layoutEpoch;
  const mode = currentMode();

  markSceneSwitching();
  applyButtonLayout(mode);

  const artworkReady =
    await waitForExpectedArtwork(bg, mode, epoch);

  if (
    epoch !== sceneState.layoutEpoch ||
    !artworkReady
  ) {
    if (epoch === sceneState.layoutEpoch) {
      markSceneError("artwork");
    }

    return;
  }

  const images = sceneImages();

  const results =
    await Promise.all(images.map(waitForImageLoad));

  if (epoch !== sceneState.layoutEpoch) {
    return;
  }

  if (results.some((loaded) => !loaded)) {
    markSceneError("asset");
    return;
  }

  await Promise.all(images.map(decodeImage));

  if (epoch !== sceneState.layoutEpoch) {
    return;
  }

  markSceneReady();
}

function hotspotClickAllowed() {
  return (
    sceneState.ready &&
    !sceneState.refreshing &&
    Date.now() >= sceneState.suppressHotspotUntil
  );
}

function activateHotspot(name) {
  if (!hotspotClickAllowed()) return;

  switch (name) {
    case "book":
      console.log("Book clicked – open book modal here.");
      break;

    case "skull":
      console.log("Skull clicked – hook lore or effect.");
      break;

    case "scroll":
      console.log("Scroll clicked – hook lore or effect.");
      break;

    case "beaker":
      console.log("Beaker clicked – hook potion effect.");
      break;
  }
}

function bindHotspots() {
  const elements = hotspotElements();

  Object.entries(elements).forEach(([name, button]) => {
    if (!button) return;

    button.addEventListener("click", () => {
      activateHotspot(name);
    });
  });
}

function initScene() {
  if (sceneState.started) return;

  sceneState.started = true;

  bindHotspots();

  /*
   * Cache-bust before readiness is evaluated. Hotspots stay hidden
   * until the refreshed background AND all four object images load.
   */
  applyCacheBust();

  settleSceneForCurrentMode();
}

function handleArtworkModeChange() {
  settleSceneForCurrentMode();
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
    '<span class="stag-ptr-mark">↻</span>' +
    '<span class="stag-ptr-label">Pull to refresh</span>';

  document.body.appendChild(indicator);

  const label =
    indicator.querySelector(".stag-ptr-label");

  const threshold = 74;
  const maxPull = 118;

  let startX = 0;
  let startY = 0;
  let pullDistance = 0;
  let tracking = false;
  let verticalPull = false;

  function setHotspotSuppression(milliseconds = 650) {
    sceneState.suppressHotspotUntil =
      Date.now() + milliseconds;
  }

  function finishSettling() {
    window.setTimeout(() => {
      scene.classList.remove("ptr-settling");
    }, 200);
  }

  function resetPull() {
    tracking = false;
    verticalPull = false;
    pullDistance = 0;

    scene.classList.remove(
      "ptr-pulling",
      "ptr-active"
    );

    scene.classList.add("ptr-settling");
    scene.style.transform = "";

    indicator.classList.remove(
      "is-pulling",
      "is-ready",
      "is-refreshing"
    );

    indicator.style.transform =
      "translate3d(-50%, -68px, 0)";

    indicator.style.setProperty(
      "--stag-ptr-rotation",
      "0deg"
    );

    indicator.setAttribute("aria-hidden", "true");

    if (label) {
      label.textContent = "Pull to refresh";
    }

    finishSettling();
  }

  shell.addEventListener(
    "touchstart",
    (event) => {
      if (
        sceneState.refreshing ||
        !sceneState.ready ||
        event.touches.length !== 1
      ) {
        return;
      }

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
      if (
        !tracking ||
        sceneState.refreshing ||
        event.touches.length !== 1
      ) {
        return;
      }

      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (!verticalPull) {
        if (dy <= 0) {
          resetPull();
          return;
        }

        if (
          Math.abs(dx) <= 10 &&
          Math.abs(dy) <= 10
        ) {
          return;
        }

        if (dy < Math.abs(dx) * 1.2) {
          resetPull();
          return;
        }

        verticalPull = true;

        scene.classList.add("ptr-active");

        setHotspotSuppression();
      }

      event.preventDefault();

      pullDistance =
        Math.min(maxPull, dy * 0.56);

      const progress =
        Math.min(1, pullDistance / threshold);

      const sceneY =
        pullDistance * 0.7;

      const indicatorY =
        -68 + pullDistance * 0.82;

      scene.classList.remove("ptr-settling");
      scene.classList.add("ptr-pulling");

      scene.style.transform =
        `translate3d(0, ${sceneY}px, 0)`;

      indicator.classList.add("is-pulling");

      indicator.classList.toggle(
        "is-ready",
        pullDistance >= threshold
      );

      indicator.style.transform =
        `translate3d(-50%, ${indicatorY}px, 0)`;

      indicator.style.setProperty(
        "--stag-ptr-rotation",
        Math.round(progress * 260) + "deg"
      );

      indicator.setAttribute(
        "aria-hidden",
        "false"
      );

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
    if (
      !tracking ||
      sceneState.refreshing
    ) {
      return;
    }

    if (
      verticalPull &&
      pullDistance >= threshold
    ) {
      sceneState.refreshing = true;
      tracking = false;

      setHotspotSuppression(1500);

      scene.classList.remove("ptr-pulling");

      scene.classList.add(
        "ptr-settling",
        "ptr-active"
      );

      scene.style.transform =
        "translate3d(0, 42px, 0)";

      indicator.classList.remove(
        "is-pulling",
        "is-ready"
      );

      indicator.classList.add(
        "is-refreshing"
      );

      indicator.style.transform =
        "translate3d(-50%, 10px, 0)";

      indicator.setAttribute(
        "aria-hidden",
        "false"
      );

      if (label) {
        label.textContent = "Refreshing";
      }

      window.setTimeout(() => {
        const url =
          new URL(window.location.href);

        url.searchParams.set(
          CACHE_PARAM,
          Date.now().toString(36)
        );

        window.location.replace(
          url.toString()
        );
      }, 220);

      return;
    }

    if (verticalPull) {
      setHotspotSuppression();
    }

    resetPull();
  }

  shell.addEventListener(
    "touchend",
    finishPull,
    { passive: true }
  );

  shell.addEventListener(
    "touchcancel",
    () => {
      if (sceneState.refreshing) return;

      if (verticalPull) {
        setHotspotSuppression();
      }

      resetPull();
    },
    { passive: true }
  );
}

function startStagLore() {
  initScene();
  initPullToRefresh();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startStagLore,
    { once: true }
  );
} else {
  /*
   * Dynamic cache-busted script loading can finish after
   * DOMContentLoaded, so startup must also work immediately.
   */
  startStagLore();
}

if (
  typeof PORTRAIT_MEDIA.addEventListener ===
  "function"
) {
  PORTRAIT_MEDIA.addEventListener(
    "change",
    handleArtworkModeChange
  );
} else {
  PORTRAIT_MEDIA.addListener(
    handleArtworkModeChange
  );
}
