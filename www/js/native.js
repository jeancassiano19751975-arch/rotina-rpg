// Ponte com o Android: "Feito" pela notificação, ícone que evolui, widget, atualização e abertura animada.
import { S, save, today, addDays, parseDay, tMin } from './state.js';
import { CATS } from './data.js';
import { completeTask, tasksOn, isRest, fmt } from './rules.js';
import { bestLevel, item } from './gear.js';
import { drawHeroFrame, heroLookFor } from './game.js';
import { VERSION } from './version.js';
import { isNative } from './notify.js';

const Cap = window.Capacitor;
const plug = name => (Cap && Cap.Plugins ? Cap.Plugins[name] : null);
const RN = () => (isNative ? plug('RpgNative') : null);
export { VERSION };

// ---------- missões marcadas pela notificação ----------
// Chamar ANTES da virada do dia, para a sequência contar certo.
export async function applyQueue() {
  const rn = RN(); if (!rn || !rn.takeQueue) return [];
  let items = [];
  try { items = (await rn.takeQueue()).items || []; } catch (e) { return []; }
  const done = [];
  for (const it of items) {
    const day = it.day || today();
    if (day < addDays(today(), -1)) continue;                   // muito antigo
    const d = new Date(it.at || Date.now());
    let atMin = d.getHours() * 60 + d.getMinutes();
    if (parseDay(day).getDate() !== d.getDate()) atMin += 1440;  // tocou depois da meia-noite
    const r = completeTask(it.taskId, { day, atMin });
    if (r.ok) { const t = S.tasks.find(x => x.id === it.taskId); done.push({ name: t ? t.name : 'Missão', xp: r.xp }); }
  }
  return done;
}

// ---------- ícone que evolui ----------
export const iconTier = () => { const id = bestLevel('w'); return id ? item(id).tier : 0; };
export async function syncIcon(force) {
  const rn = RN(); if (!rn || !rn.setIcon) return;
  if (S.iconLock && !force) return;
  const want = S.iconLock ? (S.iconIdx || 0) : iconTier();
  if (S.iconIdx === want && !force) return;
  try { await rn.setIcon({ idx: want }); S.iconIdx = want; save(); } catch (e) { console.warn('ícone', e); }
}

// ---------- widget ----------
let lastWidget = '';
export async function syncWidget(force) {
  const rn = RN(); if (!rn || !rn.updateWidget) return;
  const next = [];
  for (let i = 0; i < 2; i++) {
    const k = addDays(today(), i); if (isRest(k)) continue;
    const lg = S.log[k] || {};
    for (const t of tasksOn(k)) {
      if (lg[t.id]) continue;
      const at = parseDay(k); const m = tMin(t.time); at.setHours(Math.floor(m / 60), m % 60, 0, 0);
      if (m < 60) at.setDate(at.getDate() + 1);
      next.push({ at: at.getTime(), time: t.time, name: t.name + ' · ' + CATS[t.cat].n });
    }
  }
  next.sort((a, b) => a.at - b.at);
  const status = 'Nível ' + S.level + ' · Fase ' + S.stage + (S.streak ? ' · 🔥 ' + S.streak + ' dia(s)' : '');
  const key = JSON.stringify([next.slice(0, 8), status, iconTier(), S.equip]);
  if (key === lastWidget && !force) return;
  lastWidget = key;
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const c = document.createElement('canvas'); c.width = 120; c.height = 120;
    drawHeroFrame(c, f, { scale: 2.6, x: 56, y: 112 });
    frames.push(c.toDataURL('image/png'));
  }
  try { await rn.updateWidget({ frames, next: next.slice(0, 12), status }); } catch (e) { console.warn('widget', e); }
}

// ---------- atualização pelo GitHub ----------
const REPO = 'jeancassiano19751975-arch/rotina-rpg';
const ver = v => String(v || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
export function newer(a, b) { const x = ver(a), y = ver(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
export const update = { info: null, progress: -1, hidden: false };
export async function checkUpdate() {
  try {
    const r = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    const apk = (j.assets || []).find(a => /\.apk$/i.test(a.name));
    if (!apk || !newer(j.tag_name, VERSION)) { update.info = null; return null; }
    update.info = { tag: j.tag_name.replace(/^v/, ''), notes: (j.body || '').trim(), url: apk.browser_download_url, page: j.html_url, size: apk.size };
    return update.info;
  } catch (e) { return null; }
}
// Baixa o APK com barra de progresso e abre o instalador do Android.
export async function installUpdate(onProgress) {
  const info = update.info; if (!info) return { error: 'Nenhuma atualização.' };
  const fsys = plug('Filesystem'), rn = RN();
  if (!isNative || !fsys || !fsys.downloadFile || !rn) { window.open(info.page, '_system'); return { ok: true, browser: true }; }
  let h = null;
  try {
    h = await fsys.addListener('progress', p => { if (p.contentLength) onProgress(p.bytes / p.contentLength); });
    const res = await fsys.downloadFile({ url: info.url, path: 'RotinaRPG-' + info.tag + '.apk', directory: 'CACHE', progress: true });
    onProgress(1);
    const r = await rn.installApk({ path: res.path });
    return r && r.needPermission ? { needPermission: true } : { ok: true };
  } catch (e) {
    window.open(info.page, '_system');
    return { error: 'Não deu para baixar aqui; abri a página de download.' };
  } finally { if (h && h.remove) h.remove(); }
}

// ---------- abertura animada ----------
export function playIntro() {
  return new Promise(done => {
    const ov = document.createElement('div'); ov.className = 'intro';
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
    const t = document.createElement('b'); t.textContent = 'ROTINA RPG';
    ov.append(cv, t); document.body.appendChild(ov);
    const look = heroLookFor(null);
    const seq = [0, 0, 1, 1, 2, 3, 3, 0];
    let i = 0;
    const step = () => {
      const c = cv.getContext('2d'); c.clearRect(0, 0, 240, 240);
      if (seq[i] === 2) { c.fillStyle = 'rgba(255,224,138,.5)'; for (let k = 0; k < 8; k++) c.fillRect(150 + Math.random() * 50, 120 + Math.random() * 60, 6, 6); }
      drawHeroFrame(cv, seq[i], { look, scale: 5, x: 112, y: 222, keep: true });
      if (++i < seq.length) setTimeout(step, 120);
      else setTimeout(() => { ov.classList.add('out'); setTimeout(() => { ov.remove(); done(); }, 350); }, 260);
    };
    step();
  });
}
