import { getUser, json } from '../../_lib/util.js';
export async function onRequestGet(ctx) {
  const u = await getUser(ctx);
  return json({ user: u ? { name: u.name, email: u.email } : null });
}
