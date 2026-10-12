const siteOrigin = 'https://coffeee.xyz';
const stateCookieName = '__Host-blog-oauth-state';
const responseHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function callbackUrl(url) {
  return `${url.origin}/callback`;
}

function cookieValue(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function sameState(left, right) {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function textResponse(message, status = 400) {
  return new Response(message, {status, headers: {...responseHeaders, 'Content-Type': 'text/plain; charset=utf-8'}});
}

function resultPage(status, payload) {
  const responseValue = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const encodedResponse = JSON.stringify(responseValue).replaceAll('<', '\\u003c');
  const script = `
    if (window.opener) {
      function receiveMessage(event) {
        if (event.source !== window.opener || event.origin !== ${JSON.stringify(siteOrigin)} || event.data !== 'authorizing:github') return;
        window.removeEventListener('message', receiveMessage);
        window.opener.postMessage(${encodedResponse}, ${JSON.stringify(siteOrigin)});
      }
      window.addEventListener('message', receiveMessage);
      window.opener.postMessage('authorizing:github', ${JSON.stringify(siteOrigin)});
    }
  `;
  const page = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>博客登录</title></head><body><p>正在完成博客登录，请稍候…</p><script>${script}</script></body></html>`;
  return new Response(page, {
    headers: {
      ...responseHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'`,
      'Set-Cookie': `${stateCookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

async function handleAuth(request, url, env) {
  if (url.searchParams.get('provider') !== 'github' || url.searchParams.get('site_id') !== 'coffeee.xyz') return textResponse('Invalid provider or site');
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) return textResponse('OAuth is not configured', 503);
  const state = randomState();
  const redirect = new URL('https://github.com/login/oauth/authorize');
  redirect.searchParams.set('client_id', env.GITHUB_OAUTH_ID);
  redirect.searchParams.set('redirect_uri', callbackUrl(url));
  redirect.searchParams.set('scope', 'public_repo');
  redirect.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      ...responseHeaders,
      Location: redirect.toString(),
      'Set-Cookie': `${stateCookieName}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

async function handleCallback(request, url, env) {
  if (!sameState(url.searchParams.get('state') || '', cookieValue(request, stateCookieName))) return textResponse('Invalid or expired login session');
  if (url.searchParams.has('error')) return resultPage('error', {message:'GitHub login was cancelled'});
  const code = url.searchParams.get('code');
  if (!code || !env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) return textResponse('Missing code or OAuth configuration');
  let tokenResponse;
  try {
    tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {'Accept':'application/json', 'Content-Type':'application/json'},
      body: JSON.stringify({client_id:env.GITHUB_OAUTH_ID, client_secret:env.GITHUB_OAUTH_SECRET, code, redirect_uri:callbackUrl(url)}),
    });
  } catch {
    return resultPage('error', {message:'GitHub could not be reached'});
  }
  if (!tokenResponse.ok) return resultPage('error', {message:'GitHub rejected the login'});
  let tokenData;
  try { tokenData = await tokenResponse.json(); } catch { return resultPage('error', {message:'Invalid response from GitHub'}); }
  if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) return resultPage('error', {message:'GitHub did not return an access token'});
  return resultPage('success', {token:tokenData.access_token});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return textResponse('Method not allowed', 405);
    if (url.pathname === '/auth') return handleAuth(request, url, env);
    if (url.pathname === '/callback') return handleCallback(request, url, env);
    if (url.pathname === '/') return textResponse('Little Sweet blog authentication is ready', 200);
    return textResponse('Not found', 404);
  },
};
