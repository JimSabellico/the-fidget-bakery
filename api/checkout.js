import { catalog, shippingCents, freeShippingOverCents } from '../catalog.js';
import { normalizeTeacherPack, teacherPackDescription, teacherPackMetadata, teacherPackPriceCents } from '../teacher-pack.js';
import { paidReferrer, referralsReady, stripeRequest } from '../lib/stripe.js';

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
  const origin = process.env.SITE_URL || 'https://www.thefidgetbakery.com';
  const body = new URLSearchParams({
    mode: 'payment',
    customer_creation: 'always',
    'shipping_address_collection[allowed_countries][0]': 'US',
    'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(shipping),
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
    'shipping_options[0][shipping_rate_data][display_name]': shipping === 0 ? 'Free US shipping' : 'US shipping',
    'allow_promotion_codes': 'true',
    'metadata[shop]': 'fidget-bakery',
    success_url: `${origin}/?ordered=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`
  });
  const referrerId = String(req.body?.referrer || '');
  if (referrerId && referralsReady()) {
    try {
      const referrer = await paidReferrer(referrerId);
      if (referrer) body.set('metadata[referrer_customer]', referrer.id);
    } catch { /* A stale referral link should not prevent an ordinary order. */ }
  }
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
    const data = await stripeRequest('/checkout/sessions', { method: 'POST', body });
    if (!data.url) throw new Error('Unable to start checkout.');
    return res.status(200).json({ url: data.url });
  } catch {
    return res.status(502).json({ error: 'Checkout is temporarily unavailable. Please try again soon.' });
  }
}
