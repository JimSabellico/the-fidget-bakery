const stripeBase = 'https://api.stripe.com/v1';

export async function stripeRequest(path, { method = 'GET', body, idempotencyKey } = {}) {
  const response = await fetch(`${stripeBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
    },
    body
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Stripe request failed.');
  return result;
}

export function referralsReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);
}

export async function paidReferrer(customerId) {
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) return null;
  const customer = await stripeRequest(`/customers/${encodeURIComponent(customerId)}`);
  if (customer.deleted || !customer.email) return null;
  const sessions = await stripeRequest(`/checkout/sessions?customer=${encodeURIComponent(customerId)}&limit=100`);
  if (!sessions.data?.some(session => session.payment_status === 'paid' && session.metadata?.shop === 'fidget-bakery')) return null;
  return customer;
}
