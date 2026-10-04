import * as google from './functions/api/auth/google.js';
import * as callback from './functions/api/auth/callback.js';
import * as me from './functions/api/auth/me.js';
import * as logout from './functions/api/auth/logout.js';
import * as products from './functions/api/products.js';
import * as checkout from './functions/api/checkout.js';
import * as orders from './functions/api/orders.js';
import * as address from './functions/api/address.js';
import * as webhook from './functions/api/webhooks/cashfree.js';
import * as sitemap from './functions/sitemap.xml.js';

const routes = {
  '/api/auth/google': google, '/api/auth/callback': callback, '/api/auth/me': me,
  '/api/auth/logout': logout, '/api/products': products, '/api/checkout': checkout,
  '/api/orders': orders, '/api/address': address, '/api/webhooks/cashfree': webhook,
  '/sitemap.xml': sitemap
};

export default {
  async fetch(request, env, ctx) {
    const m = routes[new URL(request.url).pathname];
    if (m) {
      const name = 'onRequest' + request.method[0] + request.method.slice(1).toLowerCase();
      const h = m[name];
      if (h) return h({ request, env, waitUntil: ctx.waitUntil.bind(ctx) });
      return new Response('Method not allowed', { status: 405 });
    }
    return env.ASSETS.fetch(request);
  }
};
