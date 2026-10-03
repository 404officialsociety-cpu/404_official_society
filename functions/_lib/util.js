const enc = new TextEncoder();
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const ub64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const key = s => crypto.subtle.importKey('raw', enc.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function sign(obj, secret, ttl = 604800) {
  if (!secret) throw new Error('missing_secret');
  const body = b64u(enc.encode(JSON.stringify({ ...obj, exp: Math.floor(Date.now() / 1000) + ttl })));
  return body + '.' + b64u(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(body)));
}
export async function verify(tok, secret) {
  if (!tok || !secret) return null;
  const [body, sig] = tok.split('.');
  if (!body || !sig) return null;
  try {
    if (!(await crypto.subtle.verify('HMAC', await key(secret), ub64u(sig), enc.encode(body)))) return null;
    const o = JSON.parse(new TextDecoder().decode(ub64u(body)));
    return o.exp > Date.now() / 1000 ? o : null;
  } catch { return null; }
}
export async function hmacB64(secret, msg) {
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(msg)))));
}
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export const cookies = req => Object.fromEntries((req.headers.get('cookie') || '').split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)]; }));
export const setCookie = (n, v, max) => `${n}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${max}`;
export const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
export const getUser = ctx => verify(cookies(ctx.request).s404, ctx.env.SESSION_SECRET);
// CSRF: state-changing calls must come from our own origin.
export const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin;
export const fail = (e, code = 'server_error') => { console.error(String(e)); return json({ error: code }, 500); };
export async function rateLimit(env, id, max = 5) {
  const k = 'rl:' + id, n = parseInt((await env.ORDERS.get(k)) || '0', 10);
  if (n >= max) return false;
  await env.ORDERS.put(k, String(n + 1), { expirationTtl: 60 });
  return true;
}
