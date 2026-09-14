function clean(value, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const requestedKind = req.body?.kind;
  const kind = ['message', 'custom', 'teacher', 'maker'].includes(requestedKind) ? requestedKind : 'message';
  const name = clean(req.body?.name, 100);
  const email = clean(req.body?.email, 160);
  const message = clean(req.body?.message, 3000);
  const details = clean(req.body?.details, 2000);
  if (req.body?.website) return res.status(200).json({ ok: true });
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return res.status(400).json({ error: 'Please add your name, a valid email, and your message.' });
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL || !process.env.CONTACT_FROM_EMAIL) return res.status(503).json({ error: 'The form is being connected. Please use our MakerWorld or Ko-fi links for now.' });
  const label = kind === 'custom' ? 'Custom order' : kind === 'teacher' ? 'Teacher discount request' : kind === 'maker' ? 'Licensed maker listing request' : 'Message';
  const body = `${label.toUpperCase()}\n\nName: ${name}\nEmail: ${email}\nDetails: ${details || 'None provided'}\n\nMessage:\n${message}`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.CONTACT_FROM_EMAIL, to: [process.env.CONTACT_TO_EMAIL], reply_to: email, subject: `${label} from ${name} — The Fidget Bakery`, text: body })
    });
    if (!response.ok) throw new Error('Email delivery failed.');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Your message could not be sent right now. Please try again soon.' });
  }
}
