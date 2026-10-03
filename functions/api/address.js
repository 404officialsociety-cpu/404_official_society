import { getUser, json } from '../_lib/util.js';
export async function onRequestGet(ctx) {
  const u = await getUser(ctx);
  if (!u) return json({ error: 'login_required' }, 401);
  return json({ address: JSON.parse((await ctx.env.ORDERS.get('addr:' + u.sub)) || 'null') });
}
