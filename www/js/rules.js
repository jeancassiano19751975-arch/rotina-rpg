// Regras do jogo: XP, atraso, descanso, atributos, equipamento, forja, conquistas, offline.
import { S, bus, save, today, yesterday, addDays, parseDay, tMin, tGame, nowMin, weekStart } from './state.js';
import {
  DAILY_XP, OFFLINE_CAP_H, KILLS_PER_STAGE, CATS, WEAPONS, ARMOR_SETS, PIECES, SHIELDS, FORGE_MAX, FORGE_BONUS,
  RELICS, MONSTERS, BIOMES, ACHIEVEMENTS, PETS, PET_STAGES
} from './data.js';
import { FOCUS_WEIGHT } from './mentor.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const fmt = n => Math.floor(n).toLocaleString('pt-BR');
export const fmtTime = m => String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(((m % 60) + 60) % 60).padStart(2, '0');

// ---------- Nível e equipamento ----------
export const xpNeed = l => Math.round(50 * Math.pow(l, 1.3));
const tierBy = (list, lvlOf) => list.reduce((b, x, i) => (S.level >= lvlOf(x) ? i : b), -1);
export const weaponTier = () => Math.max(0, tierBy(WEAPONS, w => w.lvl));
export const shieldTier = () => tierBy(SHIELDS, x => x.lvl);              // -1 = sem escudo
export const pieceTier = i => Math.max(0, tierBy(ARMOR_SETS, a => a.lvl[i])); // 0 capacete · 1 peitoral · 2 calças
export const armorTier = () => pieceTier(1);
export const pieceName = i => ARMOR_SETS[pieceTier(i)].names[i];
const relicSum = key => S.relics.reduce((s, r) => s + (RELICS[r]?.[key] || 0), 0);

// ---------- Pets ----------
export const hasPet = () => !!(S.pet && S.pets && S.pets[S.pet]);
export function petStage(id = S.pet) {
  const days = (S.pets && S.pets[id] && S.pets[id].days) || 0;
  let st = PET_STAGES[0]; for (const x of PET_STAGES) if (days >= x.from) st = x;
  return { ...st, days, idx: PET_STAGES.indexOf(st) };
}
// Triste quando a sequência quebrou (até voltar a cumprir um dia perfeito).
export const petSad = () => hasPet() && S.streak === 0 && S.bestStreak > 0;
export const petActive = ab => hasPet() && !petSad() && PETS[S.pet].ability === ab;
export function checkPets() {
  S.pets = S.pets || {};
  const cond = {
    lobinho: S.bestStreak >= 3, coruja: (S.catDone && S.catDone.est || 0) >= 20, gatinho: (S.sleepOnTime || 0) >= 7,
    slimePet: !!S.bosses['Slime Colossal'], morceguinho: !!S.bosses['Conde Vampiro'], dragaozinho: !!S.bosses['Dragão Ancestral']
  };
  for (const id of Object.keys(PETS)) {
    if (S.pets[id] || !cond[id]) continue;
    S.pets[id] = { name: PETS[id].n, got: Date.now(), days: 0 };
    if (!S.pet) S.pet = id;
    bus.emit('pet', { id, ...PETS[id] });
  }
}

export const furyOn = () => Date.now() < S.furyUntil;
export const tiredOn = () => Date.now() < S.tiredUntil;
export const restedOn = () => S.restedDay === today();

export function heroStats() {
  const W = WEAPONS[weaponTier()], st = shieldTier(), Sh = st >= 0 ? SHIELDS[st] : null;
  const fa = 1 + FORGE_BONUS * S.forge.a, fs = 1 + FORGE_BONUS * (S.forge.s || 0);
  let armDef = 0, armHp = 0;
  PIECES.forEach((p, i) => { const A = ARMOR_SETS[pieceTier(i)]; armDef += A.def * p.share; armHp += A.hp * p.share; });
  const atk = (2 + S.level + W.atk * (1 + FORGE_BONUS * S.forge.w) + S.attrs.for / 4) * (1 + relicSum('atk'));
  const def = armDef * fa + (Sh ? Sh.def * fs : 0) + S.attrs.res / 8;
  const maxHp = (30 + S.level * 8 + armHp * fa + S.attrs.vit * 0.8) * (1 + relicSum('hp'));
  const crit = 0.06 + Math.min(0.25, S.attrs.sab / 400) + relicSum('crit') + (petActive('crit') ? 0.04 * petStage().k : 0);
  const block = Sh ? Sh.block + 0.02 * (S.forge.s || 0) : 0;
  let atkInt = Math.max(0.45, 0.85 - S.level * 0.012);
  if (tiredOn()) atkInt *= 1.35;
  if (furyOn()) atkInt /= 1.6;
  return { atk: Math.round(atk), def: Math.round(def), maxHp: Math.round(maxHp), crit, block, atkInt };
}

// Saves antigos: marca o equipamento atual como já visto (sem baús repetidos).
export function migrateGear() {
  if (S.seen && S.seen.ok) return;
  S.seen = { ok: true, w: weaponTier(), s: shieldTier(), p: [pieceTier(0), pieceTier(1), pieceTier(2)] };
  if (S.forge.s == null) S.forge.s = 0;
}

export function gainXP(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level);
    S.level++;
    bus.emit('levelup', S.level);
  }
  migrateGear();
  const wt = weaponTier(), st = shieldTier();
  if (wt > S.seen.w) { S.seen.w = wt; S.forge.w = 0; bus.emit('chest', { kind: 'weapon', item: WEAPONS[wt], name: WEAPONS[wt].n }); }
  if (st > S.seen.s) { S.seen.s = st; S.forge.s = 0; bus.emit('chest', { kind: 'shield', item: SHIELDS[st], name: SHIELDS[st].n }); }
  ['helm', 'chest', 'legs'].forEach((kind, i) => {
    const t = pieceTier(i);
    if (t > S.seen.p[i]) { S.seen.p[i] = t; if (i === 1) S.forge.a = 0; bus.emit('chest', { kind, item: ARMOR_SETS[t], name: ARMOR_SETS[t].names[i] }); }
  });
}

// ---------- Forja ----------  w = arma · a = armadura · s = escudo
export function forgeCost(kind) {
  const tier = kind === 'w' ? weaponTier() : kind === 's' ? shieldTier() : armorTier();
  return Math.round(150 * (tier + 1) * Math.pow((S.forge[kind] || 0) + 1, 2));
}
export function doForge(kind) {
  if (kind === 's' && shieldTier() < 0) return { error: 'Você ainda não tem escudo.' };
  if ((S.forge[kind] || 0) >= FORGE_MAX) return { error: 'Já está no máximo (+' + FORGE_MAX + ').' };
  const c = forgeCost(kind);
  if (S.gold < c) return { error: 'Faltam ' + fmt(c - S.gold) + ' de ouro.' };
  S.gold -= c; S.forge[kind] = (S.forge[kind] || 0) + 1; S.forged = true;
  checkAch(); save();
  return { ok: true, level: S.forge[kind] };
}

// ---------- Rotina ----------
export const tasksOn = k => {
  const wd = parseDay(k).getDay();
  return S.tasks.filter(t => t.days.includes(wd)).sort((a, b) => tGame(a.time) - tGame(b.time));
};
export const isRest = k => S.restDays.includes(k);
export const dayLog = k => (S.log[k] = S.log[k] || {});
const weight = t => (CATS[t.cat]?.w || 1) * Math.sqrt(clamp(t.dur, 5, 180) / 30) * (t.focus ? FOCUS_WEIGHT : 1);

export function baseXP(t, k = today()) {
  if (isRest(k)) return 0;
  const list = tasksOn(k);
  const sum = list.reduce((s, x) => s + weight(x), 0) || 1;
  return Math.max(1, Math.round(DAILY_XP * weight(t) / sum));
}

// Faixas de atraso: até 30 min = 100%, até 2 h = 75%, depois = 50%. Libera 1 h antes.
export function lateInfo(t, m = nowMin()) {
  const diff = m - tGame(t.time);
  if (diff < -60) return { locked: true, unlockAt: fmtTime(tGame(t.time) - 60), factor: 1, label: '' };
  if (diff <= 30) return { locked: false, factor: 1, late: false, label: diff < 0 ? 'Adiantado' : 'No horário' };
  if (diff <= 120) return { locked: false, factor: 0.75, late: true, label: 'Atrasado · 75%' };
  return { locked: false, factor: 0.5, late: true, label: 'Muito atrasado · 50%' };
}
export function predictXP(t, k = today()) {
  const li = lateInfo(t);
  let xp = baseXP(t, k) * li.factor;
  if (restedOn() && tGame(t.time) < 720) xp *= 1.1;
  return Math.round(xp);
}

export function completeTask(id, opts = {}) {
  const k = today();
  if (isRest(k)) return { error: 'Hoje é dia de descanso.' };
  const t = S.tasks.find(x => x.id === id);
  if (!t || !tasksOn(k).includes(t)) return { error: 'Essa missão não é de hoje.' };
  const lg = dayLog(k);
  if (lg[id]) return { error: 'Missão já concluída.' };
  const li = lateInfo(t);
  if (li.locked) return { error: 'Essa missão libera às ' + li.unlockAt + '.' };

  let xp = baseXP(t, k) * li.factor;
  if (restedOn() && tGame(t.time) < 720) xp *= 1.1;
  if (opts.verified) xp *= 1.5;
  xp = Math.max(1, Math.round(xp));

  lg[id] = { at: Date.now(), xp, late: !!li.late, verified: !!opts.verified };
  S.tasksDone++;
  if (!li.late) S.onTime++;
  if (nowMin() < 420) S.earlyBird++;
  S.catDone = S.catDone || {}; S.catDone[t.cat] = (S.catDone[t.cat] || 0) + 1;
  if (t.cat === 'son' && !li.late) S.sleepOnTime = (S.sleepOnTime || 0) + 1;
  const attr = CATS[t.cat]?.attr || 'for';
  S.attrs[attr] += xp / 10;
  const gold = Math.round(xp / 4);
  S.gold += gold;

  if (li.late) { S.tiredUntil = Date.now() + 20 * 60000; S.furyUntil = 0; }
  else { S.furyUntil = Math.max(Date.now(), S.furyUntil) + 90000; S.tiredUntil = 0; }

  gainXP(xp);

  let perfect = false;
  const list = tasksOn(k);
  if (list.length && list.every(x => lg[x.id]) && S.lastPerfectDay !== k) {
    perfect = true;
    S.lastPerfectDay = k;
    S.perfectDays++;
    S.streak = S.lastGood === yesterday() ? S.streak + 1 : 1;
    S.lastGood = k;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    if (S.pets) for (const id of Object.keys(S.pets)) S.pets[id].days = (S.pets[id].days || 0) + 1;
  }
  bus.emit('task-done', { t, xp, gold, late: !!li.late, verified: !!opts.verified, perfect, attr });
  checkAch();
  save();
  return { ok: true, xp, gold, late: !!li.late, perfect };
}

// Virada de dia: confere sequência, descanso e "Descansado".
export function rollover() {
  const t = today();
  if (S.day === t) return false;
  let d = S.day, guard = 0;
  while (d < t && guard++ < 120) {
    const free = isRest(d) || tasksOn(d).length === 0;
    if (free) { if (S.lastGood === addDays(d, -1)) S.lastGood = d; }
    else if (S.lastGood !== d) S.streak = 0;
    d = addDays(d, 1);
  }
  if (isRest(yesterday())) S.restedDay = t;
  S.day = t;
  S.restDays = S.restDays.filter(x => x >= addDays(t, -60));
  const keep = addDays(t, -40);
  for (const k of Object.keys(S.log)) if (k < keep) delete S.log[k];
  checkAch();
  save();
  return true;
}

// ---------- Descanso ----------
export const restCountWeek = k => S.restDays.filter(d => weekStart(d) === weekStart(k)).length;
export function toggleRest(k) {
  if (isRest(k)) {
    if (k <= today()) return { error: 'O descanso de hoje já começou.' };
    S.restDays = S.restDays.filter(d => d !== k); save(); return { ok: true, on: false };
  }
  if (k <= today()) return { error: 'O descanso precisa ser marcado até a noite anterior.' };
  if (restCountWeek(k) >= S.restPerWeek) return { error: 'Limite de ' + S.restPerWeek + ' descanso(s) nessa semana.' };
  S.restDays.push(k); save(); return { ok: true, on: true };
}

// Porcentagem da rotina cumprida nos últimos 7 dias (sem contar descanso).
export function weekRate() {
  let tot = 0, done = 0;
  for (let i = 1; i <= 7; i++) {
    const k = addDays(today(), -i);
    if (isRest(k)) continue;
    const list = tasksOn(k), lg = S.log[k] || {};
    tot += list.length; done += list.filter(x => lg[x.id]).length;
  }
  return tot ? done / tot : 1;
}

// ---------- Monstros ----------
// Fase → bioma. Depois da fase 70 os biomas se repetem no Modo Pesadelo.
export function biomeFor(st) {
  const i = Math.floor((st - 1) / 10);
  const b = BIOMES[i % BIOMES.length];
  return { ...b, nightmare: i >= BIOMES.length, cycle: Math.floor(i / BIOMES.length) };
}
export function slotKind(st = S.stage, idx = S.stageKills) {
  if (idx !== KILLS_PER_STAGE - 1) return 'normal';
  if (st % 10 === 0) return 'boss';
  if (st % 10 === 5) return 'mini';
  return 'normal';
}
// Vida e dano crescem de forma suave; cada ciclo do Pesadelo multiplica tudo.
export function mStats(st, key, kind) {
  const M = MONSTERS[key] || MONSTERS.slime, cyc = biomeFor(st).cycle;
  const hk = kind === 'boss' ? 5 : kind === 'mini' ? 3.2 : 1;
  const dk = kind === 'boss' ? 1.35 : kind === 'mini' ? 1.2 : 1;
  const gk = kind === 'boss' ? 8 : kind === 'mini' ? 4 : 1;
  const nm = Math.pow(1.6, cyc);
  return {
    hp: Math.round(8 * Math.pow(1 + 0.35 * (st - 1), 1.6) * M.hp * hk * nm),
    dmg: Math.max(1, Math.round(2 * Math.pow(1 + 0.3 * (st - 1), 1.2) * M.dmg * dk * nm)),
    gold: Math.round(3 * Math.pow(1 + 0.25 * (st - 1), 1.3) * gk * (1 + cyc * 0.5))
  };
}
export function onKill(mon) {
  S.gold += mon.gold; S.kills++;
  if (mon.kind === 'mini') S.miniKills++;
  if (mon.kind === 'boss') { S.bossKills++; S.bosses[mon.name] = (S.bosses[mon.name] || 0) + 1; }
}
export function onSlotCleared() {
  S.stageKills++;
  if (S.stageKills >= KILLS_PER_STAGE) {
    S.stage++; S.stageKills = 0;
    if (S.stage > S.maxStage) S.maxStage = S.stage;
    bus.emit('stage', S.stage);
  }
  checkAch(); save();
}
export function onHeroDeath() {
  S.stage = Math.max(1, S.stage - 1); S.stageKills = 0; save();
}

// ---------- Conquistas ----------
const COND = {
  t1: () => S.tasksDone >= 1, t25: () => S.tasksDone >= 25, t100: () => S.tasksDone >= 100,
  cedo5: () => S.earlyBird >= 5, perf: () => S.perfectDays >= 1,
  str3: () => S.streak >= 3, str7: () => S.streak >= 7, pont20: () => S.onTime >= 20,
  k50: () => S.kills >= 50, k500: () => S.kills >= 500, mini: () => S.miniKills >= 1,
  boss1: () => !!S.bosses['Slime Colossal'], boss2: () => !!S.bosses['Faraó Esquecido'], st71: () => S.maxStage >= 71,
  st20: () => S.maxStage >= 20, lv5: () => S.level >= 5, lv10: () => S.level >= 10,
  forja: () => !!S.forged, rest: () => S.restDays.some(d => d <= today())
};
export function checkAch() {
  checkPets();
  for (const a of ACHIEVEMENTS) {
    const ok = a.boss ? !!S.bosses[a.boss] : COND[a.id]?.();
    if (S.ach[a.id] || !ok) continue;
    S.ach[a.id] = Date.now();
    if (a.title && !S.titles.includes(a.title)) { S.titles.push(a.title); if (!S.title) S.title = a.title; }
    if (a.relic && !S.relics.includes(a.relic)) S.relics.push(a.relic);
    bus.emit('ach', a);
  }
}

// ---------- Progresso offline ----------
export function offlineProgress() {
  if (!S.lastSeen) return null;
  let el = Math.min((Date.now() - S.lastSeen) / 1000, OFFLINE_CAP_H * 3600);
  if (el < 60 || isRest(today())) return null;
  const total = el, st0 = S.stage, H = heroStats();
  const dps = H.atk * (1 + H.crit) / H.atkInt;
  let kills = 0, gold = 0, st = S.stage, sk = S.stageKills, guard = 0;
  while (el > 0 && guard++ < 6000) {
    const kind = slotKind(st, sk);
    const b = biomeFor(st);
    const base = kind === 'boss' ? b.boss : kind === 'mini' ? b.mini : b.mons[guard % b.mons.length];
    const m = mStats(st, base, kind);
    const ft = m.hp / dps * (kind === 'boss' ? 1.4 : 1);
    const taken = Math.ceil(ft / 1.5 + 1) * Math.max(1, m.dmg * 0.25, m.dmg - H.def) * (kind === "normal" ? 1 : 1.6);
    if (taken > H.maxHp) {           // não passa: fica farmando a fase anterior
      if (sk > 0 || st === 1) { sk = 0; }
      else { st = Math.max(1, st - 1); sk = 0; }
      const fb = biomeFor(st), fm = mStats(st, fb.mons[0], 'normal');
      const ftk = fm.hp / dps + 2.4;
      const n = Math.floor(el / ftk);
      kills += n; gold += n * fm.gold; el = 0; break;
    }
    const tk = ft + 2.4;
    if (el < tk) break;
    el -= tk; kills++; gold += m.gold; sk++;
    if (sk >= KILLS_PER_STAGE) { st++; sk = 0; }
  }
  if (!kills) return null;
  S.kills += kills; S.gold += gold; S.stage = st; S.stageKills = sk;
  if (st > S.maxStage) S.maxStage = st;
  checkAch(); save();
  return { seconds: total, kills, gold, stage: st, advanced: st - st0 };
}
