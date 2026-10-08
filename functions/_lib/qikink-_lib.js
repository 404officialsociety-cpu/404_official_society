// Sends a paid order straight to Qikink. Only used when QIKINK_DIRECT = "1".
const base = env => env.QIKINK_ENV === 'live' ? 'https://api.qikink.com' : 'https://sandbox.qikink.com';
async function token(env) {
  const r = await fetch(base(env) + '/api/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ClientId: env.QIKINK_CLIENT_ID, client_secret: env.QIKINK_CLIENT_SECRET }) });
  const d = await r.json().catch(() => ({}));
  if (!d.Accesstoken) throw new Error('qikink_auth_' + r.status);
  return d.Accesstoken;
}
export async function createQikinkOrder(env, o) {
  const a = o.shippingAddress, [first, ...rest] = a.name.split(' ');
  const body = { order_number: o.id.replace(/[^A-Za-z0-9]/g, '').slice(-15), qikink_shipping: '1', gateway: 'Prepaid', total_order_value: String(o.subtotal),
    line_items: o.items.map(i => ({ search_from_my_products: 1, quantity: String(i.quantity), price: String(i.unitPrice), sku: i.sku })),
    shipping_address: { first_name: first, last_name: rest.join(' ') || '-', address1: a.line1, address2: '', phone: a.phone, email: o.email, city: a.city, zip: a.pin, province: a.state, country_code: 'IN' } };
  const r = await fetch(base(env) + '/api/order/create', { method: 'POST', headers: { 'content-type': 'application/json', ClientId: env.QIKINK_CLIENT_ID, Accesstoken: await token(env) }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error || d.status === false) throw new Error('qikink_' + r.status + ' ' + JSON.stringify(d).slice(0, 160));
  return String(d.order_id || d.id || d.order_no || 'OK');
}
