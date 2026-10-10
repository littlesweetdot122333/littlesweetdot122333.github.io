import test from 'node:test';
import assert from 'node:assert/strict';
import {build, escape, markdown, safeImage, root} from '../scripts/build.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
test('escapes content and strips unsafe Markdown',()=>{
  assert.equal(escape('<script>'),'&lt;script&gt;');
  assert.equal(safeImage('javascript:alert(1)'), '');
  assert.equal(safeImage('/assets/../secrets'), '');
  assert.ok(!markdown('<script>alert(1)</script><img src="x" onerror="alert(1)">').includes('onerror'));
  assert.ok(!markdown('[test](javascript:alert)').includes('javascript:'));
  assert.ok(markdown('![photo](/assets/uploads/test.jpg)').includes('/assets/uploads/test.jpg'));
});
test('build preserves old URLs and includes all sections and CMS config',async()=>{
  await build();
  for (const file of ['index.html','articles/index.html','travel/index.html','about/index.html','posts/hello.html','posts/network-note.html','admin/index.html','404.html']) {
    const html = await readFile(path.join(root,'dist',file),'utf8');
    assert.ok(html.includes('lang="zh-CN"'),file);
  }
  assert.equal((await readFile(path.join(root,'dist/CNAME'),'utf8')).trim(),'coffeee.xyz');
  const config = JSON.parse(await readFile(path.join(root,'dist/admin/config.json'),'utf8'));
  assert.equal(config.publish_mode,'editorial_workflow');
  assert.equal(config.backend.branch,'main');
  assert.equal(config.collections.length,3);
  assert.ok((await readFile(path.join(root,'dist/travel/index.html'),'utf8')).includes('还没有旅行日记'));
});
