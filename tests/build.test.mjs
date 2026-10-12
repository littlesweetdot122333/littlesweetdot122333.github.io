import test from 'node:test';
import assert from 'node:assert/strict';
import {build, escape, markdown, safeImage, safeVideo, coffeeeGallery, root} from '../scripts/build.mjs';
import {readFile, access} from 'node:fs/promises';
import path from 'node:path';
test('escapes content and strips unsafe Markdown',()=>{
  assert.equal(escape('<script>'),'&lt;script&gt;');
  assert.equal(safeImage('javascript:alert(1)'), '');
  assert.equal(safeImage('/assets/../secrets'), '');
  assert.ok(!markdown('<script>alert(1)</script><img src="x" onerror="alert(1)">').includes('onerror'));
  assert.ok(!markdown('[test](javascript:alert)').includes('javascript:'));
  assert.ok(markdown('![photo](/assets/uploads/test.jpg)').includes('/assets/uploads/test.jpg'));
});
test('build includes all sections, media files and CMS config',async()=>{
  await build();
  for (const file of ['index.html','articles/index.html','travel/index.html','coffeee/index.html','about/index.html','admin/index.html','404.html']) {
    const html = await readFile(path.join(root,'dist',file),'utf8');
    assert.ok(html.includes('lang="zh-CN"'),file);
  }
  assert.equal((await readFile(path.join(root,'dist/CNAME'),'utf8')).trim(),'coffeee.xyz');
  const config = JSON.parse(await readFile(path.join(root,'dist/admin/config.json'),'utf8'));
  assert.equal(config.publish_mode,'editorial_workflow');
  assert.equal(config.backend.branch,'main');
  assert.ok(config.collections.some(collection => collection.name === 'coffeee'));
  assert.ok((await readFile(path.join(root,'dist/travel/index.html'),'utf8')).includes('还没有旅行日记'));
  const cat = JSON.parse(await readFile(path.join(root,'content/coffeee.json'),'utf8'));
  for (const entry of cat.entries) for (const field of ['src','thumbnail','poster']) {
    if (entry[field]) await access(path.join(root,'dist',entry[field]));
  }
  assert.ok((await readFile(path.join(root,'dist/coffeee/index.html'),'utf8')).includes('data-photo-src'));
});
test('cat gallery rejects unsafe media paths and prevents HTML in captions',()=>{
  assert.equal(safeVideo('/assets/coffeee/test.mp4'),'/assets/coffeee/test.mp4');
  for (const src of ['/assets/../test.mp4','https://example.com/test.mp4','/assets/test.html','javascript:alert(1)']) assert.equal(safeVideo(src),'');
  const gallery=coffeeeGallery({intro:'<script>alert(1)</script>',entries:[{type:'video',src:'/assets/test.mp4',title:'<img onerror="alert(1)">'},{type:'video',src:'javascript:alert(1)'},{type:'image',src:'/assets/test.webp',title:'" onerror="alert(1)'}]});
  assert.ok(!gallery.includes('<script>alert(1)</script>'));
  assert.ok(!gallery.includes('src="javascript:'));
  assert.ok(gallery.includes('controls playsinline preload="none"'));
  assert.ok(gallery.includes('&lt;img'));
});
