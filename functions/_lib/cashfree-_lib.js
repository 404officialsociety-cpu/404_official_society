import { hmacB64 } from './util.js';
import { createShopifyOrder } from './shopify.js';
import { createQikinkOrder } from './qikink.js';
export const cfBase = env => env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
export const cfHeaders = env => ({
  'content-type': 'application/json',
  'x-client-id': env.CASHFREE_APP_ID,
  'x-client-secret': env.CASHFREE_SECRET_KEY,
  'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01'
});
export async function cfGetOrder(env, id) {
  const r = await fetch(`${cfBase(env)}/orders/${encodeURIComponent(id)}`, { headers: cfHeaders(env) });
  if (!r.ok) throw new Error('cashfree_lookup_failed');
  return r.json();
}
async function syncShopify(env, o) {
  if (o.shopifyOrderId || !env.SHOPIFY_CLIENT_SECRET) return false;
  try { o.shopifyOrderId = await createShopifyOrder(env, o); o.shopifySync = 'OK'; }
  catch (e) { console.error(String(e)); o.shopifySync = 'FAILED'; }
  return true;
}
// Direct Qikink fulfilment. Leave QIKINK_DIRECT unset if the Qikink Shopify app already imports your Shopify orders, or you will print twice.
async function syncQikink(env, o) {
  if (env.QIKINK_DIRECT !== '1' || o.qikinkOrderId || o.qikinkSync === 'SKIP' || (o.qikinkTries || 0) >= 5) return false;
  if (!env.QIKINK_CLIENT_ID || !env.QIKINK_CLIENT_SECRET) return false;
  if (o.items.some(i => !i.sku)) { o.qikinkSync = 'SKIP'; return true; } // every Shopify variant needs its Qikink SKU in the SKU field
  o.qikinkTries = (o.qikinkTries || 0) + 1;
  try { o.qikinkOrderId = await createQikinkOrder(env, o); o.qikinkSync = 'OK'; }
  catch (e) { console.error(String(e)); o.qikinkSync = 'FAILED'; }
  return true;
}
// Server-side verification: asks Cashfree directly, never trusts the browser.
export async function settle(env, id, failedHint = false) {
  const raw = await env.ORDERS.get('order:' + id);
  if (!raw) return null;
  const o = JSON.parse(raw);
  if (o.orderStatus === 'PAID') {
    let changed = false;
    if (o.shopifySync === 'FAILED' && await syncShopify(env, o)) changed = true;
    if (await syncQikink(env, o)) changed = true;
    if (changed) await env.ORDERS.put('order:' + id, JSON.stringify(o));
    return o;
  }
  if (['REFUNDED', 'CANCELLED'].includes(o.orderStatus)) return o;
  const cf = await cfGetOrder(env, id);
  if (cf.order_status === 'PAID' && Math.round(Number(cf.order_amount) * 100) === Math.round(o.total * 100)) {
    o.paymentStatus = 'PAID'; o.orderStatus = 'PAID'; await syncShopify(env, o); await syncQikink(env, o);
  } else if (['EXPIRED', 'TERMINATED', 'TERMINATION_REQUESTED'].includes(cf.order_status) || failedHint) {
    o.paymentStatus = 'PAYMENT_FAILED'; o.orderStatus = 'PAYMENT_FAILED';
  } else return o;
  o.updatedAt = new Date().toISOString();
  await env.ORDERS.put('order:' + id, JSON.stringify(o));
  return o;
}
export { hmacB64 };
