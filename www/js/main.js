// Inicialização: carrega o estado, roda a primeira abertura, liga jogo, interface e notificações.
import { S, bus, load, save, today, nowMin } from './state.js';
import { CATS, ATTRS } from './data.js';
import { rollover, offlineProgress, completeTask, isRest, tasksOn, weekRate, fmt } from './rules.js';
import { startGame, float, burst, banner, queueChest, fullHeal, shakeScreen } from './game.js';
import { GY } from './sprites.js';
import { renderAll, renderHUD, renderNext, initTabs, onChange, toast, modal, tick, refreshPerms } from './ui.js';
import { runOnboarding } from './onboarding.js';
import { initNotifications, reschedule, onAction, snooze, isNative } from './notify.js';
import { phrase } from './phrases.js';

const HX = 96;

// ---------- sons do jogo (só depois de interação) ----------
let actx = null;
function blip(notes, type = 'square', vol = 0.05) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([f, d, at]) => {
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + at;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + d + 0.02);
    });
  } catch (e) {}
}
const sfx = {
  done: () => blip([[659, .08, 0], [880, .12, .08]]),
  level: () => blip([[523, .1, 0], [659, .1, .1], [784, .1, .2], [1047, .25, .3]]),
  chest: () => blip([[392, .1, 0], [523, .1, .12], [784, .3, .24]], 'triangle', .07)
};

// ---------- eventos do jogo ----------
bus.on('task-done', ev => {
  float(HX, GY - 40, '+' + ev.xp + ' XP', '#6ea8ff', true);
  if (ev.late) float(HX, GY - 52, 'CANSADO', '#7ab8ff');
  else float(HX, GY - 52, 'FÚRIA!', '#ff6a5a');
  burst(HX, GY - 14, ev.late ? '#7ab8ff' : '#f2c14e', 16);
  float(HX + 18, GY - 30, '+' + ATTRS[CATS[ev.t.cat].attr].n, '#f2c14e');
  sfx.done();
  toast(phrase(ev.late ? 'atraso' : 'feito') || ('Missão cumprida! +' + ev.xp + ' XP'));
  if (ev.perfect) {
    setTimeout(() => toast('Dia perfeito! Sequência de ' + S.streak + ' dia(s)'), 300);
    if (S.streak >= 3) setTimeout(() => toast(phrase('sequencia')), 600);
  }
  reschedule();
});
bus.on('levelup', lv => { banner('NÍVEL ' + lv + '!', '#f2c14e'); burst(HX, GY - 14, '#ffe08a', 26); fullHeal(); sfx.level(); toast(phrase('nivel') || 'Nível ' + lv + '!'); renderHUD(); });
bus.on('chest', ev => { queueChest(ev); setTimeout(sfx.chest, 1200); });
bus.on('ach', a => { toast('Conquista: ' + a.n + (a.title ? ' · título "' + a.title + '"' : '')); });
bus.on('stage', st => { renderHUD(); });
bus.on('kill', () => { renderHUD(); });
bus.on('hero-death', () => { toast(phrase('queda') || 'Seu herói caiu e recuou uma fase.'); renderHUD(); });

// ---------- notificações: Feito / Adiar ----------
onAction((actionId, extra, notif) => {
  if (!extra.taskId) return;
  if (actionId === 'adiar') { snooze(notif); toast('Missão adiada 10 min'); return; }
  if (actionId !== 'feito') return;
  if (extra.day !== today()) { toast('Essa missão era de outro dia.'); return; }
  const t = S.tasks.find(x => x.id === extra.taskId);
  const quick = Date.now() - (extra.at || 0) < 10 * 60000;
  const r = completeTask(extra.taskId, { verified: !!t && t.cat === 'son' && quick });
  if (r.error) toast(r.error);
  renderAll();
});

// ---------- frases de manhã e de noite ----------
function dayPhrases() {
  const k = today(), m = nowMin();
  if (isRest(k)) { if (S.lastMorning !== k) { S.lastMorning = k; toast(phrase('descanso')); save(); } return; }
  if (m >= 300 && m < 720 && S.lastMorning !== k) {
    S.lastMorning = k; save();
    toast(phrase(weekRate() < 0.5 ? 'manhaDificil' : 'manha'));
  }
  if (m >= 1260 && S.lastNight !== k) {
    const list = tasksOn(k), lg = S.log[k] || {};
    if (list.length) {
      S.lastNight = k; save();
      toast(phrase(list.every(t => lg[t.id]) ? 'noite' : 'noiteParcial'));
    }
  }
}

// ---------- boot ----------
async function boot() {
  load();
  rollover();
  if (!S.onboarded) await runOnboarding();
  initTabs();
  const away = offlineProgress();
  startGame(document.getElementById('scene'));
  renderAll();
  if (away) {
    const h = Math.floor(away.seconds / 3600), mi = Math.floor(away.seconds % 3600 / 60);
    modal({
      title: 'Enquanto você esteve fora',
      text: 'Em ' + (h ? h + 'h ' : '') + mi + 'min, seu herói derrotou ' + fmt(away.kills) + ' monstros, juntou ' + fmt(away.gold) + ' de ouro e está na fase ' + away.stage + '.',
      actions: [{ label: 'Coletar', cls: 'gold-btn', fn: () => { burst(HX, GY - 14, '#f2c14e', 24); renderHUD(); dayPhrases(); } }]
    });
  } else setTimeout(dayPhrases, 800);

  onChange(() => reschedule());
  await initNotifications();
  await reschedule();
  refreshPerms();

  setInterval(() => { save(); }, 5000);
  setInterval(() => {
    if (rollover()) { renderAll(); reschedule(); }
    tick(); dayPhrases();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { save(); return; }
    const a = offlineProgress();
    if (rollover()) reschedule();
    renderAll();
    if (a) toast('Seu herói derrotou ' + fmt(a.kills) + ' monstros enquanto você estava fora (+' + fmt(a.gold) + ' ouro)');
  });
}
boot();
