// Motor do jogo: herói, monstros, chefões, baú, fogueira, efeitos e HUD da cena.
import { S, bus, today } from './state.js';
import { WEAPONS, ARMOR_SETS, SHIELDS, SKINS, HAIRS, CLOTHES, MONSTERS, BIOMES, PETS } from './data.js';
import { drawMonster } from './monsters.js';
import { drawPet } from './pets.js';
import {
  heroStats, weaponTier, shieldTier, pieceTier, furyOn, tiredOn, restedOn, isRest, biomeFor, slotKind, mStats,
  onKill, onSlotCleared, onHeroDeath, fmt, hasPet, petSad, petStage, petActive
} from './rules.js';
import {
  W, H, GY, R, setCtx, setFlash, setBuf, drawHero, drawHeroLying, scenery, drawChest, drawItemIcon, drawCampfire, rnd
} from './sprites.js';

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
const heroLook = () => {
  const st = shieldTier(), ht = pieceTier(0), ct = pieceTier(1), lt = pieceTier(2);
  return {
    weapon: WEAPONS[weaponTier()], shield: st >= 0 ? SHIELDS[st] : null,
    helm: ARMOR_SETS[ht], helmTier: ht, chest: ARMOR_SETS[ct], legs: ARMOR_SETS[lt],
    skin: SKINS[S.hero.skin] || SKINS[0], hair: HAIRS[S.hero.hair] || HAIRS[0], cloth: CLOTHES[S.hero.cloth] || CLOTHES[0],
    cape: S.relics.includes('madrugador'), goldGlow: S.relics.includes('disciplina')
  };
};

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
  Object.assign(m, opts);
  return m;
}
function spawn() {
  if (queue.length) { mons.push(queue.shift()); return; }
  const b = biomeFor(S.stage), kind = slotKind();
  if (kind === 'boss') {
    const m = makeMon(b.boss, 'boss', { mech: b.mech, summonKey: b.summon });
    if (m.def.big) m.s = 1;
    if (b.mech === 'summon') m.thresholds = [0.66, 0.33];
    if (b.mech === 'dig') m.digT = 3.5;
    mons.push(m); banner('CHEFÃO: ' + m.name.toUpperCase(), '#ff6a5a');
  } else if (kind === 'mini') {
    const m = makeMon(b.mini, 'mini');
    mons.push(m); banner('MINI-CHEFÃO: ' + m.name.toUpperCase(), '#ffb04a');
  } else {
    let key; do { key = b.mons[Math.floor(Math.random() * b.mons.length)]; } while (key === lastBase && b.mons.length > 1);
    lastBase = key; mons.push(makeMon(key, 'normal'));
  }
}
const REACH = { dragao: 24, serpente: 10, hidra: 8, centopeia: 6, lobo: 6 };
const contactX = m => m.def.big ? HX + 12 + m.def.front * 0.85 : HX + 22 + (m.s - 1) * 9 + (REACH[m.def.draw] || 0) * m.s * 0.8;
const front = () => mons.filter(m => !m.retreat).sort((a, b) => a.x - b.x)[0] || null;
const monTop = m => m.h * m.s;
const monColor = m => (m.def.pal && m.def.pal.a) || '#ffffff';

function killMon(m) {
  onKill(m);
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
  } else onSlotCleared();
  if (!mons.length) spawnT = 0.7;
  bus.emit('kill', m);
}
function finishBoss(m) {
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
  burst(HX, GY - 14, '#e85d4f', 24);
  onHeroDeath();
  mons = []; queue = []; projs = []; bossPending = null; spawnT = 1.4;
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
    hero.hp -= d; hero.hurt = 0.45; hero.recoil = 0.2;
    float(HX - 4, GY - 34, '-' + d, '#ff6a5a', heavy);
  }
  if (d > 0) {
    const t = m.trait, bossFreeze = m.mech === 'freeze' && heavy;
    if (t === 'drain') { const h = Math.round(d * 0.8); m.hp = Math.min(m.max, m.hp + h); float(m.x, GY - monTop(m) - 4, '+' + h, '#7af07a'); }
    if (t === 'web' && Math.random() < 0.35) { hero.slow = 2.5; float(HX, GY - 52, 'TEIA!', '#e8e8e8'); }
    if ((t === 'freeze' && Math.random() < 0.3) || bossFreeze) { hero.frozen = bossFreeze ? 1.6 : 1.1; float(HX, GY - 52, 'CONGELADO!', '#8ad0f0'); burst(HX, GY - 14, '#bfe8ff', 12); }
    if (t === 'fire' && (heavy || Math.random() < 0.3)) { hero.burn = 3; float(HX, GY - 52, 'QUEIMANDO!', '#ff8a2a'); }
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
          m.atkT = m.trait === 'fast' ? 1.0 : m.enraged ? 1.05 : m.kind === 'normal' ? 1.5 : 1.7;
          const every = m.enraged ? 2 : 3;
          if (m.kind !== 'normal' && m.attacks % every === 0) m.wind = 0.75;
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

  if (furyOn() && Math.random() < dt * 14) parts.push({ x: HX - 5 + Math.random() * 10, y: GY - 4 - Math.random() * 24, vx: 0, vy: -25, life: .5, c: '#ff6a5a', sz: 1 });
  if (tiredOn() && Math.random() < dt * 1.5) parts.push({ x: HX + 5, y: GY - 28, vx: 6, vy: 0, life: .7, c: '#7ab8ff', sz: 1 });
}

const ATK = {
  down: { d: 0.22, h: 0.5, mult: 1, kx: 4 }, up: { d: 0.22, h: 0.5, mult: 1, kx: 4 },
  thrust: { d: 0.24, h: 0.45, mult: 1.15, kx: 7 }, spin: { d: 0.44, h: 0.62, mult: 1.6, kx: 9 },
  leap: { d: 0.54, h: 0.8, mult: 2.2, kx: 11 }, bash: { d: 0.3, h: 0.5, mult: 0.6, kx: 13 }
};
function startAttack(Hs) {
  const crit = Math.random() < Hs.crit, hasShield = shieldTier() >= 0;
  const type = crit ? 'leap' : hasShield && Math.random() < 0.14 ? 'bash' : hero.combo % 6 === 5 ? 'spin' : ['down', 'up', 'thrust'][hero.combo % 3];
  hero.combo++;
  hero.atk = { type, t: 0, crit, hit: false };
}
function heroHit(m, a) {
  if (!m || m.retreat) return;
  if (m.under) { float(m.x, GY - 20, 'ESQUIVOU', '#c0c0c0'); return; }
  const Hs = heroStats(), A = ATK[a.type], crit = a.crit;
  const dmg = Math.max(1, Math.round(Hs.atk * A.mult * (0.9 + Math.random() * 0.2)));
  m.hp -= dmg; m.flash = 0.1; m.kx = A.kx;
  if (petActive('leech')) hero.hp = Math.min(Hs.maxHp, hero.hp + dmg * 0.05 * petStage().k);
  float(m.x + 2, GY - monTop(m) - 4, crit ? dmg + '!' : String(dmg), crit ? '#ffd04a' : a.type === 'spin' ? '#a6f2ff' : '#ffffff', crit || a.type === 'spin');
  burst(m.x - 4, GY - monTop(m) / 2, WEAPONS[weaponTier()].edge, crit ? 10 : a.type === 'spin' ? 8 : 4);
  if (a.type === 'bash') {
    m.atkT = Math.max(m.atkT, 1.5); m.lunge = -1; m.wind = 0;
    float(m.x, GY - monTop(m) - 14, 'ATORDOADO', '#ffe04a');
    const sh = SHIELDS[Math.max(0, shieldTier())]; burst(HX + 12, GY - 16, sh.emb, 8);
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
    if (!a.hit && p >= A.h) { a.hit = true; heroHit(front(), a); }
    if (p >= 1) { hero.atk = null; hero.shieldFwd = false; }
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
  ctx.drawImage(sc.sky, 0, 0, W, H); drawLayer(sc.far, bgOff * 0.15); drawLayer(sc.mid, bgOff * 0.45);
  flies.forEach(f => { const a = (Math.sin(time * 2 + f.p) + 1) / 2; ctx.globalAlpha = 0.3 + a * 0.6; R((f.x - (bgOff * 0.45) % W + W * 2) % W, f.y + Math.sin(time + f.p) * 4, 1, 1, sc.fly); });
  ctx.globalAlpha = 1;
  drawLayer(sc.ground, bgOff);

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
    if (a && a.type !== 'thrust' && a.type !== 'bash') {   // rastro do golpe
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
      ang: hero.ang, ext: hero.ext, shieldFwd: hero.shieldFwd || hero.block > 0, time }));
    blit(HX, GY, 1, hero.hurt > 0 && Math.floor(time * 20) % 2 ? 0.35 : 1);
    if (hero.frozen > 0) { ctx.fillStyle = 'rgba(160,220,255,.38)'; ctx.fillRect(HX - 9 + hx, GY - 34 + hero.dy, 20, 34); R(HX - 6 + hx, GY - 30, 1, 1, '#ffffff'); R(HX + 5 + hx, GY - 14, 1, 1, '#ffffff'); }
    if (hero.slow > 0) { ctx.globalAlpha = 0.7; R(HX - 8, GY - 22, 16, 1, '#e8e8e8'); R(HX - 6, GY - 12, 13, 1, '#e8e8e8'); R(HX - 3, GY - 26, 1, 16, '#e8e8e8'); R(HX + 4, GY - 20, 1, 12, '#d0d0d0'); ctx.globalAlpha = 1; }
    for (const m of mons.slice().sort((a, b) => b.x - a.x)) drawMon(m);
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
function drawMon(m) {
  const lunge = m.lunge >= 0 ? Math.sin(m.lunge * Math.PI) * 6 : 0;
  const x = Math.round(m.x + m.kx - lunge);
  if (!m.under) groundShadow(x, (m.fly ? 8 : 13) * m.s, m.fly ? 0.18 : 0.32);
  pix(() => { setFlash(m.flash > 0 ? 1 : (m.wind > 0 && Math.floor(time * 14) % 2 ? 2 : 0)); drawMonster(m, time); setFlash(0); });
  blit(x, GY, m.s, m.retreat ? 0.85 : 1);
  if (m.under) return;
  const top = GY - monTop(m) - 8, bw = m.kind === 'boss' ? 44 : m.kind === 'mini' ? 32 : 24;
  R(x - bw / 2 - 1, top - 1, bw + 2, 4, '#0a0e22');
  R(x - bw / 2, top, bw * Math.max(0, m.hp / m.max), 2, m.kind === 'boss' ? '#ff6a5a' : m.kind === 'mini' ? '#ffb04a' : '#6cc04a');
  ctx.font = "600 6px 'Pixelify Sans', monospace"; ctx.textAlign = 'center';
  ctx.fillStyle = '#0a0e22'; ctx.fillText(m.name, x + .5, top - 2.5);
  ctx.fillStyle = m.kind === 'boss' ? '#ffb0a6' : m.kind === 'mini' ? '#ffd8a0' : '#d8ddff'; ctx.fillText(m.name, x, top - 3);
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
    const LBL = { weapon: 'NOVA ARMA', shield: 'NOVO ESCUDO', helm: 'NOVO CAPACETE', chest: 'NOVO PEITORAL', legs: 'NOVAS GREVAS', pet: 'NOVO PET' };
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
  if (restedOn()) { txt('DESCANSADO', 6, sy, '#a6f2a0', 7, 'left'); }
  if (resting) { txt('DIA DE DESCANSO', W - 6, 12, '#ffd04a', 8, 'right'); }
  else {
    const b = biomeFor(S.stage);
    txt((b.nightmare ? 'PESADELO · ' : '') + b.n.toUpperCase() + ' · FASE ' + S.stage, W - 6, 12, b.nightmare ? '#ff6a8a' : '#f2c14e', 8, 'right');
    const kind = slotKind(S.stage, 4);
    for (let i = 0; i < 5; i++) R(W - 40 + i * 7, 16, 5, 3, i < S.stageKills ? '#f2c14e' : (i === 4 && kind !== 'normal' ? '#5a2030' : '#0a0e22'));
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
  const c = canvas.getContext('2d'); c.setTransform(4, 0, 0, 4, 0, 0); c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, canvas.width, canvas.height);
  pix(() => drawHero({ weapon: WEAPONS[0], shield: null, helm: ARMOR_SETS[0], helmTier: 0, chest: ARMOR_SETS[0], legs: ARMOR_SETS[0],
    skin: SKINS[cfg.skin], hair: HAIRS[cfg.hair], cloth: CLOTHES[cfg.cloth], x: 0, y: 0, walk: false, step: 0, ang: 1.9, time: 0 }));
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
