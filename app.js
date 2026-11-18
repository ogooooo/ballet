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
  last: 'ballet.v1.lastCombo'
};

const CATS = [
  { key: 'leotard', label: '레오타드', required: true },
  { key: 'top', label: '상의 · 워머', required: false },
  { key: 'bottom', label: '하의', required: false },
  { key: 'ankle', label: '앵클워머', required: false }
];

const FIG = {
  tights: '#F1DFDB',
  skin: '#EFD2C8',
  hair: '#3A2F31'
};

let DATA = { items: [], presets: [], shapes: {}, copy: {} };
const state = {
  items: [],
  presets: [],
  combo: { leotard: null, top: null, bottom: null, ankle: null },
  favorites: [],
  wears: [],
  custom: [],
  tab: 'compose',
  drawn: false
};

/* ---------------- 작은 도우미 ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
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

/* ---------------- 색 계산 ---------------- */
function hexToRgb(hex) {
  let h = String(hex || '#CCCCCC').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return { r: 200, g: 200, b: 200 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r, g, b) {
  const c = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function shade(hex, pct) {
  const { r, g, b } = hexToRgb(hex);
  const target = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  return rgbToHex(r + (target - r) * p, g + (target - g) * p, b + (target - b) * p);
}
function rgbToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
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

/* ---------------- SVG 일러스트 ---------------- */
let uid = 0;

function legPaths() {
  return {
    thighL: 'M111,178 C 109,218 108,258 107,300',
    thighR: 'M129,178 C 131,218 132,258 133,300',
    calfL: 'M107,296 C 106,330 105,362 104,394',
    calfR: 'M133,296 C 134,330 135,362 136,394'
  };
}
const ARM = {
  left: 'M100,98 C 92,118 87,140 83,160 C 81,172 79,184 78,194',
  right: 'M140,98 C 148,118 153,140 157,160 C 159,172 161,184 162,194'
};
const FOOT = {
  left: 'M103,394 C 99,404 93,413 87,419 C 84,422 87,426 93,425 C 100,423 106,413 108,400 Z',
  right: 'M137,394 C 141,404 147,413 153,419 C 156,422 153,426 147,425 C 140,423 134,413 132,400 Z'
};
const SLEEVE_SHORT = {
  left: 'M101,97 C 96,107 92,117 89,126',
  right: 'M139,97 C 144,107 148,117 151,126'
};
const TORSO = 'M99,95 C 103,85 111,80 120,80 C 129,80 137,85 141,95 C 143,114 142,134 139,153 C 135,162 127,165 120,165 C 113,165 105,162 101,153 C 98,134 97,114 99,95 Z';

function leotardPath(shape) {
  if (shape === 'boatneck') {
    return 'M100,92 Q120,103 140,92 C 145,113 141,136 136,152 C 134,168 138,178 142,188 C 128,195 112,195 98,188 C 102,178 106,168 104,152 C 99,136 95,113 100,92 Z';
  }
  return 'M104,96 Q120,120 136,96 C 140,116 139,136 135,152 C 133,168 137,178 141,188 C 128,195 112,195 99,188 C 103,178 107,168 105,152 C 101,136 100,116 104,96 Z';
}

function bottomPath(shape) {
  switch (shape) {
    case 'skirt-long':
      return 'M99,158 C 97,172 82,206 70,240 C 66,250 68,255 76,257 C 90,261 105,254 120,258 C 135,254 150,261 164,257 C 172,255 174,250 170,240 C 158,206 143,172 141,158 Z';
    case 'skirt-short':
      return 'M100,160 C 98,172 86,200 76,222 C 73,230 76,235 84,236 C 96,238 108,232 120,236 C 132,232 144,238 156,236 C 164,235 167,230 164,222 C 154,200 142,172 140,160 Z';
    case 'shorts-knit':
      return 'M98,160 C 96,178 94,200 95,228 C 96,236 104,241 112,239 C 118,237 119,230 119,218 L120,198 L121,218 C 121,230 122,237 128,239 C 136,241 144,236 145,228 C 146,200 144,178 142,160 Z';
    case 'shorts-loose':
      return 'M97,158 C 94,176 91,200 90,224 C 89,232 96,237 105,235 C 113,233 116,227 116,217 L118,201 L120,197 L122,201 L124,217 C 124,227 127,233 135,235 C 144,237 151,232 150,224 C 149,200 146,176 143,158 Z';
    default:
      return '';
  }
}

function foldLines(shape, k) {
  switch (shape) {
    case 'skirt-long':
      return `<g clip-path="url(#${k}-bot)" stroke="#000" stroke-opacity=".075" stroke-width="1" fill="none">
        <path d="M110,170 C 106,194 98,222 88,250"/>
        <path d="M130,170 C 134,194 142,222 152,250"/>
        <path d="M120,176 C 120,200 120,228 120,256"/>
      </g>`;
    case 'skirt-short':
      return `<g clip-path="url(#${k}-bot)" stroke="#000" stroke-opacity=".075" stroke-width="1" fill="none">
        <path d="M111,170 C 108,188 100,208 92,230"/>
        <path d="M129,170 C 132,188 140,208 148,230"/>
      </g>`;
    case 'shorts-knit':
      return `<g clip-path="url(#${k}-bot)" stroke="#000" stroke-opacity=".08" stroke-width="1" fill="none">
        <path d="M99,168 C 111,174 129,174 141,168"/>
        <path d="M103,186 C 103,204 103,218 104,230"/>
        <path d="M137,186 C 137,204 137,218 136,230"/>
      </g>
      <g fill="${shade('#000000', 0)}" opacity=".0"></g>`;
    case 'shorts-loose':
      return `<g clip-path="url(#${k}-bot)" stroke="#000" stroke-opacity=".08" stroke-width="1" fill="none">
        <path d="M97,166 C 111,172 129,172 143,166"/>
        <path d="M95,174 C 111,180 129,180 145,174"/>
        <path d="M100,196 C 100,214 99,232 96,246"/>
        <path d="M140,196 C 140,214 141,232 144,246"/>
      </g>`;
    default:
      return '';
  }
}

function figureSvg(combo, opts = {}) {
  const k = 'u' + (++uid);
  const leo = byId(combo.leotard);
  const top = combo.top ? byId(combo.top) : null;
  const bot = combo.bottom ? byId(combo.bottom) : null;
  const ank = combo.ankle ? byId(combo.ankle) : null;

  const leoColor = leo ? leo.color : '#DCD2C9';
  const leoLine = shade(leoColor, -22);
  const topColor = top ? top.color : null;
  const botColor = bot ? bot.color : null;
  const ankColor = ank ? ank.color : null;

  const body = leotardPath(leo ? leo.shape : 'camisole');
  const bpath = bot ? bottomPath(bot.shape) : '';
  const legs = legPaths();
  const layers = [];

  layers.push(`<ellipse cx="120" cy="443" rx="66" ry="9" fill="#6B4F49" opacity=".10"/>`);

  /* 다리 · 발 */
  layers.push(`<g stroke="${FIG.tights}" stroke-linecap="round" fill="none">
      <path d="${legs.thighL}" stroke-width="18"/><path d="${legs.thighR}" stroke-width="18"/>
      <path d="${legs.calfL}" stroke-width="13.5"/><path d="${legs.calfR}" stroke-width="13.5"/>
    </g>`);
  layers.push(`<g fill="${FIG.tights}">
      <path d="${FOOT.left}"/><path d="${FOOT.right}"/>
    </g>`);
  layers.push(`<g stroke="${shade(FIG.tights, -10)}" stroke-width="1" opacity=".4" fill="none">
      <path d="M105,330 C 104,354 104,374 104,388"/>
      <path d="M135,330 C 136,354 136,374 136,388"/>
    </g>`);

  /* 팔 */
  layers.push(`<g stroke="${FIG.tights}" stroke-width="11.5" stroke-linecap="round" fill="none">
      <path d="${ARM.left}"/><path d="${ARM.right}"/>
    </g>`);
  layers.push(`<g fill="${FIG.tights}">
      <circle cx="78" cy="196" r="5.6"/><circle cx="162" cy="196" r="5.6"/>
    </g>`);

  /* 목 · 몸 (레오타드가 덮고 남는 목선·어깨 살) */
  layers.push(`<path d="M112,68 L112,92 Q120,97 128,92 L128,68 Z" fill="${FIG.skin}"/>`);
  layers.push(`<path d="${TORSO}" fill="${FIG.skin}"/>`);

  /* 레오타드 */
  layers.push(`<clipPath id="${k}-leo"><path d="${body}"/></clipPath>`);
  layers.push(`<path d="${body}" fill="${leoColor}"/>`);
  layers.push(`<g clip-path="url(#${k}-leo)">
      <rect x="90" y="80" width="60" height="130" fill="url(#${k}-shade)"/>
      <path d="M117.5,98 C 115.5,128 115.5,160 118,190" stroke="#fff" stroke-opacity=".10" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <path d="M106,150 Q120,157 134,150" stroke="${leoLine}" stroke-opacity=".35" stroke-width="1.1" fill="none"/>
      <path d="M97,186 C 111,194 129,194 143,186" stroke="${leoLine}" stroke-opacity=".35" stroke-width="1.1" fill="none"/>
    </g>`);
  if (!leo || leo.shape !== 'boatneck') {
    layers.push(`<g stroke="${leoColor}" stroke-width="3.6" stroke-linecap="round" fill="none">
        <path d="M105,98 L103.5,88"/><path d="M135,98 L136.5,88"/>
      </g>`);
  } else {
    layers.push(`<path d="M100,92 Q120,103 140,92" stroke="${leoLine}" stroke-opacity=".5" stroke-width="1.2" fill="none"/>`);
  }

  /* 상의 · 워머 */
  if (top) {
    if (top.shape === 'long-sleeve') {
      layers.push(`<g stroke="${topColor}" stroke-width="14" stroke-linecap="round" fill="none">
          <path d="${ARM.left}"/><path d="${ARM.right}"/>
        </g>`);
      layers.push(`<g stroke="${shade(topColor, -18)}" stroke-width="1.3" opacity=".45" fill="none">
          <path d="M73.5,187 Q78,192 83.5,190"/><path d="M166.5,187 Q162,192 156.5,190"/>
        </g>`);
      layers.push(`<g stroke="${shade(topColor, 16)}" stroke-width=".9" opacity=".5" fill="none">
          <path d="M95,110 C 91,132 88,156 85,178"/><path d="M145,110 C 149,132 152,156 155,178"/>
        </g>`);
    } else if (top.shape === 'slim-tee') {
      /* 슬림핏 티: 소매를 먼저 깔고 몸판을 그 위에 덮어 어깨-소매가 한 조각처럼 이어진다 */
      const teeBody = 'M110,78 C 103,82 100,87 98,94 C 99,120 99,146 100,167 Q120,173 140,167 C 141,146 141,120 142,94 C 140,87 137,82 130,78 Q120,104 110,78 Z';
      const teeLine = shade(topColor, -20);
      layers.push(`<g stroke="${topColor}" stroke-width="13" stroke-linecap="round" fill="none">
          <path d="M103,96 C 94,117 88,141 84,161 C 82,173 80,184 79,194"/>
          <path d="M137,96 C 146,117 152,141 156,161 C 158,173 160,184 161,194"/>
        </g>`);
      layers.push(`<clipPath id="${k}-tee"><path d="${teeBody}"/></clipPath>`);
      layers.push(`<path d="${teeBody}" fill="${topColor}"/>`);
      layers.push(`<g clip-path="url(#${k}-tee)">
          <rect x="92" y="74" width="56" height="104" fill="url(#${k}-shade)"/>
          <path d="M107,96 C 106,124 106,150 108,172" stroke="#fff" stroke-opacity=".13" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M133,96 C 134,124 134,150 132,172" stroke="${teeLine}" stroke-opacity=".16" stroke-width="6" stroke-linecap="round" fill="none"/>
          <path d="M118,100 C 117,126 117,152 119,172" stroke="#fff" stroke-opacity=".08" stroke-width="2.4" stroke-linecap="round" fill="none"/>
          <path d="M104,118 Q103,142 104,166" stroke="${teeLine}" stroke-opacity=".16" stroke-width="1" fill="none"/>
          <path d="M136,118 Q137,142 136,166" stroke="${teeLine}" stroke-opacity=".16" stroke-width="1" fill="none"/>
        </g>`);
      /* 넥라인 리브 */
      layers.push(`<path d="M130,78 Q120,104 110,78" fill="none" stroke="${teeLine}" stroke-opacity=".5" stroke-width="2.1" stroke-linecap="round"/>`);
      layers.push(`<path d="M128,80 Q120,101 112,80" fill="none" stroke="${shade(topColor, 14)}" stroke-opacity=".45" stroke-width=".9"/>`);
      /* 밑단 */
      layers.push(`<path d="M100,166 Q120,172 140,166" fill="none" stroke="${teeLine}" stroke-opacity=".35" stroke-width="1.2"/>`);
      layers.push(`<path d="${teeBody}" fill="none" stroke="${teeLine}" stroke-opacity=".28" stroke-width="1"/>`);
      /* 소매 커프스 · 주름 */
      layers.push(`<g stroke="${teeLine}" stroke-width="1.3" opacity=".45" fill="none">
          <path d="M73.5,187 Q78,192 83.5,190"/><path d="M166.5,187 Q162,192 156.5,190"/>
        </g>`);
      layers.push(`<g stroke="${shade(topColor, 16)}" stroke-width=".9" opacity=".4" fill="none">
          <path d="M96,110 C 92,132 89,154 86,174"/><path d="M144,110 C 148,132 151,154 154,174"/>
        </g>`);
    } else if (top.shape === 'bolero-short') {
      layers.push(`<g stroke="${topColor}" stroke-width="14" stroke-linecap="round" fill="none">
          <path d="${SLEEVE_SHORT.left}"/><path d="${SLEEVE_SHORT.right}"/>
        </g>`);
      layers.push(`<g stroke="${shade(topColor, -16)}" stroke-width="1.2" opacity=".45" fill="none">
          <path d="M83.5,122 Q89,128 95,124"/><path d="M156.5,122 Q151,128 145,124"/>
        </g>`);
    } else if (top.shape === 'mesh-crop') {
      const crop = 'M103,97 Q120,110 137,97 C 141,112 140,131 137,141 C 127,146 113,146 103,141 C 100,131 99,112 103,97 Z';
      layers.push(`<clipPath id="${k}-crop"><path d="${crop}"/></clipPath>`);
      layers.push(`<path d="${crop}" fill="${topColor}" opacity=".80"/>`);
      layers.push(`<g clip-path="url(#${k}-crop)" opacity=".45">
          <rect x="98" y="94" width="44" height="54" fill="url(#${k}-mesh)"/>
        </g>`);
      layers.push(`<path d="${crop}" fill="none" stroke="${shade(topColor, -14)}" stroke-opacity=".45" stroke-width="1.1"/>`);
      layers.push(`<g stroke="${topColor}" stroke-width="3.2" stroke-linecap="round" fill="none">
          <path d="M105,98 L103.5,90"/><path d="M135,98 L136.5,90"/>
        </g>`);
    }
  }

  /* 하의 */
  if (bot && bpath) {
    layers.push(`<clipPath id="${k}-bot"><path d="${bpath}"/></clipPath>`);
    layers.push(`<path d="${bpath}" fill="${botColor}"/>`);
    layers.push(`<g clip-path="url(#${k}-bot)"><rect x="60" y="150" width="120" height="120" fill="url(#${k}-shade)"/></g>`);
    layers.push(foldLines(bot.shape, k));
    layers.push(`<path d="${bpath}" fill="none" stroke="${shade(botColor, -20)}" stroke-opacity=".35" stroke-width="1.1"/>`);
    if (bot.shape === 'shorts-knit') {
      layers.push(`<g stroke="${shade(botColor, -30)}" stroke-width="2" fill="none" opacity=".75">
          <path d="M143,166 q5,-4 5,-9"/><path d="M143,166 q6,3 10,1"/><path d="M143,166 q-1,6 -6,8"/>
        </g>
        <circle cx="143" cy="166" r="2.2" fill="${shade(botColor, -30)}"/>`);
    }
    if (bot.shape === 'shorts-loose') {
      layers.push(`<g clip-path="url(#${k}-bot)">
          <rect x="94" y="158" width="52" height="9" fill="${shade(botColor, -8)}" opacity=".55"/>
        </g>`);
    }
  }

  /* 앵클워머 */
  if (ank) {
    const w = 21, h = 52, y = 354;
    layers.push(`<g fill="${ankColor}">
        <rect x="94.5" y="${y}" width="${w}" height="${h}" rx="8.5"/>
        <rect x="124.5" y="${y}" width="${w}" height="${h}" rx="8.5"/>
      </g>`);
    layers.push(`<g stroke="${shade(ankColor, -20)}" stroke-width="1" opacity=".5">
        <path d="M96,${y + 12} h18"/><path d="M96,${y + 20} h18"/><path d="M96,${y + 28} h18"/><path d="M96,${y + 36} h18"/>
        <path d="M126,${y + 12} h18"/><path d="M126,${y + 20} h18"/><path d="M126,${y + 28} h18"/><path d="M126,${y + 36} h18"/>
      </g>`);
    layers.push(`<g fill="${shade(ankColor, 12)}" opacity=".55">
        <rect x="94.5" y="${y}" width="${w}" height="7" rx="3.5"/>
        <rect x="124.5" y="${y}" width="${w}" height="7" rx="3.5"/>
      </g>`);
  }

  /* 머리 */
  layers.push(`<circle cx="120" cy="32" r="10.6" fill="${FIG.hair}"/>`);
  layers.push(`<ellipse cx="120" cy="61" rx="15.4" ry="17.4" fill="${FIG.skin}"/>`);
  layers.push(`<clipPath id="${k}-head"><ellipse cx="120" cy="61" rx="15.4" ry="17.4"/></clipPath>`);
  layers.push(`<g clip-path="url(#${k}-head)">
      <ellipse cx="120" cy="45" rx="16.4" ry="13.4" fill="${FIG.hair}"/>
    </g>`);
  layers.push(`<path d="M113,48 C 117,46 123,46 127,48" stroke="#fff" stroke-opacity=".14" stroke-width="2" fill="none"/>`);

  const defs = `<defs>
      <linearGradient id="${k}-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
        <stop offset="1" stop-color="#000" stop-opacity=".10"/>
      </linearGradient>
      <pattern id="${k}-mesh" width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="2.5" r=".85" fill="#fff" opacity=".7"/>
      </pattern>
    </defs>`;

  return `<svg viewBox="0 0 240 470" role="img" aria-label="선택한 발레복을 입은 일러스트" preserveAspectRatio="xMidYMid meet">${defs}${layers.join('')}</svg>`;
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
function renderStage(combo, ghost = false) {
  const stage = $('#stageFigure');
  stage.innerHTML = figureSvg(combo);
  stage.classList.toggle('is-ghost', ghost);

  const score = scoreCombo(combo);
  const title = lookTitle(combo);
  $('#stageScore').textContent = `궁합 ${score}`;
  $('#stageTitle').textContent = title;
  $('#stageKicker').textContent = state.drawn ? '오늘의 추천 코디' : '지금 고른 코디';
  $('#stageComment').textContent = lookComment(combo);

  const chosen = CATS.map((c) => ({ cat: c, item: byId(combo[c.key]) })).filter((x) => x.item);
  $('#stageItems').innerHTML = chosen.map(({ cat, item }) => `
    <li>
      <span class="dot" style="--c:${esc(item.color)}"></span>
      <span class="item-name">${esc(item.short || item.name)}</span>
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
          <span class="dot" style="--c:${esc(item.color)}"></span>${esc(item.short || item.name)}</button>`);
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
    const shorts = comboItems(p.combo).map((i) => i.short || i.name);
    return `<article class="lookcard" data-preset="${esc(p.id)}">
        <div class="lookcard-figure">${figureSvg(p.combo)}</div>
        <div class="lookcard-body">
          <div class="lookcard-top">
            <h3>${esc(p.name)}</h3>
            <span class="lookcard-score">${score}</span>
          </div>
          <p class="lookcard-tag">${esc(p.tag || '')}</p>
          <p class="lookcard-desc">${esc(p.desc || '')}</p>
          <p class="lookcard-items">${shorts.map((s) => `<span>${esc(s)}</span>`).join('')}</p>
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
              <span class="dot dot-lg" style="--c:${esc(item.color)}"></span>
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
  let ticks = 0;
  const btn = $('#btnDraw');
  btn.disabled = true;
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

  bind();
  renderSwatches();
  fillShapeSelect('leotard');
  renderAll();
}

document.addEventListener('DOMContentLoaded', boot);
