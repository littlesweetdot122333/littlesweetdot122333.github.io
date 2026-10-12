const word = document.querySelector('[data-typewriter]');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const text = 'Coffeee';
let letters = 0;
let deleting = false;
let timer;
function tick() {
  letters += deleting ? -1 : 1;
  word.textContent = text.slice(0, letters);
  let delay = deleting ? 95 : 190;
  if (letters === text.length) { deleting = true; delay = 1600; }
  else if (letters === 0) { deleting = false; delay = 550; }
  timer = window.setTimeout(tick, delay);
}
function start() {
  window.clearTimeout(timer);
  if (motion.matches || document.hidden) {
    word.textContent = text;
    return;
  }
  letters = 0;
  deleting = false;
  word.textContent = '';
  timer = window.setTimeout(tick, 450);
}
if (word) {
  motion.addEventListener('change', start);
  document.addEventListener('visibilitychange', start);
  start();
}
