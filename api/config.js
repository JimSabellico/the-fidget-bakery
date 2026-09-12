const prices = {
  'chocolate-chip-cookie': process.env.PRICE_CHOCOLATE_CHIP_COOKIE,
  'black-white-cookie': process.env.PRICE_BLACK_WHITE_COOKIE,
  'peanut-butter-cookie': process.env.PRICE_PEANUT_BUTTER_COOKIE,
  'chocolate-cupcake': process.env.PRICE_CHOCOLATE_CUPCAKE,
  'fortune-cookie': process.env.PRICE_FORTUNE_COOKIE,
  'lo-mein': process.env.PRICE_LO_MEIN,
  'california-roll': process.env.PRICE_CALIFORNIA_ROLL,
  'salmon-nigiri': process.env.PRICE_SALMON_NIGIRI,
  'soy-sauce': process.env.PRICE_SOY_SAUCE,
  'egg-roll': process.env.PRICE_EGG_ROLL,
  'dumpling': process.env.PRICE_DUMPLING
};

export default function handler(req, res) {
  const shipping = Number(process.env.SHIPPING_CENTS);
  const checkoutReady = Boolean(process.env.STRIPE_SECRET_KEY) && Number.isInteger(shipping) && shipping >= 0;
  const available = Object.fromEntries(Object.entries(prices)
    .filter(([, value]) => checkoutReady && Number.isInteger(Number(value)) && Number(value) >= 50)
    .map(([id, value]) => [id, Number(value)]));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ available, contactReady: Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL) });
}
