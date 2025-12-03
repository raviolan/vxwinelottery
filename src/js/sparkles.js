export function initSparkles(hostSelector = '.dh-lottery', count = 80) {
  const host = document.querySelector(hostSelector);
  if (!host) return;
  let layer = host.querySelector('.sparkle-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'sparkle-layer';
    host.appendChild(layer);
  }

  const spawn = () => {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 2.2).toFixed(2) + 's';
    s.style.transform = `scale(${0.5 + Math.random() * 1.2})`;
    layer.appendChild(s);
    setTimeout(() => s.remove(), 3000);
  };

  // initial batch
  for (let i = 0; i < count; i++) spawn();
  // continuous gentle sparkle
  setInterval(() => {
    for (let i = 0; i < 4; i++) spawn();
  }, 600);
}

