import { json, sameOrigin, setCookie } from '../../_lib/util.js';
export function onRequestPost({ request }) {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': setCookie('s404', '', 0) });
}
