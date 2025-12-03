import './scss/lottery.scss';
import $ from 'jquery';
import { initSparkles } from './js/sparkles.js';
import { initFallingBackground } from './js/falling.js';
import { initSnowBackground } from './js/snow.js';
import { attachHeartsBurst } from './js/hearts.js';
window.$ = $;
window.jQuery = $;

window.addEventListener('DOMContentLoaded', async () => {
  // Load the lottery plugin after jQuery is on window
  await import('./js/lottery.js');

  if (typeof window.$.lottery !== 'function') {
    console.error('$.lottery not available after loading plugin');
    return;
  }

  window.$.lottery({
    el: '.lotterybox',
    api: '/sample-data.json',
    once: true,
    speed: 500,
    showbtn: true,
    subtitle: 'company',
    timeout: 8,
    number: 1,
  });

  // Replace the roll button contents with Lottie animation and keep click behavior
  const attachLottieToButton = (btn) => {
    if (!btn) return;
    if (!btn.querySelector('.dice-lottie')) {
      btn.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'dice-lottie';
      btn.appendChild(container);
      try {
        const lottie = window.lottie;
        if (!lottie) throw new Error('Lottie runtime not found');
        lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/assets/dice/dice-animation.json',
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
          }
        });
      } catch (e) {
        console.warn('Lottie failed to load dice animation', e);
      }
    }
    // Ensure re-injection if plugin swaps innerHTML on state change
    const mo = new MutationObserver(() => attachLottieToButton(btn));
    mo.observe(btn, { childList: true, subtree: true });
  };

  // Wait for the plugin to create the button, then attach
  const tryAttach = () => {
    const btn = document.getElementById('dh-lottery-go');
    if (btn) {
      attachLottieToButton(btn);
      return true;
    }
    return false;
  };

  // Attempt immediately, then poll briefly if not yet present
  if (!tryAttach()) {
    let attempts = 0;
    const t = setInterval(() => {
      attempts++;
      if (tryAttach() || attempts > 100) clearInterval(t);
    }, 50);
    // As a fallback, observe the lottery container for DOM insertions
    const host = document.querySelector('.lotterybox') || document.body;
    const moHost = new MutationObserver(() => {
      if (tryAttach()) moHost.disconnect();
    });
    moHost.observe(host, { childList: true, subtree: true });
  }

  // Glitter/sparkles and hearts burst, ensure host exists first
  const mountBackgroundFx = () => {
    const host = document.querySelector('.dh-lottery');
    if (!host) return false;
    initSparkles('.dh-lottery', 90);
    attachHeartsBurst('.dh-lottery');
    initFallingBackground('.dh-lottery', { density: 84 });
    initSnowBackground('.dh-lottery');
    return true;
  };
  if (!mountBackgroundFx()) {
    let tries = 0;
    const t2 = setInterval(() => {
      tries++;
      if (mountBackgroundFx() || tries > 80) clearInterval(t2);
    }, 50);
    const root = document.querySelector('.lotterybox') || document.body;
    const o2 = new MutationObserver(() => {
      if (mountBackgroundFx()) o2.disconnect();
    });
    o2.observe(root, { childList: true, subtree: true });
  }
});
