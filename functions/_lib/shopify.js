async function adminToken(env) {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) throw new Error('shopify_not_configured');
  const cached = await env.ORDERS.get('shopify_token');
  if (cached) return cached;
  const r = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET, grant_type: 'client_credentials' })
  });
  if (!r.ok) throw new Error('shopify_token_' + r.status);
  const j = await r.json();
  if (!j.access_token) throw new Error('shopify_token_missing');
  await env.ORDERS.put('shopify_token', j.access_token, { expirationTtl: Math.max(60, (j.expires_in || 86399) - 600) });
  return j.access_token;
}

export async function shopify(env, query, variables = {}) {
  const token = await adminToken(env);
  const r = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION || '2025-07'}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables })
  });
  if (r.status === 401 || r.status === 403) { await env.ORDERS.delete('shopify_token'); throw new Error('shopify_auth'); }
  if (!r.ok) throw new Error('shopify_http_' + r.status);
  const j = await r.json();
  if (j.errors) throw new Error('shopify_graphql ' + JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

export async function createShopifyOrder(env, o) {
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
  const d = await shopify(env, 'mutation($order:OrderCreateOrderInput!){orderCreate(order:$order){order{id name} userErrors{field message}}}', { order });
  const res = d.orderCreate;
  if (!res?.order || res.userErrors?.length) throw new Error('shopify_order_sync_failed ' + JSON.stringify(res?.userErrors));
  return res.order.id;
}
