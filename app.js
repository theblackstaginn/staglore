/* =========================================================
   Stag Lore — app.js
   - Pause beat so effects never look like lag
   - Hover embers + glow
   - Click book -> open reader
   - Slow, weighty page turns with flipping leaf
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel, root=document) => root.querySelector(sel);

  const book = $("#book");
  const reader = $("#reader");
  const backdropClose = reader?.querySelector("[data-close]");

  // Reader fields
  const leftTitle = $("#leftTitle");
  const leftBody = $("#leftBody");
  const leftFooter = $("#leftFooter");

  const rightTitle = $("#rightTitle");
  const rightBody = $("#rightBody");
  const rightFooter = $("#rightFooter");

  // Flip leaf fields
  const flipLeaf = $("#flipLeaf");
  const flipFrontTitle = $("#flipFrontTitle");
  const flipFrontBody = $("#flipFrontBody");
  const flipFrontFooter = $("#flipFrontFooter");

  const flipBackTitle = $("#flipBackTitle");
  const flipBackBody = $("#flipBackBody");
  const flipBackFooter = $("#flipBackFooter");

  const pageIndicator = $("#pageIndicator");

  const zoneLeft = $(".zone-left");
  const zoneRight = $(".zone-right");

  // ---------------------------------------------------------
  // CONTENT (placeholder now; replace with real lore later)
  // Pages are "spreads" (left+right).
  // ---------------------------------------------------------
  const spreads = [
    {
      left:  { title:"The Desk in the Attic", body:"A place to set the weight of memory.\n\nThe wood remembers every candle.\nThe room remembers every oath.", footer:"— Stag Lore" },
      right: { title:"The Sigil", body:"The stag is not decoration.\n\nIt is a claim.\nA boundary.\nA witness.", footer:"Page One" }
    },
    {
      left:  { title:"House Rule", body:"Nothing in this book is hurried.\n\nIf you feel it rushing, you are reading it wrong.", footer:"—" },
      right: { title:"Ember Oath", body:"We do not burn to destroy.\nWe burn to reveal.", footer:"—" }
    },
    {
      left:  { title:"Threshold Notes", body:"Guests arrive with stories.\nSome are theirs.\nSome are older than they are.", footer:"—" },
      right: { title:"A Quiet Charge", body:"Speak the room’s name once.\nThen let the silence finish the spell.", footer:"—" }
    }
  ];

  let spreadIndex = 0;
  let isOpen = false;
  let flipping = false;

  // ---------------------------------------------------------
  // PAUSE BEAT (intentional stillness)
  // ---------------------------------------------------------
  window.addEventListener("load", () => {
    // stillness before life: avoids “loading lag” vibe
    setTimeout(() => document.body.classList.add("ready"), 480);

    // spawn embers after readiness (lighter CPU + more intentional)
    setTimeout(() => spawnEmbers(14), 520);
  });

  // ---------------------------------------------------------
  // EMBERS
  // ---------------------------------------------------------
  function rand(min, max){ return Math.random() * (max - min) + min; }

  function spawnEmbers(count){
    const wrap = book?.querySelector(".embers");
    if (!wrap) return;

    wrap.innerHTML = "";

    // Place embers mostly around sigil area so it’s “stag specific”
    for (let i=0; i<count; i++){
      const e = document.createElement("span");
      e.className = "ember";

      // x/y in %
      // focus horizontally near center, vertically near sigil + below
      const x = rand(36, 64);
      const y = rand(44, 92);

      const s = rand(6, 14);          // px
      const d = rand(2.8, 5.6);       // sec
      const delay = rand(0, 2.6);     // sec

      e.style.setProperty("--x", `${x}%`);
      e.style.setProperty("--y", `${y}%`);
      e.style.setProperty("--s", `${s}px`);
      e.style.setProperty("--d", `${d}s`);
      e.style.setProperty("--delay", `${delay}s`);

      wrap.appendChild(e);
    }
  }

  // ---------------------------------------------------------
  // READER OPEN/CLOSE
  // ---------------------------------------------------------
  function setSpread(idx){
    const spread = spreads[idx];
    if (!spread) return;

    // Left
    leftTitle.textContent = spread.left.title || "";
    leftBody.textContent = spread.left.body || "";
    leftFooter.textContent = spread.left.footer || "";

    // Right
    rightTitle.textContent = spread.right.title || "";
    rightBody.textContent = spread.right.body || "";
    rightFooter.textContent = spread.right.footer || "";

    pageIndicator.textContent = `Spread ${idx + 1} of ${spreads.length}`;
  }

  function openReader(){
    if (isOpen) return;
    isOpen = true;

    setSpread(spreadIndex);

    reader.classList.add("open");
    reader.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("no-scroll");
  }

  function closeReader(){
    if (!isOpen) return;
    isOpen = false;

    reader.classList.remove("open");
    reader.classList.remove("flipping");
    reader.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("no-scroll");
  }

  // ---------------------------------------------------------
  // PAGE TURN (slow + weighty)
  // We animate a leaf that flips over the right page.
  // ---------------------------------------------------------
  function doFlip(nextIdx){
    if (flipping) return;
    if (nextIdx < 0 || nextIdx >= spreads.length) return;

    flipping = true;

    const current = spreads[spreadIndex];
    const next = spreads[nextIdx];

    // Prepare flip leaf:
    // Front shows current RIGHT page (what we are “turning”)
    flipFrontTitle.textContent = current.right.title || "";
    flipFrontBody.textContent = current.right.body || "";
    flipFrontFooter.textContent = current.right.footer || "";

    // Back shows next LEFT page (revealed after turn)
    flipBackTitle.textContent = next.left.title || "";
    flipBackBody.textContent = next.left.body || "";
    flipBackFooter.textContent = next.left.footer || "";

    // Start flip
    reader.classList.add("flipping");

    // After flip completes, commit new spread
    // Timing matches CSS @keyframes pageTurn (1.25s)
    setTimeout(() => {
      spreadIndex = nextIdx;
      setSpread(spreadIndex);

      // Reset flip state cleanly
      reader.classList.remove("flipping");
      flipping = false;
    }, 1260);
  }

  // ---------------------------------------------------------
  // EVENTS
  // ---------------------------------------------------------
  book?.addEventListener("click", (e) => {
    e.preventDefault();
    openReader();
  });

  // Close
  reader?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeReader();
  });

  // Turn pages
  zoneRight?.addEventListener("click", (e) => {
    e.preventDefault();
    doFlip(spreadIndex + 1);
  });

  zoneLeft?.addEventListener("click", (e) => {
    e.preventDefault();
    // For now: reverse is a simple jump (still dignified, no flip-back)
    // If you want true reverse page animation, we’ll build a mirrored leaf next.
    const prev = spreadIndex - 1;
    if (prev < 0 || flipping) return;

    spreadIndex = prev;
    setSpread(spreadIndex);
  });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;

    if (e.key === "Escape") return closeReader();
    if (e.key === "ArrowRight") return doFlip(spreadIndex + 1);
    if (e.key === "ArrowLeft") {
      const prev = spreadIndex - 1;
      if (prev < 0 || flipping) return;
      spreadIndex = prev;
      setSpread(spreadIndex);
    }
  });

})();