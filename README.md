# The Fidget Bakery

Static Vercel site with real customer-supplied fidget photos and clearly labeled placeholders for unphotographed products, Stripe Checkout for physical orders, a self-serve teacher pack builder, and Resend email delivery for custom-order and contact forms.

## Local preview

`npm run dev` opens the site on port 3000. `npm run check` validates the JavaScript.

## Launch configuration

Add the values shown in `.env.example` to the Vercel project. Fidgets are $8 and Wiggles are $5, set in `catalog.js`. Teacher packs are $60 for exactly 10 fidgets, set in `teacher-pack.js`; a pack may be ten of one design, a surprise assortment, or a validated custom mix. A cart can go to Checkout when `STRIPE_SECRET_KEY` is configured. Checkout collects a US shipping address and sends the buyer to Stripe's hosted payment page. U.S. shipping is $5, or free when the merchandise subtotal is over $25. Shipping and threshold are set in `catalog.js`.

For form delivery, use a verified Resend sending domain and set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` in Vercel. The contact endpoint accepts only validated input and sends an email with the visitor's address as the reply-to. Do not place these secrets in the repo.

The catalog is in `catalog.js`, based on the owner's confirmed product list. Six fidgets use owner-supplied photos; three display photo-coming-soon artwork until real photos are available. The Wiggle images remain illustrations and are labeled as such on product pages. Update it as products and inventory change. The $10/month license links to the existing Ko-fi tier, which remains the source of truth for terms and billing.
