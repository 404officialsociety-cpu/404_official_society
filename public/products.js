import { shopify } from '../_lib/shopify.js';
import { json } from '../_lib/util.js';
const Q = (img, n) => `query($after:String){ products(first: ${n}, after: $after, sortKey: CREATED_AT, reverse: true, query: "status:active") {
  pageInfo { hasNextPage endCursor }
  nodes {
  handle title description tags
  featuredMedia { preview { image { url altText } } }
  collections(first: 3) { nodes { handle } }
  variants(first: 50) { nodes { id title availableForSale price compareAtPrice ${img} selectedOptions { name value } } } } } }`;
// Each call returns one page. The storefront keeps asking for the next page until all products (up to 1000) are loaded.
export async function onRequestGet({ request, env }) {
  const after = new URL(request.url).searchParams.get('after') || null;
  if (after && !/^[\w=+\/-]{1,300}$/.test(after)) return json({ error: 'bad_request' }, 400);
  try {
    let d, err;
    for (const [img, n] of [['image { url }', 50], ['', 50], ['', 20]]) {
      try { d = await shopify(env, Q(img, n), { after }); break; }
      catch (e) { if (!String(e.message).startsWith('shopify_graphql')) throw e; err = e; }
    }
    if (!d) throw err;
    const pg = d.products.pageInfo;
    const products = d.products.nodes.map(p => ({
      ...p,
      featuredImage: p.featuredMedia?.preview?.image || null,
      variants: { nodes: p.variants.nodes.map(v => ({ ...v, price: { amount: v.price }, compareAtPrice: v.compareAtPrice ? { amount: v.compareAtPrice } : null })) }
    }));
    return json({ products, next: pg.hasNextPage ? pg.endCursor : null }, 200, { 'cache-control': 'public, max-age=30, s-maxage=60' });
  } catch (e) {
    console.error(String(e));
    return json({ error: 'products_unavailable', reason: env.DEBUG === '1' ? String(e.message).slice(0, 300) : String(e.message).split(' ')[0].slice(0, 40) }, 503);
  }
}
