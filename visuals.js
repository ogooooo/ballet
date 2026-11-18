/* =========================================================
   오늘의 발레 코디북 — visuals.js
   코디를 그리는 두 가지 그림
   1) figureArt(combo)  : 패션 크로키 감성의 발레리나 일러스트
   2) boardArt(payload) : 매거진 화보풍 스타일링 보드(콜라주)
   데이터를 읽지 않고, 넘겨받은 아이템 객체로만 그린다.
   ========================================================= */

/* ---------------- 색 도우미 ---------------- */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

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
function mix(a, b, t) {
  const c1 = hexToRgb(a), c2 = hexToRgb(b);
  return rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
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
function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 176;
}

let _uid = 0;
const uid = (p) => (p || 'v') + (++_uid).toString(36);

/* =========================================================
   1. 일러스트 — 패션 크로키 발레리나
   viewBox 0 0 240 470
   ========================================================= */
const FIG = {
  skin: '#F0D4C6',
  skinShade: '#D6A997',
  skinHi: '#FBE8DC',
  tight: '#F3D3CA',
  tightShade: '#D3ACA2',
  tightHi: '#FDEEE9',
  hair: '#3A2E2F',
  hairHi: '#5B4842',
  shoe: '#E9C6BE',
  ribbon: '#DCAFA7',
  gold: '#C6A05B'
};

const P = {
  // 몸
  torso: 'M114,60 C113.6,70 113.6,79 114.4,85.6 C111.6,87.4 108,88.6 104.6,90.6 C100,93.4 96.6,96 94,99.4 C89,109 89,121 93,131 C96,139 101,145 104,150 C101,159 99,169 100,181 C101,191 110,196 120,196 C130,196 139,191 140,181 C141,169 139,159 136,150 C139,145 144,139 147,131 C151,121 151,109 146,99.4 C143.4,96 140,93.4 135.4,90.6 C132,88.6 128.4,87.4 125.6,85.6 C126.4,79 126.4,70 126,60 Z',
  neck: 'M114,62 C114,72 114.4,80 115,86 C118,89 122,89 125,86 C125.6,80 126,72 126,62 Z',
  head: 'M106,47 C106,35 112,29 120,29 C128,29 134,35 134,47 C134,58 131,65 126,69 C123,71.6 117,71.6 114,69 C109,65 106,58 106,47 Z',
  hairMass: 'M120,19 C131,19 139,31 137,50 C135.6,58 133,63 130,66 C126,69 114,69 110,66 C107,63 104.4,58 103,50 C101,31 109,19 120,19 Z',
  bun: 'M120,8.6 C126.4,8.6 131.4,13.4 131.4,19.6 C131.4,25.8 126.4,29.6 120,29.6 C113.6,29.6 108.6,25.8 108.6,19.6 C108.6,13.4 113.6,8.6 120,8.6 Z',
  // 팔
  armL: 'M95,97 C89,111 85,127 83.6,143 C82.4,157 82.2,171 82.8,185 L90.6,189 C89.8,175 89.8,161 90.8,147 C92,131 95.4,113 102.6,99 Z',
  armR: 'M145,97 C151,111 155,127 156.4,143 C157.6,157 157.8,171 157.2,185 L149.4,189 C150.2,175 150.2,161 149.2,147 C148,131 144.6,113 137.4,99 Z',
  handL: 'M82.6,184 C79.6,191 77.8,198 77.6,203 C77.4,206.4 79.6,206.8 81,203.8 C83.2,198.6 85.6,194 88.6,190.2 Z',
  handR: 'M157.4,184 C160.4,191 162.2,198 162.4,203 C162.6,206.4 160.4,206.8 159,203.8 C156.8,198.6 154.4,194 151.4,190.2 Z',
  // 다리
  legL: 'M101,178 C97.4,196 95.6,216 95.6,238 C95.6,256 95.8,272 96.6,288 C96.2,302 96.2,316 97,330 C98.2,352 100,378 101.2,400 L110.6,400 C111,378 111.6,352 112.2,330 C112.8,316 113,302 112.8,288 C113.4,272 113.4,256 113.4,238 C113,216 114.6,196 118,178 Z',
  legR: 'M139,178 C142.6,196 144.4,216 144.4,238 C144.4,256 144.2,272 143.4,288 C143.8,302 143.8,316 143,330 C141.8,352 140,378 138.8,400 L129.4,400 C129,378 128.4,352 127.8,330 C127.2,316 127,302 127.2,288 C126.6,272 126.6,256 126.6,238 C127,216 125.4,196 122,178 Z',
  // 발레슈즈
  shoeL: 'M102,392 C100,404 96,417 89,427 C84.5,433 87,438.4 93,436.4 C100.5,433.8 108,422 110.6,409 C111.6,402.6 111,396 110.2,392 Z',
  shoeR: 'M138,392 C140,404 144,417 151,427 C155.5,433 153,438.4 147,436.4 C139.5,433.8 132,422 129.4,409 C128.4,402.6 129,396 129.8,392 Z',
  toeL: 'M89,425 C84,430 82.4,436.2 87.6,436.6 C92.2,437 96.6,431.6 98.6,426.6 Z',
  toeR: 'M151,425 C156,430 157.6,436.2 152.4,436.6 C147.8,437 143.4,431.6 141.4,426.6 Z'
};

function leotardPath(shape) {
  if (shape === 'boatneck') {
    return 'M97,94 C108,101 132,101 143,94 C146,102 147,113 147,124 C146,136 144,148 143,162 C144,172 143,182 140,188 C134,196 127,199 120,199 C113,199 106,196 100,188 C97,182 96,172 97,162 C96,148 94,136 93,124 C93,113 94,102 97,94 Z';
  }
  return 'M104,91 C110,103 130,103 136,91 C140,99 143,112 144,124 C144,136 143,148 143,162 C144,172 143,182 140,188 C134,196 127,199 120,199 C113,199 106,196 100,188 C97,182 96,172 97,162 C96,148 95,136 95,124 C96,112 100,99 104,91 Z';
}

function bottomPath(shape) {
  switch (shape) {
    case 'skirt-long':
      return 'M99,162 C96,180 92,204 90,228 C89,236 98,241 108,242.4 C118,243.6 134,243 144,238 C149,235 150,226 148,216 C146,202 143,180 141,162 Z';
    case 'skirt-short':
      return 'M101,162 C99,174 95,188 92,202 C89,213 96,222 108,224 C120,226 134,226 145,221 C150,218 151,209 148,198 C144,186 141,172 139,162 Z';
    case 'shorts-knit':
      return 'M100,162 C98,180 97,200 97,220 C97,232 104,238 112,236 C118,235 119.4,229 119.2,220 L120,198 L120.8,220 C120.6,229 122,235 128,236 C136,238 143,232 143,220 C143,200 142,180 140,162 Z';
    case 'shorts-loose':
      return 'M98,161 C95,180 92,200 91,222 C90,232 97,238 106,236 C114,234 117,228 117,219 L119,197 L121,197 L123,219 C123,228 126,234 134,236 C143,238 150,232 149,222 C148,200 145,180 142,161 Z';
    default:
      return '';
  }
}

function figureArt(c) {
  const k = uid('f');
  const leo = c.leotard || null;
  const top = c.top || null;
  const bot = c.bottom || null;
  const ank = c.ankle || null;

  const leoColor = leo ? leo.color : '#DCD2C9';
  const leoLine = shade(leoColor, -26);
  const leoLight = shade(leoColor, 14);
  const topColor = top ? top.color : '#E4D6C8';
  const topLine = top ? shade(topColor, -26) : '#C9B9AA';
  const botColor = bot ? bot.color : '#DCC7AB';
  const botLine = bot ? shade(botColor, -26) : '#C4AD91';
  const ankColor = ank ? ank.color : '#DCC9B2';
  const ankLine = ank ? shade(ankColor, -26) : '#C2AE97';

  const L = [];
  const push = (s) => L.push(s);

  /* ── 바닥 그림자 ── */
  push(`<ellipse cx="120" cy="439" rx="58" ry="6.6" fill="#7A5A50" opacity=".12" filter="url(#${k}-blur)"/>`);
  push(`<ellipse cx="120" cy="437.5" rx="26" ry="3.4" fill="#7A5A50" opacity=".13" filter="url(#${k}-blur)"/>`);

  /* ── 다리 (타이즈) ── */
  push(`<path d="${P.legL}" fill="url(#${k}-tight)"/>`);
  push(`<path d="${P.legR}" fill="url(#${k}-tight)"/>`);
  push(`<g opacity=".5" filter="url(#${k}-blur2)">
      <path d="M113.4,180 C113.8,214 114,250 113.6,286 C113.4,318 113,352 112.6,388 L112.6,400 L108,400 C108.6,352 109.2,318 109.6,286 C110,250 110,214 110,180 Z" fill="${FIG.tightShade}"/>
      <path d="M126.6,180 C126.2,214 126,250 126.4,286 C126.6,318 127,352 127.4,388 L127.4,400 L132,400 C131.4,352 130.8,318 130.4,286 C130,250 130,214 130,180 Z" fill="${FIG.tightShade}"/>
    </g>`);
  push(`<g fill="none" stroke-linecap="round" opacity=".28" filter="url(#${k}-blur3)">
      <path d="M101.4,190 C99.8,214 99.4,242 100,268 C100.2,296 100.6,326 101.4,356 C101.6,370 101.9,384 102.1,396" stroke="${FIG.tightShade}" stroke-width="5.4"/>
      <path d="M138.6,190 C140.2,214 140.6,242 140,268 C139.8,296 139.4,326 138.6,356 C138.4,370 138.1,384 137.9,396" stroke="${FIG.tightShade}" stroke-width="5.4"/>
    </g>`);
  /* 무릎 · 정강이 명암 */
  push(`<g fill="${FIG.tightShade}" opacity=".10" filter="url(#${k}-blur3)">
      <ellipse cx="105.4" cy="290" rx="6.6" ry="10"/>
      <ellipse cx="134.6" cy="290" rx="6.6" ry="10"/>
    </g>`);
  /* 타이즈 광택 */
  push(`<g fill="none" stroke="#FFF8F4" stroke-linecap="round" opacity=".22" filter="url(#${k}-blur3)">
      <path d="M106,192 C104,210 103.4,228 103.6,246" stroke-width="5"/>
      <path d="M134,192 C136,210 136.6,228 136.4,246" stroke-width="5"/>
      <path d="M104.6,296 C104.4,314 104.8,330 105.6,344" stroke-width="3.4"/>
      <path d="M135.4,296 C135.6,314 135.2,330 134.4,344" stroke-width="3.4"/>
    </g>`);
  push(`<g fill="none" stroke="${FIG.tightShade}" stroke-linecap="round" opacity=".22">
      <path d="M108.6,194 C106.6,212 106,234 106.2,254" stroke-width=".8"/>
      <path d="M131.4,194 C133.4,212 134,234 133.8,254" stroke-width=".8"/>
    </g>`);

  /* ── 발레슈즈 ── */
  push(`<path d="${P.shoeL}" fill="url(#${k}-shoe)"/>`);
  push(`<path d="${P.shoeR}" fill="url(#${k}-shoe)"/>`);
  push(`<path d="${P.toeL}" fill="${shade(FIG.shoe, -4)}"/>`);
  push(`<path d="${P.toeR}" fill="${shade(FIG.shoe, -4)}"/>`);
  push(`<g fill="none" stroke="${shade(FIG.shoe, -26)}" stroke-linecap="round">
      <path d="M104.6,402 C103.6,412 100.6,422 95.6,429.4" stroke-width=".9" opacity=".45"/>
      <path d="M135.4,402 C136.4,412 139.4,422 144.4,429.4" stroke-width=".9" opacity=".45"/>
      <path d="M99,415 C103,418.4 107.4,418.6 109.6,415.6" stroke-width=".9" opacity=".5"/>
      <path d="M141,415 C137,418.4 132.6,418.6 130.4,415.6" stroke-width=".9" opacity=".5"/>
      <path d="M96.6,426 C99.4,428.6 103,429.6 105.6,428" stroke-width=".7" opacity=".4"/>
      <path d="M143.4,426 C140.6,428.6 137,429.6 134.4,428" stroke-width=".7" opacity=".4"/>
    </g>`);
  push(`<g fill="#fff" opacity=".38">
      <ellipse cx="105" cy="404" rx="2.4" ry="5.4" transform="rotate(-6 105 404)"/>
      <ellipse cx="135" cy="404" rx="2.4" ry="5.4" transform="rotate(6 135 404)"/>
    </g>`);
  /* 발목 리본 */
  push(`<g fill="none" stroke="${FIG.ribbon}" stroke-linecap="round">
      <path d="M99,394 C103,397 109,397 112.4,393" stroke-width="3"/>
      <path d="M103.4,394.4 C101.8,386 101.4,380 102.6,374" stroke-width="1.6"/>
      <path d="M107.6,394.4 C109.2,386 109.8,380 108.6,374" stroke-width="1.6"/>
      <path d="M141,394 C137,397 131,397 127.6,393" stroke-width="3"/>
      <path d="M132.6,394.4 C131,386 130.6,380 131.8,374" stroke-width="1.6"/>
      <path d="M136.6,394.4 C138.2,386 138.8,380 137.6,374" stroke-width="1.6"/>
      <path d="M99.6,392.4 C96.6,388 95.2,384 95.6,380.4" stroke-width="1.2" opacity=".8"/>
      <path d="M140.4,392.4 C143.4,388 144.8,384 144.4,380.4" stroke-width="1.2" opacity=".8"/>
    </g>`);
  push(`<g fill="${FIG.ribbon}">
      <ellipse cx="105.4" cy="393.6" rx="2" ry="1.4"/>
      <ellipse cx="134.6" cy="393.6" rx="2" ry="1.4"/>
    </g>`);

  /* ── 몸통 피부 ── */
  push(`<path d="M114.6,82 C117,85.4 123,85.4 125.4,82 L125.4,88 C122,90.4 118,90.4 114.6,88 Z" fill="${FIG.skinShade}" opacity=".22" filter="url(#${k}-blur2)"/>`);
  push(`<path d="${P.torso}" fill="url(#${k}-skin)"/>`);

  /* 쇄골 · 가슴 · 허리 명암 */
  push(`<g fill="none" stroke="${FIG.skinShade}" stroke-linecap="round" opacity=".4">
      <path d="M100,93 C106,89.6 112,88 117.6,87.6" stroke-width=".9"/>
      <path d="M122.4,87.6 C128,88 134,89.6 140,93" stroke-width=".9"/>
    </g>`);
  push(`<g fill="${FIG.skinShade}" opacity=".16" filter="url(#${k}-blur2)">
      <ellipse cx="107" cy="112" rx="5" ry="9"/>
      <ellipse cx="133" cy="112" rx="5" ry="9"/>
      <ellipse cx="120" cy="170" rx="9" ry="14"/>
    </g>`);
  push(`<ellipse cx="111.6" cy="118" rx="7" ry="4.6" fill="${FIG.skinHi}" opacity=".45" filter="url(#${k}-blur2)"/>`);
  push(`<ellipse cx="128.4" cy="118" rx="7" ry="4.6" fill="${FIG.skinHi}" opacity=".45" filter="url(#${k}-blur2)"/>`);
  push(`<path d="M120,96 L120,146" stroke="${FIG.skinShade}" stroke-width=".8" opacity=".10"/>`);

  /* ── 팔 ── */
  push(`<path d="${P.armL}" fill="url(#${k}-skin)"/>`);
  push(`<path d="${P.armR}" fill="url(#${k}-skin)"/>`);
  push(`<g fill="none" stroke="${FIG.skinShade}" stroke-linecap="round" opacity=".2" filter="url(#${k}-blur2)">
      <path d="M89,112 C85.6,128 84.4,146 84.6,164" stroke-width="3"/>
      <path d="M151,112 C154.4,128 155.6,146 155.4,164" stroke-width="3"/>
    </g>`);
  push(`<g fill="none" stroke="${FIG.skinHi}" stroke-linecap="round" opacity=".5">
      <path d="M97,110 C93,126 91.4,144 91.4,162" stroke-width="1.8"/>
      <path d="M143,110 C147,126 148.6,144 148.6,162" stroke-width="1.8"/>
    </g>`);
  push(`<path d="${P.handL}" fill="url(#${k}-skin)"/>`);
  push(`<path d="${P.handR}" fill="url(#${k}-skin)"/>`);
  push(`<g fill="none" stroke="${FIG.skinShade}" stroke-opacity=".4" stroke-linecap="round">
      <path d="M81.6,189 C80.6,193.4 80,197.4 79.8,200.6" stroke-width=".6"/>
      <path d="M158.4,189 C159.4,193.4 160,197.4 160.2,200.6" stroke-width=".6"/>
    </g>`);

  /* ── 레오타드 ── */
  const body = leotardPath(leo ? leo.shape : 'camisole');
  push(`<clipPath id="${k}-leo"><path d="${body}"/></clipPath>`);
  push(`<path d="${body}" fill="url(#${k}-leoFill)"/>`);
  push(`<g clip-path="url(#${k}-leo)">
      <rect x="88" y="76" width="64" height="126" fill="url(#${k}-clothShade)"/>
      <ellipse cx="112" cy="110" rx="13" ry="17" fill="${leoLight}" opacity=".5" filter="url(#${k}-blur2)"/>
      <path d="M99,98 C99,126 99,160 102,194" stroke="${shade(leoColor, -32)}" stroke-opacity=".26" stroke-width="5" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
      <path d="M141,98 C141,126 140,160 138,194" stroke="${shade(leoColor, -32)}" stroke-opacity=".24" stroke-width="5" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
      <path d="M114,96 C110,126 110,160 113,196" stroke="#fff" stroke-opacity=".15" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
      <path d="M126,102 C128,130 128,162 126,194" stroke="${shade(leoColor, -24)}" stroke-opacity=".14" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M108,88 C110,94 110.6,104 110.4,114" stroke="${shade(leoColor, -18)}" stroke-opacity=".2" stroke-width=".9" fill="none"/>
      <path d="M132,88 C130,94 129.4,104 129.6,114" stroke="${shade(leoColor, -18)}" stroke-opacity=".2" stroke-width=".9" fill="none"/>
      <path d="M101,150 C110,155 130,155 139,150" stroke="${leoLine}" stroke-opacity=".16" stroke-width="1" fill="none"/>
    </g>`);
  push(`<path d="M100,188 C106,196 113,199 120,199 C127,199 134,196 140,188" fill="none" stroke="${leoLine}" stroke-opacity=".4" stroke-width="1.3"/>`);
  if (!leo || leo.shape !== 'boatneck') {
    push(`<path d="M104,91 C110,103 130,103 136,91" fill="none" stroke="${leoLine}" stroke-opacity=".4" stroke-width="1.2"/>`);
    push(`<path d="M104.6,93 C110.4,104 129.6,104 135.4,93" fill="none" stroke="${leoLight}" stroke-opacity=".45" stroke-width=".7"/>`);

  } else {
    push(`<path d="M97,94 C108,101 132,101 143,94" fill="none" stroke="${leoLine}" stroke-opacity=".4" stroke-width="1.5"/>`);
    push(`<path d="M97.6,96 C108.6,102.6 131.4,102.6 142.4,96" fill="none" stroke="${leoLight}" stroke-opacity=".45" stroke-width=".7"/>`);
  }

  /* ── 상의 · 워머 ── */
  if (top) push(topArt(top, k, topColor, topLine));

  /* ── 하의 ── */
  if (bot) {
    const bp = bottomPath(bot.shape);
    if (bp) {
      push(`<clipPath id="${k}-bot"><path d="${bp}"/></clipPath>`);
      push(`<path d="${bp}" fill="url(#${k}-botFill)"/>`);
      push(`<g clip-path="url(#${k}-bot)"><rect x="80" y="158" width="84" height="100" fill="url(#${k}-clothShade)"/></g>`);
      push(bottomArt(bot, k, botColor, botLine));
      push(`<path d="${bp}" fill="none" stroke="${botLine}" stroke-opacity=".28" stroke-width="1"/>`);
    }
  }

  /* ── 앵클워머 ── */
  if (ank) {
    push(`<g fill="url(#${k}-ankFill)" stroke="${ankLine}" stroke-opacity=".2" stroke-width=".8">
        <path d="M99.6,356 C97.4,367 96.8,380 97.4,392 C97.8,398 100.4,401.8 104.2,401.4 C108.2,401 111,397.2 111.2,391 C111.8,380 111.6,367 110.2,356 Z"/>
        <path d="M140.4,356 C142.6,367 143.2,380 142.6,392 C142.2,398 139.6,401.8 135.8,401.4 C131.8,401 129,397.2 128.8,391 C128.2,380 128.4,367 129.8,356 Z"/>
      </g>`);
    push(`<g fill="none" stroke="${ankLine}" stroke-linecap="round">
        <path d="M98.6,362 C102,364.6 108,364.6 110.8,362" stroke-width="1" stroke-opacity=".35"/>
        <path d="M129.2,362 C132,364.6 138,364.6 141.4,362" stroke-width="1" stroke-opacity=".35"/>
        <path d="M97.8,372 C101,374 108,374 111.2,372" stroke-width=".8" stroke-opacity=".22"/>
        <path d="M128.8,372 C132,374 139,374 142.2,372" stroke-width=".8" stroke-opacity=".22"/>
        <path d="M97.6,382 C101,384 108,384 111.2,382" stroke-width=".8" stroke-opacity=".22"/>
        <path d="M128.8,382 C132,384 139,384 142.4,382" stroke-width=".8" stroke-opacity=".22"/>
        <path d="M97.4,390 C101,392.4 108,392.4 111.2,390" stroke-width="1" stroke-opacity=".3"/>
        <path d="M128.8,390 C132,392.4 139,392.4 142.6,390" stroke-width="1" stroke-opacity=".3"/>
      </g>`);
    push(`<g fill="${shade(ankColor, 14)}" opacity=".55">
        <path d="M99.6,356 C103.4,358.6 108.4,358.6 110.2,356 L110,360.2 C107.4,362.2 102.6,362.2 99.8,360.2 Z"/>
        <path d="M130.2,356 C134,358.6 137.6,358.6 140.4,356 L140.2,360.2 C137.6,362.2 134,362.2 130.4,360.2 Z"/>
      </g>`);
  }

  /* ── 머리 ── */
  push(`<path d="${P.hairMass}" fill="${FIG.hair}"/>`);
  push(`<path d="${P.bun}" fill="${FIG.hair}"/>`);
  push(`<path d="M112,22 C113,18.4 117,15.4 120,15.4" fill="none" stroke="${FIG.hairHi}" stroke-opacity=".35" stroke-width="1"/>`);
  push(`<ellipse cx="120" cy="28.4" rx="6" ry="1.9" fill="${shade(FIG.hair, -18)}" opacity=".85"/>`);
  push(`<path d="${P.head}" fill="url(#${k}-skinFace)"/>`);
  push(`<path d="M105,48 C105,34 112,28 120,28 C128,28 135,34 135,48 C135,52 134.4,56 133.4,59.6 C132.6,52 131.4,46 129.6,41.6 C126,45.4 114,45.4 110.4,41.6 C108.6,46 107.4,52 106.6,59.6 C105.6,56 105,52 105,48 Z" fill="${FIG.hair}"/>`);
  push(`<path d="M110.4,42.4 C114,45.6 126,45.6 129.6,42.4" fill="none" stroke="${FIG.hairHi}" stroke-opacity=".22" stroke-width=".9"/>`);
  push(`<ellipse cx="106.4" cy="50" rx="1.6" ry="2.4" fill="${FIG.skin}"/>`);
  push(`<ellipse cx="133.6" cy="50" rx="1.6" ry="2.4" fill="${FIG.skin}"/>`);
  push(`<circle cx="106.6" cy="55" r=".9" fill="${FIG.gold}" opacity=".9"/>`);
  push(`<circle cx="133.4" cy="55" r=".9" fill="${FIG.gold}" opacity=".9"/>`);
  push(`<ellipse cx="114.6" cy="56" rx="2.8" ry="1.7" fill="#DFA294" opacity=".18" filter="url(#${k}-blur2)"/>`);
  push(`<ellipse cx="125.4" cy="56" rx="2.8" ry="1.7" fill="#DFA294" opacity=".18" filter="url(#${k}-blur2)"/>`);
  push(`<path d="M119,61.6 C119.6,62.6 120.4,62.6 121,61.8" fill="none" stroke="${FIG.skinShade}" stroke-opacity=".45" stroke-width=".7" stroke-linecap="round"/>`);
  push(`<path d="M117.6,66.4 C118.8,67.4 121.2,67.4 122.4,66.4" fill="none" stroke="#C58C80" stroke-opacity=".45" stroke-width=".8" stroke-linecap="round"/>`);

  const defs = `<defs>
    <linearGradient id="${k}-skin" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${FIG.skinHi}"/><stop offset=".55" stop-color="${FIG.skin}"/><stop offset="1" stop-color="${shade(FIG.skin, -8)}"/>
    </linearGradient>
    <linearGradient id="${k}-skinFace" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FIG.skinHi}"/><stop offset="1" stop-color="${shade(FIG.skin, -4)}"/>
    </linearGradient>
    <linearGradient id="${k}-tight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${shade(FIG.tight, -13)}"/><stop offset=".24" stop-color="${shade(FIG.tight, 3)}"/><stop offset=".5" stop-color="${FIG.tight}"/><stop offset=".8" stop-color="${shade(FIG.tight, -9)}"/><stop offset="1" stop-color="${shade(FIG.tight, -15)}"/>
    </linearGradient>
    <linearGradient id="${k}-shoe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(FIG.shoe, 9)}"/><stop offset="1" stop-color="${shade(FIG.shoe, -12)}"/>
    </linearGradient>
    <linearGradient id="${k}-leoFill" x1="0.12" y1="0" x2="0.88" y2="1">
      <stop offset="0" stop-color="${leoLight}"/><stop offset=".42" stop-color="${leoColor}"/><stop offset="1" stop-color="${shade(leoColor, -13)}"/>
    </linearGradient>
    <linearGradient id="${k}-topFill" x1="0.12" y1="0" x2="0.88" y2="1">
      <stop offset="0" stop-color="${shade(topColor, 12)}"/><stop offset=".45" stop-color="${topColor}"/><stop offset="1" stop-color="${shade(topColor, -14)}"/>
    </linearGradient>
    <linearGradient id="${k}-topStroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${shade(topColor, -8)}"/><stop offset=".35" stop-color="${shade(topColor, 14)}"/><stop offset="1" stop-color="${shade(topColor, -12)}"/>
    </linearGradient>
    <linearGradient id="${k}-botFill" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${shade(botColor, 12)}"/><stop offset=".4" stop-color="${botColor}"/><stop offset="1" stop-color="${shade(botColor, -15)}"/>
    </linearGradient>
    <linearGradient id="${k}-ankFill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${shade(ankColor, -7)}"/><stop offset=".35" stop-color="${shade(ankColor, 10)}"/><stop offset="1" stop-color="${shade(ankColor, -9)}"/>
    </linearGradient>
    <linearGradient id="${k}-clothShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".10"/>
    </linearGradient>
    <linearGradient id="${k}-sheer" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".26"/>
    </linearGradient>
    <filter id="${k}-blur" x="-200%" y="-300%" width="500%" height="700%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="${k}-blur2" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="${k}-blur3" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <pattern id="${k}-mesh" width="4.2" height="4.2" patternUnits="userSpaceOnUse">
      <circle cx="2.1" cy="2.1" r=".95" fill="#fff" fill-opacity=".55"/>
    </pattern>
  </defs>`;

  return `<svg viewBox="0 0 240 470" role="img" aria-label="선택한 발레복을 입은 발레리나 일러스트" preserveAspectRatio="xMidYMid meet">${defs}${L.join('')}</svg>`;
}

/* ── 상의 그리기 ── */
function topArt(top, k, color, line) {
  const light = shade(color, 14);
  const dark = shade(color, -30);
  const rib = (path, n, w) => {
    // 경로를 따라가는 리브(골지) 느낌의 가는 선
    let s = '';
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      s += `<path d="${path}" stroke="${dark}" stroke-opacity=".16" stroke-width="${w}" fill="none" stroke-dasharray="2.6 4.6" stroke-dashoffset="${(t * 7.2).toFixed(1)}"/>`;
    }
    return s;
  };
  switch (top.shape) {
    case 'long-sleeve':
      return `
        <g fill="none" stroke="url(#${k}-topStroke)" stroke-linecap="round" stroke-width="12.6">
          <path d="M100,101 C93.6,114 89.6,128 87.6,142 C86.2,154 85.6,166 86,180 C86.2,186 86.4,190 86.6,192"/>
          <path d="M140,101 C146.4,114 150.4,128 152.4,142 C153.8,154 154.4,166 154,180 C153.8,186 153.6,190 153.4,192"/>
        </g>
        <g fill="none" stroke="${dark}" stroke-opacity=".18" stroke-linecap="round">
          <path d="M91,112 C87.6,126 85.6,142 85,158" stroke-width="1.1"/>
          <path d="M95,110 C91.6,126 89.8,144 89.6,162" stroke-width="1.1"/>
          <path d="M148.6,112 C152,126 154,142 154.6,158" stroke-width="1.1"/>
          <path d="M144.6,110 C148,126 149.8,144 150,162" stroke-width="1.1"/>
        </g>
        <g fill="none" stroke="${light}" stroke-opacity=".38" stroke-linecap="round">
          <path d="M93.4,110 C90,128 88.2,148 88,168" stroke-width="2.2"/>
          <path d="M146.6,110 C150,128 151.8,148 152,168" stroke-width="2.2"/>
        </g>
        <path d="M110,84 C104,86 98,91 95,99 C92.4,107 91.6,116 93,124 C96.6,126 100,123 101.4,118 C103,110 106,102 112,98 C118,102 121,110 122.6,118 C124,123 127.4,126 131,124 C132.4,116 131.6,107 129,99 C126,91 120,86 114,84 Z" fill="url(#${k}-topFill)"/>
        <path d="M110,84 C104,86 98,91 95,99 C93,105 92.2,112 92.8,118" fill="none" stroke="${dark}" stroke-opacity=".25" stroke-width="1"/>
        <path d="M130,84 C136,86 142,91 145,99 C147,105 147.8,112 147.2,118" fill="none" stroke="${dark}" stroke-opacity=".25" stroke-width="1"/>
        <path d="M112,98 C116,101 120,101 124,98" fill="none" stroke="${dark}" stroke-opacity=".22" stroke-width="1"/>
        <g fill="none" stroke="${dark}" stroke-opacity=".35" stroke-linecap="round">
          <path d="M85.2,188 C87,190 90,190 92,188.6" stroke-width="1.1"/>
          <path d="M154.8,188 C153,190 150,190 148,188.6" stroke-width="1.1"/>
        </g>`;
    case 'slim-tee': {
      const body = 'M110,80 C104,82 100,87 98,93 C99,110 99,126 100,140 q5,5.6 10,0 q5,5.6 10,0 q5,5.6 10,0 q5,5.6 10,0 C 141,126 141,110 142,93 C140,87 136,82 130,80 Q120,97 110,80 Z';
      return `
        <g fill="none" stroke="url(#${k}-topStroke)" stroke-linecap="round" stroke-width="11.4">
          <path d="M101.6,96 C93.6,112 88.6,132 86,152 C84.8,162 84.2,174 84.4,186"/>
          <path d="M138.4,96 C146.4,112 151.4,132 154,152 C155.2,162 155.8,174 155.6,186"/>
        </g>
        <clipPath id="${k}-tee"><path d="${body}"/></clipPath>
        <path d="${body}" fill="url(#${k}-topFill)"/>
        <g clip-path="url(#${k}-tee)">
          <rect x="94" y="76" width="52" height="72" fill="url(#${k}-clothShade)"/>
          <path d="M106,90 C105,110 105,128 107,142" stroke="#fff" stroke-opacity=".18" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <path d="M134,90 C135,110 135,128 133,142" stroke="${dark}" stroke-opacity=".14" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <path d="M118,96 C117,114 117,130 119,140" stroke="#fff" stroke-opacity=".10" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        </g>
        <path d="M130,80 Q120,97 110,80" fill="none" stroke="${dark}" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M128,83 Q120,95 112,83" fill="none" stroke="${light}" stroke-opacity=".5" stroke-width=".9"/>
        <path d="M100,140 q5,5.6 10,0 q5,5.6 10,0 q5,5.6 10,0 q5,5.6 10,0" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M101,138 q4.6,4.8 9.2,0 q4.6,4.8 9.2,0 q4.6,4.8 9.2,0 q4.6,4.8 9.2,0" fill="none" stroke="${dark}" stroke-opacity=".28" stroke-width=".9"/>
        <path d="${body}" fill="none" stroke="${dark}" stroke-opacity=".22" stroke-width="1"/>
        <g fill="none" stroke="${dark}" stroke-opacity=".35" stroke-linecap="round">
          <path d="M83.4,184 q2.6,4.4 5.2,1.2 q2.6,4.4 5.2,1.2" stroke-width="1.3"/>
          <path d="M156.6,184 q-2.6,4.4 -5.2,1.2 q-2.6,4.4 -5.2,1.2" stroke-width="1.3"/>
        </g>`;
    }
    case 'bolero-short':
      return `
        <g fill="none" stroke="url(#${k}-topStroke)" stroke-linecap="round" stroke-width="14">
          <path d="M97,101 C92.6,111 89.6,121 88.4,129"/>
          <path d="M143,101 C147.4,111 150.4,121 151.6,129"/>
        </g>
        <path d="M113,88 C106,90 100,94 97,100 C93,108 91,117 91.6,125 C94,128 97.6,127 98.6,123.4 C100,117 102.4,111 106,106 C108.6,102 111,99.4 113.6,97.4 Z" fill="url(#${k}-topFill)"/>
        <path d="M127,88 C134,90 140,94 143,100 C147,108 149,117 148.4,125 C146,128 142.4,127 141.4,123.4 C140,117 137.6,111 134,106 C131.4,102 129,99.4 126.4,97.4 Z" fill="url(#${k}-topFill)"/>
        <path d="M113,88 C108,92 105,98 104,104 C107,106 111,105 113,102" fill="${shade(color, 6)}" opacity=".55"/>
        <path d="M127,88 C132,92 135,98 136,104 C133,106 129,105 127,102" fill="${shade(color, 6)}" opacity=".55"/>
        <g fill="none" stroke="${dark}" stroke-opacity=".26" stroke-linecap="round">
          <path d="M91.6,125 C94,127.6 97.6,126.6 98.6,123.4" stroke-width="1.2"/>
          <path d="M148.4,125 C146,127.6 142.4,126.6 141.4,123.4" stroke-width="1.2"/>
          <path d="M113.6,97.4 C111,101 108.6,104 106,106" stroke-width=".9" fill="none"/>
          <path d="M126.4,97.4 C129,101 131.4,104 134,106" stroke-width=".9" fill="none"/>
        </g>
        <path d="M101,99 C106,103 116,105 120,105 C124,105 134,103 139,99" fill="none" stroke="${dark}" stroke-opacity=".18" stroke-width="1"/>
        <path d="M99,103 C105,107 116,109 120,109" fill="none" stroke="${light}" stroke-opacity=".4" stroke-width="2.2"/>`;
    case 'mesh-crop': {
      const crop = 'M103,94 Q120,107 137,94 C141,109 140,128 137,138 C127,143 113,143 103,138 C100,128 99,109 103,94 Z';
      return `
        <clipPath id="${k}-crop"><path d="${crop}"/></clipPath>
        <path d="${crop}" fill="${color}" opacity=".62"/>
        <g clip-path="url(#${k}-crop)" opacity=".55"><rect x="98" y="90" width="44" height="56" fill="url(#${k}-mesh)"/></g>
        <path d="${crop}" fill="none" stroke="${shade(color, -18)}" stroke-opacity=".5" stroke-width="1.2"/>
        <path d="M104,96 Q120,108 136,96" fill="none" stroke="${shade(color, -24)}" stroke-opacity=".5" stroke-width="1.6"/>
        <g stroke="${color}" stroke-width="2.6" stroke-linecap="round" fill="none">
          <path d="M104,95 L102.6,87"/><path d="M136,95 L137.4,87"/>
        </g>
        <path d="M112,98 C110,116 110,128 112,138" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3.4" stroke-linecap="round"/>`;
    }
    default:
      return '';
  }
}

/* ── 하의 그리기 ── */
function bottomArt(bot, k, color, line) {
  const light = shade(color, 18);
  const dark = shade(color, -32);
  switch (bot.shape) {
    case 'skirt-long':
      return `
        <g clip-path="url(#${k}-bot)">
          <path d="M141,164 C140,188 136,212 128,236 C134,239 141,238 145,234 C149,229 149,216 147,204 C145,190 143,174 141,164 Z" fill="${light}" opacity=".30"/>
          <path d="M118,166 C114,192 106,218 97,240" stroke="${dark}" stroke-opacity=".10" stroke-width="1.2" fill="none"/>
          <path d="M108,166 C104,192 98,218 92,239" stroke="${dark}" stroke-opacity=".10" stroke-width="1.2" fill="none"/>
          <path d="M132,166 C136,192 141,216 145,233" stroke="${dark}" stroke-opacity=".09" stroke-width="1.4" fill="none"/>
          <path d="M113,168 C108,194 101,220 95,240" stroke="#fff" stroke-opacity=".20" stroke-width="4.6" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <path d="M126,168 C130,194 135,216 140,234" stroke="${dark}" stroke-opacity=".10" stroke-width="5.4" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <rect x="80" y="226" width="84" height="24" fill="url(#${k}-sheer)"/>
        </g>
        <path d="M141,164 C140,188 136,212 128,236" fill="none" stroke="${dark}" stroke-opacity=".22" stroke-width="1"/>
        <path d="M99,162 C110,168 130,168 141,162" fill="none" stroke="${dark}" stroke-opacity=".26" stroke-width="1.1"/>
        <path d="M100,165 C111,170 129,170 140,165" fill="none" stroke="${light}" stroke-opacity=".45" stroke-width="1"/>
        <path d="M120,170 C118,194 117,218 116,241" stroke="${dark}" stroke-opacity=".12" stroke-width="1" fill="none"/>
        <path d="M90,214 C89,222 90,232 92,240" fill="none" stroke="${dark}" stroke-opacity=".10" stroke-width="1"/>
        <path d="M148,234 C150,228 149,216 147,204" fill="none" stroke="${dark}" stroke-opacity=".10" stroke-width="1"/>`;
    case 'skirt-short':
      return `
        <g clip-path="url(#${k}-bot)">
          <path d="M139,164 C138,184 135,204 130,222 C136,224 142,222 146,217 C149,211 148,199 146,190 C144,180 142,171 139,164 Z" fill="${light}" opacity=".30"/>
          <path d="M110,166 C106,186 100,206 96,222" stroke="${dark}" stroke-opacity=".10" stroke-width="1.1" fill="none"/>
          <path d="M120,168 C118,188 115,206 113,223" stroke="${dark}" stroke-opacity=".09" stroke-width="1" fill="none"/>
          <path d="M131,168 C133,188 137,206 141,221" stroke="${dark}" stroke-opacity=".09" stroke-width="1.2" fill="none"/>
          <path d="M114,168 C110,188 104,206 100,221" stroke="#fff" stroke-opacity=".20" stroke-width="4" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <path d="M126,170 C130,188 135,204 140,219" stroke="${dark}" stroke-opacity=".09" stroke-width="4.4" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <rect x="86" y="208" width="64" height="20" fill="url(#${k}-sheer)"/>
        </g>
        <path d="M139,164 C138,184 135,204 130,222" fill="none" stroke="${dark}" stroke-opacity=".2" stroke-width="1"/>
        <path d="M101,162 C110,167 130,167 139,162" fill="none" stroke="${dark}" stroke-opacity=".26" stroke-width="1.1"/>
        <path d="M102,165 C111,169 129,169 138,165" fill="none" stroke="${light}" stroke-opacity=".45" stroke-width="1"/>`;
    case 'shorts-knit':
      return `
        <g clip-path="url(#${k}-bot)">
          <path d="M97,178 C108,183 132,183 143,178" fill="none" stroke="${dark}" stroke-opacity=".16" stroke-width="1.2"/>
          <path d="M99,196 C110,201 130,201 141,196" fill="none" stroke="${dark}" stroke-opacity=".12" stroke-width="1.2"/>
          <path d="M99,214 C110,219 130,219 141,214" fill="none" stroke="${dark}" stroke-opacity=".12" stroke-width="1.2"/>
          <path d="M101,232 C110,236 130,236 139,232" fill="none" stroke="${dark}" stroke-opacity=".12" stroke-width="1.2"/>
          <path d="M105,180 C104,198 104,216 105,232" stroke="#fff" stroke-opacity=".2" stroke-width="3.2" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <path d="M135,180 C136,198 136,216 135,232" stroke="${dark}" stroke-opacity=".12" stroke-width="4" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
        </g>
        <path d="M100,164 C110,169 130,169 140,164" fill="none" stroke="${dark}" stroke-opacity=".35" stroke-width="2"/>
        <path d="M101,167 C111,172 129,172 139,167" fill="none" stroke="${light}" stroke-opacity=".45" stroke-width=".9"/>
        <g fill="none" stroke="${dark}" stroke-opacity=".55" stroke-linecap="round">
          <path d="M143,176 q4.6,-3.6 4.8,-8.4" stroke-width="1.8"/>
          <path d="M143,176 q5.6,2.6 9.4,0.8" stroke-width="1.8"/>
          <path d="M143,176 q-0.8,5.4 -5.4,7.2" stroke-width="1.8"/>
        </g>
        <circle cx="143" cy="176" r="2" fill="${dark}" opacity=".8"/>`;
    case 'shorts-loose':
      return `
        <g clip-path="url(#${k}-bot)">
          <rect x="94" y="157" width="52" height="8.4" fill="${dark}" opacity=".38"/>
          <path d="M96,182 C108,187 132,187 144,182" fill="none" stroke="${dark}" stroke-opacity=".14" stroke-width="1.4"/>
          <path d="M95,200 C108,205 132,205 145,200" fill="none" stroke="${dark}" stroke-opacity=".12" stroke-width="1.4"/>
          <path d="M100,206 C99,218 98,230 97,240" stroke="#fff" stroke-opacity=".16" stroke-width="4" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <path d="M140,206 C141,218 142,230 143,240" stroke="${dark}" stroke-opacity=".12" stroke-width="4" stroke-linecap="round" fill="none" filter="url(#${k}-blur2)"/>
          <rect x="90" y="228" width="24" height="12" fill="${dark}" opacity=".10"/>
          <rect x="126" y="228" width="24" height="12" fill="${dark}" opacity=".10"/>
        </g>
        <path d="M98,163 C108,168 132,168 142,163" fill="none" stroke="${dark}" stroke-opacity=".35" stroke-width="2"/>
        <g fill="none" stroke="${light}" stroke-width="1.6" stroke-linecap="round" opacity=".85">
          <path d="M117,168 C116,174 115,178 114,182"/>
          <path d="M123,168 C124,174 125,178 126,182"/>
        </g>
        <g fill="none" stroke="${dark}" stroke-opacity=".35" stroke-linecap="round">
          <path d="M106,236 C108,238 112,238 114,236" stroke-width="1.1"/>
          <path d="M126,236 C128,238 132,238 134,236" stroke-width="1.1"/>
        </g>`;
    default:
      return '';
  }
}

/* =========================================================
   2. 스타일링 보드 — 매거진 화보 콜라주
   viewBox 0 0 340 452
   ========================================================= */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fit(str, n) {
  const s = String(str || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

const BOARD = { w: 340, h: 452 };

function cardFrame(x, y, w, h, rot, inner, opts) {
  const o = opts || {};
  const kind = o.frame || 'print';
  const pad = kind === 'polaroid' ? 7.5 : kind === 'tape' ? 2.4 : 3.6;
  const foot = o.caption ? (kind === 'polaroid' ? 15 : 13) : 0;
  const iw = w - pad * 2;
  const ih = h - pad * 2 - foot;
  const rx = kind === 'polaroid' ? 2 : 1.2;
  const caption = o.caption || '';
  return `<g transform="translate(${x + w / 2} ${y + h / 2}) rotate(${rot}) translate(${-w / 2} ${-h / 2})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${kind === 'polaroid' ? '#FFFDF9' : '#FFFCF6'}" filter="url(#b-card)"/>
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="none" stroke="#D9C4B2" stroke-opacity=".55" stroke-width=".7"/>
    <g transform="translate(${pad} ${pad})">${inner(iw, ih)}</g>
    ${caption ? `<text x="${w / 2}" y="${h - 4.6}" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-size="${kind === 'polaroid' ? 6.8 : 6.6}" letter-spacing=".7" fill="#9C8477">${caption}</text>` : ''}
  </g>`;
}

function photoInner(item, iw, ih, k) {
  const clip = `${k}-clip`;
  return `
    <clipPath id="${clip}"><rect x="0" y="0" width="${iw}" height="${ih}" rx="1.4"/></clipPath>
    <g clip-path="url(#${clip})">
      <image href="${esc(item.image)}" x="0" y="0" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid slice" filter="url(#b-tone)"/>
      <rect x="0" y="0" width="${iw}" height="${ih}" fill="url(#b-photoShade)"/>
      <rect x="0" y="0" width="${iw}" height="${ih}" fill="#F6E7DA" opacity=".035"/>
    </g>
    <rect x="0.35" y="0.35" width="${iw - 0.7}" height="${ih - 0.7}" rx="1.2" fill="none" stroke="#6E5344" stroke-opacity=".16" stroke-width=".6"/>`;
}

/* 보드용 카드 안쪽: 사진이 있으면 사진, 없으면 질감 있는 디테일 카드 */
function leoCardInner(item, w, h, k) {
  if (item && item.image) return photoInner(item, w, h, k + 'l');
  return detailCard(item, w, h, k + 'ld', 'leotard');
}
function topCardInner(item, w, h, k) {
  if (item && item.image) return photoInner(item, w, h, k + 't');
  return detailCard(item, w, h, k + 'td', 'top');
}
function botCardInner(item, w, h, k) {
  if (item && item.image) return photoInner(item, w, h, k + 'b');
  return detailCard(item, w, h, k + 'bd', 'bottom');
}
function ankCardInner(item, w, h, k) {
  if (item && item.image) return photoInner(item, w, h, k + 'a');
  return detailCard(item, w, h, k + 'ad', 'ankle');
}

/* 사진 없는 아이템: 원단 질감이 살아 있는 디테일 일러스트 카드 */
function detailCard(item, w, h, k, cat) {
  const c = item ? item.color : '#D9C9BE';
  const S = Math.min(w, h);
  const tx = w / 2, ty = h * 0.48;
  const scale = (S / 100) * 1.12;
  return `<rect x="0" y="0" width="${w}" height="${h}" fill="${mix(c, '#FCF5EC', 0.9)}"/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#b-cardGrain)"/>
    <g transform="translate(${tx} ${ty}) scale(${scale}) translate(-50 -50)">${garmentDetail(item, cat, k)}</g>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#b-sweep)"/>
    <g transform="translate(${w - 4} ${h - 4}) rotate(-90)" opacity=".55">
      <text x="0" y="0" text-anchor="start" font-family="'Cormorant Garamond', serif" font-size="4.6" letter-spacing="1.1" fill="#8C7263">FABRIC STUDY</text>
    </g>
    <rect x="0.35" y="0.35" width="${w - 0.7}" height="${h - 0.7}" rx="1.2" fill="none" stroke="#6E5344" stroke-opacity=".14" stroke-width=".6"/>`;
}

function boardArt(p) {
  const k = uid('b');
  const leo = p.leotard || null;
  const top = p.top || null;
  const bot = p.bottom || null;
  const ank = p.ankle || null;
  const chosen = [leo, top, bot, ank].filter(Boolean);
  const palette = (p.palette || chosen.map((i) => i.color)).slice(0, 4);

  const W = BOARD.w, H = BOARD.h;
  const L = [];
  const push = (s) => L.push(s);

  /* ── 배경: 크림 종이 + 스튜디오 조명 ── */
  push(`<rect width="${W}" height="${H}" fill="url(#b-paper)"/>`);
  push(`<ellipse cx="140" cy="80" rx="170" ry="130" fill="url(#b-light)"/>`);
  push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#b-grain)" opacity=".55"/>`);
  push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="#AC8B77" stroke-opacity=".18" stroke-width=".7"/>`);
  push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#b-vignette)"/>`);

  /* ── 머리글 ── */
  push(`<text x="20" y="26" font-family="'Cormorant Garamond', serif" font-size="7" letter-spacing="2.6" fill="#A2816F">BALLET WARDROBE</text>`);
  push(`<text x="${W - 20}" y="26" text-anchor="end" font-family="'Cormorant Garamond', serif" font-size="6.6" letter-spacing="1.2" fill="#A2816F">${esc(p.issue || 'STYLING BOARD')}</text>`);
  push(`<path d="M20,32 L${W - 20},32" stroke="#AC8B77" stroke-opacity=".34" stroke-width=".6"/>`);

  /* ── 카드 ── */
  const hasTop = !!top, hasBot = !!bot, hasAnk = !!ank;

  const A = hasBot ? { x: 26, y: 44, w: 148, h: 176, rot: -3.0 } : { x: 36, y: 46, w: 152, h: 190, rot: -2.6 };
  const B = { x: 180, y: 34, w: 118, h: 132, rot: 6.4 };
  const C = { x: 98, y: 210, w: 164, h: 140, rot: -1.6 };
  const D = hasBot ? { x: 20, y: 264, w: 78, h: 94, rot: 5.6 } : { x: 184, y: 268, w: 82, h: 98, rot: -5.0 };

  const layer = [];
  if (hasTop) layer.push({ z: 1, el: cardFrame(B.x, B.y, B.w, B.h, B.rot, (w, h) => topCardInner(top, w, h, k), { caption: capFor(top, 'TOP'), frame: 'polaroid' }) });
  layer.push({ z: 2, el: cardFrame(A.x, A.y, A.w, A.h, A.rot, (w, h) => leoCardInner(leo, w, h, k), { caption: capFor(leo, 'LEOTARD'), frame: 'print' }) });
  if (hasBot) layer.push({ z: 3, el: cardFrame(C.x, C.y, C.w, C.h, C.rot, (w, h) => botCardInner(bot, w, h, k), { caption: capFor(bot, 'BOTTOM'), frame: 'print' }) });
  if (hasAnk) layer.push({ z: 4, el: cardFrame(D.x, D.y, D.w, D.h, D.rot, (w, h) => ankCardInner(ank, w, h, k), { caption: capFor(ank, 'ANKLE'), frame: 'polaroid' }) });
  layer.sort((a, b) => a.z - b.z).forEach((x) => push(x.el));

  /* ── 테이프 · 클립 ── */
  if (hasTop) {
    push(`<g transform="translate(${B.x + 13} ${B.y + 2}) rotate(-36)"><rect x="-13" y="-4.4" width="26" height="8.8" fill="url(#b-tape)" opacity=".85"/></g>`);
    const cx = B.x + B.w - 12, cy = B.y + 8;
    push(`<g transform="rotate(10 ${cx} ${cy})" fill="none" stroke="#B5A294" stroke-opacity=".72" stroke-width="1.4" stroke-linecap="round">
        <path d="M${cx},${cy + 12} L${cx},${cy - 5} C${cx},${cy - 10.5} ${cx + 7},${cy - 10.5} ${cx + 7},${cy - 5} L${cx + 7},${cy + 15} C${cx + 7},${cy + 20.5} ${cx - 1},${cy + 20.5} ${cx - 1},${cy + 15} L${cx - 1},${cy - 1}"/>
      </g>`);
  }
  push(`<g transform="translate(${A.x + 3} ${A.y + 13}) rotate(-46)"><rect x="-12" y="-4.2" width="24" height="8.4" fill="url(#b-tape)" opacity=".8"/></g>`);
  if (hasBot) {
    push(`<g transform="translate(${C.x + C.w - 9} ${C.y + C.h - 15}) rotate(-34)"><rect x="-11}" y="-4.2" width="22" height="8.4" fill="url(#b-tape)" opacity=".72"/></g>`.replace('x="-11}"','x="-11"'));
  }
  if (hasAnk) {
    push(`<g transform="translate(${D.x + D.w - 8} ${D.y + 5}) rotate(38)"><rect x="-10" y="-3.8" width="20" height="7.6" fill="url(#b-tape)" opacity=".7"/></g>`);
  }

  /* ── 캡션 블록 ── */
  const title = p.title || '오늘의 코디';
  const sub = fit((p.items || chosen.map((i) => i.short || i.name).join(' · ')), 38);
  const date = p.date || '';
  const baseY = 376;
  push(`<path d="M20,${baseY} L${W - 20},${baseY}" stroke="#AC8B77" stroke-opacity=".3" stroke-width=".6"/>`);
  push(`<text x="20" y="${baseY + 12}" font-family="'Cormorant Garamond', serif" font-size="5.6" letter-spacing="2" fill="#B08F80">TODAY'S LOOK</text>`);
  push(`<text x="20" y="${baseY + 31}" font-family="'Noto Serif KR', 'Cormorant Garamond', serif" font-size="15.5" letter-spacing=".1" fill="#453630">${esc(title)}</text>`);
  push(`<text x="20" y="${baseY + 44}" font-family="'Noto Serif KR', sans-serif" font-size="6.2" letter-spacing=".1" fill="#97826F">${esc(sub)}</text>`);
  if (date) push(`<text x="20" y="${baseY + 56}" font-family="'Cormorant Garamond', serif" font-size="5.6" letter-spacing="1.2" fill="#B49A8B">${esc(date)}</text>`);

  /* ── 컬러 팔레트 ── */
  const swY = baseY + 14;
  palette.forEach((col, i) => {
    const cx = W - 24 - i * 15.5;
    push(`<g transform="rotate(${i % 2 ? 3 : -2} ${cx} ${swY})">
        <rect x="${cx - 5.6}" y="${swY - 6.4}" width="11.2" height="12.8" rx=".8" fill="${col}" stroke="#6E5344" stroke-opacity=".2" stroke-width=".6"/>
        <rect x="${cx - 5.6}" y="${swY - 6.4}" width="11.2" height="2.6" fill="#000" opacity=".08"/>
      </g>`);
  });
  push(`<text x="${W - 20}" y="${swY + 17}" text-anchor="end" font-family="'Cormorant Garamond', serif" font-size="5.2" letter-spacing="1.6" fill="#B1988A">COLOR PALETTE${p.score ? ' · HARMONY ' + esc(String(p.score)) : ''}</text>`);

  const defs = `<defs>
    <linearGradient id="b-paper" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="#FEFAF3"/><stop offset=".38" stop-color="#FAF1E6"/><stop offset=".72" stop-color="#F6EADD"/><stop offset="1" stop-color="#EFDFD1"/>
    </linearGradient>
    <radialGradient id="b-light" gradientUnits="userSpaceOnUse" cx="140" cy="80" r="170">
      <stop offset="0" stop-color="#FFFEFB" stop-opacity=".95"/><stop offset=".5" stop-color="#FFF9F0" stop-opacity=".45"/><stop offset="1" stop-color="#FFF9F0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b-vignette" gradientUnits="userSpaceOnUse" cx="170" cy="215" r="238">
      <stop offset=".58" stop-color="#8A6A56" stop-opacity="0"/><stop offset="1" stop-color="#8A6A56" stop-opacity=".15"/>
    </radialGradient>
    <linearGradient id="b-photoShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4A3226" stop-opacity=".09"/><stop offset=".32" stop-color="#4A3226" stop-opacity="0"/><stop offset="1" stop-color="#4A3226" stop-opacity=".10"/>
    </linearGradient>
    <linearGradient id="b-tape" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#F4E8D8" stop-opacity=".2"/><stop offset=".16" stop-color="#FBF2E4" stop-opacity=".85"/><stop offset=".84" stop-color="#FBF2E4" stop-opacity=".85"/><stop offset="1" stop-color="#F4E8D8" stop-opacity=".18"/>
    </linearGradient>
    <linearGradient id="b-sheer" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/>
    </linearGradient>
    <linearGradient id="b-sweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="b-card" x="-30%" y="-25%" width="160%" height="160%">
      <feDropShadow dx="1.2" dy="5.2" stdDeviation="4.6" flood-color="#6A4B3A" flood-opacity=".26"/>
    </filter>
    <filter id="b-tone" x="-4%" y="-4%" width="108%" height="108%">
      <feColorMatrix type="matrix" values="1.010 0.020 0.008 0 0.004  0.012 1.005 0.006 0 0.003  0.006 0.018 0.982 0 0.002  0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.055" intercept="-0.020"/>
        <feFuncG type="linear" slope="1.055" intercept="-0.020"/>
        <feFuncB type="linear" slope="1.050" intercept="-0.018"/>
      </feComponentTransfer>
    </filter>
    <filter id="b-noise" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <pattern id="b-grain" width="120" height="120" patternUnits="userSpaceOnUse">
      <rect width="120" height="120" filter="url(#b-noise)" opacity=".2"/>
    </pattern>
    <pattern id="b-cardGrain" width="90" height="90" patternUnits="userSpaceOnUse">
      <rect width="90" height="90" filter="url(#b-noise)" opacity=".12"/>
    </pattern>
    <pattern id="b-mesh" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r=".85" fill="#fff" fill-opacity=".5"/>
    </pattern>
  </defs>`;

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="선택한 발레복을 매거진 화보처럼 담은 스타일링 보드" preserveAspectRatio="xMidYMid meet">${defs}${L.join('')}</svg>`;
}

function capFor(item, cat) {
  if (!item) return '';
  return esc(fit(`${cat} · ${item.short || item.name}`, 24).toUpperCase());
}

/* 카드 안에 담는 플랫레이 — 제품 사진처럼 놓인 옷 모양 */
const FLAT = {
  camisole: { box: [24, 6, 76, 98] },
  boatneck: { box: [26, 16, 74, 98] },
  'mesh-crop': { box: [34, 24, 66, 70] },
  'long-sleeve': { box: [8, 22, 92, 92] },
  'slim-tee': { box: [10, 20, 90, 88] },
  'bolero-short': { box: [14, 22, 86, 70] },
  'skirt-long': { box: [18, 16, 82, 92] },
  'skirt-short': { box: [18, 18, 82, 86] },
  'shorts-knit': { box: [28, 18, 72, 92] },
  'shorts-loose': { box: [26, 16, 74, 92] },
  ankle: { box: [24, 18, 76, 88] }
};

function flatPaths(shape) {
  const cami = {
    body: 'M40,32 C44,40 56,40 60,32 C64,33 68,36 69,41 C71,49 70,55 68,59 C70,67 71,73 70,78 C69,85 62,89 56,87 C52,85 51,87 50,89 C49,87 48,85 44,87 C38,89 31,85 30,78 C29,73 30,67 32,59 C30,55 29,49 31,41 C32,36 36,33 40,32 Z',
    extra: '<g stroke="C" stroke-width="4.4" stroke-linecap="round" fill="none"><path d="M39,33 L36,12"/><path d="M61,33 L64,12"/></g>'
  };
  switch (shape) {
    case 'camisole':
      return cami;
    case 'boatneck':
      return {
        body: 'M34,26 C41,33 59,33 66,26 C70,28 72,32 73,37 C74,45 72,52 70,57 C72,65 73,73 72,79 C71,86 63,90 57,88 C53,86 51,88 50,90 C49,88 47,86 43,88 C37,90 29,86 28,79 C27,73 28,65 30,57 C28,52 26,45 27,37 C28,32 30,28 34,26 Z',
        extra: '<path d="M34,25 C42,32 58,32 66,25" fill="none" stroke="L" stroke-width="2" stroke-opacity=".5"/>'
      };
    case 'long-sleeve':
      return {
        body: 'M40,26 C36,28 32,32 30,38 C29,52 29,70 30,86 C37,89 44,89 50,87 C56,89 63,89 70,86 C71,70 71,52 70,38 C68,32 64,28 60,26 C55,33 45,33 40,26 Z',
        extra: '<g stroke="S" stroke-width="11" stroke-linecap="round" fill="none"><path d="M31,33 C24,46 17,62 12,78"/><path d="M69,33 C76,46 83,62 88,78"/></g>'
      };
    case 'slim-tee':
      return {
        body: 'M40,26 C36,28 32,32 31,38 C30,50 30,64 31,76 q4,5 8,0 q4,5 8,0 q4,5 8,0 q4,5 8,0 C 69,64 69,50 68,38 C67,32 64,28 60,26 C55,33 45,33 40,26 Z',
        extra: '<g stroke="S" stroke-width="10" stroke-linecap="round" fill="none"><path d="M32,34 C25,46 19,60 16,74"/><path d="M68,34 C75,46 81,60 84,74"/></g>'
      };
    case 'bolero-short':
      return {
        body: 'M40,26 C36,28 32,32 31,38 C30,46 31,54 33,58 C37,52 41,46 46,42 C43,36 42,31 42,28 Z M60,26 C64,28 68,32 69,38 C70,46 69,54 67,58 C63,52 59,46 54,42 C57,36 58,31 58,28 Z',
        extra: '<g stroke="S" stroke-width="10" stroke-linecap="round" fill="none"><path d="M33,34 C28,42 24,50 22,56"/><path d="M67,34 C72,42 76,50 78,56"/></g>'
      };
    case 'mesh-crop':
      return {
        body: 'M38,28 C43,32 57,32 62,28 C65,38 65,52 63,62 C56,67 44,67 37,62 C35,52 35,38 38,28 Z',
        extra: '<g stroke="C" stroke-width="3" stroke-linecap="round" fill="none"><path d="M40,30 L38,22"/><path d="M60,30 L62,22"/></g>'
      };
    case 'skirt-long':
      return {
        body: 'M30,20 L70,20 C74,40 80,64 84,82 C74,86 62,88 50,87 C38,86 26,84 18,80 C22,62 26,40 30,20 Z',
        extra: '<path d="M70,22 C66,42 60,66 54,86" fill="none" stroke="L" stroke-width="1.8" stroke-opacity=".45"/>'
      };
    case 'skirt-short':
      return {
        body: 'M30,20 L70,20 C74,38 79,54 82,68 C70,72 58,74 44,73 C34,72 26,70 20,67 C23,52 27,36 30,20 Z',
        extra: '<path d="M70,22 C66,40 61,56 57,71" fill="none" stroke="L" stroke-width="1.8" stroke-opacity=".45"/>'
      };
    case 'shorts-knit':
      return {
        body: 'M30,18 L70,18 C71,40 71,64 70,86 L56,86 L53,52 L50,49 L47,52 L44,86 L30,86 C29,64 29,40 30,18 Z',
        extra: '<path d="M30,24 L70,24" fill="none" stroke="L" stroke-width="1.6" stroke-opacity=".4"/>'
      };
    case 'shorts-loose':
      return {
        body: 'M28,16 L72,16 C73,38 73,62 72,84 L57,84 L54,50 L50,47 L46,50 L43,84 L28,84 C27,62 27,38 28,16 Z',
        extra: '<path d="M28,23 L72,23" fill="none" stroke="L" stroke-width="1.8" stroke-opacity=".4"/><g stroke="L" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".6"><path d="M47,26 C46,32 45,36 44,40"/><path d="M53,26 C54,32 55,36 56,40"/></g>'
      };
    case 'ankle':
      return {
        body: 'M27,24 C25,38 25,58 26,74 C27,80 30,83 34,82 C38,81 40,77 40,71 C41,56 41,38 40,24 Z M60,24 C62,38 62,58 61,74 C60,80 57,83 53,82 C49,81 47,77 47,71 C46,56 46,38 47,24 Z',
        extra: ''
      };
    default:
      return null;
  }
}

/* 카드 안에 담는 디테일 카드 (100×100 좌표계) */
function garmentDetail(item, cat, k) {
  const shape = item ? item.shape : 'camisole';
  const spec = FLAT[shape];
  const flat = flatPaths(shape);
  const c = item ? item.color : '#D9C9BE';
  const L = shade(c, -30), S = shade(c, 16), D = shade(c, -16);

  if (!flat) {
    /* 정의되지 않은 실루엣은 옷 모양 카드로 대신한다 */
    return `<g transform="translate(50 50)">
      <defs><linearGradient id="${k}-g" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${S}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${D}"/>
      </linearGradient></defs>
      <rect x="-22" y="-26" width="44" height="52" rx="4" fill="url(#${k}-g)" stroke="${L}" stroke-opacity=".4" stroke-width=".8"/>
      <path d="M-10,-18 L-10,26" stroke="#fff" stroke-opacity=".2" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }

  const box = (spec || FLAT.camisole).box;
  const bw = box[2] - box[0], bh = box[3] - box[1];
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
  const sc = Math.min(88 / bh, 84 / bw);
  const extra = (flat.extra || '').replace(/"C"/g, `"${c}"`).replace(/"S"/g, `"url(#${k}-gs)"`).replace(/"L"/g, `"${L}"`);

  const knit = shape === 'shorts-knit' || shape === 'ankle';
  const sheer = shape === 'skirt-long' || shape === 'skirt-short' || shape === 'mesh-crop';

  return `<g transform="translate(50 50) scale(${sc}) translate(${-cx} ${-cy})">
    <defs>
      <linearGradient id="${k}-g" x1="0" y1="0" x2="0.45" y2="1">
        <stop offset="0" stop-color="${S}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${D}"/>
      </linearGradient>
      <linearGradient id="${k}-gs" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${shade(c, -6)}"/><stop offset=".38" stop-color="${S}"/><stop offset="1" stop-color="${shade(c, -12)}"/>
      </linearGradient>
      <linearGradient id="${k}-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".13"/>
      </linearGradient>
      <linearGradient id="${k}-sheer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".32"/>
      </linearGradient>
      <filter id="${k}-blur" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <pattern id="${k}-rib" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
        <path d="M0,0 L0,3.2" stroke="${L}" stroke-opacity=".32" stroke-width=".8"/>
      </pattern>
      <pattern id="${k}-mesh" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#fff" fill-opacity=".55"/>
      </pattern>
    </defs>
    ${extra}
    <path id="${k}-p" d="${flat.body}" fill="url(#${k}-g)" stroke="${L}" stroke-opacity=".45" stroke-width="1" stroke-linejoin="round"/>
    <clipPath id="${k}-c"><path d="${flat.body}"/></clipPath>
    <g clip-path="url(#${k}-c)">
      <rect x="${box[0] - 4}" y="${box[1] - 4}" width="${bw + 8}" height="${bh + 8}" fill="url(#${k}-shade)"/>
      ${knit ? `<rect x="${box[0] - 4}" y="${box[1] - 4}" width="${bw + 8}" height="${bh + 8}" fill="url(#${k}-rib)" opacity=".8"/>` : ''}
      ${shape === 'mesh-crop' ? `<rect x="${box[0] - 4}" y="${box[1] - 4}" width="${bw + 8}" height="${bh + 8}" fill="url(#${k}-mesh)"/>` : ''}
      <path d="M${cx - bw * 0.18},${box[1] + 6} C${cx - bw * 0.26},${cy} ${cx - bw * 0.3},${box[3] - 14} ${cx - bw * 0.16},${box[3] - 2}" stroke="#fff" stroke-opacity=".26" stroke-width="7" stroke-linecap="round" fill="none" filter="url(#${k}-blur)"/>
      <path d="M${cx + bw * 0.2},${box[1] + 4} C${cx + bw * 0.28},${cy} ${cx + bw * 0.3},${box[3] - 12} ${cx + bw * 0.16},${box[3] - 2}" stroke="${L}" stroke-opacity=".2" stroke-width="7" stroke-linecap="round" fill="none" filter="url(#${k}-blur)"/>
      ${sheer ? `<rect x="${box[0] - 4}" y="${box[3] - bh * 0.34}" width="${bw + 8}" height="${bh * 0.34 + 4}" fill="url(#${k}-sheer)"/>` : ''}
      ${shape === 'skirt-long' || shape === 'skirt-short'
        ? `<g stroke="${L}" stroke-opacity=".16" fill="none" stroke-width="1.1">
             <path d="M${cx - 12},${box[1] + 3} C${cx - 16},${cy} ${cx - 22},${box[3] - 18} ${cx - 26},${box[3] - 4}"/>
             <path d="M${cx},${box[1] + 3} L${cx - 2},${box[3] - 3}"/>
             <path d="M${cx + 12},${box[1] + 3} C${cx + 16},${cy} ${cx + 22},${box[3] - 18} ${cx + 26},${box[3] - 4}"/>
           </g>` : ''}
    </g>
    ${shape === 'camisole'
      ? `<path d="M40,33 C44,41 56,41 60,33" fill="none" stroke="${L}" stroke-opacity=".5" stroke-width="1.8"/>`
      : shape === 'boatneck'
        ? `<path d="M35,27 C42,34 58,34 65,27" fill="none" stroke="${L}" stroke-opacity=".5" stroke-width="2"/>`
        : ''}
    ${shape === 'skirt-long' || shape === 'skirt-short'
      ? `<g><path d="M30,20 L70,20 L70,27 L30,27 Z" fill="${shade(c, -10)}" opacity=".55"/>
           <path d="M30,20 L70,20" stroke="${L}" stroke-opacity=".55" stroke-width="1.6"/>
           <path d="M30,27 L70,27" stroke="${L}" stroke-opacity=".3" stroke-width="1"/>
           <path d="M70,22 C66,40 61,58 56,73" fill="none" stroke="${shade(c, -18)}" stroke-opacity=".45" stroke-width="1.6"/></g>` : ''}
    ${shape === 'shorts-loose' || shape === 'shorts-knit'
      ? `<path d="M${box[0]},${box[1] + 5} L${box[2]},${box[1] + 5}" stroke="${L}" stroke-opacity=".45" stroke-width="2"/>` : ''}
  </g>`;
}

/* =========================================================
   3. 썸네일용 플랫 아이콘 (칩 · 옷장 목록)
   ========================================================= */
function garmentThumb(item) {
  const c = item.color || '#D9C9BE';
  const line = shade(c, -26);
  const open = `<svg viewBox="0 0 64 64" role="img" aria-label="${esc(item.name || '아이템')}" preserveAspectRatio="xMidYMid meet">`;
  const g = (inner) => `${open}<g fill="${c}" stroke="${line}" stroke-width="1.1" stroke-linejoin="round">${inner}</g></svg>`;
  switch (item.shape) {
    case 'camisole':
      return g(`<path d="M23,15 C24,11 40,11 41,15 C42,26 42,34 41,40 C40,47 38,51 35,54 L32,42 L29,54 C26,51 24,47 23,40 C22,34 22,26 23,15 Z"/>
        <path d="M24.5,14 L27,7" fill="none" stroke="${line}" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M39.5,14 L37,7" fill="none" stroke="${line}" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M24,31 Q32,35 40,31" fill="none" stroke="${line}" stroke-opacity=".4" stroke-width=".9"/>`);
    case 'boatneck':
      return g(`<path d="M18,14 C26,18 38,18 46,14 C46,26 45,34 44,40 C43,47 41,51 38,54 L32,42 L26,54 C23,51 21,47 20,40 C19,34 18,26 18,14 Z"/>
        <path d="M18,14 C26,18 38,18 46,14" fill="none" stroke="${line}" stroke-width="1.3"/>
        <path d="M20,32 Q32,36 44,32" fill="none" stroke="${line}" stroke-opacity=".4" stroke-width=".9"/>`);
    case 'slim-tee':
      return g(`<path d="M23,16 C17,23 14,33 12,44" fill="none" stroke="${c}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M41,16 C47,23 50,33 52,44" fill="none" stroke="${c}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M22,13 C26,10 38,10 42,13 C43,22 43,30 42,38 C36,41 28,41 22,38 C21,30 21,22 22,13 Z"/>
        <path d="M26,11.5 Q32,17 38,11.5" fill="none" stroke="${line}" stroke-width="1.3"/>
        <path d="M22,38 q2.5,3.4 5,0 q2.5,3.4 5,0 q2.5,3.4 5,0 q2.5,3.4 5,0" fill="none" stroke="${line}" stroke-width="1.1"/>`);
    case 'long-sleeve':
      return g(`<path d="M25,15 C19,24 16,34 14,45" fill="none" stroke="${c}" stroke-width="5.6" stroke-linecap="round"/>
        <path d="M39,15 C45,24 48,34 50,45" fill="none" stroke="${c}" stroke-width="5.6" stroke-linecap="round"/>
        <path d="M25,15 Q32,20 39,15" fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M25,15 Q32,20 39,15" fill="none" stroke="${line}" stroke-opacity=".45" stroke-width=".9"/>`);
    case 'bolero-short':
      return g(`<path d="M24,14 C21,19 19,24 18,29" fill="none" stroke="${c}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M40,14 C43,19 45,24 46,29" fill="none" stroke="${c}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M24,14 Q32,19 40,14" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
        <path d="M24,14 Q32,19 40,14" fill="none" stroke="${line}" stroke-opacity=".45" stroke-width=".9"/>`);
    case 'mesh-crop':
      return g(`<path d="M23,16 Q32,20 41,16 C42,26 41,32 40,37 Q32,40 24,37 C23,32 22,26 23,16 Z" fill-opacity=".85"/>
        <g fill="#fff" fill-opacity=".55">
          <circle cx="27" cy="22" r=".9"/><circle cx="32" cy="21" r=".9"/><circle cx="37" cy="22" r=".9"/>
          <circle cx="29" cy="28" r=".9"/><circle cx="35" cy="28" r=".9"/><circle cx="32" cy="33" r=".9"/>
        </g>`);
    case 'skirt-long':
      return g(`<path d="M22,17 L42,17 L54,52 Q32,57 10,52 Z"/>
        <path d="M22,17 L42,17 L42,22 L22,22 Z" fill-opacity=".85"/>
        <path d="M32,23 L32,55" fill="none" stroke="${line}" stroke-opacity=".3" stroke-width=".9"/>`);
    case 'skirt-short':
      return g(`<path d="M20,18 L44,18 L52,40 Q32,44 12,40 Z"/>
        <path d="M20,18 L44,18 L44,23 L20,23 Z" fill-opacity=".85"/>`);
    case 'shorts-knit':
      return g(`<path d="M20,16 L44,16 L43,50 L34,50 L32,31 L30,50 L21,50 Z"/>
        <path d="M20,16 L44,16 L44,21 L20,21 Z" fill-opacity=".85"/>`);
    case 'shorts-loose':
      return g(`<path d="M18,15 L46,15 L45,49 L35,49 L32,29 L29,49 L19,49 Z"/>
        <path d="M18,15 L46,15 L46,21 L18,21 Z" fill-opacity=".85"/>
        <path d="M30,17 q2,3 4,0" fill="none" stroke="${line}" stroke-width="1"/>`);
    case 'ankle':
      return g(`<rect x="12" y="17" width="17" height="30" rx="8"/>
        <rect x="35" y="17" width="17" height="30" rx="8"/>
        <g fill="none" stroke="${line}" stroke-opacity=".45" stroke-width=".8">
          <path d="M13,24 h15"/><path d="M13,30 h15"/><path d="M13,36 h15"/>
          <path d="M36,24 h15"/><path d="M36,30 h15"/><path d="M36,36 h15"/>
        </g>`);
    default:
      return g(`<path d="M20,18 L44,18 L44,46 L20,46 Z"/>`);
  }
}
