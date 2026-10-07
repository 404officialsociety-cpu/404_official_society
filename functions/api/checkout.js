import { shopify } from '../_lib/shopify.js';
import { cfBase, cfHeaders } from '../_lib/cashfree.js';
import { getUser, json, sameOrigin, rateLimit, fail } from '../_lib/util.js';

const Q = `query($ids:[ID!]!){ nodes(ids:$ids){ ... on ProductVariant { id title availableForSale price product{ title } } } }`;
const str = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const user = await getUser(ctx);
  if (!user) return json({ error: 'login_required' }, 401);
  if (!(await rateLimit(env, user.sub))) return json({ error: 'rate_limited', message: 'Too many attempts. Try again in a minute.' }, 429);
  let b; try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const a = b.address || {};
  if (!str(a.name, 2, 80) || !/^[6-9]\d{9}$/.test(a.phone || '') || !str(a.line1, 5, 200) || !str(a.city, 2, 80) || !str(a.state, 2, 80) || !/^\d{6}$/.test(a.pin || ''))
    return json({ error: 'invalid_address', message: 'Check your name, 10-digit phone and address.' }, 400);
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30);
  if (!items.length || items.some(i => !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(i.id || '') || !Number.isInteger(i.q) || i.q < 1 || i.q > 10))
    return json({ error: 'invalid_cart', message: 'Your cart could not be verified.' }, 400);

  try {
    const d = await shopify(env, Q, { ids: [...new Set(items.map(i => i.id))] });
    const map = new Map(d.nodes.filter(Boolean).map(n => [n.id, n]));
    let paise = 0; const lines = [];
    for (const i of items) {
      const v = map.get(i.id);
      if (!v || !v.availableForSale) return json({ error: 'unavailable', message: 'An item in your cart is no longer available.' }, 409);
      const p = Math.round(parseFloat(v.price) * 100);
      paise += p * i.q;
      lines.push({ variantId: v.id, product: v.product.title, variant: v.title, quantity: i.q, unitPrice: p / 100 });
    }
    const shipPaise = paise > 200000 ? 6900 : 0;
    const total = (paise + shipPaise) / 100;
    const id = 'ORD_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const site = env.PUBLIC_SITE_URL || new URL(request.url).origin;
    const now = new Date().toISOString();
    const order = { id, customerId: user.sub, email: user.email, cashfreeOrderId: id, shopifyRefs: lines.map(l => l.variantId), items: lines,
      subtotal: paise / 100, shipping: shipPaise / 100, total, paymentStatus: 'CREATED', orderStatus: 'CREATED',
      shippingAddress: { name: a.name.trim(), phone: a.phone, line1: a.line1.trim(), city: a.city.trim(), state: a.state.trim(), pin: a.pin }, createdAt: now, updatedAt: now };
    await env.ORDERS.put('order:' + id, JSON.stringify(order));
    await env.ORDERS.put(`uo:${user.sub}:${id}`, '1');
    await env.ORDERS.put('addr:' + user.sub, JSON.stringify(order.shippingAddress));

    const r = await fetch(cfBase(env) + '/orders', { method: 'POST', headers: cfHeaders(env), body: JSON.stringify({
      order_id: id, order_amount: total, order_currency: 'INR',
      customer_details: { customer_id: user.sub.replace(/[^A-Za-z0-9_-]/g, ''), customer_name: order.shippingAddress.name, customer_email: user.email, customer_phone: a.phone },
      order_meta: { return_url: `${site}/?order_id={order_id}`, notify_url: `${site}/api/webhooks/cashfree` } }) });
    if (!r.ok) { console.error('cashfree_create', r.status); return json({ error: 'payment_unavailable', message: 'Payments are unavailable right now.' }, 502); }
    const cf = await r.json();
    order.paymentStatus = 'PAYMENT_PENDING'; order.orderStatus = 'PAYMENT_PENDING'; order.updatedAt = new Date().toISOString();
    await env.ORDERS.put('order:' + id, JSON.stringify(order));
    return json({ orderId: id, paymentSessionId: cf.payment_session_id, mode: env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox' });
  } catch (e) {
    return e.message === 'shopify_not_configured' ? json({ error: 'not_configured' }, 503) : fail(e);
  }
}
