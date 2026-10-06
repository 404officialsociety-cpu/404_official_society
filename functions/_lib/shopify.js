const dom = env => String(env.SHOPIFY_STORE_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');

async function adminToken(env) {
  const id = String(env.SHOPIFY_CLIENT_ID || '').trim(), secret = String(env.SHOPIFY_CLIENT_SECRET || '').trim();
  if (!dom(env) || !id || !secret) throw new Error('shopify_not_configured');
  try { const c = await env.ORDERS?.get('shopify_token'); if (c) return c; } catch {}
  const r = await fetch(`https://${dom(env)}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' })
  });
  if (!r.ok) { let b = ''; try { b = (await r.text()).slice(0, 120); } catch {} throw new Error('shopify_token_' + r.status + ' ' + b); }
  const j = await r.json();
  if (!j.access_token) throw new Error('shopify_token_missing');
  try { await env.ORDERS?.put('shopify_token', j.access_token, { expirationTtl: Math.max(60, (j.expires_in || 86399) - 600) }); } catch {}
  return j.access_token;
}

export async function shopify(env, query, variables = {}) {
  const token = await adminToken(env);
  const r = await fetch(`https://${dom(env)}/admin/api/${env.SHOPIFY_API_VERSION || '2025-07'}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables })
  });
  if (r.status === 401 || r.status === 403) { try { await env.ORDERS?.delete('shopify_token'); } catch {} throw new Error('shopify_auth'); }
  if (!r.ok) throw new Error('shopify_http_' + r.status);
  const j = await r.json();
  if (j.errors) throw new Error('shopify_graphql ' + JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

export async function createShopifyOrder(env, o) {
  if (!env.SHOPIFY_ADMIN_ACCESS_TOKEN || !env.SHOPIFY_STORE_DOMAIN) return null;
  const a = o.shippingAddress, [first, ...rest] = a.name.split(' ');
  const money = n => ({ shopMoney: { amount: String(n), currencyCode: 'INR' } });
  const order = {
    currency: 'INR', financialStatus: 'PAID', sourceName: '404-society-web', email: o.email,
    note: 'Cashfree order ' + o.cashfreeOrderId,
    lineItems: o.items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
    shippingAddress: { firstName: first, lastName: rest.join(' ') || '-', address1: a.line1, city: a.city, province: a.state, zip: a.pin, countryCode: 'IN', phone: '+91' + a.phone },
    shippingLines: [{ title: 'Shipping', priceSet: money(o.shipping) }],
    transactions: [{ kind: 'SALE', status: 'SUCCESS', gateway: 'Cashfree', amountSet: money(o.total) }]
  };
  const r = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION || '2025-07'}/graphql.json`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN },
    body: JSON.stringify({ query: 'mutation($order:OrderCreateOrderInput!){orderCreate(order:$order){order{id name} userErrors{field message}}}', variables: { order } })
  });
  const j = await r.json(), res = j?.data?.orderCreate;
  if (!r.ok || j.errors || !res?.order || res.userErrors?.length) throw new Error('shopify_order_sync_failed ' + JSON.stringify(res?.userErrors || j.errors || r.status));
  return res.order.id;
}
