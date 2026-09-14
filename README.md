# The Fidget Bakery

Static Vercel site with real customer-supplied fidget photos and clearly labeled placeholders for unphotographed products, Stripe Checkout for physical orders, a self-serve teacher pack builder, and Resend email delivery for custom-order and contact forms.

The `/where-to-buy` page links direct shopping, the MakerWorld print files, the Ko-fi commercial license, and a directory of opted-in licensed makers. The directory starts empty because no makers have been nominated yet. Add verified shops to `makers.js` only after they agree to appear and their active license is checked. The maker application uses the Resend contact endpoint once email delivery is configured.

The `/share-the-fun` page describes the referral pilot: after a paid order, the buyer can copy a personal link from the order confirmation. A later paid order through that link sends the original buyer a one-use $5 promotion code, valid on a future merchandise order of at least $25. Self-referrals by matching email are ignored. Each paid referred order can issue one reward. The site says “opening soon” until the required live secrets are set.

## Local preview

`npm run dev` opens the site on port 3000. `npm run check` validates the JavaScript.

## Launch configuration

Add the values shown in `.env.example` to the Vercel project. Fidgets are $8 and Wiggles are $5, set in `catalog.js`. Teacher packs are $60 for exactly 10 fidgets, set in `teacher-pack.js`; a pack may be ten of one design, a surprise assortment, or a validated custom mix. A cart can go to Checkout when `STRIPE_SECRET_KEY` is configured. Checkout collects a US shipping address and sends the buyer to Stripe's hosted payment page. U.S. shipping is $5, or free when the merchandise subtotal is over $25. Shipping and threshold are set in `catalog.js`.

For form delivery, use a verified Resend sending domain and set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` in Vercel. The contact endpoint accepts only validated input and sends an email with the visitor's address as the reply-to. Do not place these secrets in the repo.

For referrals, set `STRIPE_WEBHOOK_SECRET` for a Stripe webhook at `https://the-fidget-bakery.vercel.app/api/stripe-webhook`. Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. The webhook verifies Stripe's signature on the raw request body, checks the payment is paid, retrieves the current Checkout Session, and issues the code through Stripe with idempotent API requests. It sends the reward through Resend. Set `SITE_URL` to the public site origin if a custom domain is used. Test a live order and referral end to end before promoting the program. Sending requires a verified Resend domain; a Gmail inbox can receive inquiries but cannot be used as the sender without control of that domain.

The catalog is in `catalog.js`, based on the owner's confirmed product list. Seven fidgets use studio-enhanced versions of owner-supplied photos; the original photos remain in `assets/` for reference. Two display photo-coming-soon artwork until real photos are available. The Wiggle images remain illustrations and are labeled as such on product pages. Update it as products and inventory change. The $10/month license links to the existing Ko-fi tier, which remains the source of truth for terms and billing.
