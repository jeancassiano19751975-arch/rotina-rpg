// Conselho do Mestre: perguntas sobre a rotina e montagem das missões iniciais.
import { newId } from './state.js';

export const FOCUS_MAX = 3;      // máximo de missões de foco
export const FOCUS_WEIGHT = 1.6; // peso extra no orçamento de XP

export const GOALS = [
  { id: 'saude', n: 'Saúde e corpo' },
  { id: 'estudo', n: 'Estudos' },
  { id: 'trabalho', n: 'Trabalho' },
  { id: 'casa', n: 'Organização' },
  { id: 'sono', n: 'Dormir melhor' }
];
export const DELAYS = [
  { id: 'exe', n: 'Exercício' },
  { id: 'est', n: 'Estudar' },
  { id: 'cas', n: 'Arrumar a casa' },
  { id: 'ali', n: 'Comer direito' },
  { id: 'son', n: 'Dormir cedo' }
];
export const TRAIN = [
  { id: 0, n: 'Nenhuma' }, { id: 1, n: '1 a 2' }, { id: 3, n: '3 a 4' }, { id: 5, n: '5 ou mais' }
];
export const FREE = [
  { id: 0, n: 'Menos de 1 h' }, { id: 1, n: '1 a 2 h' }, { id: 2, n: 'Mais de 2 h' }
];

export const defaultProfile = () => ({ wake: '06:30', sleep: '22:30', goal: 'saude', delay: 'exe', train: 0, free: 1 });

const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const ALL = [0, 1, 2, 3, 4, 5, 6], WEEK = [1, 2, 3, 4, 5];

// Monta a rotina sugerida a partir das respostas.
export function buildRoutine(p) {
  const w = toMin(p.wake), s = toMin(p.sleep);
  const fit = (min, short, mid, long) => (p.free === 0 ? short : p.free === 1 ? mid : long) || min;
  const evening = Math.min(Math.max(w + 11 * 60, 18 * 60), s - 150); // fim de tarde, antes de dormir
  const T = [];
  const add = (name, at, cat, dur, days) => T.push({ id: newId(), name, time: toTime(at), cat, dur, days, focus: false });

  add('Acordar no horário', w, 'son', 5, ALL);
  add('Café da manhã', w + 30, 'ali', 15, ALL);
  add('Almoço com calma', 12 * 60, 'ali', 30, ALL);

  // exercício, começando no nível atual
  if (p.train === 0) add('Caminhada leve', evening, 'exe', fit(15, 15, 15, 20), [1, 3, 5]);
  else if (p.train === 1) add('Treino', evening, 'exe', fit(30, 20, 30, 45), [1, 3, 5]);
  else if (p.train === 3) add('Treino', evening, 'exe', fit(45, 30, 45, 60), [1, 2, 4, 5]);
  else add('Treino', evening, 'exe', fit(60, 45, 60, 60), [1, 2, 3, 4, 5, 6]);

  if (p.goal === 'estudo' || p.delay === 'est') add('Estudar', evening + 60, 'est', fit(30, 20, 45, 60), WEEK);
  else add('Ler ou estudar algo', evening + 60, 'est', fit(15, 10, 20, 30), [1, 3, 5]);

  if (p.goal === 'trabalho') add('Planejar o dia de trabalho', w + 60, 'tra', 10, WEEK);
  if (p.goal === 'casa' || p.delay === 'cas') add('Arrumar a casa', evening + 30, 'cas', fit(15, 10, 15, 20), [0, 3, 6]);
  else add('Arrumar o quarto', evening + 30, 'cas', 10, [0, 6]);
  if (p.goal === 'saude' || p.delay === 'ali') add('Beber água e comer uma fruta', 15 * 60, 'sau', 5, ALL);
  if (p.goal === 'sono' || p.delay === 'son') add('Desligar as telas', s - 30, 'son', 15, ALL);
  add('Dormir no horário', s, 'son', 10, ALL);

  // missões de foco: o que mais adia + objetivo principal
  const goalCat = { saude: 'exe', estudo: 'est', trabalho: 'tra', casa: 'cas', sono: 'son' }[p.goal];
  const mark = cat => { const t = T.find(x => x.cat === cat && !x.focus && x.name !== 'Acordar no horário'); if (t) t.focus = true; };
  mark(p.delay);
  if (goalCat !== p.delay) mark(goalCat);
  return T.sort((a, b) => a.time.localeCompare(b.time));
}
