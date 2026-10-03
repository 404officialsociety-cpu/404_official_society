import { shopify } from './_lib/shopify.js';
export async function onRequestGet({ request, env }) {
  const site = (env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  let hs = [];
  try { hs = (await shopify(env, '{products(first:250){nodes{handle}}}')).products.nodes.map(n => n.handle); } catch (e) { console.error(String(e)); }
  const paths = ['/', '/shop', '/collections', '/about', '/page/faq', '/page/contact', '/page/privacy', '/page/terms', '/page/shipping', '/page/refund', ...hs.map(h => '/p/' + encodeURIComponent(h))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${site}${p}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' } });
}
