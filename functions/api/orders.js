import { getUser, json, fail } from '../_lib/util.js';
import { settle } from '../_lib/cashfree.js';
const pub = o => ({ id: o.id, items: o.items, subtotal: o.subtotal, shipping: o.shipping, total: o.total, status: o.orderStatus, paymentStatus: o.paymentStatus, shippingAddress: o.shippingAddress, createdAt: o.createdAt, updatedAt: o.updatedAt });
export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const user = await getUser(ctx);
  if (!user) return json({ error: 'login_required' }, 401);
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      if (!/^[\w-]{1,50}$/.test(id)) return json({ error: 'not_found' }, 404);
      let o = await settle(env, id).catch(() => null) ?? JSON.parse((await env.ORDERS.get('order:' + id)) || 'null');
      // Owner check: other customers' orders look like they do not exist.
      if (!o || o.customerId !== user.sub) return json({ error: 'not_found' }, 404);
      return json({ order: pub(o) });
    }
    const keys = (await env.ORDERS.list({ prefix: `uo:${user.sub}:`, limit: 50 })).keys;
    const orders = (await Promise.all(keys.map(k => env.ORDERS.get('order:' + k.name.split(':')[2])))).filter(Boolean).map(r => pub(JSON.parse(r)));
    return json({ orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  } catch (e) { return fail(e); }
}
