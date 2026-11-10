// Motor do jogo: herói, monstros, chefões, baú, fogueira, efeitos e HUD da cena.
import { S, bus, today } from './state.js';
import { WEAPONS, ARMOR_SETS, SHIELDS, SKINS, HAIRS, CLOTHES, MONSTERS, BIOMES, PETS } from './data.js';
import { drawMonster, preloadSprites } from './monsters.js';
preloadSprites(MONSTERS);
import { drawPet } from './pets.js';
import {
  heroStats, isHard, furyOn, tiredOn, restedOn, isRest, biomeFor, slotKind, mStats,
  onKill, onSlotCleared, onHeroDeath, fmt, hasPet, petSad, petStage, petActive
} from './rules.js';
import {
  W, H, GY, R, setCtx, setFlash, setBuf, drawHero, drawHeroLying, scenery, drawChest, drawItemIcon, drawCampfire, rnd
} from './sprites.js';
import { look as gearLook, buffOn } from './gear.js';
import { focusLeft } from './week.js';
import { SFX, wantTrack } from './audio.js';
import { GEMS, socketOf, rollCard, checkSets, giveGem, auraColor } from './daily.js';
import { unlock as unlockStory } from './story.js';
import { equippedId } from './gear.js';
import { eventNow, dayPhase, isBirthday, EVENT_NAMES } from './events.js';

const HX = 96, TAU = Math.PI * 2;
let ctx, time = 0, bgOff = 0, shake = 0;
let mons = [], queue = [], spawnT = 0.6, parts = [], texts = [], ban = null, chests = [], chest = null;
let bossPending = null, lastBase = '', lastBiome = '';
const hero = { hp: 1, atk: null, atkT: 0.3, ang: 1.9, ext: 0, dx: 0, dy: 0, hurt: 0, block: 0, recoil: 0, victory: 0, combo: 0, shieldFwd: false };
let gibs = [];
const pet = { x: HX - 22, atkT: 1.5, atk: -1, cheer: 0 };
export const petCheer = () => { pet.cheer = 1.4; };
const flies = Array.from({ length: 7 }, (_, i) => ({ x: rnd(i + 40) * W, y: 60 + rnd(i + 60) * 55, p: rnd(i + 80) * 6 }));
const smoke = [];

// ---------- efeitos públicos ----------
export const float = (x, y, t, c, big) => texts.push({ x, y, t, c, life: 1, big });
export function burst(x, y, c, n) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 20 + Math.random() * 50; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: .6 + Math.random() * .4, c, sz: Math.random() > .5 ? 2 : 1 }); }
}
export const banner = (t, c) => { ban = { t, c, life: 2 }; };
export const queueChest = (ev) => chests.push(ev);
export const heroFx = { x: HX, y: GY };
export function fullHeal() { hero.hp = heroStats().maxHp; }

const isResting = () => isRest(today());
const gemmed = L => {
  const g = socketOf(equippedId('w')); if (!g) return L;
  return { ...L, weapon: { ...L.weapon, edge: GEMS[g].l, glow: true, glowC: GEMS[g].c, blade: L.weapon.blade } };
};
const heroLook = () => gemmed({
  ...gearLook(), sex: S.hero.sex || 'm', style: S.hero.style || 0, cls: S.hero.cls || 'guerreiro',
  skin: SKINS[S.hero.skin] || SKINS[0], hair: HAIRS[S.hero.hair] || HAIRS[0], cloth: CLOTHES[S.hero.cloth] || CLOTHES[0]
});

// ---------- pixel art: contorno colorido + luz de cima + sombra embaixo ----------
const BW = 176, BH = 150, BOX = 80, BOY = 132;      // tamanho do sprite e origem (pés)
const buf = document.createElement('canvas'); buf.width = BW; buf.height = BH;
const bctx = buf.getContext('2d', { willReadFrequently: true });
let bbox = null;
function pix(fn) {
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, BW, BH);
  bctx.setTransform(1, 0, 0, 1, BOX, BOY); bctx.imageSmoothingEnabled = false;
  setCtx(bctx); setBuf(true);
  try { fn(); } finally { setBuf(false); bctx.globalAlpha = 1; if (ctx) setCtx(ctx); }
  const img = bctx.getImageData(0, 0, BW, BH), d = img.data, n = BW * BH, m = new Uint8Array(n);
  let x0 = BW, y0 = BH, x1 = -1, y1 = -1;
  for (let i = 0; i < n; i++) {
    if (d[i * 4 + 3] >= 128) {
      m[i] = 1; d[i * 4 + 3] = 255;
      const x = i % BW, y = (i / BW) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    } else d[i * 4 + 3] = 0;
  }
  if (x1 < 0) { bbox = null; return; }
  const src = new Uint8ClampedArray(d);
  const ya = Math.max(0, y0 - 1), yb = Math.min(BH - 1, y1 + 1), xa = Math.max(0, x0 - 1), xb = Math.min(BW - 1, x1 + 1);
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    const i = y * BW + x, k = i * 4;
    if (m[i]) {
      const up = y > 0 && m[i - BW], dn = y < BH - 1 && m[i + BW], rt = x < BW - 1 && m[i + 1];
      const f = !up ? 0.26 : !dn ? -0.32 : !rt ? -0.16 : 0;
      if (f > 0) for (let c = 0; c < 3; c++) d[k + c] = src[k + c] + (255 - src[k + c]) * f;
      else if (f < 0) for (let c = 0; c < 3; c++) d[k + c] = src[k + c] * (1 + f);
    } else {
      const nb = y > 0 && m[i - BW] ? i - BW : y < BH - 1 && m[i + BW] ? i + BW : x > 0 && m[i - 1] ? i - 1 : x < BW - 1 && m[i + 1] ? i + 1 : -1;
      if (nb >= 0) { const q = nb * 4; d[k] = src[q] * 0.22 + 6; d[k + 1] = src[q + 1] * 0.22 + 6; d[k + 2] = src[q + 2] * 0.26 + 14; d[k + 3] = 255; }
    }
  }
  bctx.putImageData(img, 0, 0);
  bbox = { x: x0 - 1, y: y0 - 1, w: x1 - x0 + 3, h: y1 - y0 + 3 };
}
function blit(x, y, s = 1, alpha = 1, target = ctx) {
  target.globalAlpha = alpha;
  target.drawImage(buf, 0, 0, BW, BH, Math.round(x - BOX * s), Math.round(y - BOY * s), BW * s, BH * s);
  target.globalAlpha = 1;
}
// Contorno brilhante (aura dos elites): silhueta colorida atrás do sprite.
const aura = document.createElement('canvas'); aura.width = BW; aura.height = BH;
const actx = aura.getContext('2d');
function blitAura(x, y, s, color, alpha) {
  actx.globalCompositeOperation = 'source-over'; actx.clearRect(0, 0, BW, BH); actx.drawImage(buf, 0, 0);
  actx.globalCompositeOperation = 'source-in'; actx.fillStyle = color; actx.fillRect(0, 0, BW, BH);
  ctx.globalAlpha = alpha;
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]])
    ctx.drawImage(aura, 0, 0, BW, BH, Math.round(x - BOX * s) + ox, Math.round(y - BOY * s) + oy, BW * s, BH * s);
  ctx.globalAlpha = 1;
}
function groundShadow(x, w, a = 0.32) { ctx.fillStyle = 'rgba(0,0,0,' + a + ')'; ctx.fillRect(Math.round(x - w / 2), GY, Math.round(w), 1); ctx.fillRect(Math.round(x - w / 2 + 2), GY + 1, Math.round(w - 4), 1); }

// Monstro se despedaça: o sprite vira 6 pedaços que voam e quicam no chão.
function shatter(m) {
  pix(() => drawMonster({ ...m, state: 'fight', lunge: -1, under: false, emerge: 1 }, time));
  if (!bbox) return;
  const c = document.createElement('canvas'); c.width = bbox.w; c.height = bbox.h;
  c.getContext('2d').drawImage(buf, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
  const cols = 3, rows = 2, pw = Math.ceil(bbox.w / cols), ph = Math.ceil(bbox.h / rows);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const sx = q * pw, sy = r * ph;
    gibs.push({
      c, sx, sy, sw: pw, sh: ph, s: m.s,
      x: m.x + (bbox.x + sx + pw / 2 - BOX) * m.s, y: GY + (bbox.y + sy + ph / 2 - BOY) * m.s,
      vx: -10 + Math.random() * 70, vy: -70 - Math.random() * 50, rot: 0, vr: (Math.random() - 0.5) * 14, life: 1.5
    });
  }
}

// ---------- monstros ----------
let projs = [];
function makeMon(key, kind, opts = {}) {
  const st = S.stage, def = MONSTERS[key] || MONSTERS.slime;
  const s = mStats(st, key, kind);
  const tier = Math.floor((st - 1) / 3) % 4;
  const m = {
    key, def, kind, tier, name: def.n, hp: s.hp, max: s.hp, dmg: s.dmg, gold: s.gold,
    spd: def.spd, fly: !!def.fly, h: def.h, x: W + 34, state: 'walk', atkT: 1, flash: 0, kx: 0, lunge: -1, hitDone: false,
    seed: Math.random() * 10, s: kind === 'boss' ? 2 : kind === 'mini' ? 1.5 : 1, attacks: 0, wind: 0,
    under: !!def.burrow, emerge: def.burrow ? 0 : 1, trait: def.trait, shots: def.trait === 'ranged' ? 2 : 0, shootT: 0.4
  };
  if (def.tiers) { m.def = { ...def, pal: def.tiers[tier] }; m.name = def.tierNames[tier]; }
  if (def.img) m.s = 1;                         // desenho do Jean: o tamanho já vem no próprio desenho
  Object.assign(m, opts);
  return m;
}
// Elites: versões mais fortes que aparecem a partir da fase 3.
const ELITES = [
  { k: 'gigante', n: 'Gigante', c: '#ff9a3a', s: 1.4, hp: 2.2 },
  { k: 'veloz', n: 'Veloz', c: '#7af0ff', spd: 1.6, atkMul: 0.6, hp: 1.3 },
  { k: 'blindado', n: 'Blindado', c: '#c0c8d8', armor: 0.5, hp: 1.3 },
  { k: 'vampiro', n: 'Vampiro', c: '#ff4a6a', drain: true, hp: 1.5 },
  { k: 'explosivo', n: 'Explosivo', c: '#ffe04a', boom: true, hp: 1.4 }
];
function makeElite(m) {
  const E = ELITES[Math.floor(Math.random() * ELITES.length)];
  m.elite = E; m.hp = m.max = Math.round(m.max * E.hp); m.gold *= 2;
  if (E.s) { m.s *= E.s; m.dmg = Math.round(m.dmg * 1.3); }
  if (E.spd) m.spd *= E.spd;
  if (E.atkMul) m.atkMul = E.atkMul;
  if (E.armor) m.armor = E.armor;
  if (E.drain) m.trait = 'drain';
  return m;
}
const NIGHT_MONS = ['morcego', 'fantasma', 'morcegoV'].filter(k => MONSTERS[k]);
function spawn() {
  if (queue.length) { mons.push(queue.shift()); return; }
  const b = biomeFor(S.stage), kind = slotKind(), ev = eventNow();
  if (kind === 'blocked') {
    let key = b.mons[Math.floor(Math.random() * b.mons.length)];
    const m = makeMon(key, 'normal', { gate: true });
    mons.push(m); banner('CHEFÃO BLOQUEADO: CUMPRA 70% DA ROTINA', '#ff9a8a');
  } else if (kind === 'boss') {
    const m = makeMon(b.boss, 'boss', { mech: b.mech, summonKey: b.summon });
    if (b.nightmare && m.def.variant) {
      const v = m.def.variant;
      m.baseName = m.name; m.name = v.n; m.bkey = b.boss + '_v';
      m.def = { ...m.def, pal: { ...m.def.pal, ...v.pal }, imgFilter: v.imgFilter };
    }
    if (m.def.big) m.s = 1;
    if (b.mech === 'summon') m.thresholds = [0.66, 0.33];
    if (b.mech === 'dig') m.digT = 3.5;
    mons.push(m); banner('CHEFÃO: ' + m.name.toUpperCase(), '#ff6a5a'); SFX.boss();
  } else if (kind === 'mini') {
    const m = makeMon(ev === 'natal' ? 'bonecoNeve' : b.mini2 && Math.random() < 0.5 ? b.mini2 : b.mini, 'mini');
    mons.push(m); banner('MINI-CHEFÃO: ' + m.name.toUpperCase(), '#ffb04a');
  } else {
    let key, bonus = 1;
    const outdoor = !['caverna', 'castelo', 'inferno'].includes(b.id);
    if (ev === 'halloween' && Math.random() < 0.25) key = 'abobora';
    else if (outdoor && dayPhase() === 'noite' && NIGHT_MONS.length && Math.random() < 0.2) { key = NIGHT_MONS[Math.floor(Math.random() * NIGHT_MONS.length)]; bonus = 1.5; }
    else { do { key = b.mons[Math.floor(Math.random() * b.mons.length)]; } while (key === lastBase && b.mons.length > 1); lastBase = key; }
    const m = makeMon(key, 'normal');
    m.gold = Math.round(m.gold * bonus);
    if (S._elite || (S.stage >= 3 && Math.random() < 0.1)) makeElite(m);
    mons.push(m);
  }
}
const REACH = { dragao: 24, serpente: 10, hidra: 8, centopeia: 6, lobo: 6 };
const contactX = m => m.def.big ? HX + 12 + m.def.front * 0.85 : HX + 22 + (m.s - 1) * 9 + (REACH[m.def.draw] || 0) * m.s * 0.8;
const front = () => mons.filter(m => !m.retreat).sort((a, b) => a.x - b.x)[0] || null;
const monTop = m => m.h * m.s;
const monColor = m => (m.def.pal && m.def.pal.a) || '#ffffff';

function killMon(m) {
  onKill(m); SFX.kill();
  if (!m.child) {
    const card = rollCard(m);
    if (card) {
      float(m.x, GY - monTop(m) - 18, card.first ? 'CARTA NOVA!' : 'CARTA!', '#ffe08a', card.first);
      if (card.first) bus.emit('card', card);
      const sets = checkSets(); if (sets.length) bus.emit('card-set', sets);
    }
  }
  if (m.kind === 'boss' && !m.child && Math.random() < 0.5) { const g = giveGem(); float(m.x, GY - monTop(m) - 30, GEMS[g].n.toUpperCase() + '!', GEMS[g].l, true); bus.emit('gem', g); }
  shatter(m);
  burst(m.x, GY - monTop(m) / 2, monColor(m), m.kind === 'boss' ? 40 : 18);
  burst(m.x, GY - monTop(m) / 2, '#f2c14e', 6);
  float(m.x, GY - monTop(m) - 6, '+' + fmt(m.gold) + ' ouro', '#f2c14e');
  mons = mons.filter(x => x !== m);
  if (m.mech === 'split') {                    // Slime Colossal se divide em 3
    bossPending = m;
    for (let i = 0; i < 3; i++) {
      const c = makeMon('slime', 'normal', { name: 'Slime Filhote', child: true, s: 0.8 });
      c.def = { ...MONSTERS.slime, pal: MONSTERS.slime.tiers[0] };
      c.hp = c.max = Math.max(3, Math.round(m.max * 0.15)); c.gold = Math.round(m.gold * 0.05); c.dmg = Math.max(1, Math.round(m.dmg * 0.4));
      c.x = m.x + i * 14;
      if (i === 0) mons.push(c); else queue.push(c);
    }
    banner('ELE SE DIVIDIU!', '#a6f2a0');
  } else if (m.child) {
    if (m.summoner) { m.summoner.retreat = false; m.summoner.state = 'walk'; }
    if (bossPending && !mons.some(x => x.child) && !queue.length) { finishBoss(bossPending); bossPending = null; }
  } else if (m.kind === 'boss') {
    mons.filter(x => x.child).forEach(x => burst(x.x, GY - 12, monColor(x), 12));
    mons = mons.filter(x => !x.child);
    finishBoss(m);
  } else onSlotCleared(m.gate);
  if (m.elite && m.elite.boom) {
    burst(m.x, GY - 10, '#ffe04a', 26); burst(m.x, GY - 10, '#ff6a2a', 18); shake = 6;
    if (m.x - HX < 60) { const d = Math.max(1, Math.round(m.dmg * 1.5)); hero.hp -= d; hero.hurt = 0.45; float(HX - 4, GY - 34, '-' + d, '#ff6a5a', true); float(m.x, GY - 40, 'BUM!', '#ffe04a', true); if (hero.hp <= 0) heroDie(); }
  }
  if (!mons.length) spawnT = 0.7;
  bus.emit('kill', m);
}
function finishBoss(m) {
  const sk = m.bkey === 'golemCorrompido_v' ? 'final' : m.bkey ? null : m.key;
  if (sk && unlockStory(sk)) bus.emit('story', sk);
  banner(m.name.toUpperCase() + ' DERROTADO!', '#f2c14e');
  hero.victory = 1.8; hero.atk = null; projs = [];
  burst(HX + 30, GY - 30, '#ffe08a', 30);
  onSlotCleared();
}
function summon(boss) {
  const key = boss.summonKey || 'mumia', def = MONSTERS[key];
  boss.retreat = true; boss.state = 'walk'; boss.lunge = -1; boss.wind = 0;
  const c = makeMon(key, 'normal', { name: def.n + ' Invocad' + (/a$/.test(def.n.split(' ')[0]) ? 'a' : 'o'), child: true, summoner: boss });
  c.hp = c.max = Math.round(boss.max * 0.18); c.dmg = Math.round(boss.dmg * 0.5); c.gold = Math.round(boss.gold * 0.06);
  c.under = false; c.emerge = 1; c.shots = 0;
  c.x = contactX(c); c.state = 'fight'; c.atkT = 1.2;
  burst(boss.x, GY - 20, '#ffe04a', 14);
  boss.x = contactX(boss) + 46;
  mons.push(c);
  burst(c.x, GY - 6, monColor(c), 20); shake = 3;
  banner(boss.name.toUpperCase() + ' INVOCOU AJUDA!', '#ffe04a');
}
function heroDie() {
  if (S.potions && S.potions.vida > 0) {             // Poção de Vida: levanta na hora
    S.potions.vida--; fullHeal(); hero.hurt = 1;
    hero.slow = hero.frozen = hero.burn = 0;
    burst(HX, GY - 16, '#e84a5a', 20); burst(HX, GY - 16, '#ffffff', 10);
    float(HX, GY - 50, 'POÇÃO DE VIDA!', '#ff8a9a', true);
    bus.emit('potion-used', 'vida');
    return;
  }
  burst(HX, GY - 14, '#e85d4f', 24);
  onHeroDeath();
  mons = []; queue = []; projs = []; shots = []; bossPending = null; spawnT = 1.4;
  hero.slow = hero.frozen = hero.burn = 0;
  fullHeal(); hero.hurt = 1.2;
  bus.emit('hero-death');
}

// Dano no herói (golpe ou projétil), com bloqueio do escudo e efeitos do monstro.
function hitHero(m, heavy, Hs) {
  const raw = Math.round(m.dmg * (heavy ? 2.2 : 1));
  let d = Math.max(1, Math.round(raw * 0.25), raw - Hs.def);   // a defesa nunca zera o golpe
  if (petActive('absorb')) d = Math.max(1, Math.round(d * (1 - 0.1 * petStage().k)));
  const blocked = Hs.block > 0 && Math.random() < (heavy ? Hs.block * 0.6 : Hs.block);
  if (blocked) {
    d = heavy ? Math.max(1, Math.round(d * 0.3)) : 0;
    hero.block = 0.35; burst(HX + 8, GY - 16, '#fff0a0', 10);
    float(HX - 2, GY - 44, 'BLOQUEIO!', '#a6f2ff');
    if (d) { hero.hp -= d; float(HX - 4, GY - 34, '-' + d, '#ff6a5a'); }
  } else {
    hero.hp -= d; hero.hurt = 0.45; hero.recoil = 0.2; SFX.hurt();
    float(HX - 4, GY - 34, '-' + d, '#ff6a5a', heavy);
  }
  if (d > 0) {
    const t = m.trait, bossFreeze = m.mech === 'freeze' && heavy;
    if (t === 'drain') { const h = Math.round(d * 0.8); m.hp = Math.min(m.max, m.hp + h); float(m.x, GY - monTop(m) - 4, '+' + h, '#7af07a'); }
    const P = Hs.powers || {};
    if (t === 'web' && !P.noSlow && Math.random() < 0.35) { hero.slow = 2.5; float(HX, GY - 52, 'TEIA!', '#e8e8e8'); }
    if (!P.noFreeze && ((t === 'freeze' && Math.random() < 0.3) || bossFreeze)) { hero.frozen = bossFreeze ? 1.6 : 1.1; float(HX, GY - 52, 'CONGELADO!', '#8ad0f0'); burst(HX, GY - 14, '#bfe8ff', 12); }
    if (m.mech === 'quake' && heavy) { hero.frozen = 1.2; shake = 9; float(HX, GY - 52, 'TERREMOTO!', '#c8a070'); burst(HX + 10, GY - 2, '#8a7a5a', 18); }
    if (t === 'fire' && !P.noBurn && (heavy || Math.random() < 0.3)) { hero.burn = 3; float(HX, GY - 52, 'QUEIMANDO!', '#ff8a2a'); }
  }
  if (heavy || m.kind === 'boss') shake = heavy ? 6 : 3;
  if (hero.hp <= 0) { heroDie(); return true; }
  return false;
}

// ---------- loop ----------
function update(dt) {
  time += dt; if (shake > 0) shake = Math.max(0, shake - dt * 20);
  const Hs = heroStats(); if (hero.hp > Hs.maxHp) hero.hp = Hs.maxHp;
  const resting = isResting();
  const b = biomeFor(S.stage);
  const bKey = b.id + b.cycle;
  const vila = document.getElementById('p-vila');
  wantTrack(resting ? 'descanso' : vila && !vila.hidden ? 'vila' : mons.some(x => x.kind === 'boss') ? 'chefao' : b.id);
  if (bKey !== lastBiome) { if (lastBiome) banner((b.nightmare ? 'PESADELO: ' : '') + b.n.toUpperCase(), b.nightmare ? '#ff6a8a' : '#a6f2a0'); lastBiome = bKey; }

  parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g ?? 140) * dt; if (p.y > GY) { p.y = GY; p.vy *= -0.3; p.vx *= 0.6; } });
  parts = parts.filter(p => p.life > 0);
  gibs.forEach(g => {
    g.life -= dt; g.vy += 240 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.rot += g.vr * dt;
    if (g.y > GY - 2) { g.y = GY - 2; g.vy *= -0.28; g.vx *= 0.55; g.vr *= 0.5; }
  });
  gibs = gibs.filter(g => g.life > 0);
  texts.forEach(t => { t.life -= dt * 0.9; t.y -= 18 * dt; }); texts = texts.filter(t => t.life > 0);
  if (ban) { ban.life -= dt; if (ban.life <= 0) ban = null; }

  if (resting) {
    mons = []; queue = []; projs = [];
    hero.hp = Math.min(Hs.maxHp, hero.hp + Hs.maxHp * 0.1 * dt);
    if (Math.random() < dt * 4) smoke.push({ x: HX + 34 + Math.random() * 4, y: GY - 16, life: 2.5 });
    if (Math.random() < dt * 0.8) texts.push({ x: HX - 18, y: GY - 14, t: 'z', c: '#c8d0ff', life: 1.4 });
    smoke.forEach(s => { s.life -= dt; s.y -= 8 * dt; s.x += Math.sin(time + s.y) * 4 * dt; });
    for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].life <= 0) smoke.splice(i, 1);
    return;
  }

  if (chest) { chest.t += dt; if (chest.t > 3.4) chest = null; return; }
  if (chests.length && !mons.some(m => m.state === 'fight')) { chest = { ...chests.shift(), t: 0 }; return; }

  if (!mons.length) { spawnT -= dt; if (spawnT <= 0) spawn(); }
  const f = front();
  const fighting = f && f.state === 'fight';
  const speed = tiredOn() ? 26 : 38;
  if (!fighting) { bgOff += speed * dt; hero.hp = Math.min(Hs.maxHp, hero.hp + Hs.maxHp * (0.04 + S.attrs.vit / 4000) * dt); }

  // efeitos no herói
  hero.slow = Math.max(0, (hero.slow || 0) - dt); hero.frozen = Math.max(0, (hero.frozen || 0) - dt);
  if (hero.burn > 0) {
    hero.burn -= dt; hero.hp -= Hs.maxHp * 0.025 * dt;
    if (Math.random() < dt * 18) parts.push({ x: HX - 5 + Math.random() * 10, y: GY - 4 - Math.random() * 22, vx: 0, vy: -30, g: 0, life: .4, c: Math.random() > .5 ? '#ff8a2a' : '#ffd04a', sz: 1 });
    if (hero.hp <= 0) { heroDie(); return; }
  }

  // projéteis
  for (const p of projs) {
    p.x += p.vx * dt; if (p.vy != null) { p.vy += 160 * dt; p.y += p.vy * dt; }
    if (p.x <= HX + 8) {
      p.dead = true;
      burst(HX + 6, p.y, p.kind === 'pocao' ? '#58d47a' : '#e8e0d0', 6);
      if (hitHero(p.src, false, Hs)) return;
    }
  }
  projs = projs.filter(p => !p.dead && p.x > -10);

  for (const m of [...mons]) {                 // efeitos das gemas: fogo, gelo e veneno
    if (m.burnT > 0) { m.burnT -= dt; m.hp -= m.dot * dt; if (Math.random() < dt * 14) parts.push({ x: m.x + (Math.random() - .5) * 14, y: GY - monTop(m) * Math.random(), vx: 0, vy: -30, g: 0, life: .4, c: Math.random() < .5 ? '#ff8a2a' : '#ffe04a', sz: 1 }); }
    if (m.poisonT > 0) { m.poisonT -= dt; m.hp -= m.dot * 0.7 * dt; if (Math.random() < dt * 10) parts.push({ x: m.x + (Math.random() - .5) * 14, y: GY - monTop(m) * Math.random(), vx: 0, vy: -15, g: 0, life: .5, c: '#5ae07a', sz: 1 }); }
    if (m.iceT > 0) { m.iceT -= dt; m.atkT += dt * 0.85; }
    if (m.hp <= 0 && mons.includes(m)) killMon(m);
  }
  for (const m of mons) {
    m.flash = Math.max(0, m.flash - dt); m.kx = Math.max(0, m.kx - 35 * dt);
    if (m.trait === 'regen' && m.hp < m.max && m.hp > 0) m.hp = Math.min(m.max, m.hp + m.max * 0.012 * dt);
    if (m.thrown) { m.thrown -= dt; if (m.thrown <= 0) m.thrown = 0; }
    if (m.state === 'walk' || m.state === 'shoot') {
      if (m.retreat) {
        const tx = contactX(m) + 46;
        m.x += Math.sign(tx - m.x) * Math.min(Math.abs(tx - m.x), 30 * dt);
        continue;
      }
      const shooting = m.state === 'shoot';
      const move = (fighting ? 0 : speed) + (shooting ? 0 : m.spd);
      const stop = m === f ? contactX(m) : Math.max(contactX(m), (f ? f.x : 0) + 16);
      m.x -= move * dt;
      if (m === f && m.shots > 0 && !shooting && m.x <= contactX(m) + 90) { m.state = 'shoot'; m.shootT = 0.35; }
      if (m.state === 'shoot' && m === f) {
        m.shootT -= dt;
        if (m.shootT <= 0 && m.shots > 0) {
          m.shots--; m.shootT = 1.1; m.thrown = 0.5;
          const y = GY - monTop(m) * 0.62;
          projs.push(m.def.proj === 'pocao'
            ? { x: m.x - 8, y: y - 6, vx: -110, vy: -70, kind: 'pocao', src: m }
            : { x: m.x - 8, y, vx: -170, kind: m.def.proj || 'lanca', src: m });
        }
        if (m.shots <= 0 && m.shootT < 0.6) m.state = 'walk';
      }
      if (m.x <= stop) {
        m.x = stop;
        if (m === f) {
          if (m.under) { m.under = false; m.emerge = 0; burst(m.x, GY - 4, (m.def.pal && m.def.pal.dirt) || '#d8b070', 14); }
          m.state = 'fight';
        }
      }
    } else if (m.state === 'fight' && m === f) {
      if (m.emerge < 1) {
        m.emerge = Math.min(1, m.emerge + dt / 0.45);
        if (m.emerge >= 1 && m.bite) { m.bite = false; m.lunge = 0; m.hitDone = false; m.heavy = true; }
        continue;
      }
      // Serpente: mergulha no chão e volta com um bote
      if (m.mech === 'dig') {
        if (m.digging > 0) {
          m.digging -= dt;
          if (m.digging <= 0) { m.under = false; m.emerge = 0; m.bite = true; m.digT = 4.5; burst(m.x - 10, GY - 4, m.def.pal.dirt, 18); shake = 4; }
          continue;
        }
        m.digT -= dt;
        if (m.digT <= 0 && m.lunge < 0 && m.wind <= 0) { m.under = true; m.digging = 1.3; burst(m.x, GY - 4, m.def.pal.dirt, 18); float(m.x, GY - 40, 'MERGULHOU!', '#d8d0a0'); continue; }
      }
      // Dragão: fica enfurecido com pouca vida
      if (m.mech === 'dragon' && !m.enraged && m.hp / m.max < 0.35) { m.enraged = true; banner('O DRAGÃO SE ENFURECEU!', '#ff6a3a'); shake = 6; }
      if (m.wind > 0) {
        m.wind -= dt; if (Math.random() < dt * 20) shake = Math.max(shake, 1);
        if (m.mech === 'dragon' || m.trait === 'fire') m.breath = 1;
        if (m.wind <= 0) { m.lunge = 0; m.hitDone = false; m.heavy = true; }
      } else {
        m.atkT -= dt;
        if (m.atkT <= 0 && m.lunge < 0) {
          m.attacks++;
          m.atkT = m.trait === 'fast' ? 1.0 : m.enraged ? 1.05 : m.kind === 'normal' ? 1.5 : 1.7; if (m.atkMul) m.atkT *= m.atkMul;
          const every = m.enraged ? 2 : 3;
          if (m.kind !== 'normal' && m.attacks % every === 0) { m.wind = 0.75; SFX.warn(); }
          else { m.lunge = 0; m.hitDone = false; m.heavy = false; }
        }
      }
      if (m.breath && m.lunge >= 0 && m.heavy) {   // bafo de fogo
        for (let i = 0; i < 3; i++) parts.push({ x: m.def.big ? m.x - m.def.front - 4 : m.x - 15 * m.s, y: GY - monTop(m) * (m.def.big ? 0.62 : 0.7), vx: -120 - Math.random() * 60, vy: (Math.random() - 0.5) * 30, g: 0, life: .4, c: ['#ff6a1a', '#ffd04a', '#fff0a0'][i], sz: 2 });
      }
      if (m.lunge >= 0) {
        m.lunge += dt / 0.32;
        if (m.lunge >= 0.5 && !m.hitDone) { m.hitDone = true; if (hitHero(m, m.heavy, Hs)) return; }
        if (m.lunge >= 1) { m.lunge = -1; m.breath = 0; }
      }
    }
  }

  hero.hurt = Math.max(0, hero.hurt - dt); hero.block = Math.max(0, hero.block - dt); hero.recoil = Math.max(0, hero.recoil - dt);
  updatePet(dt, Hs, fighting, f);
  updateHeroAnim(dt, Hs, fighting, f);
  for (const sh of shots) {                     // magia e flecha voando até o monstro
    const t = sh.t, tx = t && mons.includes(t) ? t.x - 6 : sh.x + 999;
    sh.x += 280 * dt; sh.life = (sh.life || 0) + dt;
    if (sh.kind === 'cast' && Math.random() < 0.6) parts.push({ x: sh.x - 2, y: sh.y + (Math.random() - .5) * 4, vx: -20, vy: 0, g: 0, life: .25, c: sh.e, sz: 1 });
    if (sh.x >= tx) { sh.done = true; if (mons.includes(t)) { heroHit(t, sh.a); burst(t.x - 4, sh.y, sh.kind === 'cast' ? sh.c : '#e8e0d0', sh.a.crit ? 12 : 6); } }
    if (sh.life > 1.5) sh.done = true;
  }
  shots = shots.filter(x => !x.done);

  if (furyOn() && Math.random() < dt * 14) parts.push({ x: HX - 5 + Math.random() * 10, y: GY - 4 - Math.random() * 24, vx: 0, vy: -25, life: .5, c: '#ff6a5a', sz: 1 });
  if (tiredOn() && Math.random() < dt * 1.5) parts.push({ x: HX + 5, y: GY - 28, vx: 6, vy: 0, life: .7, c: '#7ab8ff', sz: 1 });
}

const ATK = {
  down: { d: 0.22, h: 0.5, mult: 1, kx: 4 }, up: { d: 0.22, h: 0.5, mult: 1, kx: 4 },
  thrust: { d: 0.24, h: 0.45, mult: 1.15, kx: 7 }, spin: { d: 0.44, h: 0.62, mult: 1.6, kx: 9 },
  leap: { d: 0.54, h: 0.8, mult: 2.2, kx: 11 }, bash: { d: 0.3, h: 0.5, mult: 0.6, kx: 13 },
  cast: { d: 0.34, h: 0.55, mult: 1, kx: 5 }, shoot: { d: 0.3, h: 0.5, mult: 1, kx: 5 }
};
// Mago e arqueiro atacam de longe: a magia ou a flecha voa até o monstro.
let shots = [];
const heroCls = () => (S.hero && S.hero.cls) || 'guerreiro';
function startAttack(Hs) {
  const crit = Math.random() < Hs.crit, hasShield = !!heroLook().shield, cls = heroCls();
  if (cls !== 'guerreiro') { hero.combo++; hero.atk = { type: cls === 'mago' ? 'cast' : 'shoot', t: 0, crit, hit: false, critMul: crit ? 2.2 : 1 }; return; }
  const type = crit ? 'leap' : hasShield && Math.random() < 0.14 ? 'bash' : hero.combo % 6 === 5 ? 'spin' : ['down', 'up', 'thrust'][hero.combo % 3];
  hero.combo++;
  hero.atk = { type, t: 0, crit, hit: false };
}
function heroHit(m, a) {
  if (!m || m.retreat) return;
  if (m.under) { float(m.x, GY - 20, 'ESQUIVOU', '#c0c0c0'); return; }
  const Hs = heroStats(), A = ATK[a.type], crit = a.crit;
  const dmg = Math.max(1, Math.round(Hs.atk * A.mult * (a.critMul || 1) * (0.9 + Math.random() * 0.2) * (1 - (m.armor || 0) * (crit ? 0.3 : 1))));
  m.hp -= dmg;
  if (Hs.powers && Hs.powers.leech) hero.hp = Math.min(Hs.maxHp, hero.hp + dmg * Hs.powers.leech); m.flash = 0.1; m.kx = A.kx; (crit ? SFX.crit : SFX.hit)();
  const gem = socketOf(equippedId('w'));
  if (gem && m.hp > 0 && Math.random() < (crit ? 0.6 : 0.22)) {
    m.dot = Math.max(m.dot || 0, Hs.atk * 0.35);
    if (gem === 'rubi') { m.burnT = 3; float(m.x, GY - monTop(m) - 16, 'QUEIMANDO', GEMS.rubi.l); }
    if (gem === 'esmeralda') { m.poisonT = 5; float(m.x, GY - monTop(m) - 16, 'ENVENENADO', GEMS.esmeralda.l); }
    if (gem === 'safira') { m.iceT = 1.4; float(m.x, GY - monTop(m) - 16, 'CONGELADO', GEMS.safira.l); burst(m.x, GY - monTop(m) / 2, '#bfe8ff', 10); }
  }
  if (petActive('leech')) hero.hp = Math.min(Hs.maxHp, hero.hp + dmg * 0.05 * petStage().k);
  float(m.x + 2, GY - monTop(m) - 4, crit ? dmg + '!' : String(dmg), crit ? '#ffd04a' : a.type === 'spin' ? '#a6f2ff' : '#ffffff', crit || a.type === 'spin');
  burst(m.x - 4, GY - monTop(m) / 2, heroLook().weapon.edge, crit ? 10 : a.type === 'spin' ? 8 : 4);
  if (a.type === 'bash') {
    m.atkT = Math.max(m.atkT, 1.5); m.lunge = -1; m.wind = 0;
    float(m.x, GY - monTop(m) - 14, 'ATORDOADO', '#ffe04a');
    const sh = heroLook().shield || SHIELDS[0]; burst(HX + 12, GY - 16, sh.emb, 8);
  }
  if (a.type === 'leap') { burst(HX + 6, GY - 1, '#c9b090', 10); }
  if (crit) shake = 5; else if (a.type === 'spin') shake = 2;
  if (m.thresholds && m.thresholds.length && m.hp > 0 && m.hp / m.max < m.thresholds[0]) {
    m.thresholds.shift(); summon(m);
  }
  if (m.hp <= 0) killMon(m);
}

function updatePet(dt, Hs, fighting, f) {
  if (!hasPet()) return;
  const id = S.pet, P = PETS[id], st = petStage(), sad = petSad();
  pet.cheer = Math.max(0, pet.cheer - dt);
  if (pet.cheer > 0 && Math.random() < dt * 6) parts.push({ x: pet.x + 2, y: GY - 18, vx: 0, vy: -18, g: 0, life: .6, c: '#ff6a8a', sz: 2 });
  if (sad) { if (Math.random() < dt * 0.8) parts.push({ x: pet.x + 6, y: GY - 12, vx: 0, vy: 10, life: .5, c: '#58a8ff', sz: 1 }); pet.atk = -1; pet.x += (HX - 22 - pet.x) * Math.min(1, dt * 6); return; }
  if (P.ability === 'heal' && fighting) { hero.hp = Math.min(Hs.maxHp, hero.hp + Hs.maxHp * 0.008 * st.k * dt); if (Math.random() < dt * 1.2) parts.push({ x: HX + Math.random() * 6 - 3, y: GY - 30, vx: 0, vy: -14, g: 0, life: .6, c: '#7af07a', sz: 1 }); }
  const attacker = P.ability === 'bite' || P.ability === 'fire';
  if (attacker && fighting && f && !f.under && pet.atk < 0) {
    pet.atkT -= dt;
    if (pet.atkT <= 0) { pet.atk = 0; pet.atkT = P.ability === 'bite' ? 2.0 : 2.6; pet.hit = false; }
  }
  if (pet.atk >= 0) {
    pet.atk += dt / 0.5;
    const tgt = f ? f.x - 12 - (f.def.big ? f.def.front * 0.6 : 0) : HX;
    pet.x = HX - 22 + (tgt - (HX - 22)) * Math.sin(Math.min(1, pet.atk) * Math.PI) * (P.ability === 'bite' ? 1 : 0.35);
    if (pet.atk >= 0.5 && !pet.hit && f) {
      pet.hit = true;
      const dmg = Math.max(1, Math.round(Hs.atk * (P.ability === 'bite' ? 0.25 : 0.4) * st.k));
      f.hp -= dmg; f.flash = 0.08;
      float(f.x, GY - monTop(f) - 12, String(dmg), P.ability === 'fire' ? '#ffb04a' : '#e8e8f8');
      if (P.ability === 'fire') for (let i = 0; i < 10; i++) parts.push({ x: pet.x + 10, y: GY - 22, vx: 90 + Math.random() * 60, vy: (Math.random() - 0.5) * 30, g: 0, life: .45, c: ['#ff6a1a', '#ffd04a'][i % 2], sz: 2 });
      if (f.hp <= 0) killMon(f);
    }
    if (pet.atk >= 1) { pet.atk = -1; pet.x = HX - 22; }
  } else pet.x += (HX - 22 + (fighting ? 0 : Math.sin(time * 3) * 2) - pet.x) * Math.min(1, dt * 6);
}

function updateHeroAnim(dt, Hs, fighting, f) {
  const k = Math.min(1, dt * 12);
  if (hero.victory > 0) {                      // pose de vitória: espada para o alto
    hero.victory -= dt; hero.atk = null;
    hero.ang += (-0.15 - hero.ang) * k; hero.ext = 0; hero.dx *= 1 - k;
    hero.dy = -Math.abs(Math.sin(time * 7)) * 4;
    if (Math.random() < dt * 10) parts.push({ x: HX + 4 + Math.random() * 6, y: GY - 50, vx: 0, vy: -20, life: .5, c: '#ffe08a', sz: 1 });
    return;
  }
  if (fighting && f.emerge >= 1 && !hero.atk && !(hero.frozen > 0)) {
    hero.atkT -= dt * (hero.slow > 0 ? 0.55 : 1);
    if (hero.atkT <= 0) { startAttack(Hs); hero.atkT = Hs.atkInt; }
  }
  const a = hero.atk;
  if (a) {
    const A = ATK[a.type]; a.t += dt;
    const p = Math.min(1, a.t / A.d), e = 1 - (1 - p) * (1 - p), sp = Math.sin(p * Math.PI);
    hero.shieldFwd = false; hero.ext = 0; hero.dy = 0; hero.dx = 0;
    if (a.type === 'down') hero.ang = -1.0 + e * 3.6;
    else if (a.type === 'up') hero.ang = 2.6 - e * 3.6;
    else if (a.type === 'thrust') { hero.ang = 1.5; hero.ext = sp * 7; hero.dx = sp * 4; }
    else if (a.type === 'spin') { hero.ang = -1.0 + e * (TAU + 0.6); hero.dy = -sp * 4; }
    else if (a.type === 'leap') {
      const q = Math.min(1, p / 0.8);
      hero.dy = -16 * Math.sin(q * Math.PI); hero.dx = sp * 8;
      hero.ang = p < 0.5 ? -1.4 : -1.4 + Math.min(1, (p - 0.5) / 0.3) * 4.0;
    } else if (a.type === 'bash') { hero.ang = 2.3; hero.shieldFwd = p > 0.12 && p < 0.88; hero.dx = sp * 6; }
    else if (a.type === 'cast') { hero.ang = p < 0.5 ? 1.9 - e * 2.6 : -0.7 + (p - 0.5) * 4.4; hero.dy = -sp * 2; }
    else if (a.type === 'shoot') { hero.ang = 1.57; hero.draw = p < A.h; hero.dx = p > A.h ? -sp * 2 : 0; }
    if (!a.hit && p >= A.h) {
      a.hit = true;
      if (a.type === 'cast' || a.type === 'shoot') {
        const t = front(); if (t) (a.type === 'cast' ? SFX.magic : SFX.arrow)(); if (t) shots.push({ x: HX + 14, y: GY - (a.type === 'cast' ? 34 : 20), t, a, kind: a.type, c: heroLook().weapon.blade, e: heroLook().weapon.edge });
      } else heroHit(front(), a);
    }
    if (p >= 1) { hero.atk = null; hero.shieldFwd = false; hero.draw = false; }
  } else {
    const idle = 1.9 + (!fighting ? Math.sin(time * 8) * 0.08 : 0);
    hero.ang += (idle - hero.ang) * k; hero.ext *= 1 - k; hero.dx *= 1 - k; hero.dy *= 1 - k;
  }
}

function txt(t, x, y, c, size, align) {
  ctx.font = '700 ' + size + "px 'Pixelify Sans', monospace"; ctx.textAlign = align || 'center';
  ctx.fillStyle = '#0a0e22'; ctx.fillText(t, x + 1, y + 1); ctx.fillStyle = c; ctx.fillText(t, x, y);
}
function drawLayer(c, off) { const x = -Math.floor(((off % W) + W) % W); ctx.drawImage(c, x, 0, W, H); ctx.drawImage(c, x + W, 0, W, H); }

function draw() {
  const resting = isResting();
  const sc = scenery(resting ? 'floresta' : biomeFor(S.stage).id);
  ctx.save();
  if (shake > 0) ctx.translate(Math.round((Math.random() - .5) * shake), Math.round((Math.random() - .5) * shake));
  ctx.drawImage(sc.sky, 0, 0, W, H);
  const bid = resting ? 'floresta' : biomeFor(S.stage).id, outdoor = ['floresta', 'deserto', 'neve', 'pantano'].includes(bid);
  const phase = outdoor ? dayPhase() : null;
  if (phase) {                                    // céu acompanha a hora do dia
    ctx.save();
    if (phase === 'dia') { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(110,150,230,.55)'; }
    else if (phase === 'noite') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(6,8,30,.45)'; }
    else { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(230,120,70,.35)'; }
    ctx.fillRect(0, 0, W, H); ctx.restore();
    if (phase === 'noite') {
      for (let i = 0; i < 18; i++) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + i)); R(Math.floor(rnd(i + 300) * W), Math.floor(rnd(i + 400) * 60), 1, 1, '#ffffff'); }
      ctx.globalAlpha = 1;
    }
  }
  drawLayer(sc.far, bgOff * 0.15); drawLayer(sc.mid, bgOff * 0.45);
  flies.forEach(f => { const a = (Math.sin(time * 2 + f.p) + 1) / 2; ctx.globalAlpha = 0.3 + a * 0.6; R((f.x - (bgOff * 0.45) % W + W * 2) % W, f.y + Math.sin(time + f.p) * 4, 1, 1, sc.fly); });
  ctx.globalAlpha = 1;
  drawLayer(sc.ground, bgOff);
  if (phase === 'noite') { ctx.fillStyle = 'rgba(6,8,30,.3)'; ctx.fillRect(0, 0, W, H); }
  else if (phase === 'amanhecer' || phase === 'entardecer') { ctx.fillStyle = 'rgba(255,140,60,.08)'; ctx.fillRect(0, 0, W, H); }
  drawEventDecor();

  const look = heroLook();
  if (resting) {
    ctx.fillStyle = 'rgba(8,10,34,.38)'; ctx.fillRect(0, 0, W, H);
    // espada fincada no chão
    R(HX + 14, GY - 12, 2, 12, look.weapon.blade); R(HX + 12, GY - 14, 6, 2, look.weapon.guard); R(HX + 14, GY - 18, 2, 4, '#5a3a20');
    drawCampfire(HX + 36, GY, time);
    smoke.forEach(s => { ctx.globalAlpha = Math.min(0.5, s.life / 4); R(s.x, s.y, 2, 2, '#9aa0b8'); }); ctx.globalAlpha = 1;
    pix(() => drawHeroLying({ ...look, x: -6, y: 0, time })); blit(HX, GY);
    if (hasPet()) { pix(() => drawPet(S.pet, { t: time, sleep: true })); blit(HX + 56, GY, [1, 1.25, 1.5][petStage().idx]); }
  } else {
    const walking = !(front() && front().state === 'fight') && !chest && hero.victory <= 0;
    if (hasPet()) {
      const P = PETS[S.pet], k = [1, 1.25, 1.5][petStage().idx];
      if (!P.fly) groundShadow(pet.x, 9 * k, 0.28);
      pix(() => drawPet(S.pet, { t: time, walk: walking, sad: petSad(), sleep: false, atk: pet.atk >= 0 ? Math.sin(pet.atk * Math.PI) : 0 }));
      blit(pet.x, GY, k);
    }
    const rec = hero.recoil > 0 ? -Math.sin(hero.recoil / 0.2 * Math.PI) * 3 : 0;
    const hx = hero.dx + rec;
    groundShadow(HX + hx, Math.max(6, 14 + hero.dy * 0.5));
    const a = hero.atk;
    if (a && a.type !== 'thrust' && a.type !== 'bash' && a.type !== 'cast' && a.type !== 'shoot') {   // rastro do golpe
      const A = ATK[a.type], p = Math.min(1, a.t / A.d);
      const a0 = a.type === 'up' ? 2.6 : a.type === 'leap' ? -1.4 : -1.0;
      if (p > 0.08 && !(a.type === 'leap' && p < 0.5)) {
        const Lg = look.weapon.len;
        ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = look.weapon.edge; ctx.lineWidth = Lg - 2;
        ctx.beginPath(); ctx.arc(HX + hx + 2, GY + hero.dy - 17, 10 + Lg / 2, a0 - Math.PI / 2, hero.ang - Math.PI / 2, a.type === 'up');
        ctx.stroke(); ctx.restore();
      }
    }
    pix(() => drawHero({ ...look, x: 0, y: 0, dx: hx, dy: hero.dy, walk: walking, step: Math.floor(time * 9) % 2,
      ang: hero.ang, ext: hero.ext, shieldFwd: hero.shieldFwd || hero.block > 0, draw: hero.draw, time }));
    const au = auraColor(); if (au) blitAura(HX, GY, 1, au, 0.55 + 0.3 * Math.sin(time * 4));
    blit(HX, GY, 1, hero.hurt > 0 && Math.floor(time * 20) % 2 ? 0.35 : 1);
    if (hero.frozen > 0) { ctx.fillStyle = 'rgba(160,220,255,.38)'; ctx.fillRect(HX - 9 + hx, GY - 34 + hero.dy, 20, 34); R(HX - 6 + hx, GY - 30, 1, 1, '#ffffff'); R(HX + 5 + hx, GY - 14, 1, 1, '#ffffff'); }
    if (hero.slow > 0) { ctx.globalAlpha = 0.7; R(HX - 8, GY - 22, 16, 1, '#e8e8e8'); R(HX - 6, GY - 12, 13, 1, '#e8e8e8'); R(HX - 3, GY - 26, 1, 16, '#e8e8e8'); R(HX + 4, GY - 20, 1, 12, '#d0d0d0'); ctx.globalAlpha = 1; }
    for (const m of mons.slice().sort((a, b) => b.x - a.x)) drawMon(m);
    shots.forEach(sh => {
      if (sh.kind === 'cast') { const r = sh.a.crit ? 3 : 2; ctx.globalAlpha = 0.45; R(sh.x - r - 1, sh.y - r - 1, r * 2 + 3, r * 2 + 3, sh.c); ctx.globalAlpha = 1; R(sh.x - r, sh.y - r, r * 2 + 1, r * 2 + 1, sh.c); R(sh.x - 1, sh.y - 1, 2, 2, '#ffffff'); }
      else { R(sh.x - 10, sh.y, 11, 1, '#8a6a4a'); R(sh.x, sh.y - 1, 3, 3, '#c8d0d8'); R(sh.x - 11, sh.y - 1, 2, 3, '#e8e0d0'); if (sh.a.crit) R(sh.x - 6, sh.y - 1, 6, 1, '#ffe04a'); }
    });
    projs.forEach(p => {
      if (p.kind === 'lanca') { R(p.x, p.y, 13, 1, '#8a5a2a'); R(p.x - 2, p.y - 1, 3, 3, '#c8d0d8'); }
      else if (p.kind === 'flecha') { R(p.x, p.y, 10, 1, '#8a6a4a'); R(p.x - 2, p.y - 1, 2, 3, '#c8d0d8'); R(p.x + 9, p.y - 1, 2, 3, '#e8e0d0'); }
      else { R(p.x - 2, p.y - 2, 5, 5, '#58d47a'); R(p.x - 1, p.y - 4, 3, 2, '#c8e0c0'); R(p.x - 1, p.y - 1, 1, 1, '#ffffff'); }
    });
    gibs.forEach(g => {
      ctx.save(); ctx.translate(Math.round(g.x), Math.round(g.y)); ctx.rotate(g.rot); ctx.globalAlpha = Math.min(1, g.life * 1.5);
      ctx.drawImage(g.c, g.sx, g.sy, g.sw, g.sh, -g.sw * g.s / 2, -g.sh * g.s / 2, g.sw * g.s, g.sh * g.s);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    if (chest) drawChestSeq();
  }
  parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); R(p.x, p.y, p.sz, p.sz, p.c); }); ctx.globalAlpha = 1;
  texts.forEach(t => { ctx.globalAlpha = Math.min(1, t.life * 2); txt(t.t, t.x, t.y, t.c, t.big ? 10 : 7); }); ctx.globalAlpha = 1;
  ctx.restore();
  drawHUD(resting);
}
const EV_DECOR = Array.from({ length: 5 }, (_, i) => ({ x: rnd(i + 500) * W, k: rnd(i + 600) }));
const snow = Array.from({ length: 40 }, (_, i) => ({ x: rnd(i + 700) * W, y: rnd(i + 800) * H, v: 10 + rnd(i + 900) * 14 }));
function drawEventDecor() {
  const ev = eventNow(); if (!ev) return;
  for (const d of EV_DECOR) {
    const x = Math.floor(((d.x - bgOff) % W + W) % W);
    if (ev === 'halloween') {
      R(x - 4, GY - 6, 9, 6, '#e87a1a'); R(x - 2, GY - 6, 1, 6, '#a84a0a'); R(x + 2, GY - 6, 1, 6, '#a84a0a'); R(x, GY - 8, 2, 2, '#4a7a2a');
      if (d.k > 0.5) { const g = Math.floor(time * 4 + d.k * 9) % 3 ? '#ffe04a' : '#ffb020'; R(x - 2, GY - 4, 1, 1, g); R(x + 2, GY - 4, 1, 1, g); R(x - 1, GY - 2, 3, 1, g); }
    } else if (ev === 'natal') {
      R(x - 6, GY - 2, 13, 2, '#f4f8ff');
      if (d.k > 0.5) { R(x - 3, GY - 6, 6, 4, '#d83a3a'); R(x, GY - 6, 1, 4, '#f2c14e'); R(x - 3, GY - 5, 6, 1, '#f2c14e'); }
    }
  }
  if (ev === 'natal') {
    ctx.globalAlpha = 0.85;
    for (const f of snow) { const y = (f.y + time * f.v) % H, x = Math.floor((f.x + Math.sin(time + f.v) * 6 - bgOff * 0.3) % W + W) % W; R(x, Math.floor(y), 1, 1, '#ffffff'); }
    ctx.globalAlpha = 1;
  }
}
function drawMon(m) {
  const lunge = m.lunge >= 0 ? Math.sin(m.lunge * Math.PI) * 6 : 0;
  const x = Math.round(m.x + m.kx - lunge);
  if (!m.under) groundShadow(x, (m.fly ? 8 : 13) * m.s, m.fly ? 0.18 : 0.32);
  pix(() => { setFlash(m.flash > 0 ? 1 : (m.wind > 0 && Math.floor(time * 14) % 2 ? 2 : 0)); drawMonster(m, time); setFlash(0); });
  if (m.elite && !m.under) blitAura(x, GY, m.s, m.elite.c, 0.55 + 0.35 * Math.sin(time * 6));
  blit(x, GY, m.s, m.retreat ? 0.85 : 1);
  if (m.under) return;
  const top = Math.max(m.elite ? 22 : 14, GY - monTop(m) - 8), bw = m.kind === 'boss' ? 44 : m.kind === 'mini' ? 32 : 24;
  R(x - bw / 2 - 1, top - 1, bw + 2, 4, '#0a0e22');
  R(x - bw / 2, top, bw * Math.max(0, m.hp / m.max), 2, m.kind === 'boss' ? '#ff6a5a' : m.kind === 'mini' ? '#ffb04a' : '#6cc04a');
  ctx.font = "600 6px 'Pixelify Sans', monospace"; ctx.textAlign = 'center';
  ctx.fillStyle = '#0a0e22'; ctx.fillText(m.name, x + .5, top - 2.5);
  ctx.fillStyle = m.kind === 'boss' ? '#ffb0a6' : m.kind === 'mini' ? '#ffd8a0' : '#d8ddff'; ctx.fillText(m.name, x, top - 3);
  if (m.elite) { const t = 'ELITE ' + m.elite.n.toUpperCase(); ctx.fillStyle = '#0a0e22'; ctx.fillText(t, x + .5, top - 9.5); ctx.fillStyle = m.elite.c; ctx.fillText(t, x, top - 10); }
}
function drawChestSeq() {
  const t = chest.t, cx = HX + 22;
  let y = GY;
  if (t < 0.4) y = GY - 60 * (1 - t / 0.4);
  let jx = 0; if (t > 0.4 && t < 1.2) jx = Math.round(Math.sin(t * 50) * 1.5);
  const open = t >= 1.2;
  if (open && !chest.burst) { chest.burst = true; burst(cx, GY - 14, '#ffe08a', 26); shake = 3; }
  drawChest(cx + jx, y, open, t);
  if (open) {
    const rise = Math.min(1, (t - 1.2) / 0.5);
    drawItemIcon(cx, GY - 26 - rise * 14, chest.item, chest.kind);
    const LBL = { weapon: 'NOVA ARMA', shield: 'NOVO ESCUDO', helm: 'NOVO CAPACETE', chest: 'NOVO PEITORAL', legs: 'NOVAS GREVAS', pet: 'NOVO PET', cape: 'NOVA CAPA', surprise: 'BAÚ SURPRESA' };
    txt((LBL[chest.kind] || 'NOVO ITEM') + ': ' + (chest.name || '').toUpperCase(), W / 2, 30, '#ffe08a', 9);
  }
}
function drawHUD(resting) {
  const Hs = heroStats(), hp = Math.max(0, hero.hp);
  R(6, 6, 62, 7, '#0a0e22'); R(7, 7, 60 * hp / Hs.maxHp, 5, hp / Hs.maxHp > .35 ? '#e85d4f' : '#ff9a3a'); R(7, 7, 60 * hp / Hs.maxHp, 1, '#ff9e96');
  txt('HP ' + fmt(hp) + '/' + fmt(Hs.maxHp), 6, 22, '#eef0ff', 7, 'left');
  let sy = 31;
  if (furyOn()) { txt('FÚRIA', 6, sy, '#ff6a5a', 7, 'left'); sy += 9; }
  if (tiredOn()) { txt('CANSADO', 6, sy, '#7ab8ff', 7, 'left'); sy += 9; }
  if (hero.frozen > 0) { txt('CONGELADO', 6, sy, '#8ad0f0', 7, 'left'); sy += 9; }
  if (hero.slow > 0) { txt('LENTO', 6, sy, '#d0d0d0', 7, 'left'); sy += 9; }
  if (hero.burn > 0) { txt('QUEIMANDO', 6, sy, '#ff8a2a', 7, 'left'); sy += 9; }
  if (restedOn()) { txt('DESCANSADO', 6, sy, '#a6f2a0', 7, 'left'); sy += 9; }
  if (isHard()) { txt('DIA DIFÍCIL', 6, sy, '#6ea8ff', 7, 'left'); sy += 9; }
  if (S.focusRun) { const l = focusLeft(), s2 = Math.ceil(l / 1000); txt(l ? 'FOCO ' + Math.floor(s2 / 60) + ':' + String(s2 % 60).padStart(2, '0') : 'FOCO PRONTO!', 6, sy, '#6ea8ff', 7, 'left'); sy += 9; }
  if (buffOn('forca')) { txt('FORÇA +30%', 6, sy, '#ff8a2a', 7, 'left'); sy += 9; }
  if (buffOn('ferro')) { txt('PELE DE FERRO', 6, sy, '#c0c8d8', 7, 'left'); sy += 9; }
  if (resting) { txt('DIA DE DESCANSO', W - 6, 12, '#ffd04a', 8, 'right'); }
  else {
    const b = biomeFor(S.stage);
    txt((b.nightmare ? 'PESADELO · ' : '') + b.n.toUpperCase() + ' · FASE ' + S.stage, W - 6, 12, b.nightmare ? '#ff6a8a' : '#f2c14e', 8, 'right');
    const kind = slotKind(S.stage, 4);
    for (let i = 0; i < 5; i++) R(W - 40 + i * 7, 16, 5, 3, i < S.stageKills ? '#f2c14e' : (i === 4 && kind !== 'normal' ? (kind === 'blocked' ? '#5a5a6a' : '#5a2030') : '#0a0e22'));
    const ev = eventNow(), bd = isBirthday();
    if (bd) txt('FELIZ ANIVERSÁRIO!', W - 6, 30, '#ff8ad8', 7, 'right');
    else if (ev) txt('EVENTO: ' + EVENT_NAMES[ev].toUpperCase(), W - 6, 30, ev === 'halloween' ? '#ff9a3a' : '#a6e0ff', 7, 'right');
  }
  if (ban) { ctx.globalAlpha = Math.min(1, ban.life * 2); txt(ban.t, W / 2, 56, ban.c, 11); ctx.globalAlpha = 1; }
}

let last = 0;
export function startGame(canvas) {
  ctx = canvas.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
  setCtx(ctx); fullHeal();
  last = performance.now();
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    setCtx(ctx);
    update(dt); draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
export const shakeScreen = n => { shake = Math.max(shake, n); };

// Prévia do herói (tela de criação)
export function drawPreview(canvas, cfg) {
  const k = canvas.width / 40, c = canvas.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvas.width, canvas.height);
  if (cfg === S.hero) { pix(() => drawHero({ ...heroLook(), x: 0, y: 0, walk: false, step: 0, ang: 1.9, time: 0.4 })); blit(20, 40, 1, 1, c); return; }
  pix(() => drawHero({ weapon: WEAPONS[0], shield: null, helm: ARMOR_SETS[0], helmTier: 0, chest: ARMOR_SETS[0], legs: ARMOR_SETS[0],
    skin: SKINS[cfg.skin], hair: HAIRS[cfg.hair], cloth: CLOTHES[cfg.cloth], sex: cfg.sex || 'm', style: cfg.style || 0, cls: cfg.cls || 'guerreiro',
    x: 0, y: 0, walk: false, step: 0, ang: 1.9, time: 0 }));
  blit(20, 40, 1, 1, c);
}

// Vitrine de um bioma (usada para revisar os desenhos; base do futuro Bestiário).
export function drawBiomeShowcase(canvas, bi) {
  const B = BIOMES[bi], c = canvas.getContext('2d'), Wd = 560;
  c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
  const sc = scenery(B.id);
  for (let k = 0; k < 2; k++) { c.drawImage(sc.sky, k * W, 0, W, H); c.drawImage(sc.far, k * W, 0, W, H); c.drawImage(sc.mid, k * W, 0, W, H); c.drawImage(sc.ground, k * W, 0, W, H); }
  const list = [...B.mons.map(k => [k, 'normal']), [B.mini, 'mini'], [B.boss, 'boss']];
  let x = 22;
  const prev = ctx; ctx = c;
  list.forEach(([key, kind]) => {
    const m = makeMon(key, kind); m.state = 'fight'; m.under = false; m.emerge = 1;
    if (m.def.big) m.s = 1;
    pix(() => drawMonster(m, 1.3));
    const lw = c.measureText ? (c.font = "600 6px 'Pixelify Sans', monospace", c.measureText(m.name).width) : 30;
    const half = Math.max(bbox ? bbox.w * m.s / 2 : 12, lw / 2 + 2);
    x += half;
    groundShadow(x, (m.fly ? 8 : 13) * m.s, 0.3);
    blit(x, GY, m.s, 1, c);
    c.font = "600 6px 'Pixelify Sans', monospace"; c.textAlign = 'center'; c.fillStyle = '#0a0e22'; c.fillText(m.name, x + .5, GY + 14.5); c.fillStyle = kind === 'boss' ? '#ffb0a6' : kind === 'mini' ? '#ffd8a0' : '#eef0ff'; c.fillText(m.name, x, GY + 14);
    x += half + 8;
  });
  ctx = prev; if (ctx) setCtx(ctx);
  c.font = "700 10px 'Pixelify Sans', monospace"; c.textAlign = 'left'; c.fillStyle = '#0a0e22'; c.fillText(B.n.toUpperCase(), 9, 15); c.fillStyle = '#f2c14e'; c.fillText(B.n.toUpperCase(), 8, 14);
  return Wd;
}

// ---------- Ícones e miniaturas (Vila, Loja, Bestiário) ----------
// Desenha um item com contorno e luz, centralizado num canvas pequeno.
export function renderItem(canvas, it, kind, scale = 2) {
  const c = canvas.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c;
  pix(() => drawItemIcon(0, 0, it, kind));
  if (bbox) blit(canvas.width / 2 - (bbox.x + bbox.w / 2 - BOX) * scale, canvas.height / 2 - (bbox.y + bbox.h / 2 - BOY) * scale, scale, 1, c);
  ctx = prev; if (ctx) setCtx(ctx);
}
// Miniatura de monstro; "unknown" vira silhueta escura (ainda não visto).
export function renderMonThumb(canvas, key, opts = {}) {
  const c = canvas.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c;
  const m = makeMon(key, opts.kind || 'normal'); m.state = 'fight'; m.under = false; m.emerge = 1; m.s = 1;
  if (opts.pal) m.def = { ...m.def, pal: { ...m.def.pal, ...opts.pal }, imgFilter: opts.filter || m.def.imgFilter };
  pix(() => drawMonster(m, 1.3));
  if (bbox) {
    const k = Math.min(3, (canvas.width - 8) / bbox.w, (canvas.height - 8) / bbox.h);
    const x = canvas.width / 2 - (bbox.x + bbox.w / 2 - BOX) * k, y = canvas.height / 2 - (bbox.y + bbox.h / 2 - BOY) * k;
    if (opts.unknown) { blitAuraTo(c, x, y, k, '#0a0e22'); }
    else blit(x, y, k, 1, c);
  }
  ctx = prev; if (ctx) setCtx(ctx);
}
function blitAuraTo(target, x, y, s, color) {
  actx.globalCompositeOperation = 'source-over'; actx.clearRect(0, 0, BW, BH); actx.drawImage(buf, 0, 0);
  actx.globalCompositeOperation = 'source-in'; actx.fillStyle = color; actx.fillRect(0, 0, BW, BH);
  target.drawImage(aura, 0, 0, BW, BH, Math.round(x - BOX * s), Math.round(y - BOY * s), BW * s, BH * s);
}

// ---------- Vila ----------
function bLoja(t) {
  R(-26, -34, 52, 34, '#c8a070'); for (let i = 0; i < 6; i++) R(-26, -30 + i * 6, 52, 1, '#a07a4a');
  for (let i = 0; i < 6; i++) R(-31 + i * 2, -38 - i * 3, 62 - i * 4, 4, i % 2 ? '#a82c22' : '#c83a2a');
  R(-12, -56, 24, 2, '#e85040');
  R(-6, -18, 12, 18, '#6a4424'); R(-5, -17, 10, 17, '#8a5a2a'); R(3, -9, 1, 2, '#f2c14e');
  R(-22, -26, 12, 10, '#3a2a1e'); R(-21, -25, 10, 8, '#a8d0f0'); R(-20, -24, 3, 3, '#ffffff');
  R(-17, -24, 2, 7, '#aab0bf'); R(-18, -19, 4, 1, '#8a5a35');            // espada na vitrine
  R(10, -26, 12, 10, '#3a2a1e'); R(11, -25, 10, 8, '#a8d0f0'); R(13, -23, 6, 5, '#e8b33c'); R(14, -24, 4, 1, '#fff0a0');   // escudo
  R(-30, -2, 60, 2, '#8a8a96');
}
function bFerreiro(t, hit) {
  R(-24, -30, 48, 30, '#7a7a86'); for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) R(-24 + i * 12 + (r % 2) * 6, -28 + r * 6, 11, 5, r % 2 ? '#8a8a96' : '#6e6e7a');
  R(-28, -36, 56, 6, '#4a3a3a'); R(-26, -38, 52, 2, '#5a4848'); R(-28, -31, 56, 1, '#2e2424');
  R(10, -52, 9, 16, '#5a5a66'); R(9, -53, 11, 2, '#3a3a46');
  const f = Math.floor(t * 8) % 3;
  R(-18, -18, 14, 14, '#2a1a14'); R(-16, -12 - f, 10, 8 + f, '#e8502a'); R(-14, -14 - f, 6, 6, '#ffb040'); R(-12, -10, 2, 3, '#fff0a0');
  R(2, -20, 14, 20, '#4a3424'); R(3, -19, 12, 19, '#6a4a2a');
}
function bMercador(t, open) {
  if (!open) {                                      // obra: andaime de madeira
    R(-22, -30, 2, 30, '#8a5a2a'); R(20, -30, 2, 30, '#8a5a2a'); R(-1, -36, 2, 36, '#8a5a2a');
    R(-24, -30, 48, 2, '#a06a32'); R(-24, -16, 48, 2, '#a06a32'); R(-18, -14, 14, 14, '#c8a070'); R(6, -8, 10, 8, '#9a6436');
    return;
  }
  for (let i = 0; i < 8; i++) { const w = 8 + i * 6; R(-w / 2, -40 + i * 4, w, 4, i % 2 ? '#f2c14e' : '#6a3aa8'); }
  R(-25, -8, 50, 8, '#8a5a2a'); R(-25, -8, 50, 1, '#c08040');
  R(-22, -32, 2, 24, '#5a3a20'); R(20, -32, 2, 24, '#5a3a20');
  const bottles = ['#e84a5a', '#ff8a2a', '#8ab0d8', '#e84a5a', '#7ac05a'];
  bottles.forEach((c, i) => { R(-17 + i * 8, -14, 4, 6, c); R(-16 + i * 8, -16, 2, 2, '#d8e4f0'); R(-17 + i * 8, -14, 1, 2, '#ffffff'); });
  R(-2, -44, 4, 4, '#f2c14e');
}
function bBiblioteca(t, open) {
  if (!open) { R(-14, -12, 28, 12, '#5a6a8a'); for (let i = 0; i < 3; i++) R(-14 + i * 10, -16, 8, 4, '#4a5a7a'); return; }
  R(-16, -50, 32, 50, '#4a5a8a'); for (let r = 0; r < 8; r++) R(-16 + (r % 2) * 4, -48 + r * 6, 32 - 4, 1, '#3a4a78');
  for (let i = 0; i < 7; i++) R(-19 + i * 2.5, -56 - i * 3, 38 - i * 5, 4, i % 2 ? '#2a3466' : '#38448a');
  R(-1, -78, 2, 6, '#f2c14e');
  R(-7, -40, 14, 14, '#2a2a40'); R(-6, -39, 12, 12, '#f2d070'); R(-1, -39, 2, 12, '#2a2a40'); R(-6, -34, 12, 2, '#2a2a40');
  R(-6, -18, 12, 18, '#3a2a5a'); R(-5, -17, 10, 17, '#5a3a8a');
  ['#d83a3a', '#3a8ad8', '#6cc04a', '#f2c14e'].forEach((c, i) => R(-14 + i * 3, -6, 2, 6, c));
}
function bCasaHeroi() {                      // a casa do herói: telhado azul, bandeira e porta grande
  R(-18, -26, 36, 26, '#d8b888'); for (let i = 0; i < 5; i++) R(-18, -22 + i * 5, 36, 1, '#b8986a');
  for (let i = 0; i < 6; i++) R(-22 + i * 2, -30 - i * 3, 44 - i * 4, 4, i % 2 ? '#2a5aa8' : '#3a6ac8');
  R(-1, -52, 2, 10, '#5a3a20'); R(1, -52, 8, 5, '#e84a4a'); R(1, -52, 8, 1, '#ff8a8a');
  R(-5, -16, 10, 16, '#5a3a20'); R(-4, -15, 8, 15, '#8a5a2a'); R(2, -8, 1, 2, '#f2c14e');
  R(-15, -20, 7, 7, '#3a2a1e'); R(-14, -19, 5, 5, '#ffd870'); R(8, -20, 7, 7, '#3a2a1e'); R(9, -19, 5, 5, '#ffd870');
}
function bCasa(k) {
  const cols = ['#c8a070', '#b8906a', '#d0b080'];
  R(-12, -16, 24, 16, cols[k % 3]); R(-14, -20, 28, 4, '#7a3a2a'); R(-10, -24, 20, 4, '#8a4a32'); R(-6, -27, 12, 3, '#7a3a2a');
  R(-3, -9, 6, 9, '#5a3a20'); R(5, -12, 4, 4, '#ffd870');
}
function smith(t, down) {
  const up = !down;
  R(-3, -10, 3, 10, '#3a3a46'); R(1, -10, 3, 10, '#3a3a46');
  R(-4, -20, 9, 10, '#6a4a2a'); R(-3, -19, 7, 9, '#8a5a35');
  R(-3, -27, 7, 7, '#e0a878'); R(-3, -28, 7, 2, '#3a2a1e'); R(-4, -22, 9, 2, '#5a3a20');
  R(2, -25, 1, 1, '#1a1a2a');
  if (up) { R(5, -30, 2, 10, '#6a4a2a'); R(3, -33, 6, 4, '#5a5a66'); }
  else { R(5, -20, 8, 2, '#6a4a2a'); R(11, -22, 5, 6, '#5a5a66'); }
}
// Desenhos da vila guardados prontos: o contorno e a luz são calculados uma vez só,
// e cada quadro só cola as imagens (fica leve em celular simples).
const VC = new Map();
export const clearVillageCache = () => VC.clear();
function cached(key, fn) {
  let e = VC.get(key);
  if (e) return e;
  pix(fn);
  const b = bbox || { x: BOX, y: BOY, w: 1, h: 1 };
  const cv = document.createElement('canvas'); cv.width = b.w; cv.height = b.h;
  cv.getContext('2d').drawImage(buf, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
  e = { cv, bx: b.x - BOX, by: b.y - BOY, w: b.w, h: b.h };
  if (VC.size > 160) VC.clear();
  VC.set(key, e);
  return e;
}
function put(e, x, y, s = 1, a = 1) {
  ctx.globalAlpha = a;
  ctx.drawImage(e.cv, Math.round(x + e.bx * s), Math.round(y + e.by * s), e.w * s, e.h * s);
  ctx.globalAlpha = 1;
}
function villageBg(phase, nh) {
  const key = 'bg|' + phase + '|' + nh;
  let e = VC.get(key); if (e) return e;
  const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
  const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c; setCtx(c);
  const sc = scenery('floresta');
  c.drawImage(sc.sky, 0, 0, W, H);
  if (phase === 'noite') { c.fillStyle = 'rgba(6,8,30,.45)'; c.fillRect(0, 0, W, H); }
  else if (phase === 'dia') { c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(110,150,230,.55)'; c.fillRect(0, 0, W, H); c.restore(); }
  else { c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(230,120,70,.35)'; c.fillRect(0, 0, W, H); c.restore(); }
  c.drawImage(sc.far, 0, 0, W, H);
  const HPOS = [24, 92, 160, 228, 296, 58];
  for (let i = 0; i < nh; i++) put(cached('casa' + i, () => bCasa(i)), HPOS[i], GY - 30, 0.8, 0.9);
  c.fillStyle = 'rgba(20,26,54,.25)'; c.fillRect(0, 0, W, GY - 28);
  c.drawImage(sc.ground, 0, 0, W, H);
  R(0, GY, W, 3, '#b89a70'); R(0, GY + 3, W, 1, '#8a7050');
  ctx = prev; if (ctx) setCtx(ctx);
  e = { cv }; VC.set(key, e);
  return e;
}
export function drawVillage(canvas, opts) {
  const c = canvas.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c; setCtx(c);
  const t = opts.t;
  c.drawImage(villageBg(dayPhase(), Math.min(6, 1 + Math.floor((S.level || 1) / 4))).cv, 0, 0);
  c.setTransform(2, 0, 0, 2, 0, 0);
  const spots = opts.spots = [];
  const B = [
    { id: 'loja', x: 34, k: 'loja', fn: () => bLoja(0), label: 'LOJA', open: true },
    { id: 'ferreiro', x: 100, k: 'ferreiro', fn: () => bFerreiro(0), label: 'FERREIRO', open: true },
    { id: 'mercador', x: 166, k: 'merc' + !!opts.merc, fn: () => bMercador(0, opts.merc), label: opts.merc ? 'MERCADOR' : 'NÍVEL 3', open: opts.merc },
    { id: 'biblioteca', x: 228, k: 'lib' + !!opts.lib, fn: () => bBiblioteca(0, opts.lib), label: opts.lib ? 'BIBLIOTECA' : 'MINI-CHEFÃO', open: opts.lib },
    { id: 'casa', x: 288, k: 'casaH', fn: () => bCasaHeroi(), label: 'SUA CASA', open: true }
  ];
  for (const b of B) {
    const e = cached(b.k, b.fn); put(e, b.x, GY);
    spots.push({ id: b.id, x0: b.x - e.w / 2, x1: b.x + e.w / 2, y0: GY - e.h, y1: GY + 10, open: b.open });
    const sel = opts.sel === b.id;
    txt(b.label, b.x, GY + 13, sel ? '#ffe08a' : b.open ? '#eef0ff' : '#a3aad6', 7);
    if (sel) { const bob = Math.round(Math.sin(t * 5) * 2), h = e.h; R(b.x - 2, GY - h - 10 + bob, 5, 3, '#ffe08a'); R(b.x - 1, GY - h - 7 + bob, 3, 2, '#ffe08a'); R(b.x, GY - h - 5 + bob, 1, 1, '#ffe08a'); }
  }
  // fogo da fornalha (por cima do desenho guardado)
  const f = Math.floor(t * 8) % 3;
  R(100 - 16, GY - 12 - f, 10, 8 + f, '#e8502a'); R(100 - 14, GY - 14 - f, 6, 6, '#ffb040'); R(100 - 12, GY - 10, 2, 3, '#fff0a0');
  // fumaça da chaminé
  for (let i = 0; i < 4; i++) { const q = (t * 0.5 + i / 4) % 1; c.globalAlpha = 0.5 * (1 - q); R(114 + Math.sin(q * 6 + i) * 3, GY - 54 - q * 30, 3, 3, '#9aa0b8'); }
  c.globalAlpha = 1;
  // ferreiro na bigorna
  R(126, GY - 6, 10, 3, '#3a3a46'); R(128, GY - 3, 6, 3, '#2a2a34'); R(125, GY - 8, 12, 2, '#5a5a66');
  const hit = opts.hit || 0, up = hit > 0 ? Math.sin(hit * 20) > 0 : Math.floor(t * 2) % 2 === 0;
  put(cached('smith' + up, () => smith(0, up ? 0 : 1)), 120, GY);
  if (hit > 0) for (let i = 0; i < 5; i++) R(132 + Math.round(rnd(Math.floor(t * 30) + i) * 10 - 5), GY - 10 - Math.round(rnd(Math.floor(t * 30) + i + 9) * 8), 1, 1, i % 2 ? '#ffe04a' : '#ff8a2a');
  // herói (e pet) em frente ao prédio escolhido
  const tgt = (B.find(b => b.id === opts.sel) || B[0]).x - 16;
  opts.hx = opts.hx == null ? tgt : opts.hx + Math.sign(tgt - opts.hx) * Math.min(Math.abs(tgt - opts.hx), 2.5);
  const walking = Math.abs(tgt - opts.hx) > 0.5, step = walking ? Math.floor(t * 9) % 2 : 0;
  if (hasPet()) {
    const ph = Math.floor(t * 4) % 4, st = petStage().idx;
    put(cached('pet|' + S.pet + '|' + walking + '|' + ph + '|' + petSad(), () => drawPet(S.pet, { t: ph / 4, walk: walking, sad: petSad(), sleep: false, atk: 0 })), opts.hx - 16, GY + 4, [0.8, 1, 1.2][st]);
  }
  put(cached('hero|' + walking + '|' + step, () => drawHero({ ...heroLook(), x: 0, y: 0, walk: walking, step, ang: 1.9, ext: 0, time: 0.3 })), opts.hx, GY + 4);
  ctx = prev; if (ctx) setCtx(ctx);
}

// ---------- Herói avulso (ícone, widget, abertura) ----------
// frame: 0 parado · 1 levanta a espada · 2 golpe · 3 depois do golpe
const POSES = [{ ang: 1.9, ext: 0 }, { ang: -0.9, ext: -1, dy: -1 }, { ang: 2.4, ext: 3 }, { ang: 2.1, ext: 1 }];
export function heroLookFor(tier) {
  if (tier == null) return heroLook();
  const t = Math.max(0, Math.min(5, tier));
  return { weapon: WEAPONS[t], shield: t ? SHIELDS[Math.min(4, t - 1)] : null, helm: ARMOR_SETS[t], helmTier: t,
    chest: ARMOR_SETS[t], legs: ARMOR_SETS[t], cape: t >= 4 ? { a: '#b82c26', b: '#8a1e1a', c: '#e04a40' } : null,
    skin: SKINS[1], hair: HAIRS[2], cloth: CLOTHES[2], sex: (S.hero && S.hero.sex) || 'm', style: (S.hero && S.hero.style) || 0, cls: (S.hero && S.hero.cls) || 'guerreiro' };
}
export function drawHeroFrame(canvas, frame = 0, opts = {}) {
  const c = canvas.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  if (!opts.keep) c.clearRect(0, 0, canvas.width, canvas.height);
  const prev = ctx; ctx = c;
  const P = POSES[frame % POSES.length], L = opts.look || heroLook();
  pix(() => drawHero({ ...L, x: 0, y: 0, dx: 0, dy: P.dy || 0, walk: false, step: 0, ang: P.ang, ext: P.ext, time: opts.time || 0.4 }));
  const s = opts.scale || 4;
  blit(opts.x ?? canvas.width / 2, opts.y ?? canvas.height - 4 * s, s, 1, c);
  ctx = prev; if (ctx) setCtx(ctx);
}

// ---------- Cenas da história ----------
let storyParts = [];
function mestre(t, talk) {
  const b = talk ? Math.round(Math.abs(Math.sin(t * 8))) : 0;
  R(-6, -2, 13, 2, '#2a1a4a');
  R(-6, -20, 12, 18, '#5a3a9a'); R(-5, -20, 3, 18, '#7a5aba'); R(3, -20, 3, 18, '#3a2470');      // manto
  R(-7, -4, 14, 3, '#4a2a8a'); R(-1, -14, 2, 10, '#f2c14e');
  R(-4, -28 - b, 9, 8, '#f0c8a0'); R(1, -26 - b, 2, 1, '#1a1a2a'); R(-3, -24 - b, 8, 1, '#d8a888');   // rosto
  R(-4, -23 - b, 9, 7, '#ececf4'); R(-3, -16 - b, 7, 3, '#ececf4'); R(-1, -13 - b, 3, 2, '#d8d8e4');    // barba
  R(-6, -30 - b, 13, 3, '#5a3a9a'); R(-4, -34 - b, 9, 4, '#5a3a9a'); R(-2, -38 - b, 6, 4, '#5a3a9a'); R(1, -41 - b, 3, 3, '#5a3a9a'); R(3, -42 - b, 2, 1, '#f2c14e');
  R(-5, -30 - b, 11, 1, '#f2c14e');
  R(8, -36, 2, 36, '#7a5230'); R(6, -40, 6, 5, '#58d4ff'); R(7, -39, 2, 2, '#ffffff');               // cajado
}
function sombra(t) {
  const f = Math.sin(t * 2) * 2;
  for (let y = 0; y < 44; y++) { const w = 6 + Math.round(Math.sin(y / 44 * Math.PI) * 9) + (y > 30 ? (y - 30) : 0); R(-w, -y - 4 + f, w * 2, 1, y > 34 ? '#2a1040' : '#1a0a2a'); }
  R(-8, -46 + f, 16, 6, '#1a0a2a'); R(-5, -40 + f, 3, 2, '#ff40ff'); R(2, -40 + f, 3, 2, '#ff40ff');
}
export function drawStoryFrame(canvas, sc, t) {
  const c = canvas.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c; setCtx(c);
  const L = scenery(sc.bg || 'floresta'), off = t * 6;
  c.drawImage(L.sky, 0, 0, W, H);
  const lay = (img, k) => { const x = -Math.floor(((off * k) % W + W) % W); c.drawImage(img, x, 0, W, H); c.drawImage(img, x + W, 0, W, H); };
  lay(L.far, 0.15); lay(L.mid, 0.4); c.drawImage(L.ground, 0, 0, W, H);
  const hx = Math.min(78, -20 + t * 70), walking = hx < 78;
  // herói
  groundShadow(hx, 14);
  pix(() => drawHero({ ...heroLook(), x: 0, y: 0, walk: walking, step: Math.floor(t * 9) % 2, ang: sc.speaker === 'heroi' ? 1.2 + Math.sin(t * 6) * 0.15 : 1.9, ext: 0, time: t }));
  blit(hx, GY - (sc.speaker === 'heroi' ? Math.round(Math.abs(Math.sin(t * 8))) : 0), 1, 1, c);
  // Mestre
  if (sc.bg && (sc.speaker === 'mestre' || !sc.boss)) { groundShadow(132, 14); pix(() => mestre(t, sc.speaker === 'mestre')); blit(132, GY, 1, 1, c); }
  // chefão (liberto depois da luta: brilha calmo)
  if (sc.boss && MONSTERS[sc.boss]) {
    const m = makeMon(sc.boss, 'boss'); m.state = 'fight'; m.under = false; m.emerge = 1; m.s = 1; m.seed = 1;
    const bx = 240;
    groundShadow(bx, 40, 0.3);
    pix(() => drawMonster(m, t)); blit(bx, GY, 1, sc.speaker === 'nevoa' ? 0.5 : 1, c);
    if (sc.defeated && Math.random() < 0.3) storyParts.push({ x: bx - 30 + Math.random() * 60, y: GY - Math.random() * 90, vx: 0, vy: -20, g: 0, life: .8, c: '#ffe08a', sz: 1 });
  }
  // Senhor da Névoa
  if (sc.nevoa) {
    c.fillStyle = 'rgba(90,30,120,' + (0.18 + Math.sin(t) * 0.05) + ')'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) { c.globalAlpha = 0.25; R(((i * 70 + t * 12) % (W + 60)) - 30, GY - 10 - (i % 3) * 8, 50, 6, '#9a6ad8'); } c.globalAlpha = 1;
    if (sc.speaker === 'nevoa') { pix(() => sombra(t)); blit(sc.boss ? 200 : 250, GY - 8, 1.4, 0.9, c); }
  }
  // partículas da cena
  storyParts.forEach(p => { p.life -= 1 / 60; p.y += p.vy / 60; c.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); R(p.x, p.y, 1, 1, p.c); }); c.globalAlpha = 1;
  storyParts = storyParts.filter(p => p.life > 0);
  ctx = prev; if (ctx) setCtx(ctx);
}

// ---------- Masmorra: duelo de uma sala ----------
export function drawDuel(canvas, key, t, hf, bf, label) {
  const c = canvas.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c; setCtx(c);
  const L = scenery('caverna');
  c.drawImage(L.sky, 0, 0, W, H); c.drawImage(L.far, 0, 0, W, H); c.drawImage(L.mid, 0, 0, W, H); c.drawImage(L.ground, 0, 0, W, H);
  c.fillStyle = 'rgba(40,10,60,.3)'; c.fillRect(0, 0, W, H);
  const hit = Math.floor(t * 5) % 2;
  groundShadow(90, 14);
  pix(() => drawHero({ ...heroLook(), x: 0, y: 0, walk: false, step: 0, ang: hit ? 2.4 : -0.9, ext: hit ? 3 : 0, time: t }));
  blit(90 + (hit ? 3 : 0), GY, 1, hf <= 0 ? 0.4 : 1, c);
  if (key) {
    const m = makeMon(key, 'boss'); m.state = 'fight'; m.under = false; m.emerge = 1; m.s = 1; m.seed = 2; m.flash = bf > 0 && bf < 1 && (t * 5) % 2 < 0.22 ? 0.1 : 0;
    groundShadow(225, 40, 0.3);
    pix(() => drawMonster(m, t)); blit(225, GY, 1, bf <= 0 ? 0.25 : 1, c);
  }
  R(20, 14, 102, 7, '#0a0e22'); R(21, 15, 100 * Math.max(0, hf), 5, '#e85d4f');
  R(198, 14, 102, 7, '#0a0e22'); R(199, 15, 100 * Math.max(0, bf), 5, '#ff6a5a');
  txt(label || '', W / 2, 32, '#ffe08a', 10);
  ctx = prev; if (ctx) setCtx(ctx);
}

// ---------- Casa do herói: troféus dos chefões, pet, estátua do renascimento ----------
const WALLS = [['#5a4a7a', '#4a3a6a'], ['#4a6a5a', '#3a5a4a'], ['#7a5a4a', '#6a4a3a'], ['#3a4a6a', '#2a3a5a']];
export function drawHouse(canvas, t, trophies) {
  const c = canvas.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
  const prev = ctx; ctx = c; setCtx(c);
  const [w1, w2] = WALLS[(S.houseWall || 0) % WALLS.length];
  R(0, 0, W, H, w1); for (let x = 0; x < W; x += 16) R(x, 0, 1, 104, w2);
  R(0, 100, W, 4, '#3a2a1e'); R(0, 104, W, H - 104, '#8a5a32'); for (let x = 0; x < W; x += 24) R(x, 104, 1, H - 104, '#6a4424'); R(0, 104, W, 2, '#a87048');
  // janela com o céu da hora
  const ph = dayPhase(), sky = ph === 'noite' ? '#14183a' : ph === 'dia' ? '#7ab0f0' : '#f0a070';
  R(140, 14, 40, 30, '#3a2a1e'); R(142, 16, 36, 26, sky); R(159, 16, 2, 26, '#3a2a1e'); R(142, 28, 36, 2, '#3a2a1e');
  if (ph === 'noite') { R(148, 20, 3, 3, '#f4f0d8'); R(170, 34, 1, 1, '#ffffff'); }
  // troféus dos chefões na parede
  trophies.slice(0, 9).forEach((key, i) => {
    const x = 18 + (i % 3) * 38 + (i >= 3 ? 0 : 0), y = 14 + Math.floor(i / 3) * 30;
    R(x - 13, y, 26, 24, '#5a3a20'); R(x - 12, y + 1, 24, 22, '#7a5230'); R(x - 2, y - 2, 4, 2, '#f2c14e');
    const m = makeMon(key, 'boss'); m.state = 'fight'; m.under = false; m.emerge = 1; m.s = 1; m.seed = 0;
    pix(() => drawMonster(m, 0)); if (bbox) { const k = Math.min(0.3, 20 / bbox.h, 22 / bbox.w); ctx.drawImage(buf, bbox.x, bbox.y, bbox.w, bbox.h, Math.round(x - bbox.w * k / 2), Math.round(y + 22 - bbox.h * k), bbox.w * k, bbox.h * k); }
  });
  if (!trophies.length) txt('Derrote chefões para pendurar troféus aqui', 64 + 28, 40, '#d8d0e8', 6);
  // estante com cartas e quadro das conquistas
  R(200, 40, 50, 64, '#5a3a20'); for (let r = 0; r < 3; r++) { R(202, 44 + r * 20, 46, 16, '#3a2a1e'); for (let b = 0; b < 8; b++) R(204 + b * 5, 48 + r * 20, 4, 12, ['#c83a3a', '#3a7ad8', '#4aa84a', '#e8b33c', '#8a5ad0'][(b + r) % 5]); }
  const ach = Object.keys(S.ach || {}).length;
  R(262, 18, 44, 30, '#e8c060'); R(264, 20, 40, 26, '#2a2a40'); txt(ach + ' 🏆', 284, 37, '#ffe08a', 9);
  // cama do pet + pet dormindo
  R(210, 132, 40, 8, '#8a3a3a'); R(212, 128, 36, 6, '#c85a5a');
  if (hasPet()) { pix(() => drawPet(S.pet, { t, sleep: true })); blit(230, 132, 1); }
  // estátua do renascimento
  if (S.rebirths) { R(276, 96, 24, 8, '#9aa0b0'); R(282, 66, 12, 30, '#b8bcc8'); R(284, 60, 8, 8, '#d8dce8'); txt('×' + S.rebirths, 288, 92, auraColor() || '#ffe08a', 7); }
  // herói em casa
  pix(() => drawHero({ ...heroLook(), x: 0, y: 0, walk: false, step: 0, ang: 1.9, ext: 0, time: t })); blit(150, 136, 1, 1, c);
  const au = auraColor(); if (au) { blitAura(150, 136, 1, au, 0.4); blit(150, 136, 1, 1, c); }
  ctx = prev; if (ctx) setCtx(ctx);
}
