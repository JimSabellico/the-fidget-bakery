import { catalog } from '../catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const id = String(req.body?.id || '');
  const product = catalog.find(item => item.id === id);
  const price = product?.priceCents;
  const shipping = Number(process.env.SHIPPING_CENTS);
  if (!product) return res.status(400).json({ error: 'Please choose a valid item.' });
  if (!process.env.STRIPE_SECRET_KEY || !Number.isInteger(price) || price < 50 || !Number.isInteger(shipping) || shipping < 0) {
    return res.status(503).json({ error: 'Online checkout is being set up. Please request this item below and we will get back to you.' });
  }
  const origin = req.headers.origin || `https://${req.headers.host}`;
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': product.name,
    'line_items[0][price_data][unit_amount]': String(price),
    'line_items[0][quantity]': '1',
    'shipping_address_collection[allowed_countries][0]': 'US',
    'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(shipping),
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
    'shipping_options[0][shipping_rate_data][display_name]': 'US shipping',
    success_url: `${origin}/?ordered=1`,
    cancel_url: `${origin}/${product.category}/${product.id}`,
    'metadata[product_id]': id
  });
  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error?.message || 'Unable to start checkout.');
    return res.status(200).json({ url: data.url });
  } catch (error) {
    return res.status(502).json({ error: 'Checkout is temporarily unavailable. Please send us a message.' });
  }
}
