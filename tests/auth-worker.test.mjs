import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../auth-worker/index.mjs';

const origin = 'https://little-sweet-blog-auth.example.workers.dev';
const env = {GITHUB_OAUTH_ID:'test-client-id', GITHUB_OAUTH_SECRET:'test-client-secret'};

test('only expected site and provider can start login', async () => {
  const invalid = await worker.fetch(new Request(`${origin}/auth?provider=github&site_id=other.example`),env);
  assert.equal(invalid.status,400);
  const response = await worker.fetch(new Request(`${origin}/auth?provider=github&site_id=coffeee.xyz`),env);
  assert.equal(response.status,302);
  const redirect = new URL(response.headers.get('Location'));
  assert.equal(redirect.origin,'https://github.com');
  assert.equal(redirect.searchParams.get('scope'),'public_repo');
  assert.equal(redirect.searchParams.get('redirect_uri'),`${origin}/callback`);
  assert.match(response.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.equal(redirect.searchParams.get('state').length,64);
});

test('callback requires matching browser-bound state', async () => {
  const start = await worker.fetch(new Request(`${origin}/auth?provider=github&site_id=coffeee.xyz`),env);
  const state = new URL(start.headers.get('Location')).searchParams.get('state');
  const response = await worker.fetch(new Request(`${origin}/callback?code=test&state=${state}`),env);
  assert.equal(response.status,400);
  assert.match(await response.text(),/Invalid or expired/);
});

test('successful exchange sends token only to blog origin', async () => {
  const start = await worker.fetch(new Request(`${origin}/auth?provider=github&site_id=coffeee.xyz`),env);
  const state = new URL(start.headers.get('Location')).searchParams.get('state');
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url,'https://github.com/login/oauth/access_token');
    const body = JSON.parse(options.body);
    assert.equal(body.redirect_uri,`${origin}/callback`);
    assert.equal(body.client_secret,'test-client-secret');
    return new Response(JSON.stringify({access_token:'test-token'}),{status:200});
  };
  try {
    const response = await worker.fetch(new Request(`${origin}/callback?code=test&state=${state}`,{headers:{Cookie:cookie}}),env);
    assert.equal(response.status,200);
    const html = await response.text();
    assert.match(html,/authorization:github:success/);
    assert.match(html,/https:\/\/coffeee\.xyz/);
    assert.doesNotMatch(html,/postMessage\([^)]*,\s*['"]\*['"]\)/);
    assert.match(response.headers.get('Set-Cookie'),/Max-Age=0/);
  } finally { globalThis.fetch = previousFetch; }
});
