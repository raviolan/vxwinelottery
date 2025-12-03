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
  fetch('/assets/lottie/snow.json')
    .then((r) => r.json())
    .then((data) => sanitize(data))
    .then((clean) => {
      // Tile the snow animation across the viewport to avoid a centered strip
      const cols = 3; const rows = 2;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = document.createElement('div');
          cell.style.position = 'absolute';
          cell.style.left = (x * 100 / cols) + '%';
          cell.style.top = (y * 100 / rows) + '%';
          cell.style.width = (100 / cols) + '%';
          cell.style.height = (100 / rows) + '%';
          cell.style.overflow = 'hidden';
          layer.appendChild(cell);
          const anim = l.loadAnimation({
            container: cell,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: clean,
          });
          try { anim.setSpeed(0.7); } catch {}
        }
      }
    })
    .catch(() => {});
}
