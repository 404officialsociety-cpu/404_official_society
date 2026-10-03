# 404 Society

Storefront on Cloudflare Pages: static site in `public/`, API in `functions/`.
Shopify (products) + Google OAuth (login) + Cashfree (payments). Not tested with live credentials.

## Setup
1. **Shopify**: create a custom app (or Headless channel) and copy the **Storefront** access token with scopes to read products, listings and tags. Set store currency to INR. Tag products `new` / `bestseller` for homepage sections; give variants a "Size" option.
2. **Google**: Cloud Console > Credentials > OAuth client (Web). Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/callback`.
3. **Cashfree**: get App ID and Secret Key (sandbox first). Dashboard > Webhooks: add `https://YOUR-DOMAIN/api/webhooks/cashfree` (payment success/failed events).
4. **Cloudflare Pages**: Workers & Pages > Create > connect this GitHub repo. Build command: none. Output directory: `public`.
5. **KV**: `npx wrangler kv namespace create ORDERS`, then bind it as `ORDERS` in Pages > Settings > Bindings (or uncomment in `wrangler.toml`).
6. **Secrets**: Pages > Settings > Environment variables, add everything in `.env.example` (`CASHFREE_ENVIRONMENT` = `SANDBOX` or `PRODUCTION`, `SESSION_SECRET` = 32+ random chars, `PUBLIC_SITE_URL` = your https URL, `GOOGLE_REDIRECT_URI` = the callback URL from step 2).
7. Add your custom domain in Pages > Custom domains.

## Local development
Copy `.env.example` to `.dev.vars`, fill it in, then: `npx wrangler pages dev public --kv ORDERS`
For local Google login, add `http://localhost:8788/api/auth/callback` as a redirect URI and set `GOOGLE_REDIRECT_URI` to match.

## Security notes
- Prices and availability are re-read from Shopify at checkout; the browser only sends variant IDs and quantities.
- Orders become PAID only after the server asks Cashfree for the order status and the amount matches.
- Webhooks are signature-checked and de-duplicated. KV is eventually consistent; for strict idempotency at scale move orders to D1 or a Durable Object.
- Add a Cloudflare rate-limiting rule for `/api/*`. `/api/checkout` also has a per-user limit.
- After payment is verified, the order is created in Shopify Admin (needs `SHOPIFY_ADMIN_ACCESS_TOKEN` with `write_orders`, kept as a Cloudflare secret). A failed sync is retried on the next webhook or order view. Two simultaneous confirmations could create a duplicate; check Shopify if unsure.
- Run tests with `npm test`. Submit `https://YOUR-DOMAIN/sitemap.xml` to Google Search Console and put your domain in `public/robots.txt`.
- Not included: Cashfree refunds (do these in the Cashfree dashboard), end-to-end browser tests.
