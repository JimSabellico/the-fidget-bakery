import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import webhook, { validStripeSignature } from '../api/stripe-webhook.js';

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

function signedRequest(event, secret) {
  const raw = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  return { method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, async *[Symbol.asyncIterator]() { yield Buffer.from(raw); } };
}

test('rejects an altered Stripe webhook payload', () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', 'whsec_test').update(`${timestamp}.original`).digest('hex');
  assert.equal(validStripeSignature('changed', `t=${timestamp},v1=${signature}`, 'whsec_test'), false);
});

test('a paid referral issues one $5 code with a $25 minimum and emails the original buyer', async () => {
  const previousEnv = { ...process.env };
  const previousFetch = global.fetch;
  Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test_mock', STRIPE_WEBHOOK_SECRET: 'whsec_test', RESEND_API_KEY: 're_test', CONTACT_FROM_EMAIL: 'Bakery <hello@example.com>', SITE_URL: 'https://example.com' });
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    const path = new URL(url).pathname;
    let body;
    if (path === '/v1/checkout/sessions/cs_test_friend') body = options.method === 'POST' ? { id: 'cs_test_friend' } : { id: 'cs_test_friend', payment_status: 'paid', customer_details: { email: 'friend@example.com' }, metadata: { shop: 'fidget-bakery', referrer_customer: 'cus_original' } };
    else if (path === '/v1/customers/cus_original') body = { id: 'cus_original', email: 'original@example.com' };
    else if (path === '/v1/checkout/sessions') body = { data: [{ payment_status: 'paid', metadata: { shop: 'fidget-bakery' } }] };
    else if (path === '/v1/coupons') body = { id: 'coupon_reward' };
    else if (path === '/v1/promotion_codes') body = { id: 'promo_reward', code: 'TREAT5' };
    else if (path === '/emails') body = { id: 'email_reward' };
    else throw new Error(`Unexpected URL: ${url}`);
    return { ok: true, async json() { return body; } };
  };
  try {
    const event = { type: 'checkout.session.completed', data: { object: { id: 'cs_test_friend' } } };
    const result = await webhook(signedRequest(event, 'whsec_test'), response());
    assert.equal(result.statusCode, 200);
    const coupon = calls.find(call => call.url.endsWith('/v1/coupons'));
    const promotion = calls.find(call => call.url.endsWith('/v1/promotion_codes'));
    const email = calls.find(call => call.url.endsWith('/emails'));
    assert.equal(coupon.options.body.get('amount_off'), '500');
    assert.equal(promotion.options.body.get('max_redemptions'), '1');
    assert.equal(promotion.options.body.get('promotion[type]'), 'coupon');
    assert.equal(promotion.options.body.get('promotion[coupon]'), 'coupon_reward');
    assert.equal(promotion.options.body.get('restrictions[minimum_amount]'), '2500');
    assert.deepEqual(JSON.parse(email.options.body).to, ['original@example.com']);
    assert.match(JSON.parse(email.options.body).text, /TREAT5/);
  } finally {
    global.fetch = previousFetch;
    process.env = previousEnv;
  }
});
