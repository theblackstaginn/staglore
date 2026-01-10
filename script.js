const BUTTON_LAYOUT = {
  desktop: {
    book:  { x: 50, y: 56, size: 20 },
    skull: { x: 78, y: 60, size: 18 },
    scroll:{ x: 26, y: 65, size: 19 },
    beaker:{ x: 68, y: 44, size: 15 }
  },
  mobile: {
    book:  { x: 50, y: 55, size: 24 },
    skull: { x: 78, y: 57, size: 22 },
    scroll:{ x: 26, y: 62, size: 23 },
    beaker:{ x: 68, y: 42, size: 20 }
  }
};

function isMobile() {
  return window.innerWidth <= 768;
}

function applyLayout() {
  const cfg = isMobile() ? BUTTON_LAYOUT.mobile : BUTTON_LAYOUT.desktop;
  const btns = {
    book:  document.getElementById('btn-book'),
    skull: document.getElementById('btn-skull'),
    scroll:document.getElementById('btn-scroll'),
    beaker:document.getElementById('btn-beaker')
  };

  Object.entries(cfg).forEach(([key, pos]) => {
    const el = btns[key];
    el.style.left = pos.x + '%';
    el.style.top  = pos.y + '%';
    el.style.width = pos.size + '%';
  });
}

window.addEventListener('load', applyLayout);
window.addEventListener('resize', applyLayout);