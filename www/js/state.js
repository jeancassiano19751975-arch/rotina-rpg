// Estado do jogo, persistência e utilitários de data.

const KEY = 'rotina-rpg-v1';

export const dayKey = (d = new Date()) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const today = () => dayKey();
export const yesterday = () => addDays(today(), -1);
export const tMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
// início da semana (segunda) de um dia
export const weekStart = k => { const d = parseDay(k); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return dayKey(d); };

let uid = Date.now();
export const newId = () => 't' + (uid++).toString(36);

const sampleTasks = () => [
  { id: newId(), name: 'Acordar e beber água',  time: '06:30', cat: 'son', dur: 5,  days: [0,1,2,3,4,5,6] },
  { id: newId(), name: 'Café da manhã',         time: '07:00', cat: 'ali', dur: 15, days: [0,1,2,3,4,5,6] },
  { id: newId(), name: 'Estudar ADS',           time: '08:00', cat: 'est', dur: 60, days: [1,2,3,4,5] },
  { id: newId(), name: 'Almoço sem celular',    time: '12:00', cat: 'ali', dur: 30, days: [0,1,2,3,4,5,6] },
  { id: newId(), name: 'Caminhada',             time: '18:30', cat: 'exe', dur: 30, days: [1,3,5] },
  { id: newId(), name: 'Arrumar o quarto',      time: '19:30', cat: 'cas', dur: 15, days: [0,6] },
  { id: newId(), name: 'Dormir no horário',     time: '22:30', cat: 'son', dur: 10, days: [0,1,2,3,4,5,6] }
];

export function defaults() {
  return {
    v: 1, onboarded: false,
    hero: { name: 'Herói', skin: 0, hair: 1, cloth: 0 },
    xp: 0, level: 1, gold: 0,
    stage: 1, stageKills: 0, maxStage: 1, kills: 0, bossKills: 0, miniKills: 0, bosses: {},
    attrs: { for: 0, sab: 0, vit: 0, res: 0 },
    forge: { w: 0, a: 0 }, seenWeapon: 0, seenArmor: 0,
    relics: [], titles: [], title: '',
    tasks: sampleTasks(), sample: true, profile: null,
    log: {},            // { 'AAAA-MM-DD': { taskId: { at, xp, late, verified } } }
    restDays: [], restPerWeek: 2, restedDay: '',
    furyUntil: 0, tiredUntil: 0,
    streak: 0, bestStreak: 0, lastGood: '', perfectDays: 0,
    tasksDone: 0, onTime: 0, earlyBird: 0,
    ach: {},
    phrasesOn: true, customPhrases: [],
    day: dayKey(), lastSeen: 0, lastMorning: '', lastNight: ''
  };
}

export const S = defaults();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(S, defaults(), JSON.parse(raw));
  } catch (e) { /* armazenamento indisponível: segue com o padrão */ }
}
export function save() {
  S.lastSeen = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}
export function exportJSON() { return JSON.stringify({ app: 'rotina-rpg', exportedAt: new Date().toISOString(), data: S }); }
export function importJSON(text) {
  const obj = JSON.parse(text);
  const data = obj && obj.app === 'rotina-rpg' ? obj.data : obj;
  if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) throw new Error('Arquivo não é um backup do Rotina RPG.');
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, defaults(), data);
  save();
}
export function resetAll() {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, defaults());
  save();
}

// barramento de eventos simples entre regras, jogo e interface
const handlers = {};
export const bus = {
  on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
  emit(ev, data) { (handlers[ev] || []).forEach(fn => fn(data)); }
};
