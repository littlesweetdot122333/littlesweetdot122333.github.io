const themeButton = document.querySelector('[data-theme-toggle]');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? '☀' : '☾';
  themeButton.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
}
let theme = document.documentElement.dataset.theme || 'light';
applyTheme(theme);
themeButton.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('blog-theme', theme); } catch {}
});
const search = document.querySelector('[data-search]');
if (search) search.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  document.querySelectorAll('[data-post]').forEach(post => {
    post.hidden = !post.textContent.toLocaleLowerCase().includes(query);
    if (!post.hidden) visible++;
  });
  document.querySelectorAll('[data-category]').forEach(group => {
    group.hidden = ![...group.querySelectorAll('[data-post]')].some(post => !post.hidden);
  });
  const empty = document.querySelector('[data-no-results]');
  if (empty) empty.hidden = visible > 0;
});
