import { stripeRequest, referralsReady } from '../lib/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const sessionId = String(req.body?.sessionId || '');
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) return res.status(400).json({ error: 'Invalid order reference.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Order lookup is unavailable.' });
  try {
    const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.metadata?.shop !== 'fidget-bakery') return res.status(404).json({ error: 'Order not found.' });
    if (session.payment_status !== 'paid') return res.status(200).json({ paid: false });
    if (!referralsReady() || !/^cus_[A-Za-z0-9]+$/.test(session.customer || '')) return res.status(200).json({ paid: true, referralsReady: false });
    const origin = (process.env.SITE_URL || 'https://www.thefidgetbakery.com').replace(/\/$/, '');
    return res.status(200).json({ paid: true, referralsReady: true, link: `${origin}/share-the-fun?ref=${session.customer}` });
  } catch {
    return res.status(502).json({ error: 'We could not check this order yet. Please try again.' });
  }
}
