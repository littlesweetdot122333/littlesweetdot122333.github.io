const filters = document.querySelectorAll('[data-media-filter]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.querySelectorAll('[data-media-section]').forEach(section => {
    section.hidden = button.dataset.mediaFilter !== 'all' && button.dataset.mediaFilter !== section.dataset.mediaSection;
  });
  document.querySelectorAll('video').forEach(video => video.pause());
}));
const viewer = document.querySelector('.photo-viewer');
const photos = [...document.querySelectorAll('[data-photo-src]')];
let active = 0;
function showPhoto(index) {
  active = (index + photos.length) % photos.length;
  const photo = photos[active];
  const image = viewer.querySelector('[data-photo-image]');
  image.src = photo.dataset.photoSrc;
  image.alt = photo.querySelector('img').alt;
  viewer.querySelector('[data-photo-description]').textContent = photo.dataset.photoCaption;
  viewer.querySelector('[data-photo-number]').textContent = `${active + 1} / ${photos.length}`;
}
photos.forEach((photo,index) => photo.addEventListener('click', () => {
  showPhoto(index);
  viewer.showModal();
  document.body.classList.add('photo-viewing');
}));
viewer.querySelector('[data-photo-close]').addEventListener('click', () => viewer.close());
viewer.querySelector('[data-photo-prev]').addEventListener('click', () => showPhoto(active - 1));
viewer.querySelector('[data-photo-next]').addEventListener('click', () => showPhoto(active + 1));
viewer.addEventListener('close', () => document.body.classList.remove('photo-viewing'));
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(active - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(active + 1); }
});
document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => {
  document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
}));
