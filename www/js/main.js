// Inicialização: carrega o estado, roda a primeira abertura, liga jogo, interface e notificações.
import { S, bus, load, save, today, nowMin } from './state.js';
import { CATS, ATTRS, ACH_GEAR } from './data.js';
import { isBirthday } from './events.js';
import { checkGear } from './gear.js';
import { migrateGear, checkAch, rollover, offlineProgress, completeTask, isRest, tasksOn, weekRate, fmt } from './rules.js';
import { startGame, float, burst, banner, queueChest, fullHeal, shakeScreen, petCheer } from './game.js';
import { GY } from './sprites.js';
import { renderAll, renderHUD, renderNext, initTabs, onChange, toast, modal, tick, refreshPerms, tickFocus, goTab, editTask } from './ui.js';
import { applyQueue, syncIcon, syncWidget, checkUpdate, playIntro } from './native.js';
import { ensureWeek, pendingCheckin, markCheckin, pauseTask, heroComment } from './week.js';
import { runOnboarding } from './onboarding.js';
import { initNotifications, reschedule, onAction, snooze, isNative, scheduleFocusEnd } from './notify.js';
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
  petCheer();
  toast(phrase(ev.late ? 'atraso' : 'feito') || ('Missão cumprida! +' + ev.xp + ' XP'));
  if (ev.perfect) {
    setTimeout(() => toast('Dia perfeito! Sequência de ' + S.streak + ' dia(s)'), 300);
    if (S.streak >= 3) setTimeout(() => toast(phrase('sequencia')), 600);
  }
  reschedule();
  syncWidget();
});
bus.on('levelup', lv => { banner('NÍVEL ' + lv + '!', '#f2c14e'); burst(HX, GY - 14, '#ffe08a', 26); fullHeal(); sfx.level(); toast(phrase('nivel') || 'Nível ' + lv + '!'); renderHUD(); });
bus.on('chest', ev => { queueChest(ev); setTimeout(sfx.chest, 1200); });
bus.on('pet', pt => { queueChest({ kind: 'pet', item: pt, name: pt.n }); setTimeout(() => toast('Novo pet: ' + pt.n + '! ' + pt.d + '.'), 1500); });
bus.on('ach', a => { toast('Conquista: ' + a.n + (a.title ? ' · título "' + a.title + '"' : '')); });
bus.on('stage', st => { renderHUD(); });
bus.on('kill', () => { renderHUD(); });
bus.on('potion-used', () => { toast('A Poção de Vida salvou seu herói!'); sfx.level(); renderHUD(); });
bus.on('forged', () => blip([[220, .06, 0], [1760, .05, .02], [220, .06, .25], [1760, .05, .27]], 'square', .05));
bus.on('focus', f => scheduleFocusEnd(f));
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

// ---------- aniversário: baú de presente uma vez por ano ----------
function birthdayGift() {
  if (!isBirthday()) return;
  const y = new Date().getFullYear();
  if (S.bdayYear === y) return;
  S.bdayYear = y; S.evt = S.evt || {}; S.evt.bday = true;
  const g = 500 + S.level * 50; S.gold += g;
  save();
  setTimeout(() => {
    toast('Feliz aniversário, ' + (S.hero.name || 'herói') + '! +' + fmt(g) + ' de ouro de presente 🎂');
    const had = S.gear && S.gear.capaLenda;
    checkGear();
    if (had) queueChest({ kind: 'surprise', item: { type: 'gold' }, name: 'Presente: +' + fmt(g) + ' de ouro' });
    renderHUD();
  }, 1500);
}

// ---------- semana: baú esquecido e check-in do Mestre ----------
function weekTurn() {
  const late = ensureWeek();
  if (late) setTimeout(() => toast('O baú da semana passada ficou fechado. Abri pra você: ' + late.text), 1200);
}
function checkin() {
  const sm = pendingCheckin(); if (!sm) return;
  const pct = Math.round(sm.rate * 100);
  let text = 'Semana passada: ' + sm.done + ' de ' + sm.tot + ' missões (' + pct + '%), ' + sm.perfect + ' dia(s) perfeito(s), +' + fmt(sm.xp) + ' XP.\n\n' +
    (S.hero.name || 'Herói') + ': "' + heroComment(sm) + '"\n\n';
  const actions = [];
  if (sm.rate >= 0.85) {
    text += 'Mestre: Você está pronto para mais. Quer subir o desafio? Adicione uma missão nova ou transforme uma em missão de foco ⭐.';
    actions.push({ label: 'Agora não', fn: markCheckin }, { label: 'Subir o desafio', cls: 'gold-btn', fn: () => { markCheckin(); goTab('rotina'); toast('Adicione uma missão nova ou marque uma como foco ⭐'); } });
  } else if (sm.rate < 0.6 && sm.worst) {
    const w = sm.worst;
    text += 'Mestre: "' + w.t.name + '" ficou para trás (' + w.n + ' de ' + w.of + ' vezes). Quer mudar o horário dela ou pausar por 1 semana para respirar?';
    actions.push({ label: 'Manter', fn: markCheckin },
      { label: 'Pausar 1 semana', fn: () => { markCheckin(); pauseTask(w.t.id); toast('"' + w.t.name + '" pausada por 7 dias'); renderAll(); reschedule(); } },
      { label: 'Mudar horário', cls: 'gold-btn', fn: () => { markCheckin(); editTask(w.t.id); } });
  } else {
    text += 'Mestre: Bom ritmo. Mantenha o foco nas missões ⭐ e a próxima semana fica perfeita.';
    actions.push({ label: 'Bora!', cls: 'gold-btn', fn: markCheckin });
  }
  modal({ title: 'Check-in do Mestre', text, actions });
}

// ---------- boot ----------
async function fromNotifications() {
  const done = await applyQueue();
  if (done.length) setTimeout(() => toast(done.length === 1 ? 'Marcada pela notificação: ' + done[0].name + ' (+' + done[0].xp + ' XP)' : done.length + ' missões marcadas pela notificação (+' + done.reduce((s, d) => s + d.xp, 0) + ' XP)'), 1500);
  return done.length;
}
async function boot() {
  load();
  if (S.onboarded) playIntro();
  migrateGear();
  await fromNotifications();
  rollover();
  if (!S.onboarded) await runOnboarding();
  initTabs();
  checkAch();
  const away = offlineProgress();
  weekTurn();
  startGame(document.getElementById('scene'));
  renderAll();
  birthdayGift();
  if (away) {
    const h = Math.floor(away.seconds / 3600), mi = Math.floor(away.seconds % 3600 / 60);
    modal({
      title: 'Enquanto você esteve fora',
      text: 'Em ' + (h ? h + 'h ' : '') + mi + 'min, seu herói derrotou ' + fmt(away.kills) + ' monstros, juntou ' + fmt(away.gold) + ' de ouro e está na fase ' + away.stage + '.' +
        (away.blocked ? ' O chefão dessa fase está esperando: cumpra 70% das missões da semana para enfrentá-lo.' : ''),
      actions: [{ label: 'Coletar', cls: 'gold-btn', fn: () => { burst(HX, GY - 14, '#f2c14e', 24); renderHUD(); dayPhrases(); setTimeout(checkin, 600); } }]
    });
  } else { setTimeout(dayPhrases, 800); setTimeout(checkin, 1400); }
  setInterval(tickFocus, 1000);
  syncIcon(); syncWidget(true);
  checkUpdate().then(u => { if (u) renderAll(); });

  onChange(() => reschedule());
  await initNotifications();
  await reschedule();
  refreshPerms();

  setInterval(() => { save(); }, 5000);
  setInterval(() => {
    if (rollover()) { weekTurn(); renderAll(); reschedule(); birthdayGift(); checkin(); }
    tick(); dayPhrases(); syncWidget();
  }, 30000);
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) { save(); syncWidget(); syncIcon(); return; }
    await fromNotifications();
    const a = offlineProgress();
    if (rollover()) reschedule();
    renderAll();
    if (a) toast('Seu herói derrotou ' + fmt(a.kills) + ' monstros enquanto você estava fora (+' + fmt(a.gold) + ' ouro)');
  });
}
boot();
