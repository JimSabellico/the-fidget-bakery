import { catalog, collections } from './catalog.js';

const page = document.querySelector('#page');
const toast = document.querySelector('#toast');
const path = location.pathname.replace(/\/+$/, '') || '/';
const segments = path.split('/').filter(Boolean);
let config = { available: {}, contactReady: false };

const money = cents => `$${(cents / 100).toFixed(0)}`;
const productUrl = item => `/${item.category}/${item.id}`;
const image = (item, className = '') => `<img class="${className}" src="${item.image}" alt="Illustration of ${item.name}" loading="lazy">`;
const sparkle = (className = '') => `<span class="sparkle ${className}" aria-hidden="true">✳</span>`;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 6000);
}

function crumb(label, href) { return `<a href="${href}">${label}</a><span aria-hidden="true">›</span>`; }

function productCard(item) {
  return `<a class="product-card" href="${productUrl(item)}" aria-label="View ${item.name}">
    <div class="product-image">${image(item)}<span class="price-sticker">${money(item.priceCents)}</span></div>
    <div class="product-card-copy"><span class="mini-label">${item.type}</span><h3>${item.name}</h3><p>${item.description}</p><span class="card-link">Meet this ${item.category === 'fidgets' ? 'fidget' : 'Wiggle'} <b>↗</b></span></div>
  </a>`;
}

function home() {
  const cookie = catalog[0], dumpling = catalog.find(item => item.id === 'dumpling');
  return `<section class="home-hero page-wrap">
    <div class="hero-copy"><span class="eyebrow">THE FIDGET BAKERY ✦ FRESHLY MADE FUN</span><h1>Little treats.<br><em>Big smiles.</em></h1><p>Playful, food-inspired 3D printed toys for busy hands and happy hearts.</p><div class="hero-actions"><a class="button button-pink" href="/fidgets">Shop fidgets <span>↗</span></a><a class="button button-cream" href="/wiggles">Meet the Wiggles <span>↗</span></a></div><div class="hero-small">✦ Made with heart by our family</div></div>
    <div class="hero-picture"><div class="hero-orbit"></div><div class="hero-pic hero-pic-cookie">${image(cookie)}</div><div class="hero-pic hero-pic-dumpling">${image(dumpling)}</div><span class="hero-sticker">FUN TO<br>FIDGET!</span>${sparkle('s-one')}${sparkle('s-two')}<span class="squiggle squiggle-hero" aria-hidden="true">〰</span></div>
  </section>
  <div class="marquee" aria-hidden="true"><div>SPIN IT ✦ SLIDE IT ✦ WIGGLE IT ✦ LOVE IT ✦ SPIN IT ✦ SLIDE IT ✦ WIGGLE IT ✦ LOVE IT ✦</div></div>
  <section class="home-choices page-wrap"><div class="section-title"><span class="eyebrow">PICK YOUR HAPPY</span><h2>What sounds <em>fun?</em></h2></div><div class="choice-grid">
    <a class="choice choice-fidgets" href="/fidgets"><div class="choice-copy"><span class="choice-number">01 / SPIN + SLIDE</span><h3>Fidgets</h3><p>Cookie spinners, sliders, and little moments of joy.</p><span class="choice-action">Explore fidgets <b>↗</b></span></div>${image(catalog[2])}${sparkle('choice-spark')}</a>
    <a class="choice choice-wiggles" href="/wiggles"><div class="choice-copy"><span class="choice-number">02 / CUTE + HAPPY</span><h3>Wiggles</h3><p>Meet the tiny food friends with big personalities.</p><span class="choice-action">Meet the Wiggles <b>↗</b></span></div>${image(dumpling)}${sparkle('choice-spark')}</a>
  </div></section>
  <section class="home-bottom page-wrap"><span class="home-bottom-icon" aria-hidden="true">✎</span><div><span class="eyebrow">HEY, TEACHERS!</span><h2>A little joy for <em>the classroom.</em></h2><p>Planning a classroom order? Ask us about special teacher pricing.</p></div><a class="button button-brown" href="/teachers">Teacher discounts <span>↗</span></a></section>`;
}

function collection(category) {
  const data = collections[category];
  const items = catalog.filter(item => item.category === category);
  return `<section class="collection-hero ${category}"><div class="page-wrap collection-hero-inner"><div><div class="breadcrumbs">${crumb('Home', '/')}<span>${data.name}</span></div><span class="eyebrow">${data.eyebrow}</span><h1>${data.title}</h1><p>${data.intro}</p><span class="collection-price">${data.price}</span></div><div class="collection-hero-art">${image(items[0])}<span class="collection-bubble">${category === 'fidgets' ? 'SPIN!' : 'HI!'}</span>${sparkle('collection-spark')}</div></div></section>
  <section class="collection-list page-wrap"><div class="list-heading"><div><span class="eyebrow">FRESH FROM THE BAKERY</span><h2>Meet every <em>${data.name.slice(0,-1)}.</em></h2></div><span>${items.length} little ${category === 'fidgets' ? 'joys' : 'friends'} to explore</span></div><div class="products-grid">${items.map(productCard).join('')}</div></section>
  <section class="collection-bottom page-wrap"><div><span class="eyebrow">DREAMING OF SOMETHING ELSE?</span><h2>We make custom ideas, too.</h2></div><a class="button button-pink" href="/custom">Request a custom order <span>↗</span></a></section>`;
}

function product(item) {
  const category = collections[item.category];
  const related = catalog.filter(candidate => candidate.category === item.category && candidate.id !== item.id).slice(0, 3);
  const enabled = Boolean(config.available[item.id]);
  return `<section class="product-page page-wrap"><div class="breadcrumbs">${crumb('Home','/')}${crumb(category.name,`/${item.category}`)}<span>${item.name}</span></div><div class="product-layout">
    <div class="product-main-image">${image(item)}<span class="image-spark image-spark-a" aria-hidden="true">✳</span><span class="image-spark image-spark-b" aria-hidden="true">✦</span></div>
    <div class="product-info"><span class="eyebrow">${item.category === 'fidgets' ? 'FRESH FROM THE FIDGET COUNTER' : 'A LITTLE WIGGLE FRIEND'}</span><h1>${item.name}</h1><div class="product-price">${money(item.priceCents)} <span>each</span></div><p class="product-lead">${item.detail}</p><div class="product-points"><div><span>✦</span> Family-made 3D printed fun</div><div><span>✦</span> Food-inspired, never edible</div><div><span>✦</span> A sweet little gift or desk companion</div></div>
    ${enabled ? `<button class="button button-pink buy-button" data-buy="${item.id}">Buy now <span>↗</span></button>` : `<div class="setup-note"><strong>Online checkout is being set up.</strong><span>We’ll open orders here soon. You can still explore the design below.</span></div>`}
    <a class="quiet-link" href="${item.makerworld}" target="_blank" rel="noopener noreferrer">See the original design on MakerWorld ↗</a><p class="image-note">Images are custom visualizations. Final 3D prints may vary slightly in color and finish.</p></div>
  </div></section><section class="related page-wrap"><div class="list-heading"><div><span class="eyebrow">KEEP EXPLORING</span><h2>More ${category.name.toLowerCase()} to <em>love.</em></h2></div><a href="/${item.category}">See all ${category.name} ↗</a></div><div class="products-grid">${related.map(productCard).join('')}</div></section>`;
}

function form(kind) {
  const teacher = kind === 'teacher', custom = kind === 'custom';
  const heading = teacher ? 'Tell us about your classroom' : custom ? 'Tell us your idea' : 'Drop us a note';
  const field = teacher ? `<label>School or organization<input name="school" placeholder="Your school or program" autocomplete="organization" required></label><label>What would you like for your classroom?<textarea name="message" rows="4" placeholder="Which fidgets or Wiggles, how many, and when do you need them?" required></textarea></label>` : custom ? `<label>What are you dreaming up?<select name="details"><option value="">Choose a starting point</option><option>Custom fidget</option><option>Party favors or bulk order</option><option>Personalized gift</option><option>Something else</option></select></label><label>Tell us more<textarea name="message" rows="4" placeholder="Colors, quantity, timing, inspiration..." required></textarea></label>` : `<label>Your message<textarea name="message" rows="4" placeholder="What's on your mind?" required></textarea></label>`;
  return `<form class="form-card" data-kind="${kind}"><h2>${heading} <span>✳</span></h2><div class="form-row"><label>Your name<input name="name" placeholder="Your name" autocomplete="name" required></label><label>Email address<input name="email" type="email" placeholder="you@example.com" autocomplete="email" required></label></div>${field}<input class="honey" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="button button-pink" type="submit">${teacher ? 'Ask for teacher pricing' : custom ? 'Send my idea' : 'Send message'} <span>↗</span></button><p class="form-status" role="status"></p></form>`;
}

function teachers() {
  return `<section class="info-hero teachers-hero"><div class="page-wrap info-hero-inner"><div><div class="breadcrumbs">${crumb('Home','/')}<span>For teachers</span></div><span class="eyebrow">A LITTLE EXTRA FOR EDUCATORS ✦</span><h1>Classroom joy,<br><em>made easier.</em></h1><p>Want fidgets or Wiggles for your students? Tell us about your classroom order and we’ll follow up with a teacher coupon code for special pricing.</p><a class="button button-pink" href="#teacher-form">Ask for a code <span>↗</span></a></div><div class="info-illustration teacher-illustration"><span class="paper-note">A+<small>FOR FUN</small></span><img src="/assets/dumpling-studio.jpg" alt="Dumpling Wiggle visualization"><span class="teacher-pencil" aria-hidden="true">✎</span></div></div></section><section class="teachers-main page-wrap"><div class="teacher-steps"><span class="eyebrow">HOW IT WORKS</span><h2>Simple as <em>1, 2, 3.</em></h2><ol><li><b>01</b><span>Tell us what you’re hoping to order.</span></li><li><b>02</b><span>We’ll reply with classroom pricing and a coupon code.</span></li><li><b>03</b><span>Choose the toys that fit your students best.</span></li></ol><p>Regular prices: fidgets $8 each and Wiggles $5 each. Teacher pricing is quoted after we hear about your classroom needs.</p></div><div id="teacher-form">${form('teacher')}</div></section>`;
}

function customPage() {
  return `<section class="info-hero custom-hero"><div class="page-wrap info-hero-inner"><div><div class="breadcrumbs">${crumb('Home','/')}<span>Custom orders</span></div><span class="eyebrow">YOUR IDEA, OUR OVEN ✦</span><h1>Got a wild idea?<br><em>Let’s make it.</em></h1><p>Party favors, personal gifts, a fidget in your favorite colors, or something beyond the bakery menu—tell us what you’re imagining.</p><a class="button button-pink" href="#custom-form">Share your idea <span>↗</span></a></div><div class="info-illustration custom-illustration"><img src="/assets/fortune-cookie-studio.jpg" alt="Fortune Cookie Wiggle visualization"><span class="idea-sticker">IDEAS<br>WELCOME!</span></div></div></section><section class="form-section page-wrap" id="custom-form"><div><span class="eyebrow">WE LOVE A GOOD CHALLENGE</span><h2>Tell us all <em>about it.</em></h2><p>Details like quantity, colors, timing, and who it is for help us get back to you with useful next steps.</p></div>${form('custom')}</section>`;
}

function contactPage() {
  return `<section class="form-section contact-section page-wrap"><div><div class="breadcrumbs">${crumb('Home','/')}<span>Contact</span></div><span class="eyebrow">SAY HELLO ✦</span><h1>Let’s talk <em>fidgets.</em></h1><p>Questions about a toy, an upcoming fair, or a custom idea? We’d love to hear from you.</p><div class="external-links"><a href="https://makerworld.com/en/@TheFidgetBakery" target="_blank" rel="noopener noreferrer">Find our designs on MakerWorld ↗</a><a href="https://ko-fi.com/thefidgetbakery/tiers" target="_blank" rel="noopener noreferrer">Explore our reseller license ↗</a></div></div>${form('message')}</section>`;
}

function notFound() { return `<section class="not-found page-wrap"><span class="eyebrow">OOPS, THAT TREAT IS MISSING</span><h1>We couldn’t find that page.</h1><a class="button button-pink" href="/">Back to the bakery <span>↗</span></a></section>`; }

function render() {
  let title = 'The Fidget Bakery | Freshly made fun';
  if (path === '/') page.innerHTML = home();
  else if (segments.length === 1 && collections[segments[0]]) { page.innerHTML = collection(segments[0]); title = `${collections[segments[0]].name} | The Fidget Bakery`; }
  else if (segments.length === 2 && collections[segments[0]]) {
    const item = catalog.find(candidate => candidate.category === segments[0] && candidate.id === segments[1]);
    page.innerHTML = item ? product(item) : notFound();
    if (item) title = `${item.name} | The Fidget Bakery`;
  } else if (path === '/teachers') { page.innerHTML = teachers(); title = 'Teacher Discounts | The Fidget Bakery'; }
  else if (path === '/custom') { page.innerHTML = customPage(); title = 'Custom Orders | The Fidget Bakery'; }
  else if (path === '/contact') { page.innerHTML = contactPage(); title = 'Contact | The Fidget Bakery'; }
  else page.innerHTML = notFound();
  document.title = title;
  const nav = segments[0];
  document.querySelectorAll('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === nav));
  activateForms();
}

function activateForms() {
  document.querySelectorAll('form[data-kind]').forEach(form => {
    if (!config.contactReady) {
      form.querySelectorAll('input, textarea, select, button').forEach(control => control.disabled = true);
      form.querySelector('.form-status').innerHTML = 'This form is being connected. Until then, you can explore our <a href="https://makerworld.com/en/@TheFidgetBakery" target="_blank" rel="noopener noreferrer">MakerWorld page ↗</a>.';
      return;
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('[type=submit]');
      const status = form.querySelector('.form-status');
      const data = Object.fromEntries(new FormData(form));
      data.kind = form.dataset.kind;
      if (data.school) data.details = `School or organization: ${data.school}`;
      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not send your message.');
        form.reset();
        status.textContent = 'Sent! We’ll get back to you soon. 🍪';
      } catch (error) { status.textContent = error.message; }
      finally { button.disabled = false; }
    });
  });
}

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('.menu-toggle').addEventListener('click', event => {
  const open = document.querySelector('.site-header').classList.toggle('menu-open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
  event.currentTarget.textContent = open ? '✕' : '☰';
});

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-buy]');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Opening checkout…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: button.dataset.buy }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Checkout could not open.');
    location.href = result.url;
  } catch (error) { showToast(error.message); button.disabled = false; button.innerHTML = 'Buy now <span>↗</span>'; }
});

if (new URLSearchParams(location.search).get('ordered') === '1') showToast('Thanks for your order! Check your email for a receipt. 🍪');
render();
fetch('/api/config').then(response => response.json()).then(value => { config = value; render(); }).catch(() => showToast('Some shop features are temporarily unavailable.'));
