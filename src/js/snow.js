export function initSnowBackground(hostSelector = '.dh-lottery') {
  const host = document.querySelector(hostSelector);
  if (!host) return;
  let layer = host.querySelector('.snow-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'snow-layer';
    layer.style.position = 'absolute';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '1';
    host.appendChild(layer);
  }
  const l = window.lottie;
  if (!l) return;
  const sanitize = (json) => {
    const blocked = /(kurage|watermark|website|mobile|apps|software|lottiefiles|author|credits)/i;
    const shouldDrop = (layer) => {
      const name = (layer && layer.nm ? String(layer.nm) : '');
      return layer.ty === 5 || blocked.test(name) || layer.t;
    };
    const strip = (obj) => {
      if (obj.layers && Array.isArray(obj.layers)) {
        obj.layers = obj.layers.filter((layer) => !shouldDrop(layer));
        obj.layers.forEach(strip);
      }
      if (obj.assets && Array.isArray(obj.assets)) obj.assets.forEach(strip);
      return obj;
    };
    try { return strip(json); } catch { return json; }
  };
  // Visual scale of each snow tile; raise slightly to be less subtle
  const SCALE = 0.84;
  // Overlap between tiles (percent of container) to hide seams
  const OVERLAP = 3.2; // %
  fetch('/assets/lottie/snow.json')
    .then((r) => r.json())
    .then((data) => sanitize(data))
    .then((clean) => {
      // Tile the snow animation across the viewport to avoid a centered strip
      // Choose a minimal grid based on viewport size (keeps instances low for performance)
      const cols = Math.min(2, Math.max(1, Math.ceil(window.innerWidth / 900)));
      const rows = Math.min(2, Math.max(1, Math.ceil(window.innerHeight / 700)));
      const createAnim = (cell) => {
        // Wrap inner container to apply visual scale without changing layout metrics
        const wrap = document.createElement('div');
        wrap.className = 'snow-tile';
        wrap.style.position = 'absolute';
        wrap.style.inset = '0';
        wrap.style.transform = `scale(${SCALE})`;
        wrap.style.transformOrigin = 'center';
        cell.appendChild(wrap);
        const anim = l.loadAnimation({
          container: wrap,
          renderer: 'canvas',
          loop: true,
          autoplay: true,
          animationData: clean,
          rendererSettings: { preserveAspectRatio: 'xMidYMid slice', clearCanvas: true }
        });
        try {
          anim.setSpeed(0.72);
          setTimeout(() => {
            try {
              const dur = (typeof anim.getDuration === 'function') ? anim.getDuration(true) : 0;
              const offset = dur ? Math.random() * dur : Math.random() * 120;
              if (typeof anim.goToAndPlay === 'function') anim.goToAndPlay(offset, true);
            } catch {}
          }, 120);
        } catch {}
      };

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = document.createElement('div');
          cell.style.position = 'absolute';
          const w = 100 / cols;
          const h = 100 / rows;
          // Slightly expand each cell and shift to create overlap to hide seams
          cell.style.left = (x * w - OVERLAP / 2) + '%';
          cell.style.top = (y * h - OVERLAP / 2) + '%';
          cell.style.width = (w + OVERLAP) + '%';
          cell.style.height = (h + OVERLAP) + '%';
          cell.style.overflow = 'hidden';
          layer.appendChild(cell);
          createAnim(cell);
        }
      }
      // Add a centered tile to improve coverage in the middle without increasing grid size drastically
      if (cols > 1 && rows > 1) {
        const center = document.createElement('div');
        center.style.position = 'absolute';
        const w = 100 / cols;
        const h = 100 / rows;
        center.style.left = (50 - (w / 2) - OVERLAP / 2) + '%';
        center.style.top = (50 - (h / 2) - OVERLAP / 2) + '%';
        center.style.width = (w + OVERLAP) + '%';
        center.style.height = (h + OVERLAP) + '%';
        center.style.overflow = 'hidden';
        layer.appendChild(center);
        createAnim(center);
      }
    })
    .catch(() => {});
}
