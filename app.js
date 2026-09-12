import { catalog } from './catalog.js';

const grid = document.querySelector('#product-grid');
const toast = document.querySelector('#toast');
let config = { available: {}, contactReady: false };
const qs = new URLSearchParams(location.search);
if (qs.get('ordered') === '1') showToast('Thanks for your order! Check your email for a receipt. 🍪');
document.querySelector('#year').textContent = new Date().getFullYear();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 6000);
}

function render(filter = 'All') {
  const visible = filter === 'All' ? catalog : catalog.filter(item => item.family === filter);
  grid.innerHTML = visible.map((item, index) => {
    const price = config.available[item.id];
    const action = price ? `<button class="product-buy" data-buy="${item.id}" aria-label="Buy ${item.name}">Buy for $${(price / 100).toFixed(2)} <span>↗</span></button>` : `<a class="product-buy" href="#custom" data-inquire="${item.name}">Ask to order <span>↗</span></a>`;
    return `<article class="product-card" style="--delay:${index * 35}ms"><div class="product-image"><img src="${item.image}" alt="${item.name}" loading="lazy"><span class="product-family">${item.family}</span></div><div class="product-body"><div class="product-meta">${item.type} • 3D printed</div><h3>${item.name}</h3><p>${item.description}</p><div class="product-actions">${action}<a href="${item.makerworld}" target="_blank" rel="noopener noreferrer" aria-label="See ${item.name} on MakerWorld">See design</a></div></div></article>`;
  }).join('');
}
render();
fetch('/api/config').then(response => response.json()).then(value => {
  config = value;
  render(document.querySelector('[data-filter].active').dataset.filter);
  if (!config.contactReady) {
    document.querySelectorAll('form[data-kind]').forEach(form => {
      form.querySelectorAll('input, textarea, select, button').forEach(control => control.disabled = true);
      form.querySelector('.form-status').innerHTML = 'Our direct form is being connected. <a href="https://ko-fi.com/thefidgetbakery" target="_blank" rel="noopener noreferrer">Message us on Ko-fi ↗</a>';
    });
  }
}).catch(() => showToast('Some shop features are temporarily unavailable.'));

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(el => el.classList.toggle('active', el === button));
  render(button.dataset.filter);
}));

grid.addEventListener('click', async event => {
  const inquire = event.target.closest('[data-inquire]');
  if (inquire) {
    document.querySelector('form[data-kind="custom"] textarea[name="message"]').value = `I'm interested in ${inquire.dataset.inquire}. `;
  }
  const button = event.target.closest('[data-buy]');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Opening checkout…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: button.dataset.buy }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Checkout could not open.');
    location.href = data.url;
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
    button.innerHTML = 'Buy this item <span>↗</span>';
  }
});

document.querySelectorAll('form[data-kind]').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('[type=submit]');
  const status = form.querySelector('.form-status');
  const data = Object.fromEntries(new FormData(form));
  data.kind = form.dataset.kind;
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
}));

document.querySelector('.menu-toggle').addEventListener('click', event => {
  const header = document.querySelector('.site-header');
  const open = header.classList.toggle('menu-open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
  event.currentTarget.textContent = open ? '✕' : '☰';
});
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.site-header').classList.remove('menu-open');
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('.menu-toggle').textContent = '☰';
}));
