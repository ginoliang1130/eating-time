import './style.css';
import CATEGORIES from './data/categories.json';
import STORES from './data/stores.json';

const root = document.documentElement;
const css = getComputedStyle(root);
const catColor = key => css.getPropertyValue(CATEGORIES.find(c => c.key === key).var).trim();

let selectedCat = null;
let spinning = false;
let currentPool = [];

const SCENE_PHOTOS = [
  '/images/backgrounds/xingtian-summer.png',
  '/images/backgrounds/xingtian-night.png',
  '/images/backgrounds/xingtian-rain.png',
  '/images/backgrounds/xingtian-snow.png',
];

function startSceneCarousel() {
  const layers = [document.getElementById('scenePhotoA'), document.getElementById('scenePhotoB')];
  let active = 0;
  let index = 0;

  layers[0].style.backgroundImage = `url(${SCENE_PHOTOS[0]})`;
  layers[0].classList.add('active');

  setInterval(() => {
    index = (index + 1) % SCENE_PHOTOS.length;
    const next = (active + 1) % layers.length;
    layers[next].style.backgroundImage = `url(${SCENE_PHOTOS[index]})`;
    layers[next].classList.add('active');
    layers[active].classList.remove('active');
    active = next;
  }, 5000);
}

const filtersEl = document.getElementById('filters');
const questPromptEl = document.getElementById('questPrompt');
const poolNoteEl = document.getElementById('poolNote');
const drawCard = document.getElementById('drawCard');
const cardBackEl = document.querySelector('.card-back');
const cardFrontEl = document.getElementById('cardFront');
const cardFrontBody = document.getElementById('cardFrontBody');
const spinBtn = document.getElementById('spinBtn');

function renderFilters() {
  filtersEl.replaceChildren(...CATEGORIES.map(c => {
    const btn = document.createElement('button');
    btn.className = 'meal-plaque';
    btn.type = 'button';
    btn.style.setProperty('--dot', catColor(c.key));
    btn.setAttribute('aria-pressed', String(selectedCat === c.key));
    btn.innerHTML = `<span class="rivet tl"></span><span class="rivet tr"></span><span class="rivet bl"></span><span class="rivet br"></span>${c.label}`;
    btn.addEventListener('click', () => {
      selectedCat = (selectedCat === c.key) ? null : c.key;
      renderAll();
      document.querySelector('.card-stage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return btn;
  }));
}

function getPool() {
  return selectedCat ? STORES.filter(s => s.cat === selectedCat) : [];
}

function renderAll() {
  renderFilters();
  currentPool = getPool();
  questPromptEl.hidden = !!selectedCat;
  poolNoteEl.innerHTML = selectedCat
    ? `目前牌組共 <strong>${currentPool.length}</strong> 家店`
    : '';
  spinBtn.disabled = currentPool.length === 0;
  drawCard.classList.remove('squeeze');
  cardBackEl.classList.remove('face-hidden');
  cardFrontEl.classList.remove('face-visible');
  cardFrontBody.innerHTML = '';
}

function spark(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const glyphs = ['✦', '✧', '・'];
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('span');
    el.className = 'spark';
    el.textContent = glyphs[i % glyphs.length];
    const angle = (Math.PI * 2 * i / 10) + Math.random() * 0.4;
    const dist = 60 + Math.random() * 50;
    el.style.left = '50%'; el.style.top = '0';
    el.style.setProperty('--sx', (Math.cos(angle) * dist) + 'px');
    el.style.setProperty('--sy', (Math.sin(angle) * dist - 20) + 'px');
    el.style.animationDelay = (Math.random() * 0.15) + 's';
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function renderCardFront(store, idx) {
  const catLabel = CATEGORIES.find(c => c.key === store.cat).label;
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(store.name + ' ' + store.addr + ' 台北市中山區');
  cardFrontBody.innerHTML = `
    <div class="badge mono">#${idx}</div>
    <div class="cat-tag"><span class="dot" style="--dot:${catColor(store.cat)}"></span>${catLabel}</div>
    <h3>${store.name}</h3>
    <div class="addr">${store.addr}</div>
    <div class="desc">${store.desc}</div>
    ${store.caution ? `<div class="caution">⚠️ ${store.caution}</div>` : ''}
    <div class="actions">
      <a class="btn-ghost" href="${mapUrl}" target="_blank" rel="noopener">在 Google 地圖開啟</a>
      <button class="btn-ghost" id="spinAgainBtn" type="button">再抽一次</button>
    </div>
  `;
  document.getElementById('spinAgainBtn').addEventListener('click', doSpin);
}

function doSpin() {
  if (spinning || currentPool.length === 0) return;
  spinning = true;
  spinBtn.disabled = true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const swapAndReveal = () => {
    const pool = currentPool;
    const targetIndex = Math.floor(Math.random() * pool.length);
    renderCardFront(pool[targetIndex], targetIndex + 1);
    cardBackEl.classList.add('face-hidden');
    cardFrontEl.classList.add('face-visible');
  };

  const finish = () => {
    spinning = false;
    spinBtn.disabled = false;
    spark(document.querySelector('.card-stage'));
  };

  if (reduced) {
    swapAndReveal();
    finish();
    return;
  }

  const onSqueezeIn = (e) => {
    if (e.propertyName !== 'transform') return;
    drawCard.removeEventListener('transitionend', onSqueezeIn);
    swapAndReveal();
    const onSqueezeOut = (e2) => {
      if (e2.propertyName !== 'transform') return;
      drawCard.removeEventListener('transitionend', onSqueezeOut);
      finish();
    };
    drawCard.addEventListener('transitionend', onSqueezeOut);
    drawCard.classList.remove('squeeze');
  };
  drawCard.addEventListener('transitionend', onSqueezeIn);
  drawCard.classList.add('squeeze');
}

spinBtn.addEventListener('click', doSpin);

startSceneCarousel();
renderAll();
