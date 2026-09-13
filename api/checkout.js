import { catalog, shippingCents, freeShippingOverCents } from '../catalog.js';
import { normalizeTeacherPack, teacherPackDescription, teacherPackMetadata, teacherPackPriceCents } from '../teacher-pack.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const requested = req.body?.items;
  if (!Array.isArray(requested) || requested.length < 1 || requested.length > 20) {
    return res.status(400).json({ error: 'Please add an item to your bag.' });
  }
  const seen = new Set();
  const items = [];
  for (const entry of requested) {
    if (entry?.kind === 'teacher-pack') {
      const pack = normalizeTeacherPack(entry.pack);
      if (!pack) return res.status(400).json({ error: 'Please check the ten fidgets in your teacher pack.' });
      items.push({ kind: 'teacher-pack', pack });
      continue;
    }
    const id = String(entry?.id || '');
    const quantity = Number(entry?.quantity);
    const product = catalog.find(item => item.id === id);
    if (!product || seen.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: 'Please check the items and quantities in your bag.' });
    }
    seen.add(id);
    items.push({ kind: 'product', product, quantity });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Online checkout is being connected. Please check back soon.' });
  }
  const subtotal = items.reduce((sum, entry) => sum + (entry.kind === 'teacher-pack' ? teacherPackPriceCents : entry.product.priceCents * entry.quantity), 0);
  const shipping = subtotal > freeShippingOverCents ? 0 : shippingCents;
  const origin = process.env.SITE_URL || 'https://the-fidget-bakery.vercel.app';
  const body = new URLSearchParams({
    mode: 'payment',
    'shipping_address_collection[allowed_countries][0]': 'US',
    'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(shipping),
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
    'shipping_options[0][shipping_rate_data][display_name]': shipping === 0 ? 'Free US shipping' : 'US shipping',
    'allow_promotion_codes': 'true',
    success_url: `${origin}/?ordered=1`,
    cancel_url: `${origin}/cart`
  });
  let packNumber = 0;
  items.forEach((entry, index) => {
    const isPack = entry.kind === 'teacher-pack';
    const name = isPack ? 'Teacher Fidget Pack (10 fidgets)' : entry.product.name;
    const price = isPack ? teacherPackPriceCents : entry.product.priceCents;
    const quantity = isPack ? 1 : entry.quantity;
    body.set(`line_items[${index}][price_data][currency]`, 'usd');
    body.set(`line_items[${index}][price_data][product_data][name]`, name);
    if (isPack) {
      body.set(`line_items[${index}][price_data][product_data][description]`, teacherPackDescription(entry.pack));
      body.set(`metadata[teacher_pack_${++packNumber}]`, teacherPackMetadata(entry.pack));
    }
    body.set(`line_items[${index}][price_data][unit_amount]`, String(price));
    body.set(`line_items[${index}][quantity]`, String(quantity));
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
  } catch {
    return res.status(502).json({ error: 'Checkout is temporarily unavailable. Please try again soon.' });
  }
}
