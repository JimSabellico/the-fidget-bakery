import { catalog } from '../catalog.js';

export default function handler(req, res) {
  const shipping = Number(process.env.SHIPPING_CENTS);
  const checkoutReady = Boolean(process.env.STRIPE_SECRET_KEY) && Number.isInteger(shipping) && shipping >= 0;
  const available = Object.fromEntries(catalog
    .filter(item => checkoutReady && Number.isInteger(item.priceCents) && item.priceCents >= 50)
    .map(item => [item.id, item.priceCents]));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ available, contactReady: Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL) });
}
