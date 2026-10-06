import { shopify } from '../_lib/shopify.js';
import { json } from '../_lib/util.js';
const Q = img => `{ products(first: 60, sortKey: CREATED_AT, reverse: true, query: "status:active") { nodes {
  handle title description tags
  featuredMedia { preview { image { url altText } } }
  collections(first: 3) { nodes { handle } }
  variants(first: 50) { nodes { id title availableForSale price compareAtPrice ${img} selectedOptions { name value } } } } } }`;
export async function onRequestGet({ env }) {
  try {
    let d;
    try { d = await shopify(env, Q('image { url }')); }
    catch (e) { if (e.message !== 'shopify_graphql') throw e; d = await shopify(env, Q('')); }
    const products = d.products.nodes.map(p => ({
      ...p,
      featuredImage: p.featuredMedia?.preview?.image || null,
      variants: { nodes: p.variants.nodes.map(v => ({ ...v, price: { amount: v.price }, compareAtPrice: v.compareAtPrice ? { amount: v.compareAtPrice } : null })) }
    }));
    return json({ products }, 200, { 'cache-control': 'public, max-age=30, s-maxage=60' });
  } catch (e) {
    console.error(String(e));
    return json({ error: 'products_unavailable', reason: String(e.message).split(' ')[0].slice(0, 40) }, 503);
  }
}
