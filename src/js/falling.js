export function initFallingBackground(hostSelector = '.dh-lottery', { density = 40 } = {}) {
  const host = document.querySelector(hostSelector);
  if (!host) return;
  let layer = host.querySelector('.fall-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'fall-layer';
    host.appendChild(layer);
  }
  const glyphs = ['✧', '✦', '❄', '❆', '❇', '✺', '✼', '✥', '★', '✪'];
  function spawnOne() {
    const el = document.createElement('span');
    el.className = 'flake';
    // Size variants
    const r = Math.random();
    if (r < 0.35) el.classList.add('flake--sm');
    else if (r > 0.7) el.classList.add('flake--lg');
    el.classList.add(Math.random() > 0.5 ? 'flake--white' : 'flake--hot');
    el.style.left = Math.round(Math.random() * 100) + '%';
    // Randomize font size further for variety (bigger overall)
    const fs = 18 + Math.random()*24;
    el.style.fontSize = fs + 'px';
    // Gentle, straight down fall
    el.style.animationDuration = `${14 + Math.random()*18}s`;
    el.style.animationDelay = `${Math.random()*-12}s`;
    el.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    layer.appendChild(el);
    // cleanup after one pass
    setTimeout(() => el.remove(), 20000);
  }
  // initial burst
  for (let i = 0; i < density; i++) spawnOne();
  // steady drizzle
  setInterval(() => {
    for (let i = 0; i < Math.ceil(density/6); i++) spawnOne();
  }, 1000);
}
