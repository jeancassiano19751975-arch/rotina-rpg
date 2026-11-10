// Semana: missões semanais com baú de domingo, modo foco, diário, resumo semanal e check-in do Mestre.
import { S, bus, save, today, addDays, parseDay, weekStart, nowMin } from './state.js';
import { CATS, POTIONS, SHOP_CAPES } from './data.js';
import { tasksOn, isRest, isHard, completeTask, fmt } from './rules.js';

// ---------- dias da semana ----------
export function weekDays(ws = weekStart(today())) { return Array.from({ length: 7 }, (_, i) => addDays(ws, i)); }
// Resultado de um dia: feitas / total (dia difícil conta só as essenciais no "perfeito", mas aqui mostra tudo).
export function dayStats(k) {
  if (isRest(k)) return { rest: true, done: 0, tot: 0 };
  const list = tasksOn(k), lg = S.log[k] || {};
  return { done: list.filter(t => lg[t.id]).length, tot: list.length, hard: isHard(k),
    onTime: list.filter(t => lg[t.id] && !lg[t.id].late).length, xp: Object.values(lg).reduce((s, x) => s + (x.xp || 0), 0) };
}
const inWeek = (k, ws) => k >= ws && k <= addDays(ws, 6) && k <= today();

// ---------- missões semanais ----------
const GOALS = {
  perf:   { n: g => g.target + ' dias perfeitos', d: 'Cumpra todas as missões do dia' },
  ontime: { n: g => g.target + ' missões no horário', d: 'Até 30 min depois do horário' },
  cat:    { n: g => g.target + ' missões de ' + CATS[g.cat].n, d: 'Qualquer horário' },
  focus:  { n: g => g.target + ' sessões no modo foco', d: 'Use o cronômetro ⏱ numa missão' },
  diary:  { n: g => 'Escrever no diário em ' + g.target + ' dias', d: 'No fim da aba Missões' }
};
export const goalName = g => GOALS[g.k].n(g);
export const goalDesc = g => GOALS[g.k].d;
function makeGoals(ws) {
  const days = weekDays(ws).filter(k => !isRest(k));
  const tasks = days.flatMap(k => tasksOn(k));
  const n = tasks.length;
  const cats = {}; tasks.forEach(t => cats[t.cat] = (cats[t.cat] || 0) + 1);
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  const goals = [
    { k: 'perf', target: Math.max(1, Math.min(4, Math.round(days.length * 0.5))) },
    { k: 'ontime', target: Math.max(3, Math.round(n * 0.6)) }
  ];
  const extra = [];
  if (topCat && topCat[1] >= 2) extra.push({ k: 'cat', cat: topCat[0], target: Math.max(2, Math.round(topCat[1] * 0.7)) });
  extra.push({ k: 'focus', target: 2 }, { k: 'diary', target: 4 });
  goals.push(extra[Math.floor(Math.random() * extra.length)]);
  return goals;
}
export function goalProgress(g, ws = S.weekly.wk) {
  let v = 0;
  for (const k of weekDays(ws)) {
    if (!inWeek(k, ws)) continue;
    const lg = S.log[k] || {}, list = tasksOn(k);
    if (g.k === 'perf') { const e = isHard(k) ? null : list; if (!isRest(k) && e && e.length && e.every(t => lg[t.id])) v++; }
    else if (g.k === 'ontime') v += Object.values(lg).filter(x => !x.late).length;
    else if (g.k === 'cat') v += list.filter(t => t.cat === g.cat && lg[t.id]).length;
    else if (g.k === 'focus') v += Object.values(lg).filter(x => x.focus).length;
    else if (g.k === 'diary') v += S.diary && S.diary[k] && S.diary[k].trim() ? 1 : 0;
  }
  return Math.min(v, g.target);
}
export const weeklyDone = () => !!S.weekly && S.weekly.goals.every(g => goalProgress(g) >= g.target);
export const isSunday = () => parseDay(today()).getDay() === 0;
export const chestReady = () => weeklyDone() && !S.weekly.opened && isSunday();

function giveWeeklyChest(late) {
  const g = Math.round(300 * (1 + (S.maxStage || 1) / 10));
  S.gold += g;
  const ks = Object.keys(POTIONS), pk = ks[Math.floor(Math.random() * ks.length)];
  S.potions = S.potions || {}; S.potions[pk] = (S.potions[pk] || 0) + 1;
  const capes = SHOP_CAPES.filter(c => !(S.owned && S.owned[c.id]));
  let cape = null;
  if (capes.length && Math.random() < 0.3) { cape = capes[Math.floor(Math.random() * capes.length)]; S.owned = S.owned || {}; S.owned[cape.id] = true; }
  S.weekly.opened = true; S.weeklyChests = (S.weeklyChests || 0) + 1;
  save();
  const name = 'Baú da Semana: +' + fmt(g) + ' ouro, ' + POTIONS[pk].n + (cape ? ' e ' + cape.n : '');
  bus.emit('chest', { kind: 'surprise', item: cape ? { type: 'cape', vis: cape.vis } : { type: 'gold' }, name: 'BAÚ DA SEMANA' });
  return { gold: g, potion: POTIONS[pk].n, cape: cape && cape.n, text: name, late };
}
export function openWeekly() {
  if (!chestReady()) return { error: weeklyDone() ? 'O baú abre no domingo.' : 'Complete as 3 missões da semana.' };
  return giveWeeklyChest(false);
}
// Chama ao abrir e na virada do dia. Troca a semana; se o baú ficou fechado, entrega agora.
export function ensureWeek() {
  const ws = weekStart(today());
  if (S.weekly && S.weekly.wk === ws) return null;
  let late = null;
  if (S.weekly && !S.weekly.opened && S.weekly.goals.every(g => goalProgress(g, S.weekly.wk) >= g.target)) late = giveWeeklyChest(true);
  if (S.weekly) S.lastWeek = { wk: S.weekly.wk, done: S.weekly.goals.filter(g => goalProgress(g, S.weekly.wk) >= g.target).length };
  S.weekly = { wk: ws, goals: makeGoals(ws), opened: false };
  save();
  return late;
}

// ---------- modo foco ----------
export const focusCap = t => Math.min(t.dur, 120);
export function focusStart(id) {
  const t = S.tasks.find(x => x.id === id); if (!t) return { error: 'Missão não encontrada.' };
  if (S.focusRun) return { error: 'Já tem um foco rodando.' };
  S.focusRun = { id, day: today(), start: Date.now(), startMin: nowMin(), min: focusCap(t) }; save();
  bus.emit('focus', S.focusRun);
  return { ok: true };
}
export function focusLeft() { const f = S.focusRun; return f ? Math.max(0, f.start + f.min * 60000 - Date.now()) : 0; }
export function focusCancel() { S.focusRun = null; save(); bus.emit('focus', null); }
export function focusFinish() {
  const f = S.focusRun; if (!f) return { error: 'Nenhum foco rodando.' };
  if (focusLeft() > 0) return { error: 'Ainda falta tempo.' };
  S.focusRun = null;
  if (f.day !== today()) { save(); return { error: 'O foco era de outro dia.' }; }
  S.focusDone = (S.focusDone || 0) + 1;
  const r = completeTask(f.id, { verified: true, focus: true, atMin: f.startMin });
  bus.emit('focus', null);
  return r;
}

// ---------- diário ----------
export function saveDiary(text, k = today()) { S.diary = S.diary || {}; const v = String(text || '').slice(0, 600); if (v.trim()) S.diary[k] = v; else delete S.diary[k]; save(); }

// ---------- resumo e check-in do Mestre ----------
export function weekSummary(ws) {
  const days = weekDays(ws).map(k => ({ k, ...dayStats(k) }));
  const work = days.filter(d => !d.rest && d.tot && d.k <= today());
  const tot = work.reduce((s, d) => s + d.tot, 0), done = work.reduce((s, d) => s + d.done, 0);
  const perfect = work.filter(d => d.done === d.tot).length;
  const xp = days.reduce((s, d) => s + (d.xp || 0), 0);
  // missão que mais ficou para trás
  const miss = {};
  for (const d of work) { const lg = S.log[d.k] || {}; for (const t of tasksOn(d.k)) { miss[t.id] = miss[t.id] || { t, n: 0, of: 0 }; miss[t.id].of++; if (!lg[t.id]) miss[t.id].n++; } }
  const worst = Object.values(miss).filter(m => m.n > 0).sort((a, b) => b.n / b.of - a.n / a.of || b.n - a.n)[0] || null;
  return { ws, days, tot, done, rate: tot ? done / tot : 0, perfect, xp, worst };
}
export function heroComment(sm) {
  if (!sm.tot) return 'Semana tranquila. Que tal montar sua rotina na aba Rotina?';
  const r = sm.rate;
  if (r >= 0.9) return 'Que semana! Minha espada nunca esteve tão afiada. Bora manter esse ritmo!';
  if (r >= 0.7) return 'Semana boa! Os chefões me respeitam. Só mais um pouco e fica perfeita.';
  if (r >= 0.5) return 'Metade do caminho. Treinei, mas senti falta de você em algumas missões.';
  return 'Semana difícil, né? Tudo bem. Um passo de cada vez: vamos começar pelas missões de foco.';
}
// Check-in: uma vez por semana, olhando a semana anterior. Devolve null se já foi feito.
export function pendingCheckin() {
  const ws = weekStart(today()), prev = addDays(ws, -7);
  if (S.checkin === ws) return null;
  if (!S.since || S.since > addDays(prev, 3)) { S.checkin = ws; save(); return null; }   // pouco tempo de jogo: pula
  const sm = weekSummary(prev);
  if (sm.tot < 3) { S.checkin = ws; save(); return null; }
  return sm;
}
export function markCheckin() { S.checkin = weekStart(today()); save(); }
export function pauseTask(id, days = 7) {
  const t = S.tasks.find(x => x.id === id); if (!t) return;
  t.pauseUntil = addDays(today(), days); save();
}
