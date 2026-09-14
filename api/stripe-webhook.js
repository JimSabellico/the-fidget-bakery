import { createHmac, timingSafeEqual } from 'node:crypto';
import { paidReferrer, referralsReady, stripeRequest } from '../lib/stripe.js';

export const config = { api: { bodyParser: false } };

export function validStripeSignature(rawBody, header, secret, now = Date.now()) {
  const parts = String(header || '').split(',').map(part => part.trim().split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!Number.isInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300 || !signatures.length || !secret) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return signatures.some(signature => {
    const given = Buffer.from(signature || '', 'hex');
    return given.length === expectedBytes.length && timingSafeEqual(given, expectedBytes);
  });
}

async function sendReward(email, code, sessionId) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `referral-reward-${sessionId}`
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL,
      to: [email],
      subject: 'A $5 thank-you from The Fidget Bakery 🍪',
      text: `Your friend shopped The Fidget Bakery through your link! Use code ${code} for $5 off a future order of $25 or more in merchandise. This code works once and cannot be exchanged for cash. Shop at ${process.env.SITE_URL || 'https://the-fidget-bakery.vercel.app'}/fidgets. Thanks for sharing the fun!`
    })
  });
  if (!response.ok) throw new Error('Could not send referral reward.');
}

async function rewardReferral(session) {
  if (!referralsReady() || session.payment_status !== 'paid' || session.metadata?.referral_reward_sent === '1') return;
  const referrerId = session.metadata?.referrer_customer;
  if (!referrerId) return;
  const referrer = await paidReferrer(referrerId);
  if (!referrer) return;
  const buyerEmail = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
  if (!buyerEmail || buyerEmail === referrer.email.trim().toLowerCase()) return;
  let promotion;
  if (session.metadata?.referral_reward_promo) {
    promotion = await stripeRequest(`/promotion_codes/${encodeURIComponent(session.metadata.referral_reward_promo)}`);
  } else {
    const coupon = await stripeRequest('/coupons', {
      method: 'POST',
      body: new URLSearchParams({ amount_off: '500', currency: 'usd', duration: 'once', name: 'Fidget Bakery referral thank-you', 'metadata[source_session]': session.id }),
      idempotencyKey: `fidget-referral-coupon-${session.id}`
    });
    promotion = await stripeRequest('/promotion_codes', {
      method: 'POST',
      body: new URLSearchParams({ 'promotion[type]': 'coupon', 'promotion[coupon]': coupon.id, max_redemptions: '1', 'restrictions[minimum_amount]': '2500', 'restrictions[minimum_amount_currency]': 'usd', 'metadata[source_session]': session.id }),
      idempotencyKey: `fidget-referral-promo-${session.id}`
    });
    await stripeRequest(`/checkout/sessions/${encodeURIComponent(session.id)}`, {
      method: 'POST',
      body: new URLSearchParams({ 'metadata[referral_reward_promo]': promotion.id })
    });
  }
  await sendReward(referrer.email, promotion.code, session.id);
  await stripeRequest(`/checkout/sessions/${encodeURIComponent(session.id)}`, {
    method: 'POST',
    body: new URLSearchParams({ 'metadata[referral_reward_sent]': '1' })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook is not configured.' });
  const chunks = [];
  let bodySize = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bodySize += bytes.length;
    if (bodySize > 1_000_000) return res.status(413).json({ error: 'Payload too large.' });
    chunks.push(bytes);
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!validStripeSignature(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) return res.status(400).json({ error: 'Invalid signature.' });
  let event;
  try { event = JSON.parse(rawBody); } catch { return res.status(400).json({ error: 'Invalid event.' }); }
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return res.status(200).json({ received: true });
  try {
    const sessionId = event.data?.object?.id;
    if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId || '')) return res.status(400).json({ error: 'Invalid session.' });
    const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.metadata?.shop === 'fidget-bakery') await rewardReferral(session);
    return res.status(200).json({ received: true });
  } catch {
    return res.status(500).json({ error: 'Could not process the referral yet.' });
  }
}
