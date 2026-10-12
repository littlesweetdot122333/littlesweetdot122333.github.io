import {readFile, readdir, mkdir, writeFile, cp, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function safeImage(value) {
  const text = String(value || '');
  return /^\/assets\/[a-zA-Z0-9_\-./\u0080-\uFFFF% ]+$/.test(text) && !text.includes('..') ? text : '';
}
export function safeVideo(value) {
  const src = safeImage(value);
  return /\.(mp4|webm)$/i.test(src) ? src : '';
}
export function coffeeeGallery(profile) {
  const entries = (profile.entries || []).filter(entry => entry.type === 'video' ? safeVideo(entry.src) : safeImage(entry.src));
  const photos = entries.filter(entry => entry.type !== 'video');
  const videos = entries.filter(entry => entry.type === 'video');
  const cover = safeImage(profile.cover);
  return `<section class="intro coffeee-intro"><div><p class="eyebrow">Meet Coffeee</p><h1>Coffeee本尊</h1><p>${escape(profile.intro)}</p><p class="coffeee-count">${photos.length} 张照片 · ${videos.length} 段视频</p></div>${cover ? `<img class="coffeee-portrait" src="${escape(cover)}" alt="黑白猫 Coffeee" fetchpriority="high">` : ''}</section>
  <div class="gallery-filters" role="group" aria-label="筛选 Coffeee 的照片和视频"><button type="button" data-media-filter="all" aria-pressed="true">全部</button><button type="button" data-media-filter="photos" aria-pressed="false">照片 ${photos.length}</button><button type="button" data-media-filter="videos" aria-pressed="false">视频 ${videos.length}</button></div>
  <section class="section" data-media-section="photos"><div class="section-head"><h2>他的相册</h2><span class="meta">点击照片，放大看看</span></div>${photos.length ? `<div class="cat-gallery">${photos.map((entry,i)=>`<figure class="cat-photo"><button type="button" class="photo-open" data-photo-src="${escape(safeImage(entry.src))}" data-photo-caption="${escape(entry.caption || entry.title)}" aria-label="放大照片：${escape(entry.title || `Coffeee ${i+1}`)}"><img src="${escape(safeImage(entry.thumbnail) || safeImage(entry.src))}" alt="${escape(entry.alt || entry.title || '黑白猫 Coffeee')}" loading="lazy" decoding="async"${entry.width && entry.height ? ` width="${Number(entry.width)}" height="${Number(entry.height)}"` : ''}></button><figcaption>${escape(entry.caption || entry.title)}</figcaption></figure>`).join('')}</div>` : '<p class="empty">相册等待下一张照片。</p>'}</section>
  <section class="section" data-media-section="videos"><div class="section-head"><h2>会动的小日常</h2><span class="meta">点开播放</span></div>${videos.length ? `<div class="cat-videos">${videos.map(entry=>`<figure><video controls playsinline preload="none"${safeImage(entry.poster) ? ` poster="${escape(safeImage(entry.poster))}"` : ''} aria-label="${escape(entry.title || 'Coffeee 的视频')}"><source src="${escape(safeVideo(entry.src))}" type="${entry.src.endsWith('.webm') ? 'video/webm' : 'video/mp4'}">你的浏览器暂不支持播放视频。<a href="${escape(safeVideo(entry.src))}">下载视频</a></video><figcaption>${escape(entry.caption || entry.title)}</figcaption></figure>`).join('')}</div>` : '<p class="empty">视频等待下一次记录。</p>'}</section>
  <dialog class="photo-viewer" aria-label="Coffeee 照片查看器"><div class="viewer-toolbar"><span data-photo-number></span><button type="button" data-photo-close aria-label="关闭照片">关闭 ×</button></div><img data-photo-image alt=""><p data-photo-description></p><div class="viewer-controls"><button type="button" data-photo-prev aria-label="上一张照片">← 上一张</button><button type="button" data-photo-next aria-label="下一张照片">下一张 →</button></div></dialog><script defer src="/coffeee.js"></script>`;
}
export function markdown(body) {
  return sanitizeHtml(marked.parse(String(body || '')), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: {...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title', 'loading']},
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {img: (_, attrs) => ({tagName:'img', attribs:{src:safeImage(attrs.src), alt:attrs.alt || '', loading:'lazy'}})}
  });
}
async function readJSON(file) { return JSON.parse(await readFile(path.join(root, file), 'utf8')); }
async function collection(folder, travel = false) {
  const entries = [];
  for (const name of await readdir(path.join(root, folder))) {
    if (!name.endsWith('.json')) continue;
    const post = await readJSON(`${folder}/${name}`);
    if (!post.title || !post.body || !/^\d{4}-\d{2}-\d{2}$/.test(post.date || '') || Number.isNaN(Date.parse(post.date))) throw new Error(`内容字段不完整：${folder}/${name}`);
    const slug = name.slice(0, -5);
    entries.push({...post, category:travel ? '旅行日记' : post.category, travel, href:`/posts/${travel ? 'travel-' : ''}${encodeURIComponent(slug)}.html`});
  }
  return entries.sort((a,b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'));
}
function rows(posts, summaries = false) {
  return `<ul class="post-list">${posts.map(post => {
    const cover = safeImage(post.cover);
    return `<li class="post-row" data-post>${cover ? `<img class="thumbnail" src="${escape(cover)}" alt="" loading="lazy">` : `<span class="thumbnail post-symbol" aria-hidden="true">${post.travel ? '↗' : post.category === '技术与学习' ? '⌘' : '✎'}</span>`}<div class="post-detail"><h3><a href="${post.href}">${escape(post.title)}</a></h3><p class="meta"><time datetime="${post.date}">${post.date}</time> · ${escape(post.category)}${post.location ? ` · ${escape(post.location)}` : ''}</p>${summaries && post.description ? `<p class="summary">${escape(post.description)}</p>` : ''}</div></li>`;
  }).join('')}</ul>`;
}
function layout(settings, title, section, content, description = settings.intro) {
  const nav = [['/', '首页', 'home'], ['/articles/', '文章', 'articles'], ['/travel/', '旅行日记', 'travel'], ['/coffeee/', 'Coffeee本尊', 'coffeee'], ['/about/', '关于', 'about']];
  const github = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/?$/.test(settings.github) ? settings.github : 'https://github.com/littlesweetdot122333';
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · ${escape(settings.name)}</title><meta name="description" content="${escape(description)}"><link rel="stylesheet" href="/blog.css"><script>try{document.documentElement.dataset.theme=localStorage.getItem('blog-theme')==='dark'?'dark':'light'}catch{}</script><script defer src="/theme.js"></script></head>
<body><a class="skip" href="#main">跳到正文</a><div class="shell"><header class="site-header"><a class="brand" href="/">${escape(settings.name)}'s Blog</a><nav class="nav" aria-label="主导航">${nav.map(([href,label,id]) => `<a href="${href}"${section === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<button class="theme-toggle" type="button" data-theme-toggle aria-label="切换到深色模式">☾</button></nav></header><main id="main">${content}</main><footer class="footer"><span>© ${new Date().getFullYear()} ${escape(settings.name)} · 记录与分享</span><span class="footer-links"><a href="${github}">GitHub</a><a href="/admin/">写文章 ↗</a></span></footer></div></body></html>`;
}
async function save(file, html) {
  await mkdir(path.dirname(path.join(out,file)), {recursive:true});
  await writeFile(path.join(out,file), html);
}
export async function build() {
  if (path.resolve(out) !== path.join(root, 'dist')) throw new Error('Invalid output path');
  await rm(out, {recursive:true, force:true});
  await mkdir(out, {recursive:true});
  const settings = await readJSON('content/settings.json');
  const coffeee = await readJSON('content/coffeee.json');
  const articles = await collection('content/articles');
  const travel = await collection('content/travel', true);
  const all = [...articles,...travel].sort((a,b)=>b.date.localeCompare(a.date));
  const intro = (label,title,text) => `<section class="intro"><p class="eyebrow">${label}</p><h1>${escape(title)}</h1><p>${escape(text)}</p></section>`;
  await save('index.html',layout(settings,'首页','home',`${intro('A personal journal',settings.headline,settings.intro)}<section class="section"><div class="section-head"><h2>最近更新 / Recent</h2><a href="/articles/">全部文章 →</a></div>${all.length ? rows(all.slice(0,6)) : '<p class="empty">还没有文章。</p>'}</section><section class="section small-grid"><div><p class="eyebrow">Notes</p><h3><a href="/articles/">技术与学习</a></h3><p>把实践中的经验和学习笔记，整理成下一次能用上的东西。</p></div><div><p class="eyebrow">On the road</p><h3><a href="/travel/">旅行日记</a></h3><p>去过的地方、沿途的风景，以及值得记住的小瞬间。</p></div></section>`));
  const catCover = safeImage(coffeee.cover);
  const home = await readFile(path.join(out,'index.html'),'utf8');
  await save('index.html',home.replace('</main>',`<section class="section coffeee-home"><div><p class="eyebrow">Meet Coffeee</p><h2><a href="/coffeee/">Coffeee本尊 →</a></h2><p>一只黑白猫，和属于他的照片、视频与小日常。</p></div>${catCover ? `<a href="/coffeee/" aria-label="打开 Coffeee本尊 相册"><img src="${escape(catCover)}" alt="黑白猫 Coffeee" loading="lazy"></a>` : ''}</section></main>`));
  await save('coffeee/index.html',layout(settings,'Coffeee本尊','coffeee',coffeeeGallery(coffeee),'黑白猫 Coffeee 的专属相册与视频日记。'));
  const categories = [...new Set(articles.map(post=>post.category))];
  await save('articles/index.html',layout(settings,'文章列表','articles',`${intro('Archive','文章列表','技术与学习，生活随笔，读书与思考。')}<label for="search" class="meta">搜索标题、分类或摘要</label><input class="search" id="search" type="search" data-search placeholder="输入关键词…">${categories.map(category=>`<section class="section" data-category><div class="section-head"><h2>${escape(category)}</h2><span class="meta">${articles.filter(post=>post.category===category).length} 篇</span></div>${rows(articles.filter(post=>post.category===category),true)}</section>`).join('')}${articles.length ? '' : '<p class="empty">还没有文章。新的记录，等你来写。</p>'}<p class="empty" data-no-results hidden role="status">没有找到匹配的文章，试试其他关键词。</p>`));
  await save('travel/index.html',layout(settings,'旅行日记','travel',`${intro('On the road','旅行日记','把走过的地方，留在文字和照片里。')}<section class="section">${travel.length ? `<div class="travel-grid">${travel.map(post=>`<article class="travel-card">${safeImage(post.cover) ? `<a href="${post.href}" tabindex="-1" aria-hidden="true"><img src="${escape(safeImage(post.cover))}" alt="" loading="lazy"></a>` : ''}<p class="meta">${post.date} · ${escape(post.location)}</p><h2><a href="${post.href}">${escape(post.title)}</a></h2><p class="summary">${escape(post.description)}</p></article>`).join('')}</div>` : '<p class="empty">还没有旅行日记。第一段旅程，等你来记录。</p>'}</section>`));
  await save('about/index.html',layout(settings,'关于我','about',`${intro('Hello','关于我',settings.intro)}<section class="section prose">${markdown(settings.about)}</section>`));
  for (const post of all) await save(decodeURIComponent(post.href.slice(1)),layout(settings,post.title,post.travel ? 'travel' : 'articles',`<article class="article"><a class="back-link" href="${post.travel ? '/travel/' : '/articles/'}">← ${post.travel ? '旅行日记' : '文章列表'}</a><header class="article-header"><p class="meta"><time datetime="${post.date}">${post.date}</time> · ${escape(post.category)}${post.location ? ` · ${escape(post.location)}` : ''}</p><h1>${escape(post.title)}</h1>${post.description ? `<p class="summary">${escape(post.description)}</p>` : ''}</header>${safeImage(post.cover) ? `<img class="article-cover" src="${escape(safeImage(post.cover))}" alt="${escape(post.title)}">` : ''}<div class="prose">${markdown(post.body)}</div></article>`,post.description));
  await save('404.html',layout(settings,'页面不存在','',`${intro('404','这页暂时不在这里。','可能是地址有误，或文章已经移动。')}<section class="section"><a href="/">返回首页 →</a></section>`));
  for (const dir of ['assets','admin']) await cp(path.join(root,dir),path.join(out,dir),{recursive:true});
  for (const file of ['blog.css','theme.js','coffeee.js']) await cp(path.join(root,'public',file),path.join(out,file));
  await cp(path.join(root,'CNAME'),path.join(out,'CNAME'));
  await writeFile(path.join(out,'.nojekyll'),'');
  console.log(`Built ${articles.length} articles and ${travel.length} travel entries → ${out}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
