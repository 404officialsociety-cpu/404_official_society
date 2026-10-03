import { setCookie } from '../../_lib/util.js';
export function onRequestGet({ env }) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) return new Response('Google login is not configured', { status: 503 });
  const state = crypto.randomUUID();
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: env.GOOGLE_REDIRECT_URI, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  return new Response(null, { status: 302, headers: { location: u.toString(), 'set-cookie': setCookie('oas', state, 600) } });
}
