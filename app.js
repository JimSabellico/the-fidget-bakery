import { catalog, collections, shippingCents, freeShippingOverCents } from './catalog.js';
import { teacherPackSize, teacherPackPriceCents, packFidgets, normalizeTeacherPack, teacherPackDescription } from './teacher-pack.js';

const page = document.querySelector('#page');
const toast = document.querySelector('#toast');
const path = location.pathname.replace(/\/+$/, '') || '/';
const segments = path.split('/').filter(Boolean);
let config = { checkoutReady: false, contactReady: false };
let cart = [];
let packMode = 'single';
let packSingleId = packFidgets[0].id;
let packCounts = Object.fromEntries(packFidgets.map(item => [item.id, 0]));
try {
  const stored = JSON.parse(localStorage.getItem('fidget-bakery-bag') || '[]');
  if (Array.isArray(stored)) {
    const seen = new Set();
    cart = stored.filter(entry => {
      if (entry?.kind === 'teacher-pack') return /^[a-f0-9-]{36}$/.test(entry.key) && Boolean(normalizeTeacherPack(entry.pack));
      if (!catalog.some(item => item.id === entry.id) || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 20 || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  }
} catch { cart = []; }

const money = cents => `$${(cents / 100).toFixed(0)}`;
const productUrl = item => `/${item.category}/${item.id}`;
const image = (item, className = '') => `<img class="${className}" src="${item.image}" alt="Illustration of ${item.name}" loading="lazy">`;
const sparkle = (className = '') => `<span class="sparkle ${className}" aria-hidden="true">✳</span>`;
const subtotal = () => cart.reduce((sum, entry) => sum + (entry.kind === 'teacher-pack' ? teacherPackPriceCents : catalog.find(item => item.id === entry.id).priceCents * entry.quantity), 0);
function saveCart() {
  try { localStorage.setItem('fidget-bakery-bag', JSON.stringify(cart)); } catch { /* Storage can be unavailable in private browsing. */ }
  document.querySelector('#bag-count').textContent = cart.reduce((sum, entry) => sum + (entry.kind === 'teacher-pack' ? 1 : entry.quantity), 0);
  if (path === '/cart') render();
}
function addToCart(id) {
  const entry = cart.find(item => item.kind !== 'teacher-pack' && item.id === id);
  if (entry) { if (entry.quantity >= 20) return showToast('The bag limit is 20 of each item.'); entry.quantity++; }
  else { if (cart.length >= 20) return showToast('Your bag is full. Please check out before adding more.'); cart.push({ id, quantity: 1 }); }
  saveCart();
  showToast('Added to your bag! 🍪');
}
function addTeacherPack() {
  const pack = normalizeTeacherPack(packMode === 'random' ? { mode: 'random' } : packMode === 'single' ? { mode: 'single', selection: [{ id: packSingleId, quantity: teacherPackSize }] } : { mode: 'custom', selection: packFidgets.map(item => ({ id: item.id, quantity: packCounts[item.id] })).filter(choice => choice.quantity > 0) });
  if (!pack) return showToast('Choose exactly 10 fidgets for your pack.');
  if (cart.length >= 20) return showToast('Your bag is full. Please check out before adding more.');
  cart.push({ kind: 'teacher-pack', key: crypto.randomUUID(), pack });
  saveCart();
  showToast('Teacher pack added to your bag! ✎');
}

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
  <section class="home-bottom page-wrap"><span class="home-bottom-icon" aria-hidden="true">✎</span><div><span class="eyebrow">HEY, TEACHERS!</span><h2>A little joy for <em>the classroom.</em></h2><p>Get 10 fidgets for $60 and build the mix your way.</p></div><a class="button button-brown" href="/teacher-packs">Teacher packs <span>↗</span></a></section>`;
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
  return `<section class="product-page page-wrap"><div class="breadcrumbs">${crumb('Home','/')}${crumb(category.name,`/${item.category}`)}<span>${item.name}</span></div><div class="product-layout">
    <div class="product-main-image">${image(item)}<span class="image-spark image-spark-a" aria-hidden="true">✳</span><span class="image-spark image-spark-b" aria-hidden="true">✦</span></div>
    <div class="product-info"><span class="eyebrow">${item.category === 'fidgets' ? 'FRESH FROM THE FIDGET COUNTER' : 'A LITTLE WIGGLE FRIEND'}</span><h1>${item.name}</h1><div class="product-price">${money(item.priceCents)} <span>each</span></div><p class="product-lead">${item.detail}</p><div class="product-points"><div><span>✦</span> Family-made 3D printed fun</div><div><span>✦</span> Food-inspired, never edible</div><div><span>✦</span> A sweet little gift or desk companion</div></div>
    <button class="button button-pink buy-button" data-add="${item.id}">Add to bag <span>↗</span></button><a class="quiet-link" href="/cart">View your bag ↗</a>
    ${config.checkoutReady ? '' : `<div class="setup-note"><strong>Online checkout is being connected.</strong><span>You can build a bag now; payment will open soon.</span></div>`}
    <a class="quiet-link" href="${item.makerworld}" target="_blank" rel="noopener noreferrer">See the original design on MakerWorld ↗</a><p class="image-note">Images are custom visualizations. Final 3D prints may vary slightly in color and finish.</p></div>
  </div></section><section class="related page-wrap"><div class="list-heading"><div><span class="eyebrow">KEEP EXPLORING</span><h2>More ${category.name.toLowerCase()} to <em>love.</em></h2></div><a href="/${item.category}">See all ${category.name} ↗</a></div><div class="products-grid">${related.map(productCard).join('')}</div></section>`;
}

function cartPage() {
  const total = subtotal();
  const shipping = total > freeShippingOverCents ? 0 : shippingCents;
  const toGo = Math.max(1, Math.ceil((freeShippingOverCents + 1 - total) / 100));
  const rows = cart.map(entry => {
    if (entry.kind === 'teacher-pack') {
      return `<div class="cart-item cart-pack"><a href="/teacher-packs">${image(packFidgets[0])}<span class="cart-pack-sticker">10</span></a><div><span class="mini-label">CLASSROOM PACK</span><h3><a href="/teacher-packs">Teacher Fidget Pack</a></h3><p>${teacherPackDescription(entry.pack)}</p><button class="remove-pack" data-remove-pack="${entry.key}">Remove pack</button></div><strong>${money(teacherPackPriceCents)}</strong></div>`;
    }
    const item = catalog.find(product => product.id === entry.id);
    return `<div class="cart-item"><a href="${productUrl(item)}">${image(item)}</a><div><span class="mini-label">${item.category === 'fidgets' ? 'Fidget' : 'Wiggle'}</span><h3><a href="${productUrl(item)}">${item.name}</a></h3><span>${money(item.priceCents)} each</span><div class="quantity"><button type="button" data-change="${item.id}" data-delta="-1" aria-label="Remove one ${item.name}">−</button><span>${entry.quantity}</span><button type="button" data-change="${item.id}" data-delta="1" aria-label="Add one ${item.name}">+</button></div></div><strong>${money(item.priceCents * entry.quantity)}</strong></div>`;
  }).join('');
  const suggestions = catalog.filter(item => !cart.some(entry => entry.kind !== 'teacher-pack' && entry.id === item.id)).sort((a, b) => a.priceCents - b.priceCents).slice(0, 3);
  const bump = suggestions[0];
  return `<section class="cart-page page-wrap"><div class="breadcrumbs">${crumb('Home','/')}<span>Your bag</span></div><span class="eyebrow">YOUR LITTLE HAUL ✦</span><h1>Your bag <em>of fun.</em></h1>${cart.length ? `<div class="cart-layout"><div class="cart-items">${rows}</div><aside class="cart-summary"><h2>Order summary</h2><div class="shipping-nudge"><strong>${shipping ? `You're $${toGo} away from free shipping!` : 'You unlocked free shipping! 🎉'}</strong><div class="shipping-track"><span style="width:${Math.min(100, total / (freeShippingOverCents + 1) * 100)}%"></span></div><small>${shipping ? 'U.S. shipping is $5; orders over $25 ship free.' : 'Your U.S. shipping is on us.'}</small>${shipping && bump ? `<button class="bump-button" data-add="${bump.id}">Add a ${bump.name} for ${money(bump.priceCents)} ↗</button>` : ''}</div><div class="total-line"><span>Items</span><b>${money(total)}</b></div><div class="total-line"><span>US shipping</span><b>${shipping ? money(shipping) : 'FREE'}</b></div><div class="total-line grand-total"><span>Total</span><b>${money(total + shipping)}</b></div>${config.checkoutReady ? '<button class="button button-pink cart-checkout" data-checkout>Continue to checkout <span>↗</span></button>' : '<div class="setup-note"><strong>Checkout is being connected.</strong><span>Your bag is saved on this device for when ordering opens.</span></div>'}<p class="cart-fine">Secure payment through Stripe. U.S. shipping only.</p></aside></div>${shipping && suggestions.length ? `<div class="cart-extras"><span class="eyebrow">A LITTLE SOMETHING EXTRA?</span><h2>Add a treat to get closer to <em>free shipping.</em></h2><div class="products-grid">${suggestions.map(productCard).join('')}</div></div>` : ''}` : `<div class="empty-bag"><span>🍪</span><h2>Nothing in the bag yet.</h2><p>There’s lots of fun waiting on the bakery shelves.</p><a class="button button-pink" href="/fidgets">Explore fidgets <span>↗</span></a><a class="button button-cream" href="/wiggles">Meet the Wiggles <span>↗</span></a></div>`}</section>`;
}

function form(kind) {
  const custom = kind === 'custom';
  const heading = custom ? 'Tell us your idea' : 'Drop us a note';
  const field = custom ? `<label>What are you dreaming up?<select name="details"><option value="">Choose a starting point</option><option>Custom fidget</option><option>Party favors or bulk order</option><option>Personalized gift</option><option>Something else</option></select></label><label>Tell us more<textarea name="message" rows="4" placeholder="Colors, quantity, timing, inspiration..." required></textarea></label>` : `<label>Your message<textarea name="message" rows="4" placeholder="What's on your mind?" required></textarea></label>`;
  return `<form class="form-card" data-kind="${kind}"><h2>${heading} <span>✳</span></h2><div class="form-row"><label>Your name<input name="name" placeholder="Your name" autocomplete="name" required></label><label>Email address<input name="email" type="email" placeholder="you@example.com" autocomplete="email" required></label></div>${field}<input class="honey" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="button button-pink" type="submit">${custom ? 'Send my idea' : 'Send message'} <span>↗</span></button><p class="form-status" role="status"></p></form>`;
}

function teachers() {
  const selected = packCounts ? Object.values(packCounts).reduce((sum, count) => sum + count, 0) : 0;
  const active = packMode === 'single' ? packFidgets.find(item => item.id === packSingleId) : null;
  const choice = packMode === 'single'
    ? `<div class="pack-single-choice">${image(active)}<label>Which fidget would you like ten of?<select data-pack-single>${packFidgets.map(item => `<option value="${item.id}" ${item.id === packSingleId ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label></div>`
    : packMode === 'random'
      ? `<div class="pack-random-choice"><div class="pack-random-art">${packFidgets.map(item => image(item)).join('')}</div><div><h3>We’ll pick a fun assortment.</h3><p>Your pack will contain ten fidgets chosen from the designs shown here. Because there are four designs, repeats will be included.</p></div></div>`
      : `<div class="pack-mix-choice"><div class="pack-progress"><strong>${selected} of ${teacherPackSize} chosen</strong><span>${selected === teacherPackSize ? 'Your pack is ready!' : `${teacherPackSize - selected} to go`}</span></div><div class="shipping-track"><span style="width:${selected / teacherPackSize * 100}%"></span></div>${packFidgets.map(item => `<div class="pack-mix-row">${image(item)}<div><strong>${item.name}</strong><small>$8 individually</small></div><div class="quantity"><button type="button" data-pack-change="${item.id}" data-delta="-1" aria-label="Remove one ${item.name}" ${packCounts[item.id] === 0 ? 'disabled' : ''}>−</button><span>${packCounts[item.id]}</span><button type="button" data-pack-change="${item.id}" data-delta="1" aria-label="Add one ${item.name}" ${selected >= teacherPackSize ? 'disabled' : ''}>+</button></div></div>`).join('')}</div>`;
  return `<section class="info-hero teachers-hero teacher-pack-hero"><div class="page-wrap info-hero-inner"><div><div class="breadcrumbs">${crumb('Home','/')}<span>Teacher packs</span></div><span class="eyebrow">A LITTLE EXTRA FOR CLASSROOMS ✦</span><h1>Ten fidgets.<br><em>One happy price.</em></h1><p>Build a pack of 10 food-inspired fidgets for $60. Pick a favorite, leave the mix to us, or choose each one yourself. No coupon needed.</p><a class="button button-pink" href="#pack-builder">Build your pack <span>↗</span></a></div><div class="info-illustration teacher-illustration"><span class="paper-note">10<small>FOR $60</small></span><img src="/assets/chocolate-chip-cookie-studio.jpg" alt="Chocolate Chip Cookie Spinner visualization"><span class="teacher-pencil" aria-hidden="true">✎</span></div></div></section><section class="pack-builder page-wrap" id="pack-builder"><div class="pack-heading"><span class="eyebrow">MAKE IT YOURS ✦</span><h2>Build your <em>teacher pack.</em></h2><p>Ten fidgets are normally $80. With the pack, you save $20 and U.S. shipping is free.</p></div><div class="pack-layout"><div><div class="pack-modes" role="group" aria-label="Choose how to build your teacher pack"><button type="button" class="pack-mode ${packMode === 'single' ? 'selected' : ''}" data-pack-mode="single" aria-pressed="${packMode === 'single'}"><span>01</span><strong>Ten of one</strong><small>One favorite, ten times.</small></button><button type="button" class="pack-mode ${packMode === 'random' ? 'selected' : ''}" data-pack-mode="random" aria-pressed="${packMode === 'random'}"><span>02</span><strong>Surprise mix</strong><small>Let us pick the fun.</small></button><button type="button" class="pack-mode ${packMode === 'custom' ? 'selected' : ''}" data-pack-mode="custom" aria-pressed="${packMode === 'custom'}"><span>03</span><strong>Mix your own</strong><small>Choose each of the ten.</small></button></div><div class="pack-choice">${choice}</div></div><aside class="pack-summary"><span class="eyebrow">YOUR CLASSROOM DEAL</span><h3>Teacher Fidget Pack</h3><div class="pack-price">$60 <span>for 10 fidgets</span></div><div class="pack-savings">Save $20 ✦ Free U.S. shipping</div><p>${packMode === 'single' ? teacherPackDescription({ mode: 'single', selection: [{ id: packSingleId, quantity: teacherPackSize }] }) : packMode === 'random' ? 'A surprise assortment of ten fidgets, with repeats.' : `${selected} of 10 fidgets selected.`}</p><button type="button" class="button button-pink" data-add-pack ${packMode === 'custom' && selected !== teacherPackSize ? 'disabled' : ''}>Add teacher pack to bag <span>↗</span></button><a class="quiet-link" href="/cart">View your bag ↗</a>${config.checkoutReady ? '' : '<div class="setup-note"><strong>Online checkout is being connected.</strong><span>You can build your pack now; payment will open soon.</span></div>'}</aside></div></section>`;
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
  } else if (path === '/teachers' || path === '/teacher-packs') { page.innerHTML = teachers(); title = 'Teacher Fidget Packs | The Fidget Bakery'; }
  else if (path === '/cart') { page.innerHTML = cartPage(); title = 'Your Bag | The Fidget Bakery'; }
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

document.addEventListener('change', event => {
  if (event.target.matches('[data-pack-single]')) { packSingleId = event.target.value; render(); }
});

document.addEventListener('click', async event => {
  const mode = event.target.closest('[data-pack-mode]');
  if (mode) { packMode = mode.dataset.packMode; render(); return; }
  const packChange = event.target.closest('[data-pack-change]');
  if (packChange) {
    const id = packChange.dataset.packChange;
    const next = packCounts[id] + Number(packChange.dataset.delta);
    const selected = Object.values(packCounts).reduce((sum, count) => sum + count, 0);
    if (next >= 0 && next <= teacherPackSize && selected + Number(packChange.dataset.delta) <= teacherPackSize) { packCounts[id] = next; render(); }
    return;
  }
  if (event.target.closest('[data-add-pack]')) { addTeacherPack(); return; }
  const removePack = event.target.closest('[data-remove-pack]');
  if (removePack) { cart = cart.filter(entry => entry.key !== removePack.dataset.removePack); saveCart(); return; }
  const add = event.target.closest('[data-add]');
  if (add) { addToCart(add.dataset.add); return; }
  const change = event.target.closest('[data-change]');
  if (change) {
    const entry = cart.find(item => item.id === change.dataset.change);
    if (entry) { entry.quantity += Number(change.dataset.delta); if (entry.quantity <= 0) cart = cart.filter(item => item !== entry); else entry.quantity = Math.min(20, entry.quantity); saveCart(); }
    return;
  }
  const button = event.target.closest('[data-checkout]');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Opening checkout…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Checkout could not open.');
    location.href = result.url;
  } catch (error) { showToast(error.message); button.disabled = false; button.innerHTML = 'Continue to checkout <span>↗</span>'; }
});

if (new URLSearchParams(location.search).get('ordered') === '1') { cart = []; showToast('Thanks for your order! Check your email for a receipt. 🍪'); }
saveCart();
render();
fetch('/api/config').then(response => response.json()).then(value => { config = value; render(); }).catch(() => showToast('Some shop features are temporarily unavailable.'));
