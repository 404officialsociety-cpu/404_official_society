import { hmacB64, safeEqual } from '../../_lib/util.js';
import { settle } from '../../_lib/cashfree.js';
export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  const ts = request.headers.get('x-webhook-timestamp'), sig = request.headers.get('x-webhook-signature');
  if (!ts || !sig || !env.CASHFREE_SECRET_KEY) return new Response('bad request', { status: 400 });
  if (!safeEqual(await hmacB64(env.CASHFREE_SECRET_KEY, ts + raw), sig)) return new Response('invalid signature', { status: 401 });
  let e; try { e = JSON.parse(raw); } catch { return new Response('bad request', { status: 400 }); }
  const oid = e?.data?.order?.order_id;
  if (!oid) return new Response('ok');
  const evKey = `evt:${oid}:${e.type}:${e?.data?.payment?.cf_payment_id || ts}`;
  if (await env.ORDERS.get(evKey)) return new Response('duplicate ignored');
  try {
    await settle(env, oid, e.type === 'PAYMENT_FAILED_WEBHOOK');
    await env.ORDERS.put(evKey, '1', { expirationTtl: 2592000 });
    return new Response('ok');
  } catch (err) {
    console.error(String(err));
    return new Response('retry', { status: 500 });
  }
}
