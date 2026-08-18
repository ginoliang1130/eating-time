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
  'xingtian-summer.webp',
  'xingtian-night.webp',
  'xingtian-rain.webp',
  'xingtian-snow.webp',
].map(name => `${import.meta.env.BASE_URL}images/backgrounds/${name}`);

const CARD_FRAMES = {
  R: `${import.meta.env.BASE_URL}images/card/R-card.webp`,
  SR: `${import.meta.env.BASE_URL}images/card/SR-card.webp`,
  SSR: `${import.meta.env.BASE_URL}images/card/SSR-card.webp`,
};

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

const RARITY_WEIGHTS = { SSR: 0.02, SR: 0.15, R: 0.83 };

function pickWeighted(pool) {
  const tiers = { SSR: [], SR: [], R: [] };
  pool.forEach(s => tiers[s.rarity || 'R'].push(s));
  const availableTiers = Object.keys(tiers).filter(t => tiers[t].length > 0);
  const totalWeight = availableTiers.reduce((sum, t) => sum + RARITY_WEIGHTS[t], 0);
  let r = Math.random() * totalWeight;
  for (const t of availableTiers) {
    if (r < RARITY_WEIGHTS[t]) {
      const list = tiers[t];
      return list[Math.floor(Math.random() * list.length)];
    }
    r -= RARITY_WEIGHTS[t];
  }
  const lastTier = tiers[availableTiers[availableTiers.length - 1]];
  return lastTier[Math.floor(Math.random() * lastTier.length)];
}

function drawTenWithPity(pool) {
  const results = [];
  for (let i = 0; i < 9; i++) results.push(pickWeighted(pool));
  if (results.some(s => s.rarity === 'SSR')) {
    results.push(pickWeighted(pool));
  } else {
    const ssrList = pool.filter(s => s.rarity === 'SSR');
    results.push(ssrList.length ? ssrList[Math.floor(Math.random() * ssrList.length)] : pickWeighted(pool));
  }
  return results;
}

const filtersEl = document.getElementById('filters');
const questPromptEl = document.getElementById('questPrompt');
const poolNoteEl = document.getElementById('poolNote');
const drawCard = document.getElementById('drawCard');
const cardBackEl = document.querySelector('.card-back');
const cardFrontEl = document.getElementById('cardFront');
const cardFrontBody = document.getElementById('cardFrontBody');
const spinBtn = document.getElementById('spinBtn');
const tenSpinBtn = document.getElementById('tenSpinBtn');
const tenPullResultsEl = document.getElementById('tenPullResults');

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
  tenSpinBtn.disabled = currentPool.length === 0;
  drawCard.classList.remove('squeeze');
  cardBackEl.classList.remove('face-hidden');
  cardFrontEl.classList.remove('face-visible');
  cardFrontBody.innerHTML = '';
  tenPullResultsEl.hidden = true;
  tenPullResultsEl.innerHTML = '';
  drawCard.parentElement.hidden = false;
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
  const rarity = store.rarity || 'R';
  cardFrontEl.dataset.rarity = rarity;
  cardFrontEl.style.backgroundImage =
    `url(${CARD_FRAMES[rarity]}), radial-gradient(circle at 50% 18%, rgba(217,154,43,.2), transparent 55%), linear-gradient(180deg, #fffdf7 0%, var(--paper) 100%)`;
  cardFrontEl.style.backgroundSize = '100% 100%, auto, auto';
  cardFrontEl.style.backgroundRepeat = 'no-repeat, no-repeat, no-repeat';
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
    const store = pickWeighted(currentPool);
    renderCardFront(store, currentPool.indexOf(store) + 1);
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

  const onExpandDone = (e) => {
    if (e.propertyName !== 'transform') return;
    drawCard.removeEventListener('transitionend', onExpandDone);
    drawCard.classList.remove('expanding');
    finish();
  };

  const onSqueezeIn = (e) => {
    if (e.propertyName !== 'transform') return;
    drawCard.removeEventListener('transitionend', onSqueezeIn);
    swapAndReveal();
    drawCard.addEventListener('transitionend', onExpandDone);
    drawCard.classList.add('expanding');
    drawCard.classList.remove('squeeze');
  };

  const onLiftDone = (e) => {
    if (e.propertyName !== 'transform') return;
    drawCard.removeEventListener('transitionend', onLiftDone);
    drawCard.addEventListener('transitionend', onSqueezeIn);
    drawCard.classList.remove('lift');
    drawCard.classList.add('squeeze');
  };
  drawCard.addEventListener('transitionend', onLiftDone);
  drawCard.classList.add('lift');
}

function doTenSpin() {
  if (spinning || currentPool.length === 0) return;
  spinning = true;
  spinBtn.disabled = true;
  tenSpinBtn.disabled = true;

  const results = drawTenWithPity(currentPool);

  drawCard.parentElement.hidden = true;
  tenPullResultsEl.innerHTML = '';
  tenPullResultsEl.hidden = false;

  results.forEach((store, i) => {
    const tile = document.createElement('div');
    tile.className = 'pull-tile';
    const tileRarity = store.rarity || 'R';
    tile.dataset.rarity = tileRarity;
    tile.style.animationDelay = (i * 0.08) + 's';
    tile.style.backgroundImage =
      `url(${CARD_FRAMES[tileRarity]}), radial-gradient(circle at 50% 18%, rgba(217,154,43,.2), transparent 55%), linear-gradient(180deg, #fffdf7 0%, var(--paper) 100%)`;
    tile.style.backgroundSize = '100% 100%, auto, auto';
    tile.style.backgroundRepeat = 'no-repeat, no-repeat, no-repeat';
    const catLabel = CATEGORIES.find(c => c.key === store.cat).label;
    tile.innerHTML = `
      <span class="pull-rarity">${store.rarity || 'R'}</span>
      <div class="cat-tag"><span class="dot" style="--dot:${catColor(store.cat)}"></span>${catLabel}</div>
      <div class="pull-name">${store.name}</div>
    `;
    tenPullResultsEl.appendChild(tile);
  });

  spinning = false;
  spinBtn.disabled = false;
  tenSpinBtn.disabled = false;
  spark(document.querySelector('.card-stage').parentElement);
}

spinBtn.addEventListener('click', doSpin);
tenSpinBtn.addEventListener('click', doTenSpin);

startSceneCarousel();
renderAll();
