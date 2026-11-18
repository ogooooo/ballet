/* =========================================================
   오늘의 발레 코디북
   - 레오타드 · 상의/워머 · 하의 · 앵클워머 조합기
   - 궁합 점수 기반 오늘의 추천 / 베스트 룩북
   - 옷장(아이템 추가) · 즐겨찾기 · 착용 기록 (localStorage)
   ========================================================= */

const STORE = {
  custom: 'ballet.v1.custom',
  favorites: 'ballet.v1.favorites',
  wears: 'ballet.v1.wears',
  last: 'ballet.v1.lastCombo',
  view: 'ballet.v1.view'
};

const CATS = [
  { key: 'leotard', label: '레오타드', required: true },
  { key: 'top', label: '상의 · 워머', required: false },
  { key: 'bottom', label: '하의', required: false },
  { key: 'ankle', label: '앵클워머', required: false }
];


let DATA = { items: [], presets: [], shapes: {}, copy: {} };
const state = {
  items: [],
  presets: [],
  combo: { leotard: null, top: null, bottom: null, ankle: null },
  favorites: [],
  wears: [],
  custom: [],
  tab: 'compose',
  view: 'illustration',
  drawn: false
};

/* ---------------- 작은 도우미 ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function persist() {
  try {
    localStorage.setItem(STORE.favorites, JSON.stringify(state.favorites));
    localStorage.setItem(STORE.wears, JSON.stringify(state.wears));
    localStorage.setItem(STORE.custom, JSON.stringify(state.custom));
    localStorage.setItem(STORE.last, JSON.stringify(state.combo));
    localStorage.setItem(STORE.view, state.view);
  } catch (e) { /* 저장 공간을 쓸 수 없어도 화면은 계속 동작한다 */ }
}

function byId(id) {
  if (!id) return null;
  return state.items.find((it) => it.id === id) || null;
}
function itemsOf(cat) {
  return state.items.filter((it) => it.category === cat);
}
function comboItems(combo) {
  return CATS.map((c) => byId(combo[c.key])).filter(Boolean);
}

/* ---------------- 색 계산 (도우미는 visuals.js) ---------------- */
function deriveTone(hex) {
  const [h, s, l] = rgbToHsl(hex);
  let family = 'neutral';
  if (l < 0.24) family = 'black';
  else if (s < 0.09 && l > 0.88) family = 'white';
  else if (s < 0.10) family = 'neutral';
  else if ((h >= 320 || h <= 14) && s > 0.13 && l > 0.6) family = 'pink';
  return { family, value: Math.round(l * 100) };
}

const COLOR_NAMES = [
  ['크림', '#F7F0E6'], ['화이트', '#FBF7F3'], ['아이보리', '#EFE6D6'], ['베이지', '#E0CFB8'],
  ['오트밀', '#DCC7AB'], ['린넨', '#CDBBA4'], ['토프', '#B5A18F'], ['모카', '#A3826E'],
  ['브라운', '#7A5F4E'], ['그레이', '#A8A4A5'], ['차콜', '#4B484B'], ['블랙', '#302C2E'],
  ['로즈핑크', '#E4A0AA'], ['핑크', '#E8B3B9'], ['뮤트핑크', '#C79AA1'], ['더스티로즈', '#B98A91'],
  ['버건디', '#7C3B44'], ['라벤더', '#C3B7D6'], ['세이지', '#A9B49C'], ['네이비', '#38425C']
];
function nearestColorName(hex) {
  const { r, g, b } = hexToRgb(hex);
  let best = '내 컬러', bestD = Infinity;
  COLOR_NAMES.forEach(([name, ref]) => {
    const c = hexToRgb(ref);
    const d = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  });
  return best;
}

/* ---------------- 그림 (visuals.js) ---------------- */
function figureSvg(combo) {
  return figureArt({
    leotard: byId(combo.leotard),
    top: combo.top ? byId(combo.top) : null,
    bottom: combo.bottom ? byId(combo.bottom) : null,
    ankle: combo.ankle ? byId(combo.ankle) : null
  });
}

function boardIssueNumber(combo) {
  const order = ['leotard', 'top', 'bottom', 'ankle'];
  let acc = 3;
  order.forEach((key, i) => {
    const item = combo[key] ? byId(combo[key]) : null;
    acc += (item ? state.items.indexOf(item) + 1 : 1) * (i + 2);
  });
  return 'NO. ' + String((acc % 12) + 1).padStart(2, '0');
}

function boardDate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function boardSvg(combo) {
  const leo = byId(combo.leotard);
  const top = combo.top ? byId(combo.top) : null;
  const bot = combo.bottom ? byId(combo.bottom) : null;
  const ank = combo.ankle ? byId(combo.ankle) : null;
  const items = [leo, top, bot, ank].filter(Boolean);
  return boardArt({
    leotard: leo,
    top,
    bottom: bot,
    ankle: ank,
    title: lookTitle(combo),
    date: boardDate(),
    issue: boardIssueNumber(combo) + ' / ' + boardDate(),
    items: items.map((i) => i.short || i.name).join(' · '),
    score: scoreCombo(combo),
    palette: items.map((i) => i.color)
  });
}

/* ---------------- 아이템 카드 (제품 사진 · 플랫레이) ---------------- */
function garmentSvg(item) {
  return garmentThumb(item);
}

function itemThumb(item, size = 'thumb-sm') {
  if (!item) return '';
  const flat = `<span class="thumb-flat" aria-hidden="true">${garmentSvg(item)}</span>`;
  const img = item.image
    ? `<img src="${esc(item.image)}" alt="${esc(item.name || '')}" loading="lazy" onerror="this.remove()"${item.imageSrc ? ` title="제품 사진 · ${esc(item.imageSrc)}"` : ''}>`
    : '';
  return `<span class="thumb ${size}${item.image ? ' has-photo' : ''}">${flat}${img}</span>`;
}

/* ---------------- 궁합 점수 ---------------- */
function pairScore(a, b) {
  if (!a || !b) return null;
  const fa = a.family, fb = b.family;
  if (fa === fb) {
    if (fa === 'neutral') {
      const d = Math.abs(a.value - b.value);
      if (d < 6) return 13;
      if (d <= 34) return 19;
      return 12;
    }
    if (fa === 'pink') return Math.abs(a.value - b.value) < 5 ? 9 : 16;
    if (fa === 'black') return 17;
    if (fa === 'white') return 17;
  }
  const set = new Set([fa, fb]);
  if (set.has('black') && set.has('pink')) return 20;
  if (set.has('black') && set.has('neutral')) return 17;
  if (set.has('white') && set.has('pink')) return 19;
  if (set.has('white') && set.has('neutral')) return 18;
  if (set.has('neutral') && set.has('pink')) return 18;
  return 14;
}

const WEIGHT = { leoTop: 1.2, leoBot: 1.1, topBot: 0.7, leoAnk: 0.4, botAnk: 0.6, topAnk: 0.3 };

function scoreCombo(combo) {
  const leo = byId(combo.leotard), top = byId(combo.top), bot = byId(combo.bottom), ank = byId(combo.ankle);
  const pairs = [
    [leo, top, WEIGHT.leoTop],
    [leo, bot, WEIGHT.leoBot],
    [top, bot, WEIGHT.topBot],
    [leo, ank, WEIGHT.leoAnk],
    [bot, ank, WEIGHT.botAnk],
    [top, ank, WEIGHT.topAnk]
  ];
  let sum = 0, wsum = 0;
  pairs.forEach(([a, b, w]) => {
    const p = pairScore(a, b);
    if (p != null) { sum += p * w; wsum += w; }
  });
  const avg = wsum ? sum / wsum : 14;
  let s = 60 + (avg - 10) * 3.3;
  if (top) s += 2.5;
  if (bot) s += 1.5;
  if (ank) s += 1.5;

  const chosen = comboItems(combo);
  const pinks = chosen.filter((i) => i.family === 'pink').length;
  if (pinks >= 3) s -= 5;
  if (chosen.length >= 3 && chosen.every((i) => i.value < 42)) s -= 7;
  if (chosen.length >= 3 && !chosen.some((i) => i.value > 72)) s -= 2;
  return clamp(Math.round(s), 58, 99);
}

function harmonyKey(combo) {
  const chosen = comboItems(combo);
  const pinks = chosen.filter((i) => i.family === 'pink').length;
  const hasBlack = chosen.some((i) => i.family === 'black');
  const neutrals = chosen.filter((i) => i.family === 'neutral').length;
  if (chosen.length <= 1) return 'single';
  if (hasBlack && pinks >= 1) return 'blackRose';
  if (pinks >= 2) return 'pinkLayered';
  if (hasBlack) return 'mono';
  if (pinks === 1 && neutrals >= 1) return 'rosePoint';
  if (pinks === 1) return 'roseTone';
  if (neutrals >= 3) return 'neutral';
  return 'daily';
}

const TITLES = {
  single: '심플 레오타드',
  blackRose: '블랙 & 로즈',
  pinkLayered: '핑크 레이어드',
  mono: '모던 모노톤',
  rosePoint: '로즈 포인트',
  roseTone: '로즈 톤',
  neutral: '뉴트럴 톤온톤',
  daily: '차분한 데일리'
};

function lookTitle(combo) {
  return TITLES[harmonyKey(combo)] || '차분한 데일리';
}

function harmonyLine(combo) {
  const c = (DATA.copy && DATA.copy.harmony) || {};
  return c[harmonyKey(combo)] || '';
}

function lookComment(combo) {
  const clause = (DATA.copy && DATA.copy.clause) || {};
  const leo = byId(combo.leotard), top = byId(combo.top), bot = byId(combo.bottom), ank = byId(combo.ankle);
  const parts = [harmonyLine(combo)];
  const bits = [];
  if (top) bits.push(clause[top.shape]);
  if (bot) bits.push(clause[bot.shape]);
  if (!top && !bot && leo) bits.push(clause[leo.shape]);
  const kept = bits.filter(Boolean).slice(0, 2);
  if (kept.length) parts.push(kept.join(' '));
  if (ank) parts.push(`발목은 ${ank.colorName} 앵클워머로 마무리했어요.`);
  return parts.filter(Boolean).join(' ');
}

/* ---------------- 추천 조합 ---------------- */
function allCombos() {
  const leos = itemsOf('leotard');
  const tops = [null, ...itemsOf('top')];
  const bots = [null, ...itemsOf('bottom')];
  const anks = [null, ...itemsOf('ankle')];
  const out = [];
  leos.forEach((l) => tops.forEach((t) => bots.forEach((b) => anks.forEach((a) => {
    out.push({
      leotard: l.id,
      top: t ? t.id : null,
      bottom: b ? b.id : null,
      ankle: a ? a.id : null
    });
  }))));
  return out;
}

function recommendPool(exclude) {
  // 추천은 하의까지 갖춘 '완성된 코디' 중에서 고른다
  const all = allCombos();
  const full = all.filter((c) => c.bottom);
  const scored = (full.length ? full : all).map((c) => ({ combo: c, score: scoreCombo(c) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(18, scored.length));
  const key = (c) => [c.leotard, c.top, c.bottom, c.ankle].join('|');
  const ex = exclude ? key(exclude) : null;
  const filtered = top.filter((x) => key(x.combo) !== ex);
  return filtered.length ? filtered : top;
}

/* ---------------- 화면 렌더링 ---------------- */
function applyView() {
  const stage = $('#stageFigure');
  if (!stage) return;
  const card = stage.closest('.stage');
  if (card) card.classList.toggle('is-board', state.view === 'board');
  $$('.vs-btn').forEach((b) => {
    const on = b.dataset.view === state.view;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function setView(view, opts = {}) {
  if (view !== 'board' && view !== 'illustration') return;
  if (state.view === view && !opts.force) return;
  state.view = view;
  renderStage(state.combo);
  persist();
  if (!opts.quiet) toast(view === 'board' ? '스타일링 보드로 봅니다' : '일러스트로 봅니다');
}

function renderStage(combo, ghost = false) {
  const stage = $('#stageFigure');
  stage.innerHTML = state.view === 'board' ? boardSvg(combo) : figureSvg(combo);
  stage.classList.toggle('is-ghost', ghost);
  applyView();

  const score = scoreCombo(combo);
  const title = lookTitle(combo);
  $('#stageScore').textContent = `궁합 ${score}`;
  $('#stageTitle').textContent = title;
  $('#stageKicker').textContent = state.drawn ? '오늘의 추천 코디' : '지금 고른 코디';
  $('#stageComment').textContent = lookComment(combo);

  const chosen = CATS.map((c) => ({ cat: c, item: byId(combo[c.key]) })).filter((x) => x.item);
  $('#stageItems').innerHTML = chosen.map(({ cat, item }) => `
    <li>
      ${itemThumb(item, 'thumb-sm')}
      <span class="item-text">
        <span class="item-name">${esc(item.short || item.name)}</span>
        <span class="item-meta">${esc(item.brand || '브랜드 미기록')}${item.colorName ? ` · ${esc(item.colorName)}` : ''}</span>
      </span>
      <span class="item-cat">${esc(cat.label)}</span>
    </li>`).join('');
}

function renderPickers() {
  const wrap = $('#pickers');
  wrap.innerHTML = CATS.map((cat) => {
    const list = itemsOf(cat.key);
    const chips = [];
    if (!cat.required) {
      const active = !state.combo[cat.key];
      chips.push(`<button class="chip chip-none ${active ? 'is-active' : ''}" data-cat="${cat.key}" data-id="">
          <span class="dot dot-none"></span>선택 안 함</button>`);
    }
    list.forEach((item) => {
      const active = state.combo[cat.key] === item.id;
      chips.push(`<button class="chip ${active ? 'is-active' : ''}" data-cat="${cat.key}" data-id="${esc(item.id)}" title="${esc(item.name)}">
          ${itemThumb(item, 'thumb-chip')}${esc(item.short || item.name)}</button>`);
    });
    return `<div class="picker">
        <div class="picker-head">
          <span class="picker-label">${esc(cat.label)}</span>
          <span class="picker-count">${list.length}</span>
        </div>
        <div class="chips">${chips.join('')}</div>
      </div>`;
  }).join('');
}

function renderLookbook() {
  const wrap = $('#lookbook');
  wrap.innerHTML = state.presets.map((p) => {
    const score = scoreCombo(p.combo);
    const shorts = comboItems(p.combo).map((i) => `<span class="lookcard-item">${itemThumb(i, 'thumb-chip')}${esc(i.short || i.name)}</span>`);
    return `<article class="lookcard" data-preset="${esc(p.id)}">
        <div class="lookcard-figure">${figureSvg(p.combo)}</div>
        <div class="lookcard-body">
          <div class="lookcard-top">
            <h3>${esc(p.name)}</h3>
            <span class="lookcard-score">${score}</span>
          </div>
          <p class="lookcard-tag">${esc(p.tag || '')}</p>
          <p class="lookcard-desc">${esc(p.desc || '')}</p>
          <p class="lookcard-items">${shorts.join('')}</p>
          <button class="btn btn-soft btn-load" data-load="${esc(p.id)}">이 코디 입어보기</button>
        </div>
      </article>`;
  }).join('');
}

function renderCloset() {
  const list = $('#closetList');
  list.innerHTML = CATS.map((cat) => {
    const items = itemsOf(cat.key);
    return `<div class="closet-group">
        <h3 class="sub-head">${esc(cat.label)} <span class="count">${items.length}</span></h3>
        <ul class="closet-rows">
          ${items.map((item) => `
            <li class="closet-row" data-item="${esc(item.id)}">
              ${itemThumb(item, 'thumb-md')}
              <div class="closet-text">
                <p class="closet-name">${esc(item.name)}</p>
                <p class="closet-meta">${esc(item.brand || '브랜드 미기록')} · ${esc(item.note || '')}</p>
              </div>
              ${item.custom ? `<button class="icon-btn" data-remove="${esc(item.id)}" aria-label="삭제">×</button>` : `<span class="closet-badge">${esc(item.colorName)}</span>`}
            </li>`).join('')}
        </ul>
      </div>`;
  }).join('');
  $('#closetSummary').textContent = `보유 아이템 ${state.items.length}개 · 마음에 드는 옷은 눌러서 코디에 담아 보세요`;
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const now = new Date();
  const year = d.getFullYear() === now.getFullYear() ? '' : `${d.getFullYear()}년 `;
  return `${year}${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function renderLog() {
  const favWrap = $('#favList');
  $('#favCount').textContent = state.favorites.length;
  if (!state.favorites.length) {
    favWrap.innerHTML = `<p class="empty">아직 저장한 코디가 없어요. 조합기에서 마음에 드는 코디를 저장해 보세요.</p>`;
  } else {
    favWrap.innerHTML = state.favorites.map((f) => `
      <article class="fav-card" data-fav="${esc(f.id)}">
        <div class="fav-thumb">${figureSvg(f.combo)}</div>
        <div class="fav-body">
          <div class="fav-head">
            <h4>${esc(f.title)}</h4>
            <span class="lookcard-score">${esc(String(f.score))}</span>
          </div>
          <p class="fav-items">${comboItems(f.combo).map((i) => esc(i.short || i.name)).join(' · ')}</p>
          <p class="fav-date">${esc(fmtDate(f.createdAt.slice(0, 10)))} 저장</p>
          <div class="fav-actions">
            <button class="btn btn-mini" data-loadcombo="${esc(f.id)}">불러오기</button>
            <button class="btn btn-mini" data-wearcombo="${esc(f.id)}">입었어요</button>
            <button class="icon-btn" data-delfav="${esc(f.id)}" aria-label="삭제">×</button>
          </div>
        </div>
      </article>`).join('');
  }

  const wearWrap = $('#wearList');
  $('#wearCount').textContent = state.wears.length;
  if (!state.wears.length) {
    wearWrap.innerHTML = `<p class="empty">착용 기록이 비어 있어요. “오늘 입었어요”를 누르면 날짜와 함께 남아요.</p>`;
  } else {
    const sorted = [...state.wears].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    wearWrap.innerHTML = sorted.map((w) => `
      <article class="wear-row" data-wear="${esc(w.id)}">
        <div class="wear-date">${esc(fmtDate(w.date))}</div>
        <div class="wear-main">
          <p class="wear-title">${esc(w.title)}<span class="wear-score">${esc(String(w.score))}</span></p>
          <p class="wear-items">${comboItems(w.combo).map((i) => esc(i.short || i.name)).join(' · ')}</p>
        </div>
        <button class="icon-btn" data-delwear="${esc(w.id)}" aria-label="삭제">×</button>
      </article>`).join('');
  }

  const month = todayISO().slice(0, 7);
  const monthCount = state.wears.filter((w) => w.date.startsWith(month)).length;
  const leoCount = {};
  state.wears.forEach((w) => {
    const leo = byId(w.combo.leotard);
    if (leo) leoCount[leo.short || leo.name] = (leoCount[leo.short || leo.name] || 0) + 1;
  });
  const topLeo = Object.entries(leoCount).sort((a, b) => b[1] - a[1])[0];
  $('#logSummary').textContent = state.wears.length
    ? `총 ${state.wears.length}번 기록 · 이번 달 ${monthCount}번${topLeo ? ` · 가장 많이 입은 레오타드 ${topLeo[0]} (${topLeo[1]}회)` : ''}`
    : '저장한 코디와 착용 기록을 모아 둘게요.';
}

function renderAll() {
  $('#mastheadSub').textContent = `보유한 ${state.items.length}개 아이템으로 오늘의 코디를 골라 보세요`;
  renderStage(state.combo);
  renderPickers();
  renderLookbook();
  renderCloset();
  renderLog();
  persist();
}

/* ---------------- 토스트 ---------------- */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2200);
}

/* ---------------- 동작 ---------------- */
function setCombo(combo, opts = {}) {
  state.combo = { ...state.combo, ...combo };
  state.drawn = !!opts.drawn;
  renderStage(state.combo);
  renderPickers();
  persist();
}

function loadPreset(id) {
  const p = state.presets.find((x) => x.id === id);
  if (!p) return;
  setCombo({ ...p.combo });
  switchTab('compose');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast(`'${p.name}' 코디를 불러왔어요`);
}

function drawLook() {
  const pool = recommendPool(state.combo);
  const btn = $('#btnDraw');
  btn.disabled = true;
  if (state.view === 'board') {
    const final = pool[Math.floor(Math.random() * pool.length)].combo;
    state.drawn = true;
    setCombo(final, { drawn: true });
    const fig = $('#stageFigure');
    fig.classList.add('is-pop');
    setTimeout(() => fig.classList.remove('is-pop'), 560);
    btn.disabled = false;
    toast('오늘의 추천 코디를 골랐어요');
    return;
  }
  let ticks = 0;
  const timer = setInterval(() => {
    const ghost = pick(pool).combo;
    renderStage(ghost, true);
    ticks++;
    if (ticks >= 8) {
      clearInterval(timer);
      const final = pool[Math.floor(Math.random() * pool.length)].combo;
      state.drawn = true;
      setCombo(final, { drawn: true });
      const fig = $('#stageFigure');
      fig.classList.remove('is-ghost');
      fig.classList.add('is-pop');
      setTimeout(() => fig.classList.remove('is-pop'), 520);
      btn.disabled = false;
      toast('오늘의 추천 코디를 골랐어요');
    }
  }, 95);
}

function saveFavorite() {
  const key = (c) => [c.leotard, c.top, c.bottom, c.ankle].join('|');
  if (state.favorites.some((f) => key(f.combo) === key(state.combo))) {
    toast('이미 저장한 코디예요');
    return;
  }
  state.favorites.unshift({
    id: 'fav-' + Date.now(),
    createdAt: new Date().toISOString(),
    combo: { ...state.combo },
    title: lookTitle(state.combo),
    score: scoreCombo(state.combo)
  });
  renderLog();
  persist();
  toast('코디를 저장했어요. 기록 탭에서 볼 수 있어요');
}

function logWear(combo) {
  const today = todayISO();
  const key = (c) => [c.leotard, c.top, c.bottom, c.ankle].join('|');
  if (state.wears.some((w) => w.date === today && key(w.combo) === key(combo))) {
    toast('오늘은 이미 이 코디로 기록했어요');
    return;
  }
  state.wears.unshift({
    id: 'wear-' + Date.now(),
    date: today,
    combo: { ...combo },
    title: lookTitle(combo),
    score: scoreCombo(combo)
  });
  renderLog();
  persist();
  toast('오늘 코디로 기록했어요');
}

function switchTab(tab) {
  state.tab = tab;
  $$('.panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab));
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tab));
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------------- 옷장 추가 폼 ---------------- */
function fillShapeSelect(cat) {
  const sel = $('#addShape');
  const shapes = (DATA.shapes && DATA.shapes[cat]) || [];
  sel.innerHTML = shapes.map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');
}
function renderSwatches() {
  const box = $('#colorSwatches');
  const base = ['#FBF7F3', '#E7DAC9', '#DCC7AB', '#B5A18F', '#A3826E', '#A8A4A5', '#4B484B', '#302C2E', '#E7AFB9', '#E4A0AA', '#C79AA1', '#B98A91'];
  box.innerHTML = base.map((c) => `<button type="button" class="swatch" data-color="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('');
}
function addItem(ev) {
  ev.preventDefault();
  const name = $('#addName').value.trim();
  const cat = $('#addCategory').value;
  const shape = $('#addShape').value;
  const brand = $('#addBrand').value.trim();
  const color = $('#addColor').value;
  const colorName = $('#addColorName').value.trim() || nearestColorName(color);
  if (!name) {
    toast('이름을 적어 주세요');
    $('#addName').focus();
    return;
  }
  const tone = deriveTone(color);
  const item = {
    id: 'custom-' + Date.now().toString(36),
    category: cat,
    shape: shape || ((DATA.shapes[cat] || [{}])[0].id || 'camisole'),
    brand,
    name,
    short: name.replace(/\s+/g, ' ').slice(0, 14),
    color,
    colorName,
    family: tone.family,
    value: tone.value,
    note: '내가 직접 추가한 아이템',
    custom: true
  };
  state.custom.push(item);
  state.items = DATA.items.concat(state.custom);
  if (!state.combo[cat]) state.combo[cat] = item.id;
  $('#addForm').reset();
  $('#addName').value = '';
  $('#addBrand').value = '';
  $('#addColorName').value = '';
  $('#addForm').hidden = true;
  renderAll();
  toast(`'${name}' 옷장에 추가했어요`);
}

/* ---------------- 이벤트 연결 ---------------- */
function bind() {
  $('#btnDraw').addEventListener('click', drawLook);

  $$('.vs-btn').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
  $('#btnSave').addEventListener('click', saveFavorite);
  $('#btnWear').addEventListener('click', () => logWear(state.combo));

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      const cat = chip.dataset.cat;
      const id = chip.dataset.id || null;
      setCombo({ [cat]: id });
      const label = id ? (byId(id) || {}).short || '아이템' : '선택 안 함';
      if (id) toast(`${label} 선택`);
      return;
    }

    const loadBtn = e.target.closest('[data-load]');
    if (loadBtn) { loadPreset(loadBtn.dataset.load); return; }

    const card = e.target.closest('.lookcard');
    if (card) { loadPreset(card.dataset.preset); return; }

    const loadFav = e.target.closest('[data-loadcombo]');
    if (loadFav) {
      const f = state.favorites.find((x) => x.id === loadFav.dataset.loadcombo);
      if (f) { setCombo({ ...f.combo }); switchTab('compose'); toast('저장한 코디를 불러왔어요'); }
      return;
    }
    const wearFav = e.target.closest('[data-wearcombo]');
    if (wearFav) {
      const f = state.favorites.find((x) => x.id === wearFav.dataset.wearcombo);
      if (f) logWear(f.combo);
      return;
    }
    const delFav = e.target.closest('[data-delfav]');
    if (delFav) {
      state.favorites = state.favorites.filter((x) => x.id !== delFav.dataset.delfav);
      renderLog(); persist(); toast('저장한 코디를 지웠어요');
      return;
    }
    const delWear = e.target.closest('[data-delwear]');
    if (delWear) {
      state.wears = state.wears.filter((x) => x.id !== delWear.dataset.delwear);
      renderLog(); persist(); toast('기록을 지웠어요');
      return;
    }
    const delItem = e.target.closest('[data-remove]');
    if (delItem) {
      const id = delItem.dataset.remove;
      state.custom = state.custom.filter((x) => x.id !== id);
      state.items = DATA.items.concat(state.custom);
      ['leotard', 'top', 'bottom', 'ankle'].forEach((c) => { if (state.combo[c] === id) state.combo[c] = null; });
      if (!state.combo.leotard) {
        const firstLeo = itemsOf('leotard')[0];
        state.combo.leotard = firstLeo ? firstLeo.id : null;
      }
      renderAll(); toast('옷장에서 지웠어요');
      return;
    }
    const row = e.target.closest('.closet-row');
    if (row) {
      const item = byId(row.dataset.item);
      if (item) {
        setCombo({ [item.category]: item.id });
        switchTab('compose');
        toast(`'${item.short || item.name}' 코디에 담았어요`);
      }
      return;
    }

    const tabBtn = e.target.closest('.tab');
    if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
  });

  $('#btnAddToggle').addEventListener('click', () => {
    const form = $('#addForm');
    form.hidden = !form.hidden;
    if (!form.hidden) {
      fillShapeSelect($('#addCategory').value);
      $('#addName').focus();
    }
  });
  $('#btnAddCancel').addEventListener('click', () => { $('#addForm').hidden = true; });
  $('#addCategory').addEventListener('change', (e) => fillShapeSelect(e.target.value));
  $('#addForm').addEventListener('submit', addItem);
  $('#colorSwatches').addEventListener('click', (e) => {
    const b = e.target.closest('.swatch');
    if (!b) return;
    $('#addColor').value = b.dataset.color;
    $('#addColorName').value = nearestColorName(b.dataset.color);
    $$('#colorSwatches .swatch').forEach((x) => x.classList.toggle('is-picked', x === b));
  });
}

/* ---------------- 시작 ---------------- */
async function boot() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    DATA = await res.json();
  } catch (err) {
    $('#stageComment').textContent = '발레복 데이터를 불러오지 못했어요. 새로고침 해 주세요.';
    return;
  }

  state.presets = DATA.presets || [];
  state.custom = load(STORE.custom, []);
  state.items = DATA.items.concat(state.custom);
  state.favorites = load(STORE.favorites, []);
  state.wears = load(STORE.wears, []);

  const saved = load(STORE.last, null);
  const fallback = (state.presets[0] && state.presets[0].combo) || {
    leotard: (DATA.items.find((i) => i.category === 'leotard') || {}).id || null,
    top: null, bottom: null, ankle: null
  };
  const start = saved && byId(saved.leotard) ? saved : fallback;
  state.combo = { leotard: start.leotard || null, top: start.top || null, bottom: start.bottom || null, ankle: start.ankle || null };

  state.view = load(STORE.view, 'illustration') === 'board' ? 'board' : 'illustration';
  bind();
  renderSwatches();
  fillShapeSelect('leotard');
  renderAll();
}

document.addEventListener('DOMContentLoaded', boot);
