// Motor do jogo: herói, monstros, chefões, baú, fogueira, efeitos e HUD da cena.
import { S, bus, today } from './state.js';
import { WEAPONS, ARMORS, SKINS, HAIRS, CLOTHES, MONSTERS } from './data.js';
import {
  heroStats, weaponTier, armorTier, furyOn, tiredOn, restedOn, isRest, biomeFor, slotKind, mStats,
  onKill, onSlotCleared, onHeroDeath, fmt
} from './rules.js';
import {
  W, H, GY, R, setCtx, setFlash, drawHero, drawHeroLying, drawMonster, scenery, drawChest, drawItemIcon, drawCampfire, rnd
} from './sprites.js';

const HX = 96, TAU = Math.PI * 2;
let ctx, time = 0, bgOff = 0, shake = 0;
let mons = [], queue = [], spawnT = 0.6, parts = [], texts = [], ban = null, chests = [], chest = null;
let bossPending = null, lastBase = '', lastBiome = '';
const hero = { hp: 1, swing: -1, atkT: 0.3, hit: false, ang: 1.9, hurt: 0 };
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
const heroLook = () => ({
  weapon: WEAPONS[weaponTier()], armor: ARMORS[armorTier()],
  skin: SKINS[S.hero.skin] || SKINS[0], hair: HAIRS[S.hero.hair] || HAIRS[0], cloth: CLOTHES[S.hero.cloth] || CLOTHES[0],
  cape: S.relics.includes('madrugador'), goldGlow: S.relics.includes('disciplina')
});

// ---------- monstros ----------
function makeMon(base, kind, opts = {}) {
  const st = S.stage, M = MONSTERS[base], b = biomeFor(st);
  const s = mStats(st, base, kind);
  const tier = Math.floor((st - 1) / 3) % 4;
  const m = {
    base, kind, tier, name: opts.name || M.n, hp: s.hp, max: s.hp, dmg: s.dmg, gold: s.gold,
    spd: M.spd, fly: !!M.fly, h: M.h, x: W + 30, state: 'walk', atkT: 1, flash: 0, kx: 0, lunge: -1, hitDone: false,
    seed: Math.random() * 10, s: kind === 'boss' ? 2.1 : kind === 'mini' ? 1.5 : 1, attacks: 0, wind: 0,
    under: !!M.burrow, emerge: M.burrow ? 0 : 1, biome: b.id
  };
  if (base === 'slime' && kind === 'normal') m.name = ['Slime Verde', 'Slime Azul', 'Slime Vermelho', 'Slime Roxo'][tier];
  Object.assign(m, opts);
  return m;
}
function spawn() {
  if (queue.length) { mons.push(queue.shift()); return; }
  const b = biomeFor(S.stage), kind = slotKind();
  if (kind === 'boss') {
    const m = makeMon(b.boss.base, 'boss', { name: b.boss.n, mech: b.boss.mech });
    if (b.boss.mech === 'split') { m.crown = true; m.s = 2.4; m.tier = 0; m.h = 16; }
    if (b.boss.mech === 'summon') m.h = 33;
    if (b.boss.mech === 'summon') { m.pharaoh = true; m.thresholds = [0.66, 0.33]; }
    mons.push(m); banner('CHEFÃO: ' + m.name.toUpperCase(), '#ff6a5a');
  } else if (kind === 'mini') {
    const m = makeMon(b.mini.base, 'mini', { name: b.mini.n });
    mons.push(m); banner('MINI-CHEFÃO: ' + m.name.toUpperCase(), '#ffb04a');
  } else {
    let base; do { base = b.mons[Math.floor(Math.random() * b.mons.length)]; } while (base === lastBase && b.mons.length > 1);
    lastBase = base; mons.push(makeMon(base, 'normal'));
  }
}
const contactX = m => HX + 22 + (m.s - 1) * 9;
const front = () => mons.filter(m => !m.retreat).sort((a, b) => a.x - b.x)[0] || null;
const monTop = m => m.h * m.s;

function killMon(m) {
  onKill(m);
  burst(m.x, GY - monTop(m) / 2, monColor(m), m.kind === 'boss' ? 40 : 18);
  burst(m.x, GY - monTop(m) / 2, '#f2c14e', 6);
  float(m.x, GY - monTop(m) - 6, '+' + fmt(m.gold) + ' ouro', '#f2c14e');
  mons = mons.filter(x => x !== m);
  if (m.mech === 'split') {               // Slime Colossal se divide em 3
    bossPending = m;
    for (let i = 0; i < 3; i++) {
      const c = makeMon('slime', 'normal', { name: 'Slime Filhote', child: true, tier: 0, s: 0.8 });
      c.hp = c.max = Math.max(3, Math.round(m.max * 0.15)); c.gold = Math.round(m.gold * 0.05); c.dmg = Math.max(1, Math.round(m.dmg * 0.4));
      c.x = m.x + i * 14; c.state = 'walk';
      if (i === 0) mons.push(c); else queue.push(c);
    }
    banner('ELE SE DIVIDIU!', '#a6f2a0');
  } else if (m.child) {
    if (m.summoner) { m.summoner.retreat = false; m.summoner.state = 'walk'; }
    if (bossPending && !mons.some(x => x.child) && !queue.length) { finishBoss(bossPending); bossPending = null; }
  } else if (m.mech === 'summon') {
    mons.filter(x => x.child).forEach(x => burst(x.x, GY - 12, '#d8ccb0', 12));
    mons = mons.filter(x => !x.child);
    finishBoss(m);
  } else {
    onSlotCleared();
  }
  if (!mons.length) spawnT = 0.7;
  bus.emit('kill', m);
}
function finishBoss(m) {
  banner(m.name.toUpperCase() + ' DERROTADO!', '#f2c14e');
  burst(HX + 30, GY - 30, '#ffe08a', 30);
  onSlotCleared();
}
const monColor = m => ({ slime: '#5fc85a', coelho: '#c9b8a6', zumbi: '#7fb069', morcego: '#4a3a5a', escorpiao: '#c0803a', mumia: '#d8ccb0', abutre: '#5a4030', verme: '#b08050' })[m.base];

function heroHit(m) {
  if (!m || m.retreat) return;
  const Hs = heroStats();
  const crit = Math.random() < Hs.crit;
  const dmg = Math.max(1, Math.round(Hs.atk * (crit ? 2 : 1) * (0.9 + Math.random() * 0.2)));
  m.hp -= dmg; m.flash = 0.1; m.kx = crit ? 8 : 4;
  float(m.x + 2, GY - monTop(m) - 4, crit ? dmg + '!' : String(dmg), crit ? '#ffd04a' : '#ffffff', crit);
  burst(m.x - 4, GY - monTop(m) / 2, WEAPONS[weaponTier()].edge, crit ? 8 : 4);
  if (crit) shake = 4;
  if (m.thresholds && m.thresholds.length && m.hp > 0 && m.hp / m.max < m.thresholds[0]) {
    m.thresholds.shift(); summon(m);
  }
  if (m.hp <= 0) killMon(m);
}
function summon(boss) {
  boss.retreat = true; boss.state = 'walk'; boss.lunge = -1; boss.wind = 0;
  const c = makeMon('mumia', 'normal', { name: 'Múmia Invocada', child: true, summoner: boss });
  c.hp = c.max = Math.round(boss.max * 0.18); c.dmg = Math.round(boss.dmg * 0.5); c.gold = Math.round(boss.gold * 0.06);
  c.x = contactX(c); c.state = 'fight'; c.atkT = 1.2;
  burst(boss.x, GY - 20, '#ffe04a', 14);
  boss.x = contactX(boss) + 46;           // o faraó salta para trás
  mons.push(c);
  burst(c.x, GY - 6, '#d8b070', 20); shake = 3;
  banner('O FARAÓ INVOCOU UMA MÚMIA!', '#ffe04a');
}
function heroDie() {
  burst(HX, GY - 14, '#e85d4f', 24);
  onHeroDeath();
  mons = []; queue = []; bossPending = null; spawnT = 1.4;
  fullHeal(); hero.hurt = 1.2;
  bus.emit('hero-death');
}

// ---------- loop ----------
function update(dt) {
  time += dt; if (shake > 0) shake = Math.max(0, shake - dt * 20);
  const Hs = heroStats(); if (hero.hp > Hs.maxHp) hero.hp = Hs.maxHp;
  const resting = isResting();
  const b = biomeFor(S.stage);
  if (b.id !== lastBiome) { if (lastBiome) banner(b.n.toUpperCase(), '#a6f2a0'); lastBiome = b.id; }

  parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; if (p.y > GY) { p.y = GY; p.vy *= -0.3; p.vx *= 0.6; } });
  parts = parts.filter(p => p.life > 0);
  texts.forEach(t => { t.life -= dt * 0.9; t.y -= 18 * dt; }); texts = texts.filter(t => t.life > 0);
  if (ban) { ban.life -= dt; if (ban.life <= 0) ban = null; }

  if (resting) {
    mons = []; queue = [];
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

  for (const m of mons) {
    m.flash = Math.max(0, m.flash - dt); m.kx = Math.max(0, m.kx - 35 * dt);
    if (m.state === 'walk') {
      if (m.retreat) {                     // chefão recuado, esperando a invocação morrer
        const tx = contactX(m) + 46;
        m.x += Math.sign(tx - m.x) * Math.min(Math.abs(tx - m.x), 30 * dt);
        continue;
      }
      const move = (fighting ? 0 : speed) + m.spd;
      const stop = m === f ? contactX(m) : Math.max(contactX(m), (f ? f.x : 0) + 16);
      m.x -= move * dt;
      if (m.x <= stop) {
        m.x = stop;
        if (m === f) {
          if (m.under) { m.under = false; m.emerge = 0; burst(m.x, GY - 4, '#d8b070', 14); }
          m.state = 'fight';
        }
      }
    } else if (m.state === 'fight' && m === f) {
      if (m.emerge < 1) { m.emerge = Math.min(1, m.emerge + dt / 0.45); continue; }
      if (m.wind > 0) {
        m.wind -= dt; if (Math.random() < dt * 20) shake = Math.max(shake, 1);
        if (m.wind <= 0) { m.lunge = 0; m.hitDone = false; m.heavy = true; }
      } else {
        m.atkT -= dt;
        if (m.atkT <= 0 && m.lunge < 0) {
          m.attacks++; m.atkT = m.kind === 'normal' ? 1.5 : 1.7;
          if (m.kind !== 'normal' && m.attacks % 3 === 0) m.wind = 0.75;
          else { m.lunge = 0; m.hitDone = false; m.heavy = false; }
        }
      }
      if (m.lunge >= 0) {
        m.lunge += dt / 0.32;
        if (m.lunge >= 0.5 && !m.hitDone) {
          m.hitDone = true;
          const d = Math.max(1, Math.round(m.dmg * (m.heavy ? 2.2 : 1)) - Hs.def);
          hero.hp -= d; hero.hurt = 0.45;
          float(HX - 4, GY - 34, '-' + d, '#ff6a5a', m.heavy);
          if (m.heavy || m.kind === 'boss') shake = m.heavy ? 6 : 3;
          if (hero.hp <= 0) { heroDie(); return; }
        }
        if (m.lunge >= 1) m.lunge = -1;
      }
    }
  }

  hero.hurt = Math.max(0, hero.hurt - dt);
  const idle = 1.9 + (!fighting ? Math.sin(time * 8) * 0.08 : 0);
  if (fighting && f.emerge >= 1) {
    hero.atkT -= dt;
    if (hero.swing < 0 && hero.atkT <= 0) { hero.swing = 0; hero.hit = false; hero.atkT = Hs.atkInt; }
  }
  if (hero.swing >= 0) {
    hero.swing += dt / 0.22; const p = Math.min(1, hero.swing), e = 1 - (1 - p) * (1 - p);
    hero.ang = -1.0 + e * 3.6;
    if (p >= 0.5 && !hero.hit) { hero.hit = true; heroHit(front()); }
    if (hero.swing >= 1) hero.swing = -1;
  } else hero.ang += (idle - hero.ang) * Math.min(1, dt * 10);

  if (furyOn() && Math.random() < dt * 14) parts.push({ x: HX - 5 + Math.random() * 10, y: GY - 4 - Math.random() * 24, vx: 0, vy: -25, life: .5, c: '#ff6a5a', sz: 1 });
  if (tiredOn() && Math.random() < dt * 1.5) parts.push({ x: HX + 5, y: GY - 28, vx: 6, vy: 0, life: .7, c: '#7ab8ff', sz: 1 });
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
    drawHeroLying({ ...look, x: HX - 6, y: GY, time });
  } else {
    if (hero.hurt > 0 && Math.floor(time * 20) % 2) ctx.globalAlpha = 0.35;
    const walking = !(front() && front().state === 'fight') && !chest;
    drawHero({ ...look, x: HX, y: GY, walk: walking, step: Math.floor(time * 9) % 2, ang: hero.ang, swing: hero.swing, time });
    ctx.globalAlpha = 1;
    for (const m of mons.slice().sort((a, b) => b.x - a.x)) drawMon(m);
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
  ctx.save(); ctx.translate(x, GY); ctx.scale(m.s, m.s);
  setFlash(m.flash > 0 ? 1 : (m.wind > 0 && Math.floor(time * 14) % 2 ? 2 : 0));
  if (m.retreat) ctx.globalAlpha = 0.85;
  drawMonster(m, time);
  setFlash(0); ctx.restore(); ctx.globalAlpha = 1;
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
    txt((chest.kind === 'weapon' ? 'NOVA ARMA: ' : 'NOVA ARMADURA: ') + chest.item.n.toUpperCase(), W / 2, 30, '#ffe08a', 9);
  }
}
function drawHUD(resting) {
  const Hs = heroStats(), hp = Math.max(0, hero.hp);
  R(6, 6, 62, 7, '#0a0e22'); R(7, 7, 60 * hp / Hs.maxHp, 5, hp / Hs.maxHp > .35 ? '#e85d4f' : '#ff9a3a'); R(7, 7, 60 * hp / Hs.maxHp, 1, '#ff9e96');
  txt('HP ' + fmt(hp) + '/' + fmt(Hs.maxHp), 6, 22, '#eef0ff', 7, 'left');
  let sy = 31;
  if (furyOn()) { txt('FÚRIA', 6, sy, '#ff6a5a', 7, 'left'); sy += 9; }
  if (tiredOn()) { txt('CANSADO', 6, sy, '#7ab8ff', 7, 'left'); sy += 9; }
  if (restedOn()) { txt('DESCANSADO', 6, sy, '#a6f2a0', 7, 'left'); }
  if (resting) { txt('DIA DE DESCANSO', W - 6, 12, '#ffd04a', 8, 'right'); }
  else {
    const b = biomeFor(S.stage);
    txt(b.n.toUpperCase() + ' · FASE ' + S.stage, W - 6, 12, '#f2c14e', 8, 'right');
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
  setCtx(c);
  drawHero({ weapon: WEAPONS[0], armor: ARMORS[0], skin: SKINS[cfg.skin], hair: HAIRS[cfg.hair], cloth: CLOTHES[cfg.cloth],
    x: 20, y: 38, walk: false, step: 0, ang: 1.9, swing: -1, time: 0 });
  if (ctx) setCtx(ctx);
}
