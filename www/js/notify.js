// Notificações (Android via Capacitor) e permissões. No navegador vira no-op.
import { S, today, addDays, parseDay, tMin } from './state.js';
import { tasksOn, isRest, baseXP } from './rules.js';
import { CATS } from './data.js';
import { phrase } from './phrases.js';

const Cap = window.Capacitor;
export const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const P = name => (Cap && Cap.Plugins ? Cap.Plugins[name] : null);
const LN = () => P('LocalNotifications');

let actionHandler = () => {};
export function onAction(fn) { actionHandler = fn; }

const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

export async function initNotifications() {
  const ln = LN(); if (!isNative || !ln) return;
  try {
    await ln.createChannel({
      id: 'missoes', name: 'Missões', description: 'Chamados das missões da sua rotina',
      importance: 5, visibility: 1, sound: 'missao.wav', vibration: true, lights: true, lightColor: '#F2C14E'
    });
    await ln.registerActionTypes({ types: [{ id: 'MISSAO', actions: [
      { id: 'feito', title: 'Feito ✔' },
      { id: 'adiar', title: 'Adiar 10 min' }
    ] }] });
    ln.addListener('localNotificationActionPerformed', ev => {
      const extra = ev.notification?.extra || {};
      actionHandler(ev.actionId, extra, ev.notification);
    });
  } catch (e) { console.warn('notificações', e); }
}

// Agenda os próximos 7 dias de missões (sem dias de descanso e sem missões já feitas).
export async function reschedule() {
  const ln = LN(); if (!isNative || !ln) return;
  try {
    const pend = await ln.getPending();
    if (pend.notifications?.length) await ln.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
    const list = [], now = Date.now();
    for (let i = 0; i < 7 && list.length < 60; i++) {
      const k = addDays(today(), i);
      const base = parseDay(k);
      if (isRest(k)) {
        const at = new Date(base); at.setHours(8, 0, 0, 0);
        if (at > now) list.push({ id: hash('rest' + k) % 2000000000, title: '🔥 Dia de descanso',
          body: phrase('descanso'), channelId: 'missoes', sound: 'missao.wav', schedule: { at, allowWhileIdle: true } });
        continue;
      }
      const lg = S.log[k] || {};
      for (const t of tasksOn(k)) {
        if (lg[t.id]) continue;
        const at = new Date(base); const m = tMin(t.time); at.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (at <= now) continue;
        list.push({
          id: hash(t.id + k) % 2000000000,
          title: '⚔️ ' + t.time + ' · Missão: ' + t.name,
          body: (phrase('missao') || CATS[t.cat].n) + ' · +' + baseXP(t, k) + ' XP',
          channelId: 'missoes', sound: 'missao.wav', actionTypeId: 'MISSAO',
          extra: { taskId: t.id, day: k, at: at.getTime() },
          schedule: { at, allowWhileIdle: true }
        });
      }
    }
    if (list.length) await ln.schedule({ notifications: list });
  } catch (e) { console.warn('agendar', e); }
}

export async function snooze(notification) {
  const ln = LN(); if (!isNative || !ln || !notification) return;
  const at = new Date(Date.now() + 10 * 60000);
  await ln.schedule({ notifications: [{
    id: (notification.id + 7) % 2000000000, title: notification.title, body: 'Adiado · ' + (notification.body || ''),
    channelId: 'missoes', sound: 'missao.wav', actionTypeId: 'MISSAO', extra: notification.extra,
    schedule: { at, allowWhileIdle: true }
  }] });
}

// ---------- Permissões ----------
export async function askNotifications() {
  const ln = LN(); if (!isNative || !ln) return 'browser';
  try { const r = await ln.requestPermissions(); return r.display; } catch (e) { return 'error'; }
}
export async function checkExact() {
  const ln = LN(); if (!isNative || !ln || !ln.checkExactNotificationSetting) return 'granted';
  try { const r = await ln.checkExactNotificationSetting(); return r.exact_alarm; } catch (e) { return 'granted'; }
}
export async function openExactSettings() {
  const ln = LN(); if (!isNative || !ln || !ln.changeExactNotificationSetting) return;
  try { await ln.changeExactNotificationSetting(); } catch (e) {}
}
export async function askLocation() {
  const g = P('Geolocation'); if (!isNative || !g) return 'browser';
  try { const r = await g.requestPermissions(); return r.location; } catch (e) { return 'error'; }
}
export async function permissionStatus() {
  const out = { notif: 'browser', loc: 'browser', exact: 'granted' };
  if (!isNative) return out;
  try { out.notif = (await LN().checkPermissions()).display; } catch (e) {}
  try { out.loc = (await P('Geolocation').checkPermissions()).location; } catch (e) {}
  out.exact = await checkExact();
  return out;
}

// ---------- Backup ----------
export async function shareBackup(json) {
  const fs = P('Filesystem'), sh = P('Share');
  if (isNative && fs && sh) {
    const name = 'rotina-rpg-backup-' + today() + '.json';
    const r = await fs.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
    await sh.share({ title: 'Backup do Rotina RPG', text: 'Backup do meu herói', url: r.uri, dialogTitle: 'Salvar backup' });
    return 'shared';
  }
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'rotina-rpg-backup-' + today() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  return 'downloaded';
}
