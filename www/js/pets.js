// Desenho dos pets (origem nos pés, olhando para a direita, como o herói).
import { R, shade } from './sprites.js';

// o: { t, walk, sad, sleep, atk (0..1) }
function lobinho(o) {
  const st = o.walk ? Math.floor(o.t * 10) % 2 : 0, a = '#8a8a96', b = '#5a5a66', c = '#c8c8d2', y = o.sleep ? 3 : 0;
  if (o.sleep) { R(-6, -5, 12, 5, a); R(-6, -5, 12, 1, c); R(4, -6, 4, 4, a); R(6, -5, 1, 1, '#2a2a34'); R(-8, -3, 3, 2, a); return; }
  R(-4, -4 + (st ? 1 : 0), 2, 4 - (st ? 1 : 0), b); R(3, -4 + (st ? 0 : 1), 2, 4 - (st ? 0 : 1), b);
  R(-5, -8 + y, 11, 5, a); R(-4, -8, 9, 1, c); R(-3, -4, 7, 1, c);
  const hy = o.sad ? -9 : -12;
  R(4 + o.atk * 3, hy, 6, 5, a); R(9 + o.atk * 3, hy + 2, 3, 2, a); R(11 + o.atk * 3, hy + 2, 1, 1, '#14141c');
  R(5 + o.atk * 3, hy - 2, 2, 2, a); R(8 + o.atk * 3, hy - 2, 1, 2, b); R(7 + o.atk * 3, hy + 1, 1, 1, '#14141c');
  if (o.atk > 0.2) R(9 + o.atk * 3, hy + 4, 2, 1, '#ffffff');
  R(-8, o.sad ? -6 : -10 + Math.round(Math.sin(o.t * 12)), 3, 2, a);
}
function coruja(o) {
  const cy = o.sleep ? -6 : -20 + Math.round(Math.sin(o.t * 3) * 2), up = Math.sin(o.t * 12) > 0, a = '#8a6a4a', b = '#5a4030', c = '#e8d8b8';
  if (!o.sleep) { if (up) { R(-7, cy - 4, 4, 3, b); R(4, cy - 4, 4, 3, b); } else { R(-7, cy, 4, 3, b); R(4, cy, 4, 3, b); } }
  R(-4, cy - 5, 9, 9, a); R(-3, cy - 1, 7, 4, c); R(-4, cy - 7, 2, 2, a); R(3, cy - 7, 2, 2, a);
  if (o.sleep) { R(-2, cy - 3, 2, 1, '#2a1e14'); R(1, cy - 3, 2, 1, '#2a1e14'); }
  else { R(-3, cy - 4, 3, 3, '#ffe08a'); R(1, cy - 4, 3, 3, '#ffe08a'); R(-2, cy - 3, 1, 2, '#14141c'); R(2, cy - 3, 1, 2, '#14141c'); }
  R(0, cy - 1, 1, 2, '#e8a030');
  if (o.sad) R(-3, cy - 4, 7, 1, a);
}
function gatinho(o) {
  const st = o.walk ? Math.floor(o.t * 9) % 2 : 0, a = '#e8903a', b = '#b86a20', c = '#ffd8a8';
  if (o.sleep) { R(-6, -5, 11, 5, a); R(-6, -5, 11, 1, c); R(2, -5, 2, 5, b); R(4, -6, 4, 4, a); R(4, -8, 1, 2, a); R(7, -8, 1, 2, a); R(-8, -2, 3, 2, a); return; }
  R(-4, -4 + st, 2, 4 - st, b); R(3, -4 + (1 - st), 2, 4 - (1 - st), b);
  R(-5, -8, 10, 5, a); R(-3, -8, 2, 5, b); R(1, -8, 2, 5, b); R(-4, -4, 8, 1, c);
  const hy = o.sad ? -9 : -12;
  R(4 + o.atk * 2, hy, 6, 5, a); R(4 + o.atk * 2, hy - 2, 1, 2, a); R(9 + o.atk * 2, hy - 2, 1, 2, a);
  R(6 + o.atk * 2, hy + 1, 1, 1, '#2a8a3a'); R(8 + o.atk * 2, hy + 1, 1, 1, '#2a8a3a'); R(7 + o.atk * 2, hy + 3, 1, 1, '#e07a8a');
  const tw = Math.round(Math.sin(o.t * 4) * 2); R(-7, (o.sad ? -6 : -12) + tw, 2, 5, a);
}
function slimePet(o) {
  const hop = o.walk ? Math.abs(Math.sin(o.t * 7)) * 3 : 0, y = -hop, a = '#4ac8b8', b = '#2a8a7a', c = '#a6f2e8';
  const w = o.sleep ? 11 : 9, h = o.sleep ? 5 : 7;
  R(-w / 2 + 1, y - h, w - 2, 1, a); R(-w / 2, y - h + 1, w, h - 1, a); R(-w / 2, y - 2, w, 2, b); R(-w / 2 + 2, y - h + 1, 2, 1, c);
  if (o.sleep) { R(-2, y - 3, 2, 1, '#14141c'); R(1, y - 3, 2, 1, '#14141c'); return; }
  R(-1, y - 4, 1, 2, '#14141c'); R(2, y - 4, 1, 2, '#14141c');
  if (o.sad) R(-1, y - 1, 4, 1, '#14141c'); else R(0, y - 1, 2, 1, '#14141c');
}
function morceguinho(o) {
  const cy = o.sleep ? -14 : -22 + Math.round(Math.sin(o.t * 5) * 3), ph = Math.floor(o.t * 16) % 3, a = '#5a2a3a', b = '#3a1424';
  if (o.sleep) { R(-1, -16, 1, 4, '#3a3040'); R(-3, -12, 6, 7, b); R(-2, -12, 4, 6, a); R(-1, -7, 1, 1, '#ffe04a'); return; }
  const wy = [-4, -1, 2][ph];
  R(-8, cy + wy, 5, 2, b); R(4, cy + wy, 5, 2, b);
  R(-3, cy - 3, 7, 6, a); R(-3, cy - 5, 2, 2, a); R(2, cy - 5, 2, 2, a);
  R(-2, cy - 1, 1, 1, '#ffe04a'); R(1, cy - 1, 1, 1, '#ffe04a'); R(-1, cy + 2, 1, 1, '#ffffff');
}
function dragaozinho(o) {
  const cy = o.sleep ? -5 : -20 + Math.round(Math.sin(o.t * 3.5) * 2), up = Math.sin(o.t * 10) > 0, a = '#d83a2e', b = '#8a1a1e', c = '#f0b060';
  if (o.sleep) { R(-6, -5, 12, 5, a); R(-6, -2, 12, 2, c); R(5, -7, 5, 4, a); R(7, -6, 1, 1, '#2a0a0a'); R(-9, -3, 4, 2, a); R(-2, -8, 5, 3, b); return; }
  if (up) TRIw(-2, cy - 3, 3, cy - 10, 6, cy - 3, b); else TRIw(-2, cy - 2, 3, cy + 4, 6, cy - 2, b);
  R(-5, cy - 3, 10, 6, a); R(-4, cy + 1, 8, 2, c); R(-9, cy, 5, 2, a); R(-11, cy - 1, 2, 2, b);
  R(4 + o.atk * 2, cy - 7, 6, 5, a); R(9 + o.atk * 2, cy - 5, 2, 3, a); R(7 + o.atk * 2, cy - 6, 1, 1, '#ffe04a');
  R(5 + o.atk * 2, cy - 9, 1, 2, '#f4ecd8'); R(7 + o.atk * 2, cy - 9, 1, 2, '#f4ecd8');
  R(-3, cy + 3, 2, 2, b); R(2, cy + 3, 2, 2, b);
}
function TRIw(ax, ay, bx, by, cx, cy, c) {
  const minY = Math.min(ay, by, cy), maxY = Math.max(ay, by, cy);
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]].forEach(([x0, y0, x1, y1]) => { if (y >= Math.min(y0, y1) && y <= Math.max(y0, y1) && y0 !== y1) xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0)); });
    if (xs.length >= 2) R(Math.min(...xs), y, Math.max(1, Math.max(...xs) - Math.min(...xs) + 1), 1, c);
  }
}
const DRAW = { lobinho, coruja, gatinho, slimePet, morceguinho, dragaozinho };
export function drawPet(id, o) { (DRAW[id] || lobinho)(o); }
