// Desenho em pixel art (retângulos) do herói, monstros, cenários, baú e fogueira.
export const W = 320, H = 150, GY = 124;
const TAU = Math.PI * 2;

let ctx = null;
let FL = 0; // 0 normal · 1 branco (tomou dano) · 2 vermelho (preparando golpe forte)
export const setCtx = c => { ctx = c; };
export const setFlash = f => { FL = f; };
export function R(x, y, w, h, c) {
  ctx.fillStyle = FL === 1 ? '#ffffff' : FL === 2 ? '#ff5a48' : c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
export const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------- Herói ----------------
// o: { x, y, walk, step, ang, swing, weapon, armor, skin, hair, cloth, cape, goldGlow, time }
export function drawHero(o) {
  const A = o.armor, Wp = o.weapon;
  const main = A.main || o.cloth, dark = A.dark || shade(o.cloth, -0.3), legs = A.legs;
  const skin = o.skin, skinD = shade(skin, -0.18), hair = o.hair, hairD = shade(hair, -0.35);
  const x = o.x, y = o.y;
  const ls = o.walk && o.step ? 1 : 0, rs = o.walk && !o.step ? 1 : 0;
  const by = y + (o.walk && o.step ? -1 : 0);

  if (!FL) R(x - 7, y, 14, 1, 'rgba(0,0,0,.35)');
  if (o.cape) {
    const wv = Math.round(Math.sin(o.time * 6) * 1);
    R(x - 9 - wv, by - 19, 4, 13, '#b82c26'); R(x - 10 - wv, by - 8, 3, 2, '#8a1e1a'); R(x - 8, by - 19, 3, 2, '#e04a40');
  }
  // pernas e botas
  R(x - 5, y - 10 - ls, 4, 7, legs); R(x - 5, y - 3 - ls, 4, 3, '#3a2a1e');
  R(x + 1, y - 10 - rs, 4, 7, shade(legs, -0.1)); R(x + 1, y - 3 - rs, 4, 3, '#2e2018');
  // braço de trás
  R(x - 7, by - 18, 2, 7, dark); R(x - 7, by - 11, 2, 2, skinD);
  // tronco
  R(x - 5, by - 19, 10, 8, main); R(x + 3, by - 19, 2, 8, dark); R(x - 4, by - 18, 1, 5, shade(main, 0.25));
  R(x - 2, by - 19, 4, 1, dark); R(x - 5, by - 11, 10, 1, '#3a2a1e'); R(x, by - 11, 2, 1, '#e8c060');
  // cabeça
  R(x - 5, by - 29, 10, 10, skin); R(x - 5, by - 20, 10, 1, skinD);
  R(x - 5, by - 30, 10, 3, hair); R(x - 6, by - 29, 3, 7, hair); R(x + 3, by - 28, 2, 1, hair); R(x - 6, by - 23, 2, 1, hairD);
  R(x + 1, by - 25, 3, 2, '#ffffff'); R(x + 3, by - 25, 1, 2, '#1a2a4a'); R(x + 1, by - 26, 3, 1, hairD);
  R(x + 2, by - 21, 2, 1, '#a8604a');
  if (A.helm) {
    R(x - 6, by - 31, 12, 4, A.helm); R(x - 6, by - 31, 12, 1, shade(A.helm, 0.3));
    R(x - 6, by - 27, 3, 6, A.helm); R(x + 4, by - 27, 1, 3, shade(A.helm, -0.2));
  }
  // rastro do golpe
  const sx = x + 2, sy = by - 17, L = Wp.len;
  if (o.swing >= 0 && !FL) {
    ctx.save(); ctx.globalAlpha = 0.28; ctx.strokeStyle = Wp.edge; ctx.lineWidth = L - 1;
    ctx.beginPath(); ctx.arc(sx, sy, 10 + L / 2, -1.0 - Math.PI / 2, o.ang - Math.PI / 2); ctx.stroke(); ctx.restore();
  }
  // braço da frente + arma
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(o.ang);
  R(-1, -7, 3, 7, main); R(-1, -9, 3, 2, skin);
  R(-3, -10, 7, 2, Wp.guard); R(-1, -10 - L, 3, L, Wp.blade); R(0, -10 - L, 1, L, Wp.edge); R(0, -11 - L, 1, 1, Wp.edge);
  if ((Wp.glow || o.goldGlow) && !FL) {
    ctx.globalAlpha = 0.3 + Math.sin(o.time * 5) * 0.1;
    R(-2, -11 - L, 5, L + 1, o.goldGlow ? '#ffe08a' : Wp.edge);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}

// Herói deitado (dia de descanso): mesmo sprite girado 90°.
export function drawHeroLying(o) {
  const A = o.armor, main = A.main || o.cloth, legs = A.legs, skin = o.skin, hair = o.hair;
  const b = Math.sin(o.time * 1.6) > 0 ? 1 : 0;
  const x = o.x, y = o.y;
  R(x - 16, y, 32, 1, 'rgba(0,0,0,.35)');
  R(x - 2, y - 6, 12, 5, legs); R(x + 10, y - 6, 3, 5, '#3a2a1e');
  R(x - 10, y - 7 - b, 9, 6 + b, main); R(x - 9, y - 7 - b, 7, 1, shade(main, 0.25));
  R(x - 20, y - 8, 10, 8, skin); R(x - 21, y - 8, 4, 8, hair); R(x - 20, y - 9, 10, 2, hair);
  R(x - 13, y - 6, 2, 1, '#7a4a3a'); // olho fechado
  if (A.helm) R(x - 24, y - 6, 5, 6, A.helm);
  R(x - 25, y - 1, 8, 2, '#6a4a8a'); // travesseiro (mochila)
}

// ---------------- Monstros (origem nos pés, olhando para a esquerda) ----------------
const SLIME_C = [['#5fc85a', '#a6f2a0', '#2f7a2c'], ['#4a8ef0', '#a4ccff', '#24509a'], ['#e0504a', '#ff9e96', '#8a2622'], ['#a35fe0', '#d8acff', '#5a2a8a']];

function slime(m, t) {
  const [c, l, d] = SLIME_C[m.tier % 4];
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 6 + m.seed)) * 6 : 0;
  const sq = m.state === 'walk' ? (hop < 1 ? 1.15 : 0.92) : 1 + Math.sin(t * 3) * 0.05;
  const w = Math.round(14 * sq), h = Math.round(10 / sq);
  if (!FL) R(-w / 2 + 1, 0, w - 2, 1, 'rgba(0,0,0,.35)');
  const bx = -w / 2, by = -h - hop;
  ctx.globalAlpha = 0.92;
  R(bx + 3, by, w - 6, 1, c); R(bx + 1, by + 1, w - 2, 2, c); R(bx, by + 3, w, h - 4, c); R(bx, by + h - 3, w, 2, d); R(bx + 1, by + h - 1, w - 2, 1, d);
  R(bx + 3, by + 2, 2, 2, l); ctx.globalAlpha = 1;
  R(bx + 2, by + 4, 2, 2, '#1a1a2a'); R(bx + 6, by + 4, 2, 2, '#1a1a2a');
  if (m.crown) { R(bx + 3, by - 4, 8, 3, '#f2c14e'); R(bx + 3, by - 6, 2, 2, '#f2c14e'); R(bx + 6, by - 6, 2, 2, '#f2c14e'); R(bx + 9, by - 6, 2, 2, '#f2c14e'); R(bx + 6, by - 3, 2, 1, '#e0504a'); }
}
function coelho(m, t) {
  const c = '#c9b8a6', d = '#9a8676';
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 9 + m.seed)) * 7 : (m.lunge >= 0 ? 3 : 0);
  const y = -hop;
  if (!FL) R(-5, 0, 10, 1, 'rgba(0,0,0,.35)');
  R(-5, y - 7, 10, 6, c); R(-5, y - 2, 10, 1, d); R(4, y - 7, 2, 2, '#ffffff');
  R(-9, y - 10, 6, 5, c); R(-8, y - 16, 2, 6, c); R(-5, y - 15, 2, 5, d); R(-8, y - 15, 1, 4, '#e8a0a8');
  R(-8, y - 9, 1, 1, '#e02020'); R(-9, y - 6, 1, 2, '#ffffff');
  R(-4, y - 1, 2, 1, d); R(2, y - 1, 3, 1, d);
}
function zumbi(m, t) {
  const step = m.state === 'walk' ? Math.floor(t * 6 + m.seed) % 2 : 0, skin = '#7fb069', sd = '#5e8a4c';
  if (!FL) R(-6, 0, 12, 1, 'rgba(0,0,0,.35)');
  R(-4, -9, 4, 9 - step, '#4a3b2a'); R(1, -9, 4, 9 - (1 - step), '#3e3122');
  R(-5, -18, 10, 9, '#3d6ea8'); R(2, -14, 2, 3, skin); R(-5, -11, 10, 2, '#2d527d'); R(-1, -18, 2, 2, '#2d527d');
  R(-5, -27, 10, 9, skin); R(-5, -27, 10, 2, '#3a4a2a'); R(3, -25, 2, 4, sd);
  R(-4, -23, 2, 2, '#ff3a3a'); R(-4, -20, 4, 1, '#2a2a1a');
  const reach = m.lunge >= 0 ? Math.sin(m.lunge * Math.PI) * 3 : 0;
  R(-13 - reach, -17, 9 + reach, 3, skin); R(-12 - reach, -14, 7, 2, sd);
}
function morcego(m, t) {
  const cy = -26 + Math.sin(t * 4 + m.seed) * 4;
  const up = Math.sin(t * 18 + m.seed) > 0;
  if (!FL) R(-4, 0, 8, 1, 'rgba(0,0,0,.2)');
  const c = '#4a3a5a', d = '#2e2240';
  if (up) { R(-12, cy - 7, 8, 3, d); R(-12, cy - 4, 2, 2, d); R(4, cy - 7, 8, 3, d); R(10, cy - 4, 2, 2, d); }
  else { R(-12, cy, 8, 3, d); R(-13, cy + 3, 2, 2, d); R(4, cy, 8, 3, d); R(11, cy + 3, 2, 2, d); }
  R(-4, cy - 4, 8, 7, c); R(-4, cy - 6, 2, 2, c); R(2, cy - 6, 2, 2, c);
  R(-3, cy - 2, 1, 1, '#ff5050'); R(0, cy - 2, 1, 1, '#ff5050'); R(-2, cy + 1, 1, 1, '#ffffff');
}
function escorpiao(m, t) {
  const c = '#c0803a', d = '#8a5a2a';
  const stab = m.lunge >= 0 ? Math.sin(m.lunge * Math.PI) * 4 : 0;
  const lg = m.state === 'walk' ? Math.floor(t * 12) % 2 : 0;
  if (!FL) R(-9, 0, 18, 1, 'rgba(0,0,0,.35)');
  for (let i = 0; i < 4; i++) R(-5 + i * 3, -2 + ((i + lg) % 2), 1, 2, d);
  R(-6, -6, 13, 4, c); R(-6, -6, 13, 1, shade(c, 0.25));
  R(-11, -8, 5, 3, c); R(-13, -10, 3, 2, d); R(-13, -7, 3, 2, d);
  R(-5, -7, 1, 1, '#1a1a1a'); R(-3, -7, 1, 1, '#1a1a1a');
  R(6, -9, 3, 3, c); R(8, -13, 3, 4, c); R(6 - stab, -17, 3, 3, c); R(3 - stab * 1.5, -17, 3, 2, '#e04040');
}
function mumia(m, t) {
  const step = m.state === 'walk' ? Math.floor(t * 5 + m.seed) % 2 : 0;
  const c = '#d8ccb0', d = '#a89a7a';
  if (!FL) R(-6, 0, 12, 1, 'rgba(0,0,0,.35)');
  R(-4, -9, 4, 9 - step, c); R(1, -9, 4, 9 - (1 - step), d);
  R(-5, -18, 10, 9, c); R(-5, -27, 10, 9, c);
  for (let yy = -26; yy < -9; yy += 3) R(-5, yy, 10, 1, d);
  R(-4, -23, 2, 1, '#ffe04a'); R(-1, -23, 2, 1, '#ffe04a');
  const reach = m.lunge >= 0 ? Math.sin(m.lunge * Math.PI) * 3 : 0;
  R(-12 - reach, -17, 8 + reach, 3, c); R(-12 - reach, -14, 1, 4, d); R(4, -14, 1, 5, d);
  if (m.pharaoh) {
    R(-6, -30, 12, 4, '#f2c14e'); R(-6, -26, 3, 9, '#f2c14e'); R(4, -26, 3, 9, '#f2c14e');
    for (let yy = -26; yy < -17; yy += 2) { R(-6, yy, 3, 1, '#2f6fa8'); R(4, yy, 3, 1, '#2f6fa8'); }
    R(-1, -32, 2, 2, '#e04040');
    R(-15, -28, 2, 28, '#9b6f1e'); R(-16, -31, 4, 4, '#58d4ff');
  }
}
function abutre(m, t) {
  const cy = -28 + Math.sin(t * 3 + m.seed) * 3;
  const up = Math.sin(t * 10 + m.seed) > 0;
  if (!FL) R(-5, 0, 10, 1, 'rgba(0,0,0,.2)');
  const c = '#5a4030', d = '#3e2c20';
  if (up) R(-3, cy - 10, 11, 5, d); else R(-3, cy + 1, 11, 5, d);
  R(-4, cy - 3, 10, 6, c); R(6, cy - 1, 4, 2, d);
  R(-5, cy - 4, 3, 3, '#e8e0d0'); R(-8, cy - 7, 4, 4, '#d89a8a'); R(-10, cy - 6, 2, 2, '#e8c060');
  R(-7, cy - 6, 1, 1, '#1a1a1a');
  R(-1, cy + 3, 1, 3, '#e8c060'); R(2, cy + 3, 1, 3, '#e8c060');
}
function verme(m, t) {
  const c = '#b08050', d = '#8a5e36';
  if (m.under) {
    const j = Math.floor(t * 10) % 2;
    R(-7, -2 - j, 14, 2 + j, '#c9a060'); R(-4, -4, 8, 2, '#b8904e');
    return;
  }
  const e = Math.min(1, m.emerge ?? 1);
  const sway = Math.round(Math.sin(t * 4 + m.seed) * 2);
  const n = 6, top = -n * 4 * e;
  for (let i = 0; i < n; i++) {
    const yy = -4 - i * 4 * e; if (yy < top - 1) break;
    const sw = Math.round(sway * i / n);
    R(-4 + sw, yy, 8, 4, i % 2 ? c : d); R(-4 + sw, yy, 2, 4, shade(c, 0.2));
  }
  const hx = -4 + sway;
  R(hx - 2, top - 4, 10, 5, d); R(hx - 3, top - 3, 3, 3, '#3a1a10'); R(hx - 3, top - 3, 1, 1, '#ffffff'); R(hx - 3, top - 1, 1, 1, '#ffffff');
  R(-8, -1, 16, 1, '#c9a060');
}
const DRAW = { slime, coelho, zumbi, morcego, escorpiao, mumia, abutre, verme };
export function drawMonster(m, t) { (DRAW[m.base] || slime)(m, t); }

// ---------------- Cenários ----------------
function layer(fn) { const c = document.createElement('canvas'); c.width = W; c.height = H; fn(c.getContext('2d')); return c; }
function bands(g, cols, size) { cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * size, W, size); }); g.fillStyle = cols[cols.length - 1]; g.fillRect(0, cols.length * size, W, H); }
function disc(g, cx, cy, r, c) { g.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const h = Math.floor(Math.sqrt(r * r - dy * dy)); g.fillRect(cx - h, cy + dy, h * 2, 1); } }

function forest() {
  return {
    sky: layer(g => {
      bands(g, ['#121838', '#172048', '#1d2958', '#24336a', '#2e407c', '#3a4f8c'], 16);
      for (let i = 0; i < 60; i++) { g.fillStyle = rnd(i + 3) > .8 ? '#ffffff' : '#9aa6e0'; g.fillRect(Math.floor(rnd(i) * W), Math.floor(rnd(i + 100) * 80), 1, 1); }
      disc(g, 262, 24, 8, '#f4eed2'); g.fillStyle = '#d8d0ac'; g.fillRect(258, 20, 3, 3); g.fillRect(265, 27, 2, 2);
    }),
    far: layer(g => { for (let x = 0; x < W; x += 2) { const h = 34 + 12 * Math.sin(TAU * x / W * 2) + 8 * Math.sin(TAU * x / W * 5 + 1) + 4 * Math.sin(TAU * x / W * 11 + 2); const y = Math.round((112 - h) / 2) * 2; g.fillStyle = '#2a3570'; g.fillRect(x, y, 2, H - y); g.fillStyle = '#3a4a8a'; g.fillRect(x, y, 2, 2); } }),
    mid: layer(g => {
      for (let x = 0; x < W; x += 2) { const y = Math.round((100 + 5 * Math.sin(TAU * x / W * 3)) / 2) * 2; g.fillStyle = '#1c284e'; g.fillRect(x, y, 2, H - y); }
      for (let i = 0; i < 10; i++) {
        const tx = i * 32 + Math.floor(rnd(i + 7) * 14), th = 18 + Math.floor(rnd(i + 9) * 14), base = 106;
        g.fillStyle = '#2a2036'; g.fillRect(tx, base - th, 3, th);
        disc(g, tx + 1, base - th - 4, 7, i % 2 ? '#1e3d4a' : '#234756');
        g.fillStyle = '#2c5868'; g.fillRect(tx - 3, base - th - 9, 3, 2);
      }
    }),
    ground: layer(g => {
      g.fillStyle = '#7a4e2e'; g.fillRect(0, GY, W, H - GY);
      for (let x = 0; x < W; x += 2) for (let y = GY + 5; y < H; y += 2) { const r = rnd(x * 7 + y * 13); if (r > .86) { g.fillStyle = '#5e3a22'; g.fillRect(x, y, 2, 2); } else if (r < .025) { g.fillStyle = '#8f8f9a'; g.fillRect(x, y, 2, 2); } }
      g.fillStyle = '#6cc04a'; g.fillRect(0, GY, W, 4);
      for (let x = 0; x < W; x += 2) { if (rnd(x) > .5) { g.fillStyle = '#4f9a3a'; g.fillRect(x, GY + 3, 2, 2); } if (rnd(x + 999) > .8) { g.fillStyle = '#8fdc66'; g.fillRect(x, GY - 2, 1, 2); } }
    }),
    fly: '#e8ff9a'
  };
}
function desert() {
  return {
    sky: layer(g => {
      bands(g, ['#2a1f4a', '#3f2756', '#5e305c', '#8a3f58', '#b85a4a', '#d8804a', '#e8a060'], 14);
      disc(g, 70, 82, 16, '#ffd27a'); disc(g, 70, 82, 12, '#ffe6a6');
      for (let i = 0; i < 25; i++) { g.fillStyle = '#e8c8f0'; g.fillRect(Math.floor(rnd(i + 50) * W), Math.floor(rnd(i + 150) * 40), 1, 1); }
    }),
    far: layer(g => { for (let x = 0; x < W; x += 2) { const h = 22 + 8 * Math.sin(TAU * x / W * 2 + 0.5) + 5 * Math.sin(TAU * x / W * 5); const y = Math.round((112 - h) / 2) * 2; g.fillStyle = '#8a4e40'; g.fillRect(x, y, 2, H - y); g.fillStyle = '#a8624a'; g.fillRect(x, y, 2, 2); }
      g.fillStyle = '#6e3c34'; for (let s = 0; s < 3; s++) { const px = 40 + s * 110; for (let r = 0; r < 18; r++) g.fillRect(px - r, 72 + r, r * 2 + 1, 1); } }),
    mid: layer(g => {
      for (let x = 0; x < W; x += 2) { const y = Math.round((104 + 4 * Math.sin(TAU * x / W * 3 + 1)) / 2) * 2; g.fillStyle = '#b8784a'; g.fillRect(x, y, 2, H - y); g.fillStyle = '#cc8c58'; g.fillRect(x, y, 2, 1); }
      for (let i = 0; i < 6; i++) {
        const cx = i * 54 + Math.floor(rnd(i + 21) * 20), ch = 12 + Math.floor(rnd(i + 31) * 10), base = 108;
        g.fillStyle = '#3e6a3a'; g.fillRect(cx, base - ch, 4, ch); g.fillRect(cx - 4, base - ch + 4, 3, 2); g.fillRect(cx - 4, base - ch + 1, 2, 4); g.fillRect(cx + 5, base - ch + 6, 3, 2); g.fillRect(cx + 6, base - ch + 2, 2, 5);
        g.fillStyle = '#5a8a4e'; g.fillRect(cx + 1, base - ch, 1, ch);
      }
    }),
    ground: layer(g => {
      g.fillStyle = '#d8b070'; g.fillRect(0, GY, W, H - GY);
      for (let x = 0; x < W; x += 2) for (let y = GY + 3; y < H; y += 2) { const r = rnd(x * 5 + y * 17); if (r > .85) { g.fillStyle = '#b8904e'; g.fillRect(x, y, 2, 1); } else if (r < .02) { g.fillStyle = '#e8d0a0'; g.fillRect(x, y, 2, 2); } }
      g.fillStyle = '#ecc98a'; g.fillRect(0, GY, W, 3);
      for (let x = 0; x < W; x += 4) if (rnd(x + 77) > .7) { g.fillStyle = '#c8a060'; g.fillRect(x, GY + 2, 3, 1); }
    }),
    fly: '#ffe6a6'
  };
}
let CACHE = null;
export function scenery(id) {
  if (!CACHE) CACHE = { floresta: forest(), deserto: desert() };
  return CACHE[id] || CACHE.floresta;
}

// ---------------- Baú ----------------
export function drawChest(x, y, open, t) {
  if (open) {
    ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(t * 6) * 0.08; ctx.fillStyle = '#ffe08a';
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(x, y - 12); ctx.rotate(t * 0.6 + i * TAU / 6); ctx.fillRect(-1, -34, 3, 30); ctx.restore(); }
    ctx.restore();
    R(x - 9, y - 20, 18, 4, '#a06a32'); R(x - 9, y - 20, 18, 1, '#f2c14e');
  }
  R(x - 9, y - 11, 18, 11, '#8a5a2a'); R(x - 9, y - 11, 18, 1, '#f2c14e'); R(x - 9, y - 6, 18, 1, '#6a4420');
  R(x - 9, y - 11, 1, 11, '#f2c14e'); R(x + 8, y - 11, 1, 11, '#f2c14e');
  if (!open) { R(x - 9, y - 15, 18, 4, '#a06a32'); R(x - 9, y - 15, 18, 1, '#c08040'); R(x - 1, y - 13, 3, 4, '#f2c14e'); R(x, y - 12, 1, 1, '#6a4420'); }
  else R(x - 7, y - 11, 14, 2, '#ffe08a');
}
export function drawItemIcon(x, y, item, kind) {
  if (kind === 'weapon') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4);
    R(-1, -2, 2, 5, '#5a3a20'); R(-3, -3, 7, 2, item.guard); R(-1, -3 - item.len, 3, item.len, item.blade); R(0, -3 - item.len, 1, item.len, item.edge);
    ctx.restore();
  } else {
    R(x - 6, y - 8, 12, 9, item.main); R(x - 6, y - 8, 12, 2, shade(item.main, 0.3)); R(x + 3, y - 6, 3, 7, item.dark);
    R(x - 5, y - 15, 10, 6, item.helm); R(x - 5, y - 15, 10, 1, shade(item.helm, 0.3));
  }
}

// ---------------- Fogueira ----------------
export function drawCampfire(x, y, t) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 70);
  g.addColorStop(0, 'rgba(255,170,80,.35)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 80, y - 80, 160, 100);
  ctx.restore();
  R(x - 8, y - 3, 16, 3, '#6a4420'); R(x - 7, y - 4, 4, 2, '#8a5a2a'); R(x + 3, y - 4, 4, 2, '#8a5a2a');
  R(x - 10, y - 1, 4, 2, '#7a7a86'); R(x + 6, y - 1, 4, 2, '#7a7a86');
  const f = i => Math.floor(rnd(Math.floor(t * 10) * 7 + i) * 3);
  R(x - 5, y - 8 - f(1), 10, 5 + f(1), '#e8502a');
  R(x - 3, y - 12 - f(2), 6, 6 + f(2), '#f08a2a');
  R(x - 2, y - 15 - f(3), 4, 6, '#ffd04a');
  R(x - 1, y - 17 - f(4), 2, 3, '#fff0a0');
}
