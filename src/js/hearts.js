// Creates a bursting hearts effect near the center of the screen
export function attachHeartsBurst(hostSelector = '.dh-lottery') {
  const host = document.querySelector(hostSelector) || document.body;
  window.heartsBurst = () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    host.appendChild(container);

    const N = 24 + Math.floor(Math.random() * 16);
    for (let i = 0; i < N; i++) {
      const h = document.createElement('span');
      h.style.position = 'absolute';
      h.style.left = '50%';
      h.style.top = '55%';
      h.style.width = h.style.height = '14px';
      h.style.transform = 'translate(-50%, -50%)';
      h.style.opacity = '0';
      h.style.filter = 'drop-shadow(0 0 8px rgba(255, 105, 180, .8))';
      h.innerHTML = '💖';
      container.appendChild(h);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 220;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = (Math.random() * 40 - 20).toFixed(0);
      const scale = (0.8 + Math.random() * 0.8).toFixed(2);
      const dur = 800 + Math.random() * 700;
      setTimeout(() => {
        h.animate([
          { transform: 'translate(-50%, -50%) scale(0.6) rotate(0deg)', opacity: 0 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale}) rotate(${rot}deg)`, opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 40}px)) scale(${scale}) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      }, i * 12);
    }

    setTimeout(() => container.remove(), 2200);
  };
}

