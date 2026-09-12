# The Fidget Bakery

Static Vercel site with real MakerWorld catalog images, Stripe Checkout for physical orders, and Resend email delivery for custom-order/contact forms.

## Local preview

`npm run dev` opens the site on port 3000. `npm run check` validates the JavaScript.

## Launch configuration

Add the values shown in `.env.example` to the Vercel project. Each product price is in cents. A product can go to Checkout only when its price, `STRIPE_SECRET_KEY`, and `SHIPPING_CENTS` are configured. Checkout collects a US shipping address and sends the buyer to Stripe's hosted payment page. Shipping is a flat rate configured in cents.

For form delivery, use a verified Resend sending domain and set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` in Vercel. The contact endpoint accepts only validated input and sends an email with the visitor's address as the reply-to. Do not place these secrets in the repo.

The catalog is in `catalog.js`, based on The Fidget Bakery's public MakerWorld profile. Update it as products and inventory change. The $10/month license links to the existing Ko-fi tier, which remains the source of truth for terms and billing.
