export async function shopify(env, query, variables = {}) {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) throw new Error('shopify_not_configured');
  const v = env.SHOPIFY_API_VERSION || '2025-07';
  const r = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/${v}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables })
  });
  if (r.status === 401 || r.status === 403) throw new Error('shopify_auth');
  if (!r.ok) throw new Error('shopify_http_' + r.status);
  const j = await r.json();
  if (j.errors) throw new Error('shopify_graphql');
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
