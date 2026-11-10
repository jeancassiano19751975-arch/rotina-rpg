// Desenho em pixel art (retângulos) do herói, monstros, cenários, baú e fogueira.
export const W = 320, H = 150, GY = 124;
const TAU = Math.PI * 2;

let ctx = null;
let FL = 0; // 0 normal · 1 branco (tomou dano) · 2 vermelho (preparando golpe forte)
let BUF = false; // desenhando num sprite (contorno e sombra são aplicados depois)
export const setCtx = c => { ctx = c; };
export const setFlash = f => { FL = f; };
export const setBuf = b => { BUF = b; };
export function R(x, y, w, h, c) {
  if (!c) return;                                // cor vazia (ex.: roupa de viajante): não desenha nada
  if (BUF && c.charCodeAt(0) === 114) return; // 'rgba(...)': sombra no chão fica fora do sprite
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
// o: { x, y, dx, dy, walk, step, ang, ext, swing, weapon, shield, helm, chest, legs, helmTier, chestTier, legsTier,
//      shieldFwd, skin, hair, cloth, cape, goldGlow, time }
function drawHelm(x, by, A, tier) {
  if (!tier) return;
  const m = A.main, d = A.dark, l = A.light;
  if (tier === 'farao') {                   // nemes do faraó: listras douradas e azuis caindo nos ombros
    R(x - 6, by - 33, 12, 5, m); R(x - 5, by - 33, 9, 1, l);
    for (let i = 0; i < 3; i++) R(x - 6, by - 31 + i * 2, 12, 1, d);
    R(x - 8, by - 28, 4, 9, m); R(x - 8, by - 26, 4, 1, d); R(x - 8, by - 23, 4, 1, d); R(x - 8, by - 20, 4, 1, d);
    R(x + 4, by - 28, 2, 5, m); R(x + 4, by - 26, 2, 1, d);
    R(x, by - 36, 2, 3, m); R(x, by - 37, 2, 1, '#58d4ff');
    return;
  }
  if (tier === 'gelo') {                    // coroa de cristais de gelo
    R(x - 6, by - 32, 12, 2, m); R(x - 6, by - 32, 12, 1, l);
    for (const [ox, h] of [[-6, 4], [-3, 6], [0, 8], [3, 6]]) { R(x + ox, by - 32 - h, 2, h, m); R(x + ox, by - 32 - h, 1, h, l); }
    R(x + 5, by - 35, 1, 3, m); R(x, by - 31, 2, 1, d); R(x - 4, by - 31, 1, 1, '#58d4ff');
    return;
  }
  if (tier === 'natal') {                   // gorro com pompom caindo pro lado
    R(x - 6, by - 33, 12, 4, m); R(x - 5, by - 33, 6, 1, shade(m, 0.25));
    R(x - 4, by - 36, 8, 3, m); R(x - 7, by - 37, 6, 2, m); R(x - 9, by - 36, 3, 3, '#ffffff'); R(x - 8, by - 37, 1, 1, '#ffffff');
    R(x - 7, by - 30, 14, 3, '#ffffff'); R(x - 7, by - 28, 14, 1, '#d8e4f0');
    return;
  }
  if (tier === 1) {                         // gorro de couro
    R(x - 6, by - 32, 12, 4, m); R(x - 6, by - 32, 12, 1, l); R(x - 6, by - 28, 13, 1, d); R(x - 6, by - 28, 3, 5, m);
    return;
  }
  // elmos de metal
  R(x - 6, by - 33, 12, 6, m); R(x - 5, by - 33, 8, 1, l); R(x - 4, by - 32, 2, 2, l);
  R(x - 6, by - 27, 4, 7, d); R(x - 6, by - 27, 1, 7, m);
  if (tier === 2) { R(x + 4, by - 27, 1, 4, d); R(x + 3, by - 27, 3, 1, d); }
  if (tier >= 3) { R(x + 1, by - 27, 5, 6, m); R(x + 1, by - 25, 5, 1, '#14141c'); R(x + 1, by - 23, 5, 1, d); R(x - 1, by - 30, 1, 1, l); R(x + 3, by - 30, 1, 1, l); }
  if (tier === 4) { R(x - 2, by - 37, 5, 4, '#d8402e'); R(x - 3, by - 36, 2, 3, '#a82c22'); R(x - 1, by - 37, 3, 1, '#ff7a5a'); }
  if (tier >= 5) { R(x - 8, by - 37, 2, 5, l); R(x - 9, by - 39, 2, 3, l); R(x + 5, by - 37, 2, 5, l); R(x + 6, by - 39, 2, 3, l); R(x, by - 31, 2, 2, '#58d4ff'); }
}
function drawShield(x, y, Sh, fwd) {
  const sx = fwd ? x + 4 : x - 10, sy = fwd ? y - 22 : y - 20;
  R(sx, sy, 7, 11, Sh.rim); R(sx + 1, sy + 1, 5, 9, Sh.main); R(sx + 1, sy + 10, 5, 1, Sh.rim);
  R(sx + 2, sy + 11, 3, 1, Sh.rim); R(sx + 1, sy + 1, 1, 7, shade(Sh.main, 0.25));
  R(sx + 3, sy + 3, 1, 1, Sh.emb); R(sx + 2, sy + 4, 3, 2, Sh.emb); R(sx + 3, sy + 6, 1, 1, Sh.emb);
}
export function drawHero(o) {
  const x = Math.round(o.x + (o.dx || 0)), y = Math.round(o.y + (o.dy || 0));
  const C = o.chest, L = o.legs, Wp = o.weapon;
  const tMain = C.main || o.cloth, tDark = C.dark || shade(o.cloth, -0.32), tLight = C.light || shade(o.cloth, 0.22);
  const lMain = L.main || '#5a4632', lDark = L.dark || '#3e3022', lLight = L.light || '#7a6248';
  const bootM = L.main ? L.main : '#4a3624', bootD = L.main ? L.dark : '#2e2018';
  const skin = o.skin, skinD = shade(skin, -0.2), hair = o.hair, hairD = shade(hair, -0.38), hairL = shade(hair, 0.28);
  const air = (o.dy || 0) < -1;
  const ls = o.walk && o.step ? 1 : 0, rs = o.walk && !o.step ? 1 : 0;
  const by = y + (o.walk && o.step ? -1 : 0);

  if (o.cape) {                             // capa esvoaçando atrás do herói
    const K = o.cape === true ? { a: '#b82c26', b: '#8a1e1a', c: '#e04a40' } : o.cape;
    const t = o.time || 0, wv = Math.sin(t * 6), wv2 = Math.sin(t * 6 - 1.2);
    for (let r = 0; r <= 18; r++) {               // capa em leque: larga embaixo, balança com o vento
      const k = r / 18, l = Math.round(x - 6 - r * 0.62 - (r > 6 ? (k * k) * (2 + wv * 2) : 0) - (r > 14 ? wv2 : 0)), yy = by - 21 + r;
      const rr = x - 2;
      R(l, yy, rr - l, 1, r === 18 ? K.b : K.a); R(l, yy, 1, 1, K.b);
      if (r > 3 && r % 5 === 0) R(l + 2, yy, Math.max(1, (rr - l) - 6), 1, K.b);
      if (r < 2) R(l + 1, yy, rr - l - 2, 1, K.c);
    }
    if (K.sparkle && Math.floor(t * 5) % 3 === 0) R(x - 13 - Math.round(wv), by - 8 + Math.floor(t * 7) % 5, 1, 1, '#ffffff');
  }
  // pernas (a de trás mais escura) e botas
  if (air) { R(x - 5, y - 9, 4, 6, lDark); R(x + 1, y - 10, 4, 5, lMain); R(x - 6, y - 4, 5, 3, bootD); R(x + 2, y - 6, 5, 3, bootM); }
  else {
    R(x - 5, y - 10 - ls, 4, 7, lDark); R(x + 1, y - 10 - rs, 4, 7, lMain); R(x + 1, y - 10 - rs, 1, 6, lLight);
    if (L.main) { R(x + 1, y - 7 - rs, 4, 1, lLight); R(x - 5, y - 7 - ls, 4, 1, lMain); }
    R(x - 5, y - 3 - ls, 4, 3, bootD); R(x + 1, y - 3 - rs, 5, 3, bootM); R(x + 4, y - 3 - rs, 2, 1, shade(bootM, 0.3));
  }
  // braço de trás
  R(x - 7, by - 18, 2, 7, tDark); R(x - 7, by - 11, 2, 2, skinD);
  // tronco
  R(x - 5, by - 19, 10, 8, tMain); R(x + 3, by - 19, 2, 8, tDark); R(x - 4, by - 18, 1, 6, tLight);
  if (C.main) {
    R(x - 5, by - 15, 10, 1, tDark); R(x - 1, by - 18, 2, 3, tLight); R(x - 3, by - 14, 1, 2, tLight);
    R(x - 9, by - 21, 5, 4, tMain); R(x - 9, by - 21, 5, 1, tLight); R(x - 9, by - 18, 5, 1, tDark);
  } else { R(x - 2, by - 19, 4, 1, tDark); R(x + 1, by - 17, 1, 4, tDark); }
  R(x - 5, by - 11, 10, 1, '#3a2a1e'); R(x, by - 11, 2, 1, '#e8c060'); R(x - 5, by - 11, 2, 3, '#6a4a2a');
  // cabeça
  R(x - 5, by - 29, 10, 10, skin); R(x - 4, by - 20, 9, 1, skinD); R(x - 2, by - 25, 2, 3, skinD);
  R(x - 5, by - 31, 10, 3, hair); R(x - 6, by - 30, 3, 8, hair); R(x - 4, by - 31, 6, 1, hairL); R(x - 1, by - 30, 3, 1, hairL);
  R(x - 6, by - 25, 2, 3, hairD); R(x - 6, by - 23, 1, 2, hairD); R(x + 2, by - 28, 3, 1, hair); R(x + 4, by - 27, 1, 1, hair);
  R(x + 1, by - 25, 3, 2, '#ffffff'); R(x + 3, by - 25, 1, 2, '#1a2a4a'); R(x + 1, by - 27, 3, 1, hairD);
  R(x + 5, by - 24, 1, 2, skinD); R(x + 2, by - 21, 2, 1, '#a8604a');
  drawHelm(x, by, o.helm, o.helmTier);
  // escudo no braço de trás (ou levantado na frente)
  if (o.shield && !o.shieldFwd) drawShield(x, by, o.shield, false);
  // braço da frente + arma
  const sx = x + 2, sy = by - 17, Lg = Wp.len;
  ctx.save(); ctx.translate(sx + (o.ext || 0), sy); ctx.rotate(o.ang);
  R(-1, -7, 3, 7, tMain); R(-1, -9, 3, 2, skin);
  R(-3, -10, 7, 2, Wp.guard); R(-3, -10, 7, 1, shade(Wp.guard, 0.3)); R(0, -8, 1, 1, '#e8c060');
  R(-1, -10 - Lg, 3, Lg, Wp.blade); R(0, -10 - Lg, 1, Lg, Wp.edge); R(0, -11 - Lg, 1, 1, Wp.edge);
  R(1, -9 - Lg, 1, Lg - 2, shade(Wp.blade, -0.25));
  if (Wp.glow || o.goldGlow) { const gc = Wp.glowC || (o.goldGlow ? '#ffe08a' : Wp.edge); R(-2, -9 - Lg, 1, Lg - 2, gc); R(2, -9 - Lg, 1, Lg - 2, gc); }
  ctx.restore();
  if (o.shield && o.shieldFwd) drawShield(x, by, o.shield, true);
}

// Herói deitado (dia de descanso).
export function drawHeroLying(o) {
  const C = o.chest, L = o.legs, main = C.main || o.cloth, legs = L.main || '#5a4632', skin = o.skin, hair = o.hair;
  const b = Math.sin(o.time * 1.6) > 0 ? 1 : 0;
  const x = o.x, y = o.y;
  R(x - 2, y - 6, 12, 5, legs); R(x - 2, y - 6, 12, 1, shade(legs, 0.2)); R(x + 10, y - 6, 3, 5, L.main ? L.dark : '#3a2a1e');
  R(x - 10, y - 7 - b, 9, 6 + b, main); R(x - 9, y - 7 - b, 7, 1, shade(main, 0.25));
  R(x - 20, y - 8, 10, 8, skin); R(x - 21, y - 8, 4, 8, hair); R(x - 20, y - 9, 10, 2, hair); R(x - 19, y - 9, 6, 1, shade(hair, 0.28));
  R(x - 13, y - 6, 2, 1, '#7a4a3a');
  R(x - 25, y - 2, 8, 2, '#6a4a8a'); R(x - 25, y - 2, 8, 1, '#8a6aaa');
}

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
// ---- cenários extras ----
function ridge(g, base, amps, col, rim, step = 2) {
  for (let x = 0; x < W; x += step) {
    let h = 0; amps.forEach(([a, f, ph]) => { h += a * Math.sin(TAU * x / W * f + ph); });
    const y = Math.round((base - h) / 2) * 2;
    g.fillStyle = col; g.fillRect(x, y, step, H - y);
    if (rim) { g.fillStyle = rim; g.fillRect(x, y, step, 2); }
  }
}
function stars(g, n, top, c1, c2) { for (let i = 0; i < n; i++) { g.fillStyle = rnd(i + 3) > .8 ? c1 : c2; g.fillRect(Math.floor(rnd(i) * W), Math.floor(rnd(i + 100) * top), 1, 1); } }
function groundLayer(base, top, top2, speck, speck2, deco) {
  return layer(g => {
    g.fillStyle = base; g.fillRect(0, GY, W, H - GY);
    for (let x = 0; x < W; x += 2) for (let y = GY + 4; y < H; y += 2) { const r = rnd(x * 7 + y * 13); if (r > .86) { g.fillStyle = speck; g.fillRect(x, y, 2, 2); } else if (r < .03) { g.fillStyle = speck2; g.fillRect(x, y, 2, 2); } }
    g.fillStyle = top; g.fillRect(0, GY, W, 3);
    for (let x = 0; x < W; x += 2) if (rnd(x + 5) > .55) { g.fillStyle = top2; g.fillRect(x, GY + 2, 2, 2); }
    if (deco) deco(g);
  });
}
function snow() {
  return {
    sky: layer(g => { bands(g, ['#16223e', '#1c2c4e', '#24385e', '#2e4670', '#3a5682', '#486894'], 16); stars(g, 50, 70, '#ffffff', '#a8c0e8');
      g.fillStyle = 'rgba(120,255,200,.10)'; for (let x = 0; x < W; x += 2) { const y = 30 + Math.sin(x / 30) * 8; g.fillRect(x, y, 2, 14 + Math.sin(x / 17) * 4); } }),
    far: layer(g => { ridge(g, 108, [[16, 2, 0], [8, 5, 1], [4, 11, 2]], '#6a80aa', '#e8f0ff'); }),
    mid: layer(g => { ridge(g, 102, [[4, 3, 1]], '#3a5470');
      for (let i = 0; i < 12; i++) { const tx = i * 27 + Math.floor(rnd(i + 7) * 12), th = 16 + Math.floor(rnd(i + 9) * 12), b = 106;
        g.fillStyle = '#2a3a2a'; g.fillRect(tx, b - 4, 2, 4);
        for (let r = 0; r < th; r++) { const w = Math.floor((th - r) / 2.2) + 1; g.fillStyle = r % 4 === 0 ? '#e8f0ff' : '#24443e'; g.fillRect(tx + 1 - w, b - 4 - r, w * 2, 1); } } }),
    ground: groundLayer('#c8d8e8', '#ffffff', '#e0eaf4', '#a8bcd0', '#8aa4c0'),
    fly: '#ffffff'
  };
}
function cave() {
  return {
    sky: layer(g => { bands(g, ['#100e18', '#15121e', '#1a1724', '#201c2c', '#262234', '#2c283c'], 18);
      for (let i = 0; i < 20; i++) { const x = Math.floor(rnd(i + 30) * W), h = 6 + Math.floor(rnd(i + 31) * 22); for (let r = 0; r < h; r++) { const w = Math.max(1, Math.floor((h - r) / 4)); g.fillStyle = r % 5 === 0 ? '#3a3448' : '#2a2636'; g.fillRect(x - w, r, w * 2, 1); } } }),
    far: layer(g => { ridge(g, 112, [[10, 3, 0], [6, 7, 2]], '#2e2a3c', '#3e3a50'); }),
    mid: layer(g => { ridge(g, 106, [[3, 4, 2]], '#24202e');
      for (let i = 0; i < 9; i++) { const cx = i * 36 + Math.floor(rnd(i + 11) * 18), ch = 6 + Math.floor(rnd(i + 12) * 10), c = i % 2 ? '#58d4ff' : '#b493ff';
        g.fillStyle = c; for (let r = 0; r < ch; r++) { const w = Math.max(1, Math.floor((ch - r) / 3)); g.fillRect(cx - w, 108 - r, w * 2, 1); }
        g.fillStyle = '#ffffff'; g.fillRect(cx - 1, 104 - Math.floor(ch / 2), 1, 2);
        g.fillStyle = 'rgba(180,147,255,.12)'; g.fillRect(cx - 8, 96 - ch, 16, ch + 12); } }),
    ground: groundLayer('#3e3a4c', '#5a5468', '#4a4458', '#2e2a3a', '#7a7488'),
    fly: '#7af0c0'
  };
}
function swamp() {
  return {
    sky: layer(g => { bands(g, ['#14201c', '#1a2822', '#203028', '#28382e', '#304034', '#3a4a3a'], 16); disc(g, 250, 34, 9, '#c8d8a0'); disc(g, 250, 34, 7, '#dce8b8');
      g.fillStyle = 'rgba(200,220,180,.08)'; g.fillRect(0, 70, W, 30); }),
    far: layer(g => { ridge(g, 110, [[5, 3, 0], [3, 7, 1]], '#24342a');
      for (let i = 0; i < 7; i++) { const tx = i * 46 + 10; g.fillStyle = '#1e2c22'; g.fillRect(tx, 70, 3, 40); g.fillRect(tx - 6, 80, 7, 2); g.fillRect(tx + 3, 76, 7, 2); g.fillRect(tx - 6, 76, 2, 5); g.fillRect(tx + 9, 72, 2, 5); } }),
    mid: layer(g => { ridge(g, 104, [[3, 3, 1]], '#2a3e2c');
      for (let i = 0; i < 8; i++) { const tx = i * 40 + Math.floor(rnd(i + 14) * 16); g.fillStyle = '#2a2018'; g.fillRect(tx, 80, 3, 26);
        disc(g, tx + 1, 78, 9, '#2e4a30'); g.fillStyle = '#3a5a3a'; for (let k = -8; k < 9; k += 3) g.fillRect(tx + k, 80, 1, 10 + Math.floor(rnd(k + i) * 8)); }
      g.fillStyle = '#4a6a3a'; for (let x = 0; x < W; x += 5) if (rnd(x + 3) > .5) g.fillRect(x, 100 - Math.floor(rnd(x) * 8), 1, 8); }),
    ground: groundLayer('#3e3a24', '#5a7a3a', '#4a6a30', '#2e2a1a', '#5a5a3a', g => { g.fillStyle = '#3a5a5a'; for (let x = 10; x < W; x += 70) g.fillRect(x, GY + 6, 22, 3); g.fillStyle = '#6a9a9a'; for (let x = 12; x < W; x += 70) g.fillRect(x, GY + 6, 8, 1); }),
    fly: '#c8ff6a'
  };
}
function castle() {
  return {
    sky: layer(g => { bands(g, ['#100818', '#160c22', '#1e102c', '#261436', '#2e1a40', '#38204a'], 16); stars(g, 40, 60, '#ffd8f0', '#8a6aaa');
      disc(g, 70, 36, 14, '#c8304a'); disc(g, 70, 36, 11, '#e0485a'); g.fillStyle = '#a8203a'; g.fillRect(64, 30, 4, 3); g.fillRect(74, 40, 3, 2); }),
    far: layer(g => { ridge(g, 112, [[4, 2, 0]], '#1a1024');
      const tw = [[150, 46, 10], [175, 62, 14], [205, 40, 9], [230, 54, 12], [262, 34, 8]];
      tw.forEach(([x, h, w]) => { g.fillStyle = '#1a1024'; g.fillRect(x, 100 - h, w, h + 12); for (let k = 0; k < w; k += 3) g.fillRect(x + k, 98 - h, 2, 2);
        g.fillStyle = '#ffd04a'; g.fillRect(x + Math.floor(w / 2) - 1, 104 - h + 10, 2, 3); });
      g.fillStyle = '#1a1024'; g.fillRect(150, 80, 125, 30); g.fillStyle = '#ffd04a'; g.fillRect(190, 90, 2, 3); g.fillRect(240, 88, 2, 3); }),
    mid: layer(g => { ridge(g, 106, [[3, 3, 1]], '#24182e');
      for (let i = 0; i < 9; i++) { const x = i * 36 + Math.floor(rnd(i + 21) * 14);
        if (i % 3 === 0) { g.fillStyle = '#1e1426'; g.fillRect(x, 80, 2, 26); g.fillRect(x - 5, 86, 6, 1); g.fillRect(x + 2, 83, 6, 1); g.fillRect(x - 5, 82, 1, 4); g.fillRect(x + 7, 79, 1, 4); }
        else { g.fillStyle = '#4a4058'; g.fillRect(x, 98, 7, 10); g.fillRect(x + 1, 96, 5, 2); g.fillStyle = '#6a6078'; g.fillRect(x + 1, 97, 5, 1); g.fillStyle = '#2a2236'; g.fillRect(x + 3, 100, 1, 4); g.fillRect(x + 2, 101, 3, 1); } } }),
    ground: groundLayer('#2e2636', '#4a4054', '#3a3244', '#221c28', '#5a5066', g => { g.fillStyle = '#3e3448'; for (let x = 0; x < W; x += 16) g.fillRect(x, GY + 3, 1, 4); }),
    fly: '#c0a0ff'
  };
}
function inferno() {
  return {
    sky: layer(g => { bands(g, ['#180504', '#260806', '#360c08', '#46120a', '#581a0c', '#6a240e'], 16);
      g.fillStyle = 'rgba(255,120,40,.12)'; g.fillRect(0, 70, W, 40); }),
    far: layer(g => { ridge(g, 110, [[14, 2, 1], [7, 5, 0]], '#2a0c08', '#5a1a0c');
      [[60, 62], [220, 56]].forEach(([vx, vy]) => { g.fillStyle = '#ff6a1a'; g.fillRect(vx - 3, vy, 6, 2); 
        g.fillStyle = '#ff8a2a'; for (let r = 0; r < 30; r++) g.fillRect(vx - 1 + Math.round(Math.sin(r / 3) * 2), vy + 2 + r, 2, 1); }); }),
    mid: layer(g => { ridge(g, 104, [[4, 3, 2]], '#1e0806');
      for (let i = 0; i < 9; i++) { const x = i * 36 + Math.floor(rnd(i + 41) * 14), h = 10 + Math.floor(rnd(i + 42) * 18);
        for (let r = 0; r < h; r++) { const w = Math.max(1, Math.floor((h - r) / 3)); g.fillStyle = r % 4 === 0 ? '#3a120a' : '#2a0a06'; g.fillRect(x - w, 106 - r, w * 2, 1); } } }),
    ground: groundLayer('#2a1814', '#4a2418', '#3a1c14', '#1a0e0a', '#5a3020', g => {
      for (let x = 0; x < W; x += 2) if (rnd(x + 91) > .85) { g.fillStyle = '#ff8a2a'; g.fillRect(x, GY + 4 + Math.floor(rnd(x) * 18), 2 + Math.floor(rnd(x + 1) * 6), 1); }
      g.fillStyle = '#ff6a1a'; g.fillRect(0, GY, W, 1); }),
    fly: '#ffb04a'
  };
}
let CACHE = null;
export function scenery(id) {
  if (!CACHE) CACHE = {};
  if (!CACHE[id]) {
    const make = { floresta: forest, deserto: desert, neve: snow, caverna: cave, pantano: swamp, castelo: castle, inferno: inferno }[id] || forest;
    CACHE[id] = make();
  }
  return CACHE[id];
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
function drawPotion(x, y, c) {
  R(x - 1, y - 16, 3, 2, '#9a6436'); R(x - 1, y - 14, 3, 2, '#d8e4f0');
  R(x - 4, y - 12, 9, 11, '#d8e4f0'); R(x - 3, y - 9, 7, 7, c); R(x - 3, y - 9, 7, 1, shade(c, 0.35));
  R(x - 3, y - 11, 1, 3, '#ffffff'); R(x - 2, y - 2, 5, 1, shade(c, -0.3));
}
function drawCapeIcon(x, y, K) {
  R(x - 5, y - 16, 10, 3, K.a); R(x - 4, y - 16, 8, 1, K.c);
  R(x - 6, y - 13, 12, 6, K.a); R(x - 7, y - 7, 14, 6, K.a); R(x - 7, y - 1, 14, 1, K.b);
  R(x - 6, y - 13, 1, 12, K.b); R(x + 5, y - 13, 1, 12, K.b); R(x - 1, y - 13, 1, 12, K.b); R(x - 3, y - 12, 1, 9, K.c);
  R(x - 1, y - 16, 2, 2, '#f2c14e');
}
export function drawItemIcon(x, y, item, kind) {
  if (kind === 'cape') { drawCapeIcon(x, y, item); return; }
  if (kind === 'potion') { drawPotion(x, y, item.c || item); return; }
  if (kind === 'surprise') {
    if (item.type === 'cape') drawCapeIcon(x, y, item.vis);
    else if (item.type === 'potion') drawPotion(x, y, item.c);
    else { for (let i = 0; i < 4; i++) { R(x - 6 + i * 3, y - 4 - i * 3, 7, 3, '#e8b33c'); R(x - 6 + i * 3, y - 4 - i * 3, 7, 1, '#fff0a0'); R(x - 6 + i * 3, y - 2 - i * 3, 7, 1, '#9b6f1e'); } }
    return;
  }
  if (kind === 'pet') {                       // ovo do pet, chacoalhando
    const w = Math.round(Math.sin(Date.now() / 90) * 1);
    for (let dy = -7; dy <= 7; dy++) { const h = Math.round(5 * Math.sqrt(1 - (dy * dy) / 56)); R(x - h + w, y - 9 + dy, h * 2 + 1, 1, dy < -2 ? '#fff4e0' : '#f0dcb8'); }
    R(x - 3 + w, y - 12, 2, 2, '#e07a5a'); R(x + 2 + w, y - 7, 3, 2, '#58a8e0'); R(x - 4 + w, y - 4, 2, 2, '#7ac05a'); R(x - 1 + w, y - 15, 2, 1, '#ffffff');
    return;
  }
  if (kind === 'weapon') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4);
    R(-1, -2, 2, 5, '#5a3a20'); R(-3, -3, 7, 2, item.guard); R(-1, -3 - item.len, 3, item.len, item.blade); R(0, -3 - item.len, 1, item.len, item.edge);
    ctx.restore();
  } else if (kind === 'shield') {
    R(x - 6, y - 16, 12, 16, item.rim); R(x - 5, y - 15, 10, 13, item.main); R(x - 3, y - 2, 6, 2, item.rim);
    R(x - 5, y - 15, 2, 11, shade(item.main, 0.3)); R(x - 1, y - 12, 2, 2, item.emb); R(x - 3, y - 10, 6, 3, item.emb); R(x - 1, y - 7, 2, 2, item.emb);
  } else if (kind === 'helm') {
    R(x - 6, y - 12, 12, 8, item.main); R(x - 5, y - 12, 8, 2, item.light); R(x - 6, y - 4, 4, 4, item.dark); R(x + 2, y - 6, 4, 6, item.main); R(x + 2, y - 4, 4, 1, '#14141c');
  } else if ((kind === 'chest' || kind === 'legs') && !item.main) {
    item = kind === 'chest' ? { main: '#3d7bd9', dark: '#2a5aa8', light: '#6a9ae8' } : { main: '#5a4632', dark: '#3e3022', light: '#7a6248' };
    drawItemIcon(x, y, item, kind);
  } else if (kind === 'chest') {
    R(x - 8, y - 12, 16, 4, item.main); R(x - 6, y - 8, 12, 8, item.main); R(x - 8, y - 12, 16, 1, item.light);
    R(x - 1, y - 8, 2, 6, item.light); R(x + 3, y - 8, 3, 8, item.dark);
  } else {
    R(x - 6, y - 14, 5, 11, item.main); R(x + 1, y - 14, 5, 11, item.main); R(x - 6, y - 14, 12, 2, item.dark);
    R(x - 7, y - 3, 6, 3, item.dark); R(x + 1, y - 3, 6, 3, item.dark); R(x - 5, y - 10, 3, 1, item.light); R(x + 2, y - 10, 3, 1, item.light);
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
