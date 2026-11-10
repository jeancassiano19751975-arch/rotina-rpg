// Motivação diária: calendário de 7 dias, desafio do dia, combo de missões no horário,
// cartas de monstro, gemas e o resumo do mês.
import { S, bus, save, today, addDays, parseDay } from './state.js';
import { CATS, POTIONS, BIOMES, MONSTERS } from './data.js';
import { tasksOn, isRest, fmt } from './rules.js';

const f = () => 1 + (S.maxStage || 1) / 20;          // prêmios crescem com o avanço

// ---------- gemas ----------
export const GEMS = {
  rubi:      { n: 'Rubi',      c: '#e83a4a', l: '#ff8a9a', d: 'Golpes podem queimar o monstro (dano por 3 s)' },
  safira:    { n: 'Safira',    c: '#3a7ae8', l: '#8ac0ff', d: 'Golpes podem congelar o monstro (ele demora para atacar)' },
  esmeralda: { n: 'Esmeralda', c: '#2ab85a', l: '#8af0a8', d: 'Golpes podem envenenar o monstro (dano por 5 s)' }
};
export function giveGem(k) {
  k = k || Object.keys(GEMS)[Math.floor(Math.random() * 3)];
  S.gems = S.gems || {}; S.gems[k] = (S.gems[k] || 0) + 1; save();
  return k;
}
export const socketOf = wid => (S.sockets && S.sockets[wid]) || null;
export function setSocket(wid, gem) {
  S.sockets = S.sockets || {}; S.gems = S.gems || {};
  const old = S.sockets[wid];
  if (old) S.gems[old] = (S.gems[old] || 0) + 1;            // a gema antiga volta para a bolsa
  if (gem) { if (!S.gems[gem]) return { error: 'Você não tem essa gema.' }; S.gems[gem]--; S.sockets[wid] = gem; }
  else delete S.sockets[wid];
  save(); return { ok: true };
}

// ---------- calendário de 7 dias ----------
// Cada dia com pelo menos 1 missão cumprida libera o próximo prêmio. Faltar um dia só pausa.
export const CAL = [
  { n: 'Ouro', ic: 'gold', give: () => { const g = Math.round(100 * f()); S.gold += g; return '+' + fmt(g) + ' de ouro'; } },
  { n: 'Poção de Vida', ic: 'potion', c: POTIONS.vida.c, give: () => { S.potions = S.potions || {}; S.potions.vida = (S.potions.vida || 0) + 1; return 'Poção de Vida'; } },
  { n: 'Mais ouro', ic: 'gold', give: () => { const g = Math.round(200 * f()); S.gold += g; return '+' + fmt(g) + ' de ouro'; } },
  { n: 'Gema', ic: 'gem', give: () => GEMS[giveGem()].n },
  { n: 'Ouro', ic: 'gold', give: () => { const g = Math.round(300 * f()); S.gold += g; return '+' + fmt(g) + ' de ouro'; } },
  { n: 'Poções', ic: 'potion', c: POTIONS.forca.c, give: () => { S.potions = S.potions || {}; S.potions.forca = (S.potions.forca || 0) + 1; S.potions.ferro = (S.potions.ferro || 0) + 1; return 'Poção de Força e de Pele de Ferro'; } },
  { n: 'Baú grande', ic: 'chest', give: () => { const g = Math.round(800 * f()); S.gold += g; const gem = GEMS[giveGem()].n; return '+' + fmt(g) + ' de ouro e ' + gem; } }
];
export function calState() { S.cal = S.cal || { idx: 0, last: '' }; return S.cal; }
function calOnTask() {
  const c = calState(), k = today();
  if (c.last === k) return null;
  const R = CAL[c.idx], txt = R.give(), day = c.idx + 1;
  c.last = k; c.idx = (c.idx + 1) % 7; c.rounds = (c.rounds || 0) + (day === 7 ? 1 : 0);
  save();
  return { day, txt, big: day === 7 };
}

// ---------- desafio do dia ----------
const DC_TYPES = {
  cedo:    { n: t => 'Cumpra ' + t + ' missões antes do meio-dia', ok: (lg) => Object.values(lg).filter(x => new Date(x.at).getHours() < 12).length },
  pontual: { n: t => 'Cumpra ' + t + ' missões no horário', ok: (lg) => Object.values(lg).filter(x => !x.late).length },
  foco:    { n: () => 'Use o modo foco ⏱ em 1 missão', ok: (lg) => Object.values(lg).filter(x => x.focus).length },
  todas:   { n: () => 'Cumpra todas as missões de hoje', ok: (lg, list) => list.length && list.every(t => lg[t.id]) ? 1 : 0 },
  cat:     { n: (t, c) => 'Cumpra ' + t + ' missão de ' + CATS[c].n, ok: (lg, list, c) => list.filter(t => t.cat === c && lg[t.id]).length }
};
export function dailyChallenge() {
  const k = today();
  if (S.dc && S.dc.day === k) return S.dc;
  const list = tasksOn(k);
  if (!list.length || isRest(k)) { S.dc = { day: k, none: true }; return S.dc; }
  const opts = [];
  const morning = list.filter(t => parseInt(t.time) < 12).length;
  if (morning >= 2) opts.push({ k: 'cedo', target: Math.min(3, morning) });
  if (list.length >= 3) opts.push({ k: 'pontual', target: Math.min(4, Math.ceil(list.length * 0.6)) });
  opts.push({ k: 'foco', target: 1 });
  if (list.length <= 6) opts.push({ k: 'todas', target: 1 });
  const cats = [...new Set(list.map(t => t.cat))]; const c = cats[Math.floor(Math.random() * cats.length)];
  opts.push({ k: 'cat', target: 1, cat: c });
  const pick = opts[Math.floor(Math.random() * opts.length)];
  S.dc = { day: k, ...pick, claimed: false }; save();
  return S.dc;
}
export function dcProgress(dc = dailyChallenge()) {
  if (dc.none) return 0;
  const lg = S.log[dc.day] || {}, list = tasksOn(dc.day);
  return Math.min(dc.target, DC_TYPES[dc.k].ok(lg, list, dc.cat));
}
export const dcName = dc => dc.none ? 'Sem desafio hoje' : DC_TYPES[dc.k].n(dc.target, dc.cat);
function dcOnTask() {
  const dc = dailyChallenge();
  if (dc.none || dc.claimed || dcProgress(dc) < dc.target) return null;
  dc.claimed = true; const g = Math.round(150 * f()); S.gold += g;
  const gem = Math.random() < 0.5 ? GEMS[giveGem()].n : null;
  S.dcDone = (S.dcDone || 0) + 1; save();
  return '+' + fmt(g) + ' de ouro' + (gem ? ' e ' + gem : '');
}

// ---------- combo ----------
// Missões seguidas no horário aumentam o XP (+5% cada, até +50%). Atrasou ou faltou, zera.
export const comboMul = (n = S.combo || 0) => 1 + Math.min(10, n) * 0.05;
export function comboBefore(late) { if (late) { S.combo = 0; return 1; } return comboMul(S.combo || 0); }
export function comboAfter(late) { S.combo = late ? 0 : (S.combo || 0) + 1; S.bestCombo = Math.max(S.bestCombo || 0, S.combo); }
export function comboRollover(prevDay) {               // faltou missão ontem: zera
  const list = tasksOn(prevDay), lg = S.log[prevDay] || {};
  if (!isRest(prevDay) && list.some(t => !lg[t.id])) S.combo = 0;
}

// Chamado a cada missão concluída (depois do XP).
export function afterTask(verified) {
  const out = {};
  out.cal = calOnTask();
  out.dc = dcOnTask();
  out.wb = worldHit(verified);
  return out;
}

// ---------- cartas de monstro ----------
export function cardKey(m) { return m.bkey || m.key; }
export function rollCard(m) {
  const ch = m.kind === 'boss' ? 0.35 : m.kind === 'mini' ? 0.15 : m.elite ? 0.1 : 0.02;
  if (Math.random() >= ch) return null;
  const k = cardKey(m); S.cards = S.cards || {};
  const first = !S.cards[k]; S.cards[k] = (S.cards[k] || 0) + 1; save();
  return { k, first, name: m.name };
}
export function biomeCards(b) { return [...b.mons, b.mini, ...(b.mini2 ? [b.mini2] : []), b.boss]; }
export const setDone = b => biomeCards(b).every(k => S.cards && S.cards[k]);
export const cardBonus = () => BIOMES.filter(setDone).length * 0.03;   // +3% de ataque por bioma completo
export function checkSets() {
  S.setsDone = S.setsDone || {};
  const novos = [];
  for (const b of BIOMES) if (setDone(b) && !S.setsDone[b.id]) { S.setsDone[b.id] = Date.now(); novos.push(b.n); }
  if (novos.length) save();
  return novos;
}

// ---------- resumo do mês ----------
export function monthStats(ref = today()) {
  const d0 = parseDay(ref); const y = d0.getFullYear(), mo = d0.getMonth();
  const days = new Date(y, mo + 1, 0).getDate(), out = { days: [], cats: {}, hours: Array(24).fill(0), done: 0, tot: 0, ontime: 0, perfect: 0, best: 0 };
  let run = 0;
  for (let i = 1; i <= days; i++) {
    const k = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
    if (k > ref) { out.days.push({ k, future: true }); continue; }
    const rest = isRest(k), list = rest ? [] : tasksOn(k), lg = S.log[k] || {};
    const done = list.filter(t => lg[t.id]);
    out.days.push({ k, rest, done: done.length, tot: list.length });
    out.done += done.length; out.tot += list.length;
    done.forEach(t => { out.cats[t.cat] = (out.cats[t.cat] || 0) + 1; const x = lg[t.id]; if (!x.late) out.ontime++; if (x.at) out.hours[new Date(x.at).getHours()]++; });
    if (list.length && done.length === list.length) { out.perfect++; run++; out.best = Math.max(out.best, run); } else if (!rest && list.length) run = 0;
  }
  const topCat = Object.entries(out.cats).sort((a, b) => b[1] - a[1])[0];
  out.topCat = topCat ? CATS[topCat[0]].n : null;
  const h = out.hours.indexOf(Math.max(...out.hours)); out.topHour = out.done ? h : null;
  out.month = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][mo];
  return out;
}

// ---------- Renascer ----------
export const REBIRTH_LVL = 30;
export const rebirthBonus = () => (S.rebirths || 0) * 0.10;          // +10% de ataque e vida por renascimento
export const canRebirth = () => (S.level || 1) >= REBIRTH_LVL;
export function doRebirth() {
  if (!canRebirth()) return { error: 'Renascer libera no nível ' + REBIRTH_LVL + '.' };
  S.rebirths = (S.rebirths || 0) + 1;
  S.level = 1; S.xp = 0; S.stage = 1; S.stageKills = 0;
  S.seen = { ok: true, w: 0, s: -1, p: [0, 0, 0] };                   // os baús de equipamento caem de novo
  if (S.equip) for (const k of Object.keys(S.equip)) if (/^[wshcl]\d$/.test(S.equip[k])) delete S.equip[k];
  const t = 'Renascido ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][Math.min(9, S.rebirths - 1)];
  S.titles = S.titles || []; if (!S.titles.includes(t)) S.titles.push(t); S.title = t;
  save();
  return { ok: true, n: S.rebirths, title: t };
}
export const auraColor = () => { const r = S.rebirths || 0; return r >= 3 ? '#c87aff' : r === 2 ? '#7af0ff' : r === 1 ? '#ffe08a' : null; };

// ---------- Chefão do mês ----------
// Um chefão gigante por mês: cada missão cumprida dá um golpe nele.
const WB = ['dragao', 'golemCorrompido', 'grifo', 'conde', 'rainhaGelo', 'reiOssos', 'farao', 'serpente', 'slimeRei'];
export function worldBoss() {
  const k = today().slice(0, 7);
  if (S.wb && S.wb.month === k) return S.wb;
  const d = parseDay(today()), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  let tasks = 0;
  for (let i = 1; i <= days; i++) { const dk = k + '-' + String(i).padStart(2, '0'); if (!isRest(dk)) tasks += tasksOn(dk).length; }
  const max = Math.max(30, Math.round(tasks * 0.65));
  const key = WB[(d.getFullYear() * 12 + d.getMonth()) % WB.length];
  S.wb = { month: k, key, hp: max, max, killed: false }; save();
  return S.wb;
}
function worldHit(verified) {
  const wb = worldBoss(); if (wb.killed) return null;
  const dmg = verified ? 2 : 1; wb.hp = Math.max(0, wb.hp - dmg);
  let reward = null;
  if (wb.hp === 0) {
    wb.killed = true;
    const g = Math.round(2000 * f()); S.gold += g; const g1 = GEMS[giveGem()].n, g2 = GEMS[giveGem()].n;
    S.titles = S.titles || []; if (!S.titles.includes('Matador de Titãs')) S.titles.push('Matador de Titãs');
    S.wbKills = (S.wbKills || 0) + 1;
    reward = '+' + fmt(g) + ' de ouro, ' + g1 + ', ' + g2 + ' e o título "Matador de Titãs"';
  }
  save();
  return { dmg, hp: wb.hp, max: wb.max, reward, key: wb.key };
}
export function afterTaskWorld(verified) { return worldHit(verified); }

// ---------- Masmorra da semana ----------
// Libera no domingo se as 3 missões da semana estiverem cumpridas. Uma tentativa por semana.
export const DUNGEON_BOSSES = ['slimeRei', 'farao', 'rainhaGelo', 'reiOssos', 'serpente', 'conde', 'dragao', 'grifo', 'golemCorrompido'];
export function runDungeon(stats, mstats) {
  const out = []; let hp = stats.maxHp, room = 0;
  while (room < 30) {
    const key = DUNGEON_BOSSES[room % DUNGEON_BOSSES.length];
    const st = Math.max(1, (S.maxStage || 1) - 6 + room * 2);
    const B = mstats(st, key, 'boss');
    const dps = stats.atk / stats.atkInt * (1 + stats.crit);
    const ttk = B.hp / Math.max(1, dps);
    const hit = Math.max(B.dmg * 0.25, B.dmg - stats.def) * (1 - Math.min(0.5, stats.block || 0) * 0.6);
    const taken = hit / 1.6 * ttk;
    const win = taken < hp;
    out.push({ key, st, win, before: hp, after: Math.max(0, hp - taken), ttk });
    if (!win) break;
    hp = Math.min(stats.maxHp, hp - taken + stats.maxHp * 0.35);   // descansa um pouco entre as salas
    room++;
  }
  const cleared = out.filter(r => r.win).length;
  const gold = Math.round(cleared * 150 * f());
  const gems = Math.floor(cleared / 5);
  return { rooms: out, cleared, gold, gems };
}
export function dungeonReward(res) {
  S.gold += res.gold; for (let i = 0; i < res.gems; i++) giveGem();
  const best = S.dungeonBest || 0; if (res.cleared > best) S.dungeonBest = res.cleared;
  save(); return res.cleared > best;
}
