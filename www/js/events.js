// Eventos especiais do calendário e ciclo dia/noite pela hora real.
import { S } from './state.js';

// Halloween: 24/10 a 02/11 · Natal: 18/12 a 26/12. S._event força um evento (testes).
export function eventNow(d = new Date()) {
  if (S._event) return S._event;
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 10 && day >= 24) || (m === 11 && day <= 2)) return 'halloween';
  if (m === 12 && day >= 18 && day <= 26) return 'natal';
  return null;
}
export const EVENT_NAMES = { halloween: 'Halloween', natal: 'Natal' };

// Aniversário guardado como "MM-DD".
export function isBirthday(d = new Date()) {
  if (!S.birthday) return false;
  return S.birthday === String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Fase do dia: noite (20h–5h), amanhecer (5h–8h), dia (8h–17h), entardecer (17h–20h).
export function dayPhase(d = new Date()) {
  if (S._phase) return S._phase;
  const h = d.getHours();
  if (h >= 20 || h < 5) return 'noite';
  if (h < 8) return 'amanhecer';
  if (h < 17) return 'dia';
  return 'entardecer';
}
export const isNight = () => dayPhase() === 'noite';
