// Regras do jogo: XP, atraso, descanso, atributos, equipamento, forja, conquistas, offline.
import { S, bus, save, today, yesterday, addDays, parseDay, tMin, nowMin, weekStart } from './state.js';
import {
  DAILY_XP, OFFLINE_CAP_H, KILLS_PER_STAGE, CATS, WEAPONS, ARMORS, FORGE_MAX, FORGE_BONUS,
  RELICS, MONSTERS, BIOMES, ACHIEVEMENTS
} from './data.js';
import { FOCUS_WEIGHT } from './mentor.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const fmt = n => Math.floor(n).toLocaleString('pt-BR');
export const fmtTime = m => String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(((m % 60) + 60) % 60).padStart(2, '0');

// ---------- Nível e equipamento ----------
export const xpNeed = l => Math.round(50 * Math.pow(l, 1.3));
export const weaponTier = () => WEAPONS.reduce((b, w, i) => (S.level >= w.lvl ? i : b), 0);
export const armorTier = () => ARMORS.reduce((b, a, i) => (S.level >= a.lvl ? i : b), 0);
const relicSum = key => S.relics.reduce((s, r) => s + (RELICS[r]?.[key] || 0), 0);

export const furyOn = () => Date.now() < S.furyUntil;
export const tiredOn = () => Date.now() < S.tiredUntil;
export const restedOn = () => S.restedDay === today();

export function heroStats() {
  const W = WEAPONS[weaponTier()], A = ARMORS[armorTier()];
  const atk = (2 + S.level + W.atk * (1 + FORGE_BONUS * S.forge.w) + S.attrs.for / 4) * (1 + relicSum('atk'));
  const def = A.def * (1 + FORGE_BONUS * S.forge.a) + S.attrs.res / 8;
  const maxHp = (30 + S.level * 8 + A.hp * (1 + FORGE_BONUS * S.forge.a) + S.attrs.vit * 0.8) * (1 + relicSum('hp'));
  const crit = 0.06 + Math.min(0.25, S.attrs.sab / 400) + relicSum('crit');
  let atkInt = Math.max(0.45, 0.85 - S.level * 0.012);
  if (tiredOn()) atkInt *= 1.35;
  if (furyOn()) atkInt /= 1.6;
  return { atk: Math.round(atk), def: Math.round(def), maxHp: Math.round(maxHp), crit, atkInt };
}

export function gainXP(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level);
    S.level++;
    bus.emit('levelup', S.level);
  }
  const wt = weaponTier(), at = armorTier();
  if (wt > S.seenWeapon) { S.seenWeapon = wt; S.forge.w = 0; bus.emit('chest', { kind: 'weapon', item: WEAPONS[wt] }); }
  if (at > S.seenArmor) { S.seenArmor = at; S.forge.a = 0; bus.emit('chest', { kind: 'armor', item: ARMORS[at] }); }
}

// ---------- Forja ----------
export function forgeCost(kind) {
  const tier = kind === 'w' ? weaponTier() : armorTier();
  return Math.round(150 * (tier + 1) * Math.pow(S.forge[kind] + 1, 2));
}
export function doForge(kind) {
  if (S.forge[kind] >= FORGE_MAX) return { error: 'Já está no máximo (+' + FORGE_MAX + ').' };
  const c = forgeCost(kind);
  if (S.gold < c) return { error: 'Faltam ' + fmt(c - S.gold) + ' de ouro.' };
  S.gold -= c; S.forge[kind]++; S.forged = true;
  checkAch(); save();
  return { ok: true, level: S.forge[kind] };
}

// ---------- Rotina ----------
export const tasksOn = k => {
  const wd = parseDay(k).getDay();
  return S.tasks.filter(t => t.days.includes(wd)).sort((a, b) => a.time.localeCompare(b.time));
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
  const diff = m - tMin(t.time);
  if (diff < -60) return { locked: true, unlockAt: fmtTime(tMin(t.time) - 60), factor: 1, label: '' };
  if (diff <= 30) return { locked: false, factor: 1, late: false, label: diff < 0 ? 'Adiantado' : 'No horário' };
  if (diff <= 120) return { locked: false, factor: 0.75, late: true, label: 'Atrasado · 75%' };
  return { locked: false, factor: 0.5, late: true, label: 'Muito atrasado · 50%' };
}
export function predictXP(t, k = today()) {
  const li = lateInfo(t);
  let xp = baseXP(t, k) * li.factor;
  if (restedOn() && tMin(t.time) < 720) xp *= 1.1;
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
  if (restedOn() && tMin(t.time) < 720) xp *= 1.1;
  if (opts.verified) xp *= 1.5;
  xp = Math.max(1, Math.round(xp));

  lg[id] = { at: Date.now(), xp, late: !!li.late, verified: !!opts.verified };
  S.tasksDone++;
  if (!li.late) S.onTime++;
  if (nowMin() < 420) S.earlyBird++;
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
export const biomeFor = st => BIOMES.find(b => st >= b.from && st <= b.to) || BIOMES[BIOMES.length - 1];
export function slotKind(st = S.stage, idx = S.stageKills) {
  if (idx !== KILLS_PER_STAGE - 1) return 'normal';
  if (st % 10 === 0) return 'boss';
  if (st % 10 === 5) return 'mini';
  return 'normal';
}
const biomeMul = st => (st > 10 ? 1.3 : 1);
export function mStats(st, base, kind) {
  const M = MONSTERS[base];
  const hk = kind === 'boss' ? 6 : kind === 'mini' ? 3.5 : 1;
  const dk = kind === 'boss' ? 1.7 : kind === 'mini' ? 1.4 : 1;
  const gk = kind === 'boss' ? 8 : kind === 'mini' ? 4 : 1;
  return {
    hp: Math.round(8 * Math.pow(1.18, st - 1) * M.hp * hk * biomeMul(st)),
    dmg: Math.max(1, Math.round(2 * Math.pow(1.13, st - 1) * M.dmg * dk * (st > 10 ? 1.15 : 1))),
    gold: Math.round(3 * Math.pow(1.12, st - 1)) * gk
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
  boss1: () => !!S.bosses['Slime Colossal'], boss2: () => !!S.bosses['Faraó Esquecido'],
  st20: () => S.maxStage >= 20, lv5: () => S.level >= 5, lv10: () => S.level >= 10,
  forja: () => !!S.forged, rest: () => S.restDays.some(d => d <= today())
};
export function checkAch() {
  for (const a of ACHIEVEMENTS) {
    if (S.ach[a.id] || !COND[a.id]?.()) continue;
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
    const base = kind === 'boss' ? b.boss.base : kind === 'mini' ? b.mini.base : b.mons[guard % b.mons.length];
    const m = mStats(st, base, kind);
    const ft = m.hp / dps * (kind === 'boss' ? 1.4 : 1);
    const taken = Math.ceil(ft / 1.5 + 1) * Math.max(1, m.dmg - H.def);
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
