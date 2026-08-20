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

const RARITY_WEIGHTS = { SSR: 0.05, SR: 0.15, R: 0.80 };

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
  const usedIds = new Set();
  const remainingPool = () => {
    const remaining = pool.filter(s => !usedIds.has(s.id));
    return remaining.length ? remaining : pool; // pool smaller than 10: allow repeats once exhausted
  };

  for (let i = 0; i < 9; i++) {
    const store = pickWeighted(remainingPool());
    usedIds.add(store.id);
    results.push(store);
  }

  if (results.some(s => s.rarity === 'SSR')) {
    const store = pickWeighted(remainingPool());
    usedIds.add(store.id);
    results.push(store);
  } else {
    const unusedSsr = pool.filter(s => s.rarity === 'SSR' && !usedIds.has(s.id));
    const ssrList = unusedSsr.length ? unusedSsr : pool.filter(s => s.rarity === 'SSR');
    const store = ssrList.length ? ssrList[Math.floor(Math.random() * ssrList.length)] : pickWeighted(remainingPool());
    usedIds.add(store.id);
    results.push(store);
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
  spinning = false; // cancel any in-flight reveal so a mid-animation category switch can't strand the draw buttons disabled
  questPromptEl.hidden = !!selectedCat;
  poolNoteEl.innerHTML = selectedCat
    ? '牌組已就位，抽一張看緣分'
    : '';
  spinBtn.disabled = currentPool.length === 0;
  tenSpinBtn.disabled = currentPool.length === 0;
  drawCard.classList.remove('lift');
  drawCard.style.transform = '';
  drawCard.style.filter = '';
  drawCard.style.transition = '';
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

// Drives the squeeze-pinch -> swap -> expand reveal via inline transform/filter
// rather than CSS classes, so it can safely run right after an element's own
// entrance animation hands off control (a class-based approach would fight
// with the inline styles that handoff needs).
function runSqueezeReveal(el, onSqueezed, onDone) {
  el.style.transition = 'transform .22s cubic-bezier(.55,0,.85,.35), filter .22s cubic-bezier(.55,0,.85,.35)';
  void el.offsetHeight;

  const onSqueezeDone = (e) => {
    if (e.propertyName !== 'transform') return;
    el.removeEventListener('transitionend', onSqueezeDone);
    onSqueezed();
    el.style.transition = 'transform .34s cubic-bezier(.34,1.56,.64,1), filter .26s ease-out';
    el.style.transform = 'none';
    el.style.filter = 'none';
    el.addEventListener('transitionend', onExpandDone);
  };
  const onExpandDone = (e) => {
    if (e.propertyName !== 'transform') return;
    el.removeEventListener('transitionend', onExpandDone);
    // clear the inline overrides once settled, otherwise they'd outrank (and
    // silently no-op) any CSS class-driven transform used on the next reveal,
    // e.g. #drawCard's `.lift` phase on a subsequent draw.
    el.style.transition = '';
    el.style.transform = '';
    el.style.filter = '';
    onDone && onDone();
  };
  el.addEventListener('transitionend', onSqueezeDone);
  el.style.transform = 'scaleX(.04) rotate(1deg)';
  el.style.filter = 'brightness(.5)';
}

function renderCardFront(store, idx) {
  const catLabel = CATEGORIES.find(c => c.key === store.cat).label;
  const rarity = store.rarity || 'R';
  cardFrontEl.dataset.rarity = rarity;
  cardFrontEl.classList.toggle('has-caution', !!store.caution);
  cardFrontEl.style.backgroundImage = `url(${CARD_FRAMES[rarity]})`;
  cardFrontEl.style.backgroundSize = '100% 100%';
  cardFrontEl.style.backgroundRepeat = 'no-repeat';
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(store.name + ' ' + store.addr + ' 台北市中山區');
  cardFrontBody.innerHTML = `
    <div class="card-top-row">
      <div class="badge mono">#${idx}</div>
      <div class="cat-tag"><span class="dot" style="--dot:${catColor(store.cat)}"></span>${catLabel}</div>
    </div>
    <h3>${store.name}</h3>
    <div class="addr"><span class="addr-text">${store.addr}</span>${store.walkMin ? `<span class="walk">🚶 約${store.walkMin}分</span>` : ''}</div>
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
  tenPullResultsEl.hidden = true;
  drawCard.parentElement.hidden = false;
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

  const onLiftDone = (e) => {
    if (e.propertyName !== 'transform') return;
    drawCard.removeEventListener('transitionend', onLiftDone);
    drawCard.classList.remove('lift');
    runSqueezeReveal(drawCard, swapAndReveal, finish);
  };
  drawCard.addEventListener('transitionend', onLiftDone);
  // force layout so the browser registers the just-unhidden state before
  // the transition-triggering class is added, otherwise no transition
  // starts (nothing to animate from) and transitionend never fires.
  void drawCard.offsetHeight;
  drawCard.classList.add('lift');
}

function doTenSpin() {
  if (spinning || currentPool.length === 0) return;
  spinning = true;
  spinBtn.disabled = true;
  tenSpinBtn.disabled = true;

  const results = drawTenWithPity(currentPool);
  // shuffle so the SSR/pity pull doesn't always land in a predictable slot
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }

  drawCard.parentElement.hidden = true;
  tenPullResultsEl.innerHTML = '';
  tenPullResultsEl.hidden = false;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pending = results.length;

  const finishOne = () => {
    pending -= 1;
    if (pending <= 0) {
      spinning = false;
      spinBtn.disabled = false;
      tenSpinBtn.disabled = false;
    }
  };

  results.forEach((store, i) => {
    const tile = document.createElement('div');
    tile.className = 'pull-tile' + (store.caution ? ' has-caution' : '');
    const tileRarity = store.rarity || 'R';
    tile.dataset.rarity = tileRarity;
    tile.style.animationDelay = reduced ? '0s' : (i * 0.06) + 's';
    const catLabel = CATEGORIES.find(c => c.key === store.cat).label;
    const idx = currentPool.indexOf(store) + 1;
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(store.name + ' ' + store.addr + ' 台北市中山區');
    tile.innerHTML = `
      <div class="tile-face tile-back">
        <svg class="tile-back-emblem" width="36" height="36" viewBox="0 0 52 52" fill="none" aria-hidden="true">
          <path d="M12 20c0-7 6-13 14-13s14 6 14 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M9 20h34l-2.4 15.5C40 39.5 36 42 26 42s-14-2.5-14.6-6.5L9 20z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
          <line x1="26" y1="6" x2="26" y2="13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
        <span class="tile-back-mark">吃飯了</span>
        <span class="tile-back-hint">點一下翻牌</span>
      </div>
      <div class="tile-face tile-front">
        <div class="card-top-row">
          <div class="badge mono">#${idx}</div>
          <div class="cat-tag"><span class="dot" style="--dot:${catColor(store.cat)}"></span>${catLabel}</div>
        </div>
        <h3>${store.name}</h3>
        <div class="addr"><span class="addr-text">${store.addr}</span>${store.walkMin ? `<span class="walk">🚶 約${store.walkMin}分</span>` : ''}</div>
        <div class="desc">${store.desc}</div>
        ${store.caution ? `<div class="caution">⚠️ ${store.caution}</div>` : ''}
        <div class="actions">
          <a class="btn-ghost" href="${mapUrl}" target="_blank" rel="noopener">在 Google 地圖開啟</a>
        </div>
      </div>
    `;
    const tileFront = tile.querySelector('.tile-front');
    tileFront.style.backgroundImage = `url(${CARD_FRAMES[tileRarity]})`;
    tileFront.style.backgroundSize = '100% 100%';
    tileFront.style.backgroundRepeat = 'no-repeat';
    tenPullResultsEl.appendChild(tile);

    const tileBack = tile.querySelector('.tile-back');
    const reveal = () => {
      tileBack.classList.add('face-hidden');
      tileFront.classList.add('face-visible');
    };
    const afterReveal = () => {
      if (tileRarity === 'SSR') spark(tile);
      finishOne();
    };

    if (reduced) {
      reveal();
      afterReveal();
      return;
    }

    const flip = () => {
      tile.removeEventListener('click', flip);
      tile.classList.remove('flippable');
      runSqueezeReveal(tile, reveal, afterReveal);
    };

    tile.addEventListener('animationend', function onEntranceEnd() {
      tile.removeEventListener('animationend', onEntranceEnd);
      // lock in the entrance's final look as inline styles before dropping the
      // animation, otherwise clearing `animation` also drops its forwards-held
      // end state and the tile snaps back to its (invisible) pre-entrance look.
      tile.style.opacity = '1';
      tile.style.transform = 'none';
      tile.style.animation = 'none';
      tile.classList.add('flippable');
      tile.addEventListener('click', flip);
    }, { once: true });
  });
}

spinBtn.addEventListener('click', doSpin);
tenSpinBtn.addEventListener('click', doTenSpin);

startSceneCarousel();
renderAll();
