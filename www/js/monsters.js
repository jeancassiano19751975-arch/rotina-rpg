// Desenho dos monstros (origem nos pés, olhando para a esquerda, onde está o herói).
// Cada função recebe o monstro m (com m.def.pal = paleta), o tempo t e a paleta p.
import { R, shade } from './sprites.js';

const walkStep = (m, t, sp = 6) => (m.state === 'walk' ? Math.floor(t * sp + m.seed) % 2 : 0);
const lungeK = m => (m.lunge >= 0 ? Math.sin(m.lunge * Math.PI) : 0);

function slime(m, t, p) {
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 6 + m.seed)) * 6 : 0;
  const sq = m.state === 'walk' ? (hop < 1 ? 1.15 : 0.92) : 1 + Math.sin(t * 3) * 0.05;
  const w = Math.round(14 * sq), h = Math.round(10 / sq), bx = -w / 2, by = -h - hop;
  R(bx + 3, by, w - 6, 1, p.a); R(bx + 1, by + 1, w - 2, 2, p.a); R(bx, by + 3, w, h - 4, p.a);
  R(bx, by + h - 3, w, 2, p.b); R(bx + 1, by + h - 1, w - 2, 1, p.b);
  R(bx + 3, by + 2, 2, 2, p.c); R(bx + 2, by + 1, 1, 1, '#ffffff');
  R(bx + 2, by + 4, 2, 3, '#14141c'); R(bx + 6, by + 4, 2, 3, '#14141c'); R(bx + 2, by + 4, 1, 1, '#ffffff'); R(bx + 6, by + 4, 1, 1, '#ffffff');
  R(bx + 3, by + h - 3, 4, 1, shade(p.b, -0.3));
  if (m.crown) {
    R(bx + 3, by - 4, 9, 3, '#f2c14e'); R(bx + 3, by - 6, 2, 2, '#f2c14e'); R(bx + 7, by - 7, 2, 3, '#f2c14e'); R(bx + 10, by - 6, 2, 2, '#f2c14e');
    R(bx + 7, by - 3, 2, 1, '#e0504a'); R(bx + 4, by - 3, 1, 1, '#58d4ff'); R(bx + 10, by - 3, 1, 1, '#58d4ff');
  }
}
function coelho(m, t, p) {
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 9 + m.seed)) * 7 : lungeK(m) * 3, y = -hop;
  R(-5, y - 7, 10, 6, p.a); R(-5, y - 2, 10, 1, p.b); R(4, y - 8, 3, 3, '#ffffff');
  R(-9, y - 10, 6, 5, p.a); R(-8, y - 17, 2, 7, p.a); R(-5, y - 16, 2, 6, p.b); R(-8, y - 16, 1, 5, '#e8a0a8');
  R(-8, y - 9, 2, 1, '#e02020'); R(-9, y - 6, 1, 2, '#ffffff'); R(-7, y - 10, 2, 1, p.b);
  R(-4, y - 1, 3, 1, p.b); R(2, y - 1, 3, 1, p.b);
}
function lobo(m, t, p) {
  const st = walkStep(m, t, 10), l = lungeK(m), y = -Math.round(l * 2);
  const legs = [[-8, 0], [-5, 1], [4, 1], [7, 0]];
  legs.forEach(([x, ph], i) => R(x, y - 5 + ((st + ph) % 2), 2, 5 - ((st + ph) % 2), i % 2 ? p.b : p.a));
  R(-9, y - 11, 17, 6, p.a); R(-6, y - 12, 12, 1, p.b); R(-7, y - 6, 12, 1, p.c);
  R(-11, y - 12, 4, 7, p.c); R(-16, y - 15, 7, 6, p.a); R(-19, y - 12, 4, 3, p.a); R(-20, y - 12, 1, 1, '#14141c');
  R(-14, y - 18, 2, 3, p.a); R(-11, y - 17, 2, 2, p.b); R(-15, y - 14, 2, 1, p.e);
  if (l > 0.1) { R(-19, y - 9, 4, 1, '#ffffff'); R(-19, y - 8, 3, 1, '#8a1e1e'); }
  R(8, y - 13, 5, 2, p.a); R(12, y - 16, 2, 3, p.c);
  if (p.fire) for (let i = 0; i < 4; i++) { const f = Math.floor((t * 12 + i * 3) % 3); R(-6 + i * 4, y - 14 - f, 2, 2 + f, i % 2 ? '#ff8a2a' : '#ffd04a'); }
}
function goblin(m, t, p) {
  const st = walkStep(m, t, 7), l = lungeK(m);
  R(-3, -5, 2, 5 - st, p.b); R(1, -5, 2, 5 - (1 - st), p.b); R(-4, -1 - st, 3, 1, '#3a2a1e'); R(1, -1, 3, 1, '#3a2a1e');
  R(-4, -11, 7, 6, p.c); R(-4, -7, 7, 1, shade(p.c, -0.3));
  R(-5, -17, 8, 6, p.a); R(-8, -16, 3, 2, p.a); R(3, -16, 2, 2, p.a); R(-8, -17, 1, 1, p.a);
  R(-4, -15, 2, 1, p.e); R(-6, -14, 1, 2, p.b); R(-4, -12, 3, 1, '#ffffff');
  if (p.miner) { R(-6, -19, 10, 3, '#c8a040'); R(-6, -19, 10, 1, '#f0d060'); R(-7, -18, 2, 2, '#ffff90'); R(-9 - l * 3, -14, 1, 9, '#7a5a3a'); R(-12 - l * 3, -14, 7, 2, '#9aa0b0'); return; }
  if (p.chief) {
    R(-6, -20, 9, 3, '#f2c14e'); R(-6, -22, 2, 2, '#f2c14e'); R(-2, -22, 2, 2, '#f2c14e'); R(1, -22, 2, 2, '#f2c14e'); R(-3, -19, 2, 1, '#e0504a');
    R(-11 - l * 3, -18, 3, 10, '#6a4a2a'); R(-12 - l * 3, -21, 5, 5, '#8a6a4a'); R(-12 - l * 3, -20, 1, 1, '#c0c0c0'); return;
  }
  if (!m.thrown) { R(-9 - l * 4, -22, 1, 18, '#8a5a2a'); R(-10 - l * 4, -25, 3, 3, '#c8d0d8'); }
  R(-7, -10, 3, 2, p.a);
}
function aranha(m, t, p) {
  const st = walkStep(m, t, 12), l = lungeK(m);
  for (let i = 0; i < 4; i++) {
    const x = -7 + i * 4, up = (i + st) % 2;
    R(x - 2, -9 - up, 1, 3, p.b); R(x - 3, -6 - up, 1, 6 + up, p.b); R(x + 1, -8 + up, 1, 2, p.b); R(x + 2, -6, 1, 6, p.b);
  }
  R(-1, -11, 11, 8, p.a); R(1, -12, 7, 1, p.a); R(0, -11, 9, 1, p.c); R(3, -9, 3, 3, p.x); R(4, -6, 1, 1, p.x);
  R(-8 - l * 3, -9, 8, 5, p.b); R(-8 - l * 3, -9, 7, 1, shade(p.b, 0.3));
  R(-8 - l * 3, -8, 1, 1, p.e); R(-6 - l * 3, -8, 1, 1, p.e); R(-7 - l * 3, -7, 1, 1, p.e);
  R(-9 - l * 3, -5, 1, 2, '#e8e0d0'); R(-7 - l * 3, -5, 1, 2, '#e8e0d0');
  if (p.queen) { R(1, -15, 7, 3, '#f2c14e'); R(1, -17, 2, 2, '#f2c14e'); R(4, -17, 2, 2, '#f2c14e'); R(7, -17, 1, 2, '#f2c14e'); }
}
function escorpiao(m, t, p) {
  const stab = lungeK(m) * 4, lg = m.state === 'walk' ? Math.floor(t * 12) % 2 : 0;
  for (let i = 0; i < 4; i++) R(-5 + i * 3, -2 + ((i + lg) % 2), 1, 2, p.b);
  R(-6, -6, 13, 4, p.a); R(-6, -6, 13, 1, p.c); R(-3, -4, 1, 2, p.b); R(1, -4, 1, 2, p.b);
  R(-11, -8, 5, 3, p.a); R(-14, -10, 4, 2, p.b); R(-14, -7, 4, 2, p.b);
  R(-5, -7, 1, 1, '#1a1a1a'); R(-3, -7, 1, 1, '#1a1a1a');
  R(6, -9, 3, 3, p.a); R(8, -13, 3, 4, p.a); R(6 - stab, -17, 3, 3, p.a); R(9, -12, 1, 1, p.c);
  R(3 - stab * 1.5, -17, 3, 2, p.x); R(2 - stab * 1.5, -16, 1, 1, p.x);
  if (p.king) { R(-3, -10, 6, 2, '#f2c14e'); R(-3, -12, 1, 2, '#f2c14e'); R(0, -12, 1, 2, '#f2c14e'); R(2, -12, 1, 2, '#f2c14e'); }
}
function zumbi(m, t, p) {
  const st = walkStep(m, t), skin = p.a, sd = p.b, sway = m.state === 'walk' ? Math.round(Math.sin(t * 3 + m.seed)) : 0;
  R(-4, -9, 4, 9 - st, p.pants); R(1, -9, 4, 9 - (1 - st), shade(p.pants, -0.15));
  R(-5 + sway, -18, 10, 9, p.shirt); R(2 + sway, -14, 2, 3, skin); R(-5 + sway, -11, 10, 2, shade(p.shirt, -0.25)); R(-1 + sway, -18, 2, 2, shade(p.shirt, -0.25));
  R(-3 + sway, -16, 1, 1, shade(p.shirt, 0.3)); R(-4 + sway, -10, 3, 1, skin);
  R(-5 + sway, -27, 10, 9, skin); R(-5 + sway, -27, 10, 2, p.hair); R(3 + sway, -25, 2, 4, sd); R(-2 + sway, -27, 2, 1, sd);
  R(-4 + sway, -23, 2, 2, p.e); R(-4 + sway, -20, 4, 1, '#2a2a1a'); R(-3 + sway, -19, 1, 1, '#e8e0d0');
  if (p.moss) { R(-5 + sway, -27, 4, 1, '#4a7a2a'); R(1 + sway, -16, 3, 2, '#4a7a2a'); }
  const reach = lungeK(m) * 3;
  R(-13 - reach + sway, -17, 9 + reach, 3, skin); R(-12 - reach + sway, -14, 7, 2, sd); R(-14 - reach + sway, -17, 1, 1, sd); R(-14 - reach + sway, -15, 1, 1, sd);
}
function morcego(m, t, p) {
  const cy = -26 + Math.sin(t * 4 + m.seed) * 4, ph = Math.floor((t * 18 + m.seed) % 4);
  const wy = [-8, -4, 0, -4][ph];
  R(-13, cy + wy, 9, 3, p.b); R(-13, cy + wy + 3, 2, 2, p.b); R(-9, cy + wy + 3, 2, 1, p.b); R(-12, cy + wy, 7, 1, p.c);
  R(4, cy + wy, 9, 3, p.b); R(11, cy + wy + 3, 2, 2, p.b); R(7, cy + wy + 3, 2, 1, p.b); R(5, cy + wy, 7, 1, p.c);
  R(-4, cy - 4, 8, 8, p.a); R(-4, cy - 6, 2, 2, p.a); R(2, cy - 6, 2, 2, p.a); R(-3, cy + 3, 6, 1, shade(p.a, 0.2));
  R(-3, cy - 2, 2, 1, p.e); R(1, cy - 2, 2, 1, p.e); R(-2, cy + 1, 1, 2, '#ffffff'); R(1, cy + 1, 1, 2, '#ffffff');
}
function mumia(m, t, p) {
  const st = walkStep(m, t, 5);
  R(-4, -9, 4, 9 - st, p.a); R(1, -9, 4, 9 - (1 - st), p.b);
  R(-5, -18, 10, 9, p.a); R(-5, -27, 10, 9, p.a);
  for (let yy = -26; yy < -9; yy += 3) { R(-5, yy, 10, 1, p.b); R(-5 + ((yy / 3) & 1) * 4, yy + 1, 3, 1, p.c); }
  R(-4, -23, 3, 1, '#14141c'); R(-4, -23, 2, 1, '#ffe04a'); R(-1, -23, 2, 1, '#14141c');
  const reach = lungeK(m) * 3, fl = Math.round(Math.sin(t * 5) * 1);
  R(-12 - reach, -17, 8 + reach, 3, p.a); R(-12 - reach, -14 + fl, 1, 4, p.b); R(4, -14 - fl, 1, 6, p.b); R(5, -9 - fl, 1, 3, p.b);
  if (p.pharaoh) {
    R(-6, -31, 12, 5, '#f2c14e'); R(-6, -26, 3, 10, '#f2c14e'); R(4, -26, 3, 10, '#f2c14e');
    for (let yy = -26; yy < -16; yy += 2) { R(-6, yy, 3, 1, '#2f6fa8'); R(4, yy, 3, 1, '#2f6fa8'); }
    R(-1, -33, 2, 2, '#e04040'); R(-6, -31, 12, 1, '#fff0a0');
    R(-16, -30, 2, 30, '#9b6f1e'); R(-17, -34, 4, 4, '#58d4ff'); R(-17, -34, 1, 1, '#ffffff');
  }
}
function abutre(m, t, p) {
  const cy = -28 + Math.sin(t * 3 + m.seed) * 3, up = Math.sin(t * 10 + m.seed) > 0;
  if (up) { R(-3, cy - 11, 12, 5, p.b); R(-1, cy - 13, 8, 2, p.b); R(0, cy - 11, 10, 1, shade(p.b, 0.25)); }
  else { R(-3, cy + 1, 12, 5, p.b); R(0, cy + 6, 8, 2, p.b); }
  R(-4, cy - 3, 10, 6, p.a); R(6, cy - 1, 5, 2, p.b); R(8, cy + 1, 3, 1, p.b);
  R(-5, cy - 4, 3, 3, '#e8e0d0'); R(-8, cy - 8, 4, 5, '#d89a8a'); R(-11, cy - 7, 3, 2, '#e8c060'); R(-11, cy - 5, 1, 1, '#c09030');
  R(-7, cy - 7, 1, 1, '#1a1a1a');
  R(-1, cy + 3, 1, 3, '#e8c060'); R(2, cy + 3, 1, 3, '#e8c060');
}
function verme(m, t, p) {
  if (m.under) { const j = Math.floor(t * 10) % 2; R(-8, -2 - j, 16, 2 + j, p.dirt || '#c9a060'); R(-4, -4, 8, 2, shade(p.dirt || '#c9a060', -0.15)); return; }
  const e = Math.min(1, m.emerge ?? 1), sway = Math.round(Math.sin(t * 4 + m.seed) * 2), n = p.big ? 9 : 6, sz = p.big ? 10 : 8;
  const top = -n * 4 * e;
  for (let i = 0; i < n; i++) {
    const yy = -4 - i * 4 * e; if (yy < top - 1) break;
    const sw = Math.round(sway * i / n);
    R(-sz / 2 + sw, yy, sz, 4, i % 2 ? p.a : p.b); R(-sz / 2 + sw, yy, 2, 4, p.c);
    if (p.x && i % 2) R(-sz / 2 + 3 + sw, yy + 1, 2, 2, p.x);
  }
  const hx = -sz / 2 + sway;
  R(hx - 3, top - 5, sz + 4, 6, p.b); R(hx - 4, top - 4, 4, 4, '#3a1a10');
  R(hx - 4, top - 4, 1, 1, '#ffffff'); R(hx - 4, top - 2, 1, 1, '#ffffff'); R(hx - 2, top - 5, 1, 1, '#ffffff');
  if (p.e) { R(hx + 2, top - 4, 2, 1, p.e); }
  R(-10, -1, 20, 1, p.dirt || '#c9a060');
}
function centopeia(m, t, p) {
  const n = 7;
  for (let i = n - 1; i >= 0; i--) {
    const x = -11 + i * 5, y = -5 + Math.round(Math.sin(t * 9 + i * 0.9 + m.seed));
    R(x, y - 4, 5, 5, i % 2 ? p.a : p.b); R(x, y - 4, 5, 1, p.c);
    const lg = Math.floor(t * 14 + i) % 2;
    R(x + 1, y + 1, 1, 2 - lg, p.b); R(x + 3, y + 1, 1, 1 + lg, p.b);
  }
  const l = lungeK(m) * 3;
  R(-17 - l, -10, 7, 7, p.a); R(-17 - l, -10, 7, 1, p.c); R(-16 - l, -8, 2, 1, p.e);
  R(-19 - l, -5, 3, 1, p.x); R(-19 - l, -4, 1, 2, p.x); R(-16 - l, -13, 1, 3, p.b); R(-14 - l, -12, 1, 2, p.b);
}
function esqueleto(m, t, p) {
  const st = walkStep(m, t, 6), a = p.a, b = p.b, l = lungeK(m);
  R(-3, -9, 1, 9 - st, a); R(2, -9, 1, 9 - (1 - st), b); R(-4, -1 - st, 3, 1, b); R(1, -1, 3, 1, b); R(-3, -5, 2, 1, b);
  R(-3, -11, 7, 2, a); R(0, -20, 2, 9, a);
  for (let r = 0; r < 3; r++) { R(-3, -19 + r * 3, 7, 1, a); R(-3, -18 + r * 3, 1, 1, b); R(3, -18 + r * 3, 1, 1, b); }
  R(-4, -28, 9, 8, a); R(-4, -28, 9, 1, shade(a, 0.3)); R(-3, -25, 3, 3, '#14141c'); R(1, -25, 2, 2, '#14141c');
  R(-2, -24, 1, 1, p.e); R(-3, -21, 6, 1, b); R(-2, -20, 1, 1, a); R(0, -20, 1, 1, a); R(2, -20, 1, 1, a);
  R(-7 - l * 3, -19, 5 + l * 3, 1, a); R(-7 - l * 3, -18, 1, 1, b);
  if (p.bow) { R(-10, -26, 1, 15, '#8a5a2a'); R(-9, -27, 1, 1, '#8a5a2a'); R(-9, -11, 1, 1, '#8a5a2a'); R(-8, -26, 1, 15, '#e8e0d0'); }
  else { R(-9 - l * 3, -28, 1, 10, p.blade || '#aab0bf'); R(-10 - l * 3, -18, 3, 1, '#6a4a2a'); }
  R(3, -19, 1, 7, b);
  if (p.ice) { R(-4, -30, 2, 2, '#bfe8ff'); R(2, -31, 2, 3, '#bfe8ff'); R(-1, -29, 1, 1, '#ffffff'); }
  if (p.fire) for (let i = 0; i < 3; i++) { const f = Math.floor((t * 12 + i * 2) % 3); R(-3 + i * 3, -31 - f, 2, 3 + f, i === 1 ? '#ffd04a' : '#ff6a1a'); }
  if (p.king) {
    R(-5, -32, 11, 3, '#f2c14e'); R(-5, -34, 2, 2, '#f2c14e'); R(-1, -35, 2, 3, '#f2c14e'); R(3, -34, 2, 2, '#f2c14e'); R(-1, -31, 2, 1, '#b493ff');
    R(5, -22, 4, 10, '#4a3a5a'); R(5, -22, 4, 1, '#6a5a7a');
  }
}
function golem(m, t, p) {
  const st = walkStep(m, t, 4), l = lungeK(m);
  R(-6, -4, 5, 4 - st, p.b); R(2, -4, 5, 4 - (1 - st), p.b);
  R(-8, -16, 16, 12, p.a); R(-9, -14, 1, 8, p.a); R(8, -14, 1, 8, p.b); R(-7, -16, 13, 1, '#ffffff');
  R(-1, -12, 2, 2, '#1a2a3a'); R(-1, -8, 2, 2, '#1a2a3a');
  R(-6, -25, 12, 9, p.a); R(-5, -25, 9, 1, '#ffffff');
  R(-5, -22, 2, 2, p.e); R(-1, -22, 2, 2, p.e); R(-4, -18, 5, 1, p.e); R(-8, -21, 3, 2, '#e08a3a');
  R(-14 - l * 4, -15, 6, 6, p.c); R(-14 - l * 4, -15, 6, 1, '#ffffff'); R(8, -15, 4, 6, p.c);
  R(-4, -28, 2, 3, p.c); R(0, -30, 2, 5, p.c); R(3, -28, 2, 3, p.c);
}
function espirito(m, t, p) {
  const cy = -24 + Math.sin(t * 3 + m.seed) * 3, w = Math.floor(t * 6) % 2;
  R(-6, cy - 10, 12, 12, p.a); R(-5, cy - 11, 10, 1, p.a); R(-5, cy - 10, 9, 1, shade(p.a, 0.4));
  for (let i = 0; i < 4; i++) R(-6 + i * 3, cy + 2 + ((i + w) % 2), 2, 2, p.a);
  R(6, cy - 4, 3, 3, p.a); R(8, cy - 1, 3, 2, p.b); R(10, cy + 1, 2, 2, p.b);
  R(-4, cy - 7, 2, 3, p.e); R(0, cy - 7, 2, 3, p.e); R(-3, cy - 2, 3, 2, p.e);
  const reach = lungeK(m) * 4;
  R(-10 - reach, cy - 4, 4 + reach, 2, p.a);
}
function yeti(m, t, p) {
  const st = walkStep(m, t, 4), l = lungeK(m);
  R(-6, -8, 5, 8 - st, p.a); R(2, -8, 5, 8 - (1 - st), p.b); R(-7, -1 - st, 6, 1, '#7a8aa0'); R(2, -1, 6, 1, '#7a8aa0');
  R(-8, -24, 16, 16, p.a); R(8, -22, 1, 12, p.b); R(-7, -24, 12, 1, '#ffffff');
  for (let i = 0; i < 4; i++) R(-6 + i * 4, -10, 2, 2, p.b);
  R(-7, -32, 13, 9, p.a); R(-5, -30, 8, 6, p.c); R(-4, -29, 2, 1, '#14141c'); R(0, -29, 2, 1, '#14141c');
  R(-4, -26, 5, 1, '#3a2a3a'); R(-4, -25, 1, 2, '#ffffff'); R(0, -25, 1, 2, '#ffffff');
  R(-13 - l * 4, -22, 5, 15, p.a); R(-14 - l * 4, -8, 6, 3, p.c); R(8, -22, 4, 13, p.b);
}
function rainhaGelo(m, t, p) {
  const fl = Math.round(Math.sin(t * 2) * 1), l = lungeK(m);
  for (let r = 0; r < 14; r++) { const w = 6 + Math.floor(r / 2); R(-w / 2 - 1, -14 + r + fl, w + 2, 1, r % 4 === 0 ? p.c : p.a); }
  R(-4, -22 + fl, 8, 8, p.a); R(-4, -22 + fl, 8, 1, p.c); R(-1, -20 + fl, 2, 4, '#ffffff');
  R(-4, -30 + fl, 8, 8, '#d8ecff'); R(-3, -27 + fl, 2, 1, '#2a5aa8'); R(1, -27 + fl, 2, 1, '#2a5aa8'); R(-2, -24 + fl, 3, 1, '#8a6aaa');
  R(-5, -30 + fl, 2, 9, '#ffffff'); R(4, -30 + fl, 2, 10, '#ffffff');
  R(-5, -33 + fl, 10, 2, p.c); R(-5, -36 + fl, 2, 3, p.c); R(-1, -38 + fl, 2, 5, p.c); R(3, -36 + fl, 2, 3, p.c); R(-1, -34 + fl, 2, 1, '#ffffff');
  R(-10 - l * 3, -32 + fl, 1, 30, '#bfe8ff'); R(-12 - l * 3, -36 + fl, 5, 5, p.c); R(-11 - l * 3, -35 + fl, 2, 2, '#ffffff');
  R(-8 - l * 3, -20 + fl, 4, 2, '#d8ecff');
}
function sapo(m, t, p) {
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 7 + m.seed)) * 6 : 0, y = -hop, l = lungeK(m);
  R(-8, y - 8, 14, 8, p.a); R(-7, y - 4, 10, 4, p.c); R(-8, y - 8, 14, 1, shade(p.a, 0.3));
  R(-8, y - 11, 4, 4, p.a); R(-2, y - 11, 4, 4, p.a); R(-7, y - 10, 2, 2, '#ffe04a'); R(-6, y - 10, 1, 2, '#14141c'); R(-1, y - 10, 2, 2, '#ffe04a'); R(0, y - 10, 1, 2, '#14141c');
  R(0, y - 7, 2, 2, p.x); R(3, y - 6, 2, 2, p.x); R(-4, y - 7, 1, 1, p.x);
  R(-9, y - 1, 4, 1, p.b); R(3, y - 2, 5, 2, p.b); R(6, y - 1, 3, 1, p.b);
  R(-9, y - 5, 2, 1, '#1a3a1a');
  if (l > 0.05) { R(-9 - l * 10, y - 5, l * 10, 1, '#e0607a'); R(-11 - l * 10, y - 6, 2, 2, '#e0607a'); }
}
function planta(m, t, p) {
  const e = Math.min(1, m.emerge ?? 1);
  if (m.under) { R(-4, -2, 8, 2, '#3f7a2a'); R(-2, -4, 1, 2, '#4f9a3a'); R(1, -3, 1, 1, '#4f9a3a'); return; }
  const h = Math.round(14 * e), sw = Math.round(Math.sin(t * 2 + m.seed) * 2), open = Math.floor(t * 4) % 2 || m.lunge >= 0;
  R(-1, -h, 3, h, '#3f7a2a'); R(0, -h, 1, h, '#5a9a3a');
  R(-6, -5, 5, 2, '#4f9a3a'); R(2, -8, 5, 2, '#4f9a3a'); R(-7, -4, 2, 1, '#3f7a2a');
  const hy = -h - 10, hx = -7 + sw - lungeK(m) * 3;
  R(hx, hy, 13, 5, p.a); R(hx + 1, hy, 10, 1, p.c); R(hx + 3, hy + 1, 2, 2, p.x); R(hx + 8, hy + 2, 2, 2, p.x);
  if (open) { R(hx, hy + 5, 13, 2, '#3a0a14'); R(hx + 1, hy + 5, 1, 1, '#ffffff'); R(hx + 4, hy + 5, 1, 1, '#ffffff'); R(hx + 8, hy + 5, 1, 1, '#ffffff'); }
  R(hx, hy + (open ? 7 : 5), 13, 4, p.b); R(hx + 2, hy + (open ? 7 : 5), 1, 1, '#ffffff'); R(hx + 6, hy + (open ? 7 : 5), 1, 1, '#ffffff');
}
function bruxa(m, t, p) {
  const st = walkStep(m, t, 5), l = lungeK(m);
  for (let r = 0; r < 12; r++) { const w = 6 + Math.floor(r / 2); R(-w / 2, -12 + r, w, 1, r > 9 ? shade(p.a, -0.3) : p.a); }
  R(-3, -1, 2, 1 - st, '#2a1e3a'); R(2, -1, 2, 1, '#2a1e3a');
  R(-4, -19, 8, 7, p.a); R(-4, -14, 8, 1, '#3a2a1e'); R(-1, -14, 2, 1, '#e8c060');
  R(-4, -25, 7, 6, '#8ac070'); R(-6, -22, 2, 2, '#8ac070'); R(-7, -21, 1, 1, '#6a9a50'); R(-3, -23, 1, 1, '#ff3a3a'); R(-3, -20, 3, 1, '#3a2a1e');
  R(2, -25, 2, 8, '#d8d0c0');
  R(-7, -27, 14, 2, p.b); R(-4, -31, 8, 4, p.b); R(-2, -34, 5, 3, p.b); R(1, -36, 3, 2, p.b); R(-4, -28, 8, 1, '#e0a030');
  R(-10 - l * 3, -28, 1, 26, '#6a4a2a'); R(-12 - l * 3, -31, 5, 3, '#58d47a'); R(-11 - l * 3, -30, 1, 1, '#ffffff');
}
function hidra(m, t, p) {
  const st = walkStep(m, t, 4), l = lungeK(m);
  R(-6, -4, 3, 4 - st, p.b); R(4, -4, 3, 4 - (1 - st), p.b);
  R(-8, -12, 18, 9, p.a); R(-6, -6, 14, 2, p.c); R(9, -9, 6, 3, p.a); R(14, -7, 3, 2, p.b);
  [[-3, 0], [0, 1.2], [3, 2.4]].forEach(([nx, ph], k) => {
    const sw = Math.round(Math.sin(t * 3 + ph) * 2), reach = k === 1 ? l * 4 : l * 2;
    for (let i = 0; i < 4; i++) R(nx - i * 2 - sw * i / 3 - reach * i / 4, -14 - i * 4 - (k === 1 ? 3 : 0), 3, 5, i % 2 ? p.a : p.b);
    const hx = nx - 10 - sw - reach, hy = -32 - (k === 1 ? 3 : 0) + k * 2;
    R(hx, hy, 7, 5, p.a); R(hx - 2, hy + 2, 3, 3, p.a); R(hx + 1, hy + 1, 2, 1, p.e); R(hx - 2, hy + 4, 3, 1, '#ffffff'); R(hx + 4, hy - 1, 2, 2, p.c);
  });
}
function serpente(m, t, p) {
  if (m.under) { const j = Math.floor(t * 10) % 2; R(-12, -2 - j, 24, 2 + j, p.dirt); R(-6, -4, 12, 2, shade(p.dirt, -0.2)); return; }
  const e = Math.min(1, m.emerge ?? 1), sw = Math.sin(t * 3 + m.seed) * 3, l = lungeK(m);
  R(-2, -6, 22, 6, p.b); R(0, -6, 18, 1, p.c); for (let i = 0; i < 5; i++) R(2 + i * 4, -5, 2, 4, p.x);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const k = i / n, yy = -6 - i * 4 * e, xx = Math.round(Math.sin(k * 3 + t * 2) * sw - k * 6 * (1 + l));
    R(xx - 4, yy - 4, 9, 5, i % 2 ? p.a : p.b); R(xx - 4, yy - 4, 2, 5, p.c); if (i % 2) R(xx, yy - 3, 2, 2, p.x);
  }
  const hx = Math.round(Math.sin(3 + t * 2) * sw - 6 * (1 + l)) - 10, hy = -6 - n * 4 * e - 6;
  R(hx, hy, 14, 8, p.a); R(hx, hy, 14, 1, p.c); R(hx - 3, hy + 3, 4, 5, p.a);
  R(hx + 3, hy + 2, 3, 2, p.e); R(hx + 4, hy + 2, 1, 2, '#14141c');
  R(hx - 3, hy + 6, 9, 2, '#3a0a14'); R(hx - 2, hy + 6, 1, 3, '#ffffff'); R(hx + 3, hy + 6, 1, 3, '#ffffff');
  if (l > 0.2) { R(hx - 8, hy + 7, 5, 1, '#e0405a'); R(hx - 9, hy + 6, 1, 1, '#e0405a'); R(hx - 9, hy + 8, 1, 1, '#e0405a'); }
  R(hx + 9, hy - 3, 2, 3, p.c); R(hx + 6, hy - 2, 2, 2, p.c);
}
function lobisomem(m, t, p) {
  const st = walkStep(m, t, 6), l = lungeK(m);
  R(-5, -10, 4, 10 - st, p.a); R(1, -10, 4, 10 - (1 - st), p.b); R(-6, -1 - st, 5, 1, p.b); R(1, -1, 5, 1, p.b);
  R(-5, -13, 10, 4, p.x); R(-4, -11, 2, 2, shade(p.x, -0.3));
  R(-6, -26, 12, 13, p.a); R(-4, -24, 7, 8, p.c); R(5, -25, 2, 10, p.b); R(-6, -26, 12, 1, shade(p.a, 0.25));
  R(-11, -34, 10, 8, p.a); R(-15, -31, 5, 4, p.a); R(-16, -31, 1, 1, '#14141c'); R(-9, -38, 3, 4, p.a); R(-5, -37, 3, 3, p.b);
  R(-10, -32, 2, 1, p.e); R(-15, -28, 4, 1, '#ffffff');
  R(-12 - l * 4, -25, 7 + l * 4, 4, p.a); R(-14 - l * 4, -25, 2, 1, '#ffffff'); R(-14 - l * 4, -23, 2, 1, '#ffffff');
  R(5, -24, 3, 12, p.b); R(4, -12, 4, 2, '#ffffff');
}
function vampiro(m, t, p) {
  const st = walkStep(m, t, 5), l = lungeK(m), wv = Math.round(Math.sin(t * 5));
  R(-1 + wv, -26, 12, 24, p.b); R(1 + wv, -24, 9, 20, p.x); R(9 + wv, -4, 3, 2, p.b);
  R(-4, -9, 3, 9 - st, '#1a1a24'); R(1, -9, 3, 9 - (1 - st), '#14141c');
  R(-5, -20, 10, 11, '#1e1e2a'); R(-2, -20, 4, 6, '#e8e0e8'); R(-1, -18, 2, 1, p.x); R(-6, -22, 12, 3, p.b);
  R(-4, -29, 8, 8, p.a); R(-4, -30, 8, 2, '#14141c'); R(-1, -29, 2, 2, '#14141c'); R(3, -29, 1, 5, '#14141c');
  R(-3, -26, 2, 1, p.e); R(-3, -23, 3, 1, '#7a1a2a'); R(-3, -22, 1, 1, '#ffffff'); R(-1, -22, 1, 1, '#ffffff');
  R(-11 - l * 4, -19, 7 + l * 4, 2, '#1e1e2a'); R(-12 - l * 4, -19, 2, 3, p.a);
  if (p.count) { R(-5, -33, 10, 2, '#f2c14e'); R(-5, -35, 2, 2, '#f2c14e'); R(-1, -36, 2, 3, '#f2c14e'); R(3, -35, 2, 2, '#f2c14e'); R(-1, -33, 2, 1, '#e0304a'); }
}
function diabrete(m, t, p) {
  const cy = -24 + Math.sin(t * 5 + m.seed) * 3, up = Math.sin(t * 16) > 0, l = lungeK(m);
  if (up) { R(2, cy - 10, 8, 4, p.b); R(6, cy - 12, 4, 2, p.b); } else { R(2, cy - 2, 8, 4, p.b); R(6, cy + 2, 4, 2, p.b); }
  R(-4, cy - 6, 8, 9, p.a); R(-3, cy - 2, 5, 4, p.c);
  R(-5, cy - 13, 8, 7, p.a); R(-6, cy - 16, 2, 3, '#2a1a1a'); R(1, cy - 16, 2, 3, '#2a1a1a');
  R(-4, cy - 11, 2, 1, '#ffe04a'); R(-4, cy - 8, 4, 1, '#3a0a0a'); R(-3, cy - 7, 1, 1, '#ffffff');
  R(4, cy + 1, 4, 1, p.a); R(8, cy, 1, 1, p.a); R(9, cy - 1, 2, 2, p.a);
  R(-3, cy + 3, 2, 3, p.b); R(1, cy + 3, 2, 3, p.b);
  R(-10 - l * 4, cy - 14, 1, 16, '#6a6a7a'); R(-12 - l * 4, cy - 16, 5, 1, '#9aa0b0'); R(-12 - l * 4, cy - 18, 1, 2, '#9aa0b0'); R(-10 - l * 4, cy - 18, 1, 2, '#9aa0b0'); R(-8 - l * 4, cy - 18, 1, 2, '#9aa0b0');
}
function demonio(m, t, p) {
  const st = walkStep(m, t, 4), l = lungeK(m), up = Math.sin(t * 4) > 0;
  R(4, up ? -36 : -30, 12, 12, p.b); R(8, up ? -38 : -32, 8, 3, p.b); R(5, up ? -35 : -29, 10, 1, shade(p.b, 0.25));
  R(-6, -11, 5, 11 - st, p.a); R(2, -11, 5, 11 - (1 - st), p.b); R(-7, -1 - st, 6, 1, '#1a0a0a'); R(2, -1, 6, 1, '#1a0a0a');
  R(-8, -28, 16, 17, p.a); R(-6, -26, 5, 5, p.c); R(0, -26, 5, 5, p.c); R(-4, -19, 8, 6, p.c); R(7, -27, 2, 15, p.b);
  R(-6, -36, 12, 9, p.a); R(-8, -40, 3, 5, '#e8d8c0'); R(-9, -42, 2, 3, '#e8d8c0'); R(4, -40, 3, 5, '#e8d8c0'); R(5, -42, 2, 3, '#e8d8c0');
  R(-5, -33, 3, 2, '#ffe04a'); R(-1, -33, 3, 2, '#ffe04a'); R(-5, -29, 7, 1, '#2a0a0a'); R(-4, -28, 1, 1, '#ffffff'); R(0, -28, 1, 1, '#ffffff');
  R(-14 - l * 5, -27, 7 + l * 5, 5, p.a); R(-16 - l * 5, -27, 2, 1, '#ffffff'); R(-16 - l * 5, -25, 2, 1, '#ffffff'); R(-16 - l * 5, -23, 2, 1, '#ffffff');
}
function elemental(m, t, p) {
  const cy = -18 + Math.sin(t * 3) * 2, l = lungeK(m);
  const f = i => Math.floor(((t * 10 + i * 1.7) % 3));
  R(-8, cy - 4, 16, 18, p.a); R(-6, cy - 12 - f(1), 12, 10, p.a); R(-4, cy - 18 - f(2), 8, 8, p.c); R(-2, cy - 23 - f(3), 4, 6, '#fff0a0');
  R(-10, cy, 3, 6 + f(4), p.b); R(7, cy - 2, 3, 8 + f(5), p.b);
  R(-5, cy - 6, 10, 8, p.b); R(-4, cy - 4, 2, 2, '#ffffff'); R(1, cy - 4, 2, 2, '#ffffff'); R(-3, cy, 5, 1, '#ffffff');
  R(-16 - l * 5, cy - 2, 8 + l * 5, 4, p.c); R(-18 - l * 5, cy - 3, 3, 6, '#fff0a0');
  R(-4, cy + 14, 8, 2 + f(6), p.b);
}
function dragao(m, t, p) {
  const cy = -24 + Math.round(Math.sin(t * 2 + m.seed) * 3), ph = Math.floor((t * 6) % 4), l = lungeK(m), br = m.breath || 0;
  const wy = [-14, -8, -2, -8][ph];
  // asa de trás
  R(2, cy + wy - 2, 18, 4, shade(p.b, -0.2)); R(6, cy + wy - 5, 12, 3, shade(p.b, -0.2));
  // cauda
  R(12, cy + 2, 8, 4, p.a); R(19, cy + 4, 6, 3, p.a); R(24, cy + 5, 4, 2, p.a); R(27, cy + 3, 3, 4, p.x);
  // corpo
  R(-6, cy - 4, 20, 10, p.a); R(-4, cy + 3, 16, 3, p.c); for (let i = 0; i < 5; i++) R(-3 + i * 3, cy + 3, 1, 3, shade(p.c, -0.2));
  for (let i = 0; i < 5; i++) R(-2 + i * 4, cy - 6, 2, 2, p.x);
  R(-4, cy + 6, 3, 5, p.b); R(8, cy + 6, 3, 5, p.b); R(-6, cy + 10, 5, 1, '#e8d8c0'); R(6, cy + 10, 5, 1, '#e8d8c0');
  // pescoço e cabeça
  const hx = -22 - l * 4, hy = cy - 14 - Math.round(l * 2);
  R(-12, cy - 8, 8, 7, p.a); R(-16, cy - 11, 6, 6, p.a); R(-14, cy - 4, 8, 2, p.c);
  R(hx, hy, 13, 8, p.a); R(hx, hy, 13, 1, shade(p.a, 0.3)); R(hx - 3, hy + 3, 5, 4, p.a);
  R(hx + 4, hy + 2, 3, 2, p.e); R(hx + 5, hy + 2, 1, 2, '#14141c'); R(hx - 3, hy + 3, 1, 1, '#14141c');
  R(hx + 9, hy - 4, 2, 4, '#e8d8c0'); R(hx + 11, hy - 6, 2, 3, '#e8d8c0'); R(hx + 6, hy - 3, 2, 3, '#e8d8c0');
  const jaw = l > 0.2 || br > 0 ? 3 : 0;
  R(hx - 3, hy + 7 + jaw, 11, 3, p.b); R(hx - 2, hy + 7, 1, 1 + jaw, '#ffffff'); R(hx + 2, hy + 7, 1, 1 + jaw, '#ffffff');
  if (jaw) R(hx - 2, hy + 8, 8, jaw - 1, '#5a0a0a');
  // asa da frente
  R(-2, cy + wy, 20, 4, p.b); R(1, cy + wy - 3, 16, 3, p.b); R(4, cy + wy - 6, 10, 3, p.b);
  R(-2, cy + wy, 20, 1, shade(p.b, 0.3)); for (let i = 0; i < 4; i++) R(1 + i * 5, cy + wy + 1, 1, 3, shade(p.b, -0.3));
  if (m.enraged) { R(hx + 4, hy + 2, 3, 2, '#ffffff'); }
}

const DRAW = { slime, coelho, lobo, goblin, aranha, escorpiao, zumbi, morcego, mumia, abutre, verme, centopeia, esqueleto,
  golem, espirito, yeti, rainhaGelo, sapo, planta, bruxa, hidra, serpente, lobisomem, vampiro, diabrete, demonio, elemental, dragao };

export function drawMonster(m, t) {
  const d = m.def || {};
  (DRAW[d.draw] || slime)(m, t, d.pal || {});
}

// =====================================================================
// CHEFÕES GRANDES (desenhados no tamanho real, pixels finos, 4–5 tons)
// =====================================================================
function E(cx, cy, rx, ry, c) {               // elipse cheia
  for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); R(cx - w, cy + dy, w * 2 + 1, 1, c); }
}
function EG(cx, cy, rx, ry, tones) {          // elipse com faixas de tom (claro em cima, escuro embaixo)
  const n = tones.length;
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    const k = Math.min(n - 1, Math.floor(((dy + ry) / (2 * ry + 1)) * n));
    R(cx - w, cy + dy, w * 2 + 1, 1, tones[k]);
  }
}
function L(x0, y0, x1, y1, w, c) {            // linha grossa
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; R(x - w / 2, y - w / 2, Math.max(1, w), Math.max(1, w), c); }
}
function TRI(ax, ay, bx, by, cx, cy, c) {     // triângulo cheio (membranas, espinhos, capas)
  const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
  const ed = [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]];
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (const [x0, y0, x1, y1] of ed) {
      if ((y >= Math.min(y0, y1)) && (y <= Math.max(y0, y1)) && y0 !== y1) xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
    }
    if (xs.length >= 2) { const a = Math.min(...xs), b = Math.max(...xs); R(a, y, Math.max(1, b - a + 1), 1, c); }
  }
}
const tones = (base, n = 5) => Array.from({ length: n }, (_, i) => shade(base, 0.35 - i * (0.75 / (n - 1))));


// Asa de dragão: ombro → cotovelo → pulso, dedos saindo do pulso e membrana com bordas recortadas.
function wing(sx, sy, up, k, memb, membD, bone) {
  const ex = sx + 10 * k, ey = sy - 22 * k - up * 9 * k, wx = sx + 24 * k, wy = sy - 36 * k - up * 15 * k;
  const tips = [[sx + 48 * k, sy - 32 * k - up * 10 * k], [sx + 54 * k, sy - 14 * k - up * 4 * k], [sx + 50 * k, sy + 2 * k], [sx + 36 * k, sy + 10 * k]];
  const rear = [sx + 20 * k, sy + 8 * k];
  TRI(sx, sy, ex, ey, wx, wy, memb); TRI(sx, sy, wx, wy, rear[0], rear[1], memb);
  let prev = [wx, wy];
  const all = [[wx + 14 * k, wy - 6 * k], ...tips];
  for (let i = 0; i < all.length; i++) {
    const t0 = i ? all[i - 1] : [wx, wy], t1 = all[i];
    const mx = (t0[0] + t1[0]) / 2, my = (t0[1] + t1[1]) / 2, cx = mx + (wx - mx) * 0.28, cyy = my + (wy - my) * 0.28;
    TRI(wx, wy, t0[0], t0[1], cx, cyy, memb); TRI(wx, wy, cx, cyy, t1[0], t1[1], memb);
    TRI(wx, wy, (wx + t0[0]) / 2, (wy + t0[1]) / 2, (wx + cx) / 2, (wy + cyy) / 2, membD);
  }
  const lt = tips[tips.length - 1];
  TRI(wx, wy, lt[0], lt[1], rear[0], rear[1], memb);
  L(sx, sy, ex, ey, 3 * k, bone); L(ex, ey, wx, wy, 2 * k, bone);
  all.forEach(([x, y]) => L(wx, wy, x, y, 1, bone));
  R(wx - 1, wy - 3, 2, 3, shade(bone, 0.3)); R(ex - 1, ey - 1, 3, 3, shade(bone, 0.25));
}

// ---------- Dragão Ancestral (vermelho) ----------
function dragaoG(m, t, p) {
  const T = tones(p.a), cy = -52 + Math.round(Math.sin(t * 2.2 + m.seed) * 3), l = lungeK(m);
  const fl = Math.sin(t * 5.5), up = fl;                       // bater de asas
  const open = l > 0.15 || m.breath ? 4 : Math.floor(t * 1.3) % 5 === 0 ? 1 : 0;
  const memb = p.m || '#2e2832', membD = shade(memb, -0.3), bone = p.bone || '#cfc6ae';
  const sway = Math.sin(t * 2.6) * 3;
  // asa de trás (menor e mais escura)
  wing(10, cy - 10, up, 0.8, membD, shade(membD, -0.25), shade(bone, -0.35));
  // cauda em curva
  let px = 22, py = cy + 4;
  for (let i = 1; i <= 14; i++) {
    const x = 22 + i * 4.2, y = cy + 4 + i * 1.2 + Math.sin(t * 2.5 - i * 0.55) * (2 + i * 0.35), w = Math.max(2, 7 - i * 0.4);
    L(px, py, x, y, w, i % 3 === 0 ? T[3] : T[2]); L(px, py + w / 2 - 0.5, x, y + w / 2 - 0.5, 1, p.c); px = x; py = y;
  }
  TRI(px, py - 4, px + 7, py, px, py + 4, T[1]); TRI(px + 1, py - 2, px + 5, py, px + 1, py + 2, T[3]);
  // pata de trás
  E(16, cy + 6, 6, 7, T[2]); L(18, cy + 10, 22, cy + 20, 4, T[3]); L(22, cy + 20, 18, cy + 26, 3, T[2]);
  L(18, cy + 26, 14, cy + 28, 1, bone); L(19, cy + 26, 17, cy + 29, 1, bone); L(21, cy + 26, 21, cy + 29, 1, bone);
  // corpo
  EG(4, cy, 21, 10, [T[0], T[1], T[2], T[2], T[3], T[4]]);
  for (let i = 0; i < 6; i++) { R(-12 + i * 6, cy - 3, 2, 1, T[0]); R(-10 + i * 6, cy - 1, 1, 1, T[0]); }
  E(2, cy + 6, 17, 3, p.c); for (let i = 0; i < 7; i++) R(-12 + i * 5, cy + 4, 1, 5, shade(p.c, -0.25));
  for (let i = 0; i < 7; i++) TRI(-14 + i * 6, cy - 9, -11 + i * 6, cy - 14, -8 + i * 6, cy - 9, p.x);
  // pata da frente
  L(-12, cy + 4, -16, cy + 14, 4, T[2]); L(-16, cy + 14, -12, cy + 22, 3, T[3]);
  L(-12, cy + 22, -16, cy + 24, 1, bone); L(-11, cy + 22, -13, cy + 25, 1, bone); L(-10, cy + 22, -9, cy + 25, 1, bone);
  // pescoço
  const hx = -44 + sway - l * 5, hy = cy - 22 + Math.round(Math.sin(t * 2.6 + 1) * 2) - l * 2;
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, x = -14 + (hx + 6 + 14) * k, y = cy - 4 + (hy + 4 - cy + 4) * k - Math.sin(k * Math.PI) * 6, w = 9 - k * 3;
    E(x, y, w / 2 + 1, w / 2, T[2]); R(x - 2, y + w / 2 - 1, 4, 1, p.c);
    if (i % 2 === 0) TRI(x - 2, y - w / 2, x, y - w / 2 - 4, x + 2, y - w / 2, p.x);
  }
  // cabeça
  EG(hx + 8, hy, 9, 6, [T[0], T[1], T[2], T[3]]);
  R(hx - 8, hy - 2, 12, 5, T[2]); R(hx - 8, hy - 2, 12, 1, T[1]); R(hx - 9, hy - 1, 2, 3, T[2]);
  R(hx - 8, hy - 1, 1, 1, '#14141c');                                        // narina
  R(hx - 8, hy + 3 + open, 13, 3, T[3]); R(hx - 7, hy + 3 + open, 12, 1, shade(T[3], 0.2));
  if (open) { R(hx - 7, hy + 3, 11, open, '#4a0a0a'); R(hx - 3, hy + 3, 4, Math.max(1, open - 1), '#ff6a2a'); }
  for (let i = 0; i < 5; i++) { R(hx - 7 + i * 2, hy + 3, 1, 1 + (open ? 1 : 0), '#f4ecd8'); R(hx - 6 + i * 2, hy + 2 + open, 1, 1, '#f4ecd8'); }
  R(hx + 3, hy - 3, 4, 2, m.enraged ? '#ffffff' : p.e); R(hx + 4, hy - 3, 1, 2, '#14141c'); R(hx + 2, hy - 5, 6, 1, T[0]);
  L(hx + 9, hy - 4, hx + 20, hy - 12, 2, bone); L(hx + 20, hy - 12, hx + 23, hy - 12, 1, bone);
  L(hx + 12, hy - 1, hx + 21, hy - 5, 2, shade(bone, -0.15));
  TRI(hx + 14, hy + 4, hx + 18, hy + 9, hx + 11, hy + 5, T[1]);
  // asa da frente
  wing(2, cy - 8, up, 1, memb, membD, bone);
}

// ---------- Serpente Gigante ----------
function serpenteG(m, t, p) {
  const T = tones(p.a);
  if (m.under) { const j = Math.floor(t * 10) % 2; E(0, -1, 18, 2 + j, p.dirt); E(-4, -3, 10, 2, shade(p.dirt, -0.2)); R(-6, -6, 2, 2, shade(p.dirt, 0.2)); R(5, -5, 2, 2, shade(p.dirt, 0.2)); return; }
  const e = Math.min(1, m.emerge ?? 1), l = lungeK(m), hood = m.wind > 0 || l > 0.1 ? 1 : 0;
  // espiral no chão
  EG(10, -6, 22, 6, [T[1], T[2], T[3], T[4]]); for (let i = 0; i < 8; i++) R(-8 + i * 5, -9, 2, 4, p.x);
  EG(18, -14, 13, 5, [T[0], T[1], T[2], T[3]]); for (let i = 0; i < 5; i++) R(9 + i * 4, -16, 2, 3, p.x);
  // corpo subindo em S
  const N = 18, pts = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N, y = -12 - k * 78 * e, x = 4 + Math.sin(k * 5.2 + t * 2) * (9 - k * 3) - k * 10 - l * k * 14;
    pts.push([x, y, 11 - k * 3]);
  }
  for (let i = 0; i < N; i++) {
    const [x, y, w] = pts[i];
    E(x, y, w / 2 + 1, 3, T[2]); R(x - w / 2, y - 1, 2, 3, p.c); R(x - w / 2 + 1, y + 1, Math.max(1, w / 3), 1, shade(p.c, 0.2));
    if (i % 2) { R(x + 1, y - 1, 2, 2, p.x); R(x + 3, y, 1, 1, T[0]); }
  }
  const [hx0, hy0] = pts[N], hx = hx0 - 6, hy = hy0 - 4;
  // capuz
  if (hood || e < 1) { TRI(hx + 4, hy + 2, hx - 6, hy + 18, hx + 18, hy + 18, T[3]); TRI(hx + 4, hy + 4, hx - 2, hy + 16, hx + 12, hy + 16, p.c); R(hx + 2, hy + 9, 4, 2, p.x); R(hx + 3, hy + 13, 2, 2, p.x); }
  else { TRI(hx + 4, hy + 4, hx, hy + 14, hx + 10, hy + 14, T[3]); }
  // cabeça
  EG(hx + 2, hy, 9, 5, [T[0], T[1], T[2], T[3]]); R(hx - 10, hy - 1, 8, 4, T[2]); R(hx - 10, hy - 1, 8, 1, T[1]);
  R(hx - 2, hy - 3, 3, 2, p.e); R(hx - 1, hy - 3, 1, 2, '#14141c'); R(hx - 3, hy - 4, 5, 1, T[0]);
  R(hx - 9, hy, 1, 1, '#14141c');
  const open = l > 0.15 ? 3 : 0;
  R(hx - 10, hy + 3 + open, 11, 2, T[3]);
  if (open) { R(hx - 9, hy + 3, 9, open, '#3a0a14'); R(hx - 8, hy + 3, 1, open + 1, '#f4ecd8'); R(hx - 4, hy + 3, 1, open + 1, '#f4ecd8'); }
  const flick = Math.floor(t * 3) % 3 === 0 || l > 0.3;
  if (flick) { R(hx - 16, hy + 3, 6, 1, '#e0405a'); R(hx - 18, hy + 2, 2, 1, '#e0405a'); R(hx - 18, hy + 4, 2, 1, '#e0405a'); }
  for (let i = 0; i < 3; i++) TRI(hx + 4 + i * 3, hy - 4, hx + 6 + i * 3, hy - 8, hx + 8 + i * 3, hy - 4, T[0]);
}

// ---------- Slime Colossal ----------
function slimeG(m, t, p) {
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 4 + m.seed)) * 8 : 0;
  const sq = m.state === 'walk' ? (hop < 1 ? 1.12 : 0.94) : 1 + Math.sin(t * 2.5) * 0.04;
  const rx = Math.round(23 * sq), ry = Math.round(16 / sq), cy = -ry - hop;
  const Tn = [p.c, shade(p.a, 0.15), p.a, shade(p.a, -0.15), p.b];
  for (let dy = -ry; dy <= ry; dy++) {
    const wob = Math.round(Math.sin(t * 6 + dy * 0.4) * 1.2);
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, dy) / ry, 4) * 0.2 - Math.pow(Math.min(0, dy) / ry, 2)))) + wob;
    const k = Math.min(4, Math.floor(((dy + ry) / (2 * ry + 1)) * 5));
    R(-w, cy + dy, w * 2 + 1, 1, Tn[k]);
  }
  R(-rx + 1, cy + ry - 1, rx * 2 - 1, 2, p.b);
  // coisas engolidas e bolhas
  R(6, cy + 4, 9, 1, '#7a7f90'); R(14, cy + 3, 2, 3, '#5a3a20'); R(-14, cy + 7, 5, 2, '#d8d0c0'); R(-15, cy + 6, 2, 4, '#d8d0c0');
  for (let i = 0; i < 6; i++) { const by = cy + ry - 2 - ((t * 10 + i * 9) % (ry * 2 - 2)), bx = -12 + i * 5 + Math.round(Math.sin(t * 3 + i)); R(bx, by, 2, 2, p.c); R(bx, by, 1, 1, '#ffffff'); }
  R(-rx + 6, cy - ry + 4, 5, 2, '#ffffff'); R(-rx + 5, cy - ry + 6, 2, 3, '#ffffff'); R(-rx + 12, cy - ry + 3, 2, 1, p.c);
  // rosto
  const blink = Math.floor(t * 1.5) % 6 === 0;
  R(-13, cy - 2, 6, blink ? 1 : 7, '#14141c'); R(-1, cy - 2, 6, blink ? 1 : 7, '#14141c');
  if (!blink) { R(-12, cy - 1, 2, 2, '#ffffff'); R(0, cy - 1, 2, 2, '#ffffff'); }
  R(-9, cy + 8, 10, 2, '#14141c'); R(-8, cy + 10, 8, 1, shade(p.b, -0.4)); R(-6, cy + 8, 2, 1, '#ffffff');
  // coroa
  const cw = Math.round(Math.sin(t * 2) * 1), crY = cy - ry - 7;
  R(-9 + cw, crY + 3, 19, 5, '#e8b33c'); R(-9 + cw, crY + 3, 19, 1, '#ffe08a'); R(-9 + cw, crY + 7, 19, 1, '#9b6f1e');
  [-9, -3, 3, 8].forEach((x, i) => TRI(x + cw, crY + 3, x + 1 + cw + (i === 3 ? 0 : 1), crY - 3 - (i % 2) * 2, x + 3 + cw, crY + 3, '#e8b33c'));
  R(-1 + cw, crY + 4, 3, 3, '#e0304a'); R(-7 + cw, crY + 5, 2, 2, '#58d4ff'); R(5 + cw, crY + 5, 2, 2, '#58d47a');
}

// ---------- Faraó Esquecido ----------
function faraoG(m, t, p) {
  const st = walkStep(m, t, 4), l = lungeK(m), B = p.a, Bd = p.b, Bl = p.c, G = '#e8b33c', Gd = '#9b6f1e', Gl = '#ffe08a', Bu = '#2f6fa8';
  const wind = Math.sin(t * 4);
  // tiras soltas
  for (let k = 0; k < 3; k++) { let x = 6, y = -40 + k * 12; for (let i = 0; i < 6; i++) { const nx = x + 3, ny = y + 1 + Math.sin(t * 5 + i + k) * 2; L(x, y, nx, ny, 2, i % 2 ? Bd : B); x = nx; y = ny; } }
  // pernas
  R(-7, -18, 6, 18 - st, B); R(2, -18, 6, 18 - (1 - st), Bd);
  for (let y = -17; y < 0; y += 3) { R(-7, y, 6, 1, Bd); R(2, y + 1, 6, 1, shade(Bd, -0.2)); }
  R(-8, -1 - st, 7, 1, Gd); R(2, -1, 7, 1, Gd);
  // saiote dourado
  TRI(-10, -26, 10, -26, 0, -14, G); R(-10, -27, 21, 3, G); R(-10, -27, 21, 1, Gl); for (let x = -8; x < 10; x += 3) R(x, -24, 1, 5, Gd);
  // tronco enfaixado
  R(-8, -44, 16, 18, B); for (let y = -43; y < -26; y += 3) { R(-8, y, 16, 1, Bd); R(-8 + ((y / 3) & 1) * 7, y + 1, 5, 1, Bl); }
  R(6, -44, 2, 18, Bd);
  // colar largo
  for (let r = 0; r < 4; r++) R(-9 + r, -46 + r * 2, 19 - r * 2, 2, r % 2 ? Bu : G);
  R(-1, -40, 3, 3, '#e0304a');
  // braço de trás e cajado
  R(6, -44, 4, 14, Bd); R(6, -31, 4, 3, B);
  const sx = -22 - l * 4;
  R(sx, -60, 2, 60, Gd); R(sx + 1, -60, 1, 60, G);
  const pulse = (Math.sin(t * 4) + 1) / 2, orb = pulse > 0.5 ? '#9af0ff' : '#58d4ff';
  E(sx + 1, -64, 4, 4, orb); R(sx - 1, -66, 2, 2, '#ffffff'); L(sx - 4, -60, sx + 6, -60, 2, G);
  // braço da frente segurando o cajado
  R(-18 - l * 4, -42, 12 + l * 4, 4, B); R(-18 - l * 4, -42, 12, 1, Bl); R(-20 - l * 4, -43, 3, 5, B);
  // cabeça e nemes
  R(-7, -60, 14, 14, B); for (let y = -58; y < -47; y += 3) R(-7, y, 14, 1, Bd);
  R(-6, -56, 4, 2, '#0a1a2a'); R(1, -56, 4, 2, '#0a1a2a'); R(-5, -56, 2, 2, pulse > 0.3 ? '#9af0ff' : '#58d4ff'); R(2, -56, 2, 2, pulse > 0.3 ? '#9af0ff' : '#58d4ff');
  R(-10, -64, 21, 5, G); R(-10, -64, 21, 1, Gl);
  for (let i = 0; i < 6; i++) { R(-11, -59 + i * 3, 4, 2, i % 2 ? Bu : G); R(8, -59 + i * 3, 4, 2, i % 2 ? Bu : G); }
  R(-10, -62, 21, 1, Bu); R(-1, -67, 3, 3, '#e0304a'); R(0, -68, 1, 1, Gl);
  R(-2, -46, 4, 5, G); R(-1, -42, 2, 2, Gd);
}

// ---------- Rainha do Gelo ----------
function rainhaG(m, t, p) {
  const fl = Math.round(Math.sin(t * 2) * 2), l = lungeK(m), D = p.b, M = p.a, C = p.c;
  // cabelo ao vento
  for (let k = 0; k < 4; k++) { let x = 3, y = -56 + fl + k * 2; for (let i = 0; i < 8; i++) { const nx = x + 2.5, ny = y + 2.4 + Math.sin(t * 3 + i * 0.7 + k) * 1.5; L(x, y, nx, ny, 2, k % 2 ? '#e8f4ff' : '#c8dcf0'); x = nx; y = ny; } }
  // vestido
  for (let r = 0; r < 30; r++) {
    const w = 8 + Math.floor(r * 0.55), wob = r > 22 ? Math.round(Math.sin(t * 5 + r) * 1) : 0, y = -30 + r + fl * (r < 26 ? 1 : 0);
    const c = r % 6 === 0 ? C : r > 25 ? D : r > 14 ? M : shade(M, 0.12);
    R(-w + wob, y, w * 2, 1, c);
    if (r % 6 === 3) { R(-w + 3 + wob, y, 1, 1, '#ffffff'); R(w - 4 + wob, y, 1, 1, '#ffffff'); }
  }
  // corpete
  R(-6, -44 + fl, 12, 14, M); R(-6, -44 + fl, 12, 1, C); TRI(-6, -44 + fl, 0, -34 + fl, 6, -44 + fl, D); R(-1, -40 + fl, 2, 6, '#ffffff');
  // braços
  R(5, -43 + fl, 3, 12, '#d8ecff'); R(-14 - l * 4, -42 + fl, 9 + l * 4, 3, '#d8ecff');
  // cetro
  const sx = -16 - l * 4; R(sx, -66 + fl, 2, 52, '#bfe8ff'); R(sx + 1, -66 + fl, 1, 52, '#ffffff');
  const g = Math.floor(t * 4) % 2; TRI(sx - 3, -66 + fl, sx + 1, -74 + fl - g, sx + 5, -66 + fl, C); TRI(sx - 3, -66 + fl, sx + 1, -60 + fl, sx + 5, -66 + fl, M); R(sx, -68 + fl, 2, 2, '#ffffff');
  // rosto
  E(0, -50 + fl, 6, 6, '#dceeff'); R(-4, -51 + fl, 3, 2, '#14306a'); R(1, -51 + fl, 3, 2, '#14306a'); R(-3, -51 + fl, 1, 1, '#9af0ff'); R(2, -51 + fl, 1, 1, '#9af0ff');
  R(-2, -46 + fl, 4, 1, '#8a6aaa'); R(-6, -56 + fl, 12, 3, '#e8f4ff');
  // coroa de gelo
  for (let i = 0; i < 5; i++) { const x = -6 + i * 3, h = i === 2 ? 9 : i % 2 ? 6 : 4; TRI(x, -57 + fl, x + 1, -57 - h + fl, x + 3, -57 + fl, i === 2 ? '#ffffff' : C); }
  R(-6, -58 + fl, 13, 2, C);
  // cristais girando em volta
  for (let i = 0; i < 3; i++) {
    const a = t * 2 + i * 2.1, cx = Math.cos(a) * 20, cy = -36 + Math.sin(a) * 8 + fl;
    TRI(cx - 2, cy, cx, cy - 4, cx + 2, cy, C); TRI(cx - 2, cy, cx, cy + 4, cx + 2, cy, M); R(cx, cy - 2, 1, 1, '#ffffff');
  }
}

// ---------- Rei dos Ossos ----------
function reiG(m, t, p) {
  const st = walkStep(m, t, 5), l = lungeK(m), A = p.a, Bn = p.b, cape = '#4a2a6a', capeD = '#2e1a44';
  const fl = Math.sin(t * 4);
  // capa rasgada
  for (let r = 0; r < 34; r++) { const w = 6 + Math.floor(r * 0.35), wv = Math.round(Math.sin(t * 4 + r * 0.25) * (r / 12)); R(2 + wv, -50 + r, w, 1, r % 7 === 0 ? capeD : cape); }
  for (let i = 0; i < 4; i++) TRI(4 + i * 4 + Math.round(fl * 2), -16, 6 + i * 4 + Math.round(fl * 2), -10 + (i % 2) * 3, 8 + i * 4 + Math.round(fl * 2), -16, cape);
  // pernas
  R(-6, -20, 2, 20 - st, A); R(3, -20, 2, 20 - (1 - st), Bn); E(-5, -11, 2, 2, A); E(4, -11, 2, 2, Bn);
  R(-8, -1 - st, 5, 1, Bn); R(2, -1, 5, 1, Bn);
  // bacia e coluna
  E(0, -22, 7, 3, A); R(-1, -46, 3, 24, A);
  // costelas
  for (let r = 0; r < 5; r++) { const y = -44 + r * 4, w = 9 - Math.abs(r - 2); L(-w, y + 2, 0, y, 2, A); L(w, y + 2, 1, y, 2, Bn); }
  // ombros e braços
  E(-8, -46, 3, 2, A); E(8, -46, 3, 2, Bn); R(8, -45, 2, 14, Bn);
  L(-8, -45, -16 - l * 4, -36, 2, A); L(-16 - l * 4, -36, -20 - l * 4, -40, 2, A);
  // espada de osso
  const sx = -21 - l * 4; L(sx, -42, sx - 2, -72, 4, '#e8e0c8'); L(sx - 1, -42, sx - 3, -72, 1, '#ffffff'); R(sx - 5, -44, 10, 3, '#8a7a9a'); E(sx + 1, -38, 2, 2, '#b493ff');
  // crânio
  EG(0, -56, 8, 7, [shade(A, 0.3), A, A, Bn]);
  R(-6, -58, 5, 4, '#14141c'); R(1, -58, 5, 4, '#14141c');
  const fire = Math.floor(t * 8) % 2; R(-5, -57 - fire, 3, 2, '#b493ff'); R(2, -57 - fire, 3, 2, '#b493ff'); R(-4, -59 - fire, 1, 1, '#e0d0ff'); R(3, -59 - fire, 1, 1, '#e0d0ff');
  R(-1, -53, 2, 2, '#14141c');
  const jaw = Math.floor(t * 6) % 3 === 0 || l > 0.2 ? 2 : 0;
  R(-5, -49 + jaw, 10, 3, Bn); for (let i = 0; i < 5; i++) R(-4 + i * 2, -50 + (jaw ? 0 : 0), 1, 2, '#f4ecd8');
  // coroa
  R(-8, -64, 17, 3, '#e8b33c'); R(-8, -64, 17, 1, '#ffe08a');
  [-8, -3, 2, 7].forEach((x, i) => TRI(x, -64, x + 1, -70 - (i % 2 ? 3 : 0), x + 2, -64, '#e8b33c'));
  R(-1, -63, 3, 2, '#b493ff');
}

// ---------- Conde Vampiro ----------
function condeG(m, t, p) {
  const st = walkStep(m, t, 4), l = lungeK(m), spread = m.wind > 0 || m.retreat ? 1 : 0.15 + (Math.sin(t * 2) + 1) * 0.08;
  const outC = p.b, inC = p.x, skin = p.a, wv = Math.sin(t * 5);
  // capa (abre como asas)
  const W = 14 + spread * 16;
  TRI(-4, -50, 6 + W, -54 - spread * 10, 10 + W * 0.6, -4, outC); TRI(-4, -50, 10 + W * 0.6, -4, -2, -6, outC);
  TRI(-2, -48, 4 + W - 3, -50 - spread * 8, 8 + W * 0.55, -8, inC);
  for (let i = 0; i < 4; i++) { const x = 4 + i * ((W - 4) / 4); L(-2, -48, x + W * 0.2, -52 - spread * 9 + i * 10, 1, shade(outC, 0.3)); }
  TRI(-10 - spread * 10, -50, -4, -52, -6, -10, outC); TRI(-8 - spread * 8, -48, -4, -50, -5, -12, inC);
  // pernas
  R(-5, -18, 4, 18 - st, '#1a1a24'); R(1, -18, 4, 18 - (1 - st), '#14141c'); R(-6, -1 - st, 5, 1, '#0a0a10'); R(1, -1, 5, 1, '#0a0a10');
  // terno
  R(-7, -42, 14, 24, '#1e1e2a'); R(-7, -42, 14, 1, '#2e2e3c'); TRI(-3, -42, 0, -30, 3, -42, '#ece4ec'); R(-1, -40, 2, 6, inC);
  R(-7, -24, 14, 2, '#2e2e3c'); E(0, -33, 2, 2, '#e8b33c'); R(0, -34, 1, 1, '#e0304a');
  // braços
  R(7, -41, 3, 15, '#1e1e2a'); R(7, -27, 3, 3, skin);
  R(-16 - l * 6, -38, 10 + l * 6, 3, '#1e1e2a'); R(-19 - l * 6, -39, 3, 5, skin); R(-21 - l * 6, -38, 2, 1, skin); R(-21 - l * 6, -36, 2, 1, skin);
  // gola alta
  TRI(-8, -42, -10, -54, -3, -46, inC); TRI(8, -42, 10, -54, 3, -46, inC);
  // cabeça
  EG(0, -50, 6, 7, ['#fbf4fb', skin, skin, shade(skin, -0.15)]);
  R(-6, -57, 12, 3, '#0a0a12'); TRI(-3, -54, 0, -51, 3, -54, '#0a0a12'); R(-6, -55, 2, 5, '#0a0a12'); R(5, -55, 2, 5, '#0a0a12');
  const glow = Math.floor(t * 3) % 2; R(-4, -51, 3, 2, glow ? '#ff2a3a' : '#c01a2a'); R(1, -51, 3, 2, glow ? '#ff2a3a' : '#c01a2a'); R(-3, -51, 1, 1, '#ffffff');
  R(-2, -46, 5, 1, '#7a1a2a'); R(-2, -45, 1, 2, '#ffffff'); R(2, -45, 1, 2, '#ffffff');
  // coroa
  R(-6, -60, 13, 3, '#e8b33c'); R(-6, -60, 13, 1, '#ffe08a'); [-6, -1, 4].forEach(x => TRI(x, -60, x + 1, -64, x + 2, -60, '#e8b33c')); R(0, -59, 2, 1, '#e0304a');
}

// ---------- Eventos ----------
function abobora(m, t, p) {
  const hop = m.state === 'walk' ? Math.abs(Math.sin(t * 7 + m.seed)) * 5 : 0, y = -hop, l = lungeK(m);
  // perninhas de cipó
  R(-4, y - 3, 2, 3 + hop, '#3a6a2a'); R(3, y - 3, 2, 3 + hop, '#3a6a2a');
  // abóbora em gomos
  E(0, y - 9, 9, 7, p.a);
  R(-9, y - 10, 2, 4, p.b); R(-4, y - 15, 2, 12, p.b); R(3, y - 15, 2, 12, p.b); R(8, y - 10, 2, 4, p.b);
  R(-6, y - 15, 4, 1, p.c); R(-7, y - 13, 2, 3, p.c);
  R(-1, y - 18, 3, 3, '#4a7a2a'); R(1, y - 19, 3, 1, '#4a7a2a'); R(3, y - 18, 2, 1, '#6aa04a');
  // rosto aceso
  const glow = Math.floor(t * 6) % 2 ? '#ffe04a' : '#ffb020';
  TRI(-7, y - 10, -4, y - 13, -2, y - 10, glow); TRI(1, y - 10, 3, y - 13, 6, y - 10, glow);
  R(-6 - l * 2, y - 7, 11, 2, glow); R(-5 - l * 2, y - 5, 2, 1, glow); R(-1 - l * 2, y - 5, 2, 1, glow); R(3 - l * 2, y - 5, 2, 1, glow);
  R(-4 - l * 2, y - 7, 1, 1, p.b); R(0 - l * 2, y - 7, 1, 1, p.b); R(4 - l * 2, y - 7, 1, 1, p.b);
}
function bonecoNeve(m, t, p) {
  const sway = Math.round(Math.sin(t * 2 + m.seed)), l = lungeK(m);
  EG(0, -8, 10, 8, ['#ffffff', '#eef4fc', '#d8e4f0', '#b8c8dc']);
  EG(sway, -22, 8, 7, ['#ffffff', '#eef4fc', '#d8e4f0', '#b8c8dc']);
  EG(sway, -34, 6, 6, ['#ffffff', '#eef4fc', '#d8e4f0', '#c0d0e0']);
  R(sway - 1, -24, 2, 2, '#2a2a34'); R(sway - 1, -19, 2, 2, '#2a2a34'); R(-1, -10, 2, 2, '#2a2a34');
  // cachecol
  R(sway - 6, -29, 12, 3, '#d83a3a'); R(sway - 6, -29, 12, 1, '#ff6a5a'); R(sway + 3, -27, 3, 7, '#d83a3a'); R(sway + 3, -21, 3, 1, '#ffffff');
  // rosto bravo
  R(sway - 4, -37, 2, 2, '#14141c'); R(sway + 1, -37, 2, 2, '#14141c'); R(sway - 5, -39, 3, 1, '#14141c'); R(sway + 2, -39, 3, 1, '#14141c');
  TRI(sway - 1, -34, sway - 8, -33, sway - 1, -32, '#ff8a2a');
  for (let i = 0; i < 4; i++) R(sway - 3 + i * 2, -30 - (i === 0 || i === 3 ? 1 : 0), 1, 1, '#2a2a34');
  // cartola
  R(sway - 7, -40, 14, 2, '#1e1e2a'); R(sway - 5, -48, 10, 8, '#1e1e2a'); R(sway - 5, -43, 10, 2, '#d83a3a'); R(sway - 4, -48, 3, 1, '#3a3a4a');
  // braços de galho
  L(sway - 7, -23, sway - 15 - l * 4, -30, 1, '#6a4a2a'); L(sway - 13 - l * 4, -28, sway - 16 - l * 4, -26, 1, '#6a4a2a');
  L(sway + 7, -23, sway + 14, -18, 1, '#6a4a2a'); L(sway + 12, -19, sway + 14, -23, 1, '#6a4a2a');
}

Object.assign(DRAW, { abobora, bonecoNeve });
Object.assign(DRAW, { dragaoG, serpenteG, slimeG, faraoG, rainhaG, reiG, condeG });
