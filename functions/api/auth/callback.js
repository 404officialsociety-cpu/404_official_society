import { cookies, setCookie, sign } from '../../_lib/util.js';
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), code = url.searchParams.get('code'), state = url.searchParams.get('state');
  const expected = cookies(request).oas;
  const clear = setCookie('oas', '', 0);
  if (!code || !state || !expected || state !== expected) return new Response('Invalid login state', { status: 400, headers: { 'set-cookie': clear } });
  try {
    const t = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: env.GOOGLE_REDIRECT_URI, grant_type: 'authorization_code' })
    });
    if (!t.ok) throw new Error('token_exchange_failed');
    const { access_token } = await t.json();
    const p = await (await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: 'Bearer ' + access_token } })).json();
    if (!p.sub || !p.email || p.email_verified !== true) throw new Error('unverified_email');
    const s = await sign({ sub: String(p.sub), email: p.email, name: p.name || p.email }, env.SESSION_SECRET);
    const h = new Headers({ location: '/account' });
    h.append('set-cookie', setCookie('s404', s, 604800)); h.append('set-cookie', clear);
    return new Response(null, { status: 302, headers: h });
  } catch (e) {
    console.error(String(e));
    return new Response('Login failed. Please try again.', { status: 400, headers: { 'set-cookie': clear } });
  }
}
