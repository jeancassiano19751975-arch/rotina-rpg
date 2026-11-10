// Interface: HUD, abas, rotina, herói, conquistas, ajustes, toast e modal.
import { S, save, today, addDays, parseDay, tMin, tGame, nowMin, newId, exportJSON, importJSON, resetAll } from './state.js';
import { CATS, ATTRS, DURATIONS, WEEKDAYS, WEEKDAY_NAMES, PETS, PET_STAGES, RELICS, ACHIEVEMENTS, ACH_GEAR, SLOTS, POTIONS, HAIR_STYLES, CLASSES, SKINS, HAIRS, CLOTHES } from './data.js';
import {
  fmt, fmtTime, xpNeed, petStage, petSad, hasPet, heroStats, tasksOn, isRest, baseXP, lateInfo,
  predictXP, completeTask, toggleRest, restCountWeek, furyOn, tiredOn, restedOn, bossRate, bossAllowed, BOSS_RATE, slotKind
} from './rules.js';
import { item, equippedId, forgeLevel, statLine, buffOn } from './gear.js';
import { renderVila, setVillageHooks } from './village.js';
import { renderItem, drawPreview } from './game.js';
import { musicOn, sfxOn, setMusic, setSfx } from './audio.js';
import { CAL, calState, dailyChallenge, dcProgress, dcName, comboMul, monthStats, REBIRTH_LVL, canRebirth, doRebirth, rebirthBonus, worldBoss, runDungeon, dungeonReward } from './daily.js';
import { unlock as unlockStory, playQueued } from './story.js';
import { renderMonThumb, drawDuel } from './game.js';
import { mStats } from './rules.js';
import { MONSTERS } from './data.js';
import { eventNow, EVENT_NAMES } from './events.js';
import { isHard, setHard, essentials, hardCountWeek, HARD_PER_WEEK } from './rules.js';
import {
  goalName, goalDesc, goalProgress, weeklyDone, chestReady, isSunday, openWeekly, focusStart, focusLeft, focusCancel, focusFinish,
  saveDiary, weekSummary, heroComment
} from './week.js';
import { weekStart } from './state.js';
import { update, installUpdate, checkUpdate, VERSION, syncIcon, iconTier } from './native.js';
import { FOCUS_MAX } from './mentor.js';
import { runMentor } from './onboarding.js';
import { permissionStatus, askNotifications, openExactSettings, shareBackup, isNative } from './notify.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let changeHook = () => {};
export const onChange = fn => { changeHook = fn; };
const changed = () => { save(); changeHook(); renderAll(); };

// ---------- toast e modal ----------
const tq = []; let tBusy = false;
export function toast(msg) { if (!msg) return; tq.push(msg); if (!tBusy) nextToast(); }
function nextToast() {
  const m = tq.shift(); const el = $('toast');
  if (!m) { tBusy = false; el.hidden = true; return; }
  tBusy = true; el.textContent = m; el.hidden = false; setTimeout(nextToast, 2600);
}
export function modal({ title, text, actions = [{ label: 'Ok', cls: 'gold-btn' }] }) {
  const box = $('modal-box');
  box.innerHTML = '<h2>' + esc(title) + '</h2>' + (text ? '<p>' + esc(text) + '</p>' : '') + '<div class="acts"></div>';
  const acts = box.querySelector('.acts');
  actions.forEach(a => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (a.cls || ''); b.textContent = a.label;
    b.onclick = () => { $('modal').hidden = true; a.fn && a.fn(); }; acts.appendChild(b);
  });
  $('modal').hidden = false;
}

// ---------- HUD ----------
const ABBR = { for: 'Força', sab: 'Sabed.', vit: 'Vital.', res: 'Resist.' };
export function renderHUD() {
  $('lvl').textContent = S.level;
  $('hname').textContent = S.hero.name || 'Herói';
  $('htitle').textContent = S.title || '';
  const need = xpNeed(S.level);
  $('xptext').textContent = fmt(S.xp) + ' / ' + fmt(need);
  $('xpbar').style.width = Math.min(100, S.xp / need * 100) + '%';
  $('gold').textContent = fmt(S.gold);
  const at = S.attrs;
  $('attrs').innerHTML =
    Object.entries(ATTRS).map(([k, a]) => '<div class="stat box" title="' + a.n + ': ' + a.d + '"><span>' + ABBR[k] + '</span><b>' + Math.floor(at[k]) + '</b></div>').join('') +
    '<div class="stat box" title="Dias perfeitos seguidos"><span>Seq.</span><b>' + S.streak + 'd</b></div>';
}

export function renderNext() {
  const k = today();
  if (isRest(k)) {
    $('next-eye').textContent = 'Dia de descanso'; $('next-time').textContent = '🔥';
    $('next-name').textContent = 'Seu herói está recuperando as forças.'; $('next-in').textContent = ''; $('next-xp').textContent = 'Amanhã ele acorda Descansado: +10% de XP nas missões da manhã.';
    return;
  }
  const lg = S.log[k] || {}, n = nowMin();
  const list = tasksOn(k).filter(t => !lg[t.id]);
  const t = list.find(x => tGame(x.time) >= n - 30) || list[0];
  $('next-eye').textContent = 'Próxima missão';
  if (!t) {
    const all = tasksOn(k);
    $('next-time').textContent = all.length ? '✔' : '--:--';
    $('next-name').textContent = all.length ? 'Todas as missões de hoje cumpridas!' : 'Nenhuma missão hoje';
    $('next-in').textContent = ''; $('next-xp').textContent = all.length ? 'Descanse, guerreiro.' : 'Adicione missões na aba Rotina.';
    return;
  }
  const d = tGame(t.time) - n;
  $('next-time').textContent = t.time; $('next-name').textContent = t.name;
  $('next-in').textContent = d > 0 ? 'em ' + (d >= 60 ? Math.floor(d / 60) + 'h ' + (d % 60) + 'min' : d + ' min') : d >= -30 ? 'agora' : 'atrasada ' + Math.abs(d) + ' min';
  $('next-xp').textContent = CATS[t.cat].n + ' · ' + t.dur + ' min · vale ' + predictXP(t) + ' XP agora';
}

// ---------- Missões de hoje ----------
const CHECK_SVG = '<svg viewBox="0 0 8 8"><path d="M1 4h1v1h1v1h1V5h1V4h1V3h1V2h1v1H7v1H6v1H5v1H4v1H3V6H2V5H1z" fill="#123010"/></svg>';
export function renderToday() {
  const p = $('p-hoje'), k = today();
  const dname = WEEKDAY_NAMES[new Date().getDay()];
  if (isRest(k)) {
    p.innerHTML = '<div class="rest-card"><b>Dia de descanso</b><p class="hint">Hoje não tem missão. Seu herói está na clareira, ao lado da fogueira. Amanhã ele acorda Descansado, com vida cheia e +10% de XP nas missões da manhã.</p></div>';
    return;
  }
  const list = tasksOn(k), lg = S.log[k] || {}, n = nowMin();
  const doneN = list.filter(t => lg[t.id]).length;
  const nx = list.find(t => !lg[t.id] && !lateInfo(t).locked);
  const hard = isHard(k), ess = hard ? essentials(k).map(t => t.id) : [];
  let html = updateCard() + focusCard() + dailyCard();
  html += '<p class="hint">Hoje, ' + dname + ': ' + doneN + ' de ' + list.length + ' missões. O jogo decide o XP de cada uma; o dia vale até 300 XP.' +
    (restedOn() ? ' <b style="color:var(--grass)">Descansado: +10% nas missões da manhã.</b>' : '') + '</p>';
  if (hard) html += '<div class="card-note hard-on"><b>Dia difícil ligado.</b> Só as missões <b>essenciais</b> contam para a sequência; o XP de hoje vale metade. Força: amanhã é outro dia.' +
    (doneN ? '' : ' <button class="btn sm" type="button" id="hard-off">Desligar</button>') + '</div>';
  else if (list.length && !doneN) html += '<div class="card-note">Dia complicado? Ligue o <b>dia difícil</b>: só as missões essenciais (⭐ foco) contam para a sequência, com metade do XP. ' +
    (HARD_PER_WEEK - hardCountWeek(k)) + ' de ' + HARD_PER_WEEK + ' disponíveis nesta semana. <button class="btn sm" type="button" id="hard-on"' + (hardCountWeek(k) >= HARD_PER_WEEK ? ' disabled' : '') + '>Ligar dia difícil</button></div>';
  if (S.stage % 10 === 0 && !bossAllowed()) html += '<p class="hint" style="color:#ff9a8a;border:2px dashed #8a3a3a;padding:6px 10px">O chefão da fase ' + S.stage + ' só aparece quando você cumpre <b>' + Math.round(BOSS_RATE * 100) + '%</b> das missões dos últimos 7 dias. Agora: <b>' + Math.round(bossRate() * 100) + '%</b>. Até lá o herói treina com os monstros da fase.</p>';
  const ev = eventNow(); if (ev) html += '<p class="hint" style="color:var(--gold)">Evento de ' + EVENT_NAMES[ev] + ' acontecendo! ' + (ev === 'halloween' ? 'Abóboras Assombradas aparecem nas fases: derrote 20 para ganhar a Capa de Abóbora.' : 'O Boneco de Neve Gigante virou mini-chefão: derrote ele para ganhar o Gorro de Natal.') + '</p>';
  if (S.sample) html += '<p class="hint" style="color:var(--gold);border:2px dashed var(--gold-d);padding:6px 10px">Rotina de exemplo. Monte a sua na aba Rotina.</p>';
  if (!list.length) html += '<p class="hint">Nenhuma missão para hoje. Adicione na aba Rotina.</p>';
  html += '<ul class="list">';
  for (const t of list) {
    const done = lg[t.id], li = lateInfo(t, n);
    let chips = (ess.includes(t.id) ? '<span class="chip ok">essencial</span>' : '') + (t.focus ? '<span class="chip focus">⭐ foco</span>' : '') + '<span class="chip">' + CATS[t.cat].n + '</span><span class="chip">' + t.dur + ' min</span>';
    let sub;
    if (done) {
      sub = '+' + done.xp + ' XP';
      if (done.late) chips += '<span class="chip late">atrasada</span>'; else chips += '<span class="chip ok">no horário</span>';
      if (done.verified) chips += '<span class="chip ver">' + (done.focus ? '⏱ foco' : 'verificada') + '</span>';
    } else if (li.locked) sub = 'Libera às ' + li.unlockAt;
    else { sub = 'Vale ' + predictXP(t) + ' XP'; if (li.late) chips += '<span class="chip late">' + li.label + '</span>'; }
    html += '<li class="task' + (done ? ' done' : '') + (li.locked && !done ? ' locked' : '') + (nx === t ? ' next-up' : '') + '">' +
      '<button class="check" type="button" data-done="' + t.id + '" aria-label="Concluir ' + esc(t.name) + '"' + (done || li.locked ? ' disabled' : '') + '>' + CHECK_SVG + '</button>' +
      '<span class="t-time">' + t.time + '</span>' +
      '<div class="t-main"><span class="t-name">' + esc(t.name) + '</span><span class="t-sub"><span>' + sub + '</span>' + chips + '</span></div>' +
      (!done && !li.locked && !S.focusRun ? '<button class="icon-btn" type="button" data-focus="' + t.id + '" title="Modo foco: cronômetro de ' + Math.min(t.dur, 120) + ' min, vale +50%">⏱ Foco</button>' : '') + '</li>';
  }
  html += '</ul>';
  html += '<p class="hint">⏱ <b>Modo foco:</b> liga um cronômetro com a duração da missão. Terminando, ela conta como verificada (+50% de XP).</p>';
  html += worldCard() + weeklyCard() + summaryCard() + monthCard() + diaryCard(k);
  p.innerHTML = html;
  drawWeekChart();
  bindToday(p);
  p.querySelectorAll('[data-done]').forEach(b => b.onclick = () => {
    const r = completeTask(b.dataset.done);
    if (r.error) toast(r.error); else changed();
  });
}

// ---------- modo foco, dia difícil, semana e diário (aba Missões) ----------
const mmss = ms => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function updateCard() {
  const u = update.info; if (!u || update.hidden) return '';
  const notes = u.notes ? '<details><summary>O que mudou</summary><div class="hint" style="white-space:pre-line">' + esc(u.notes.slice(0, 1500)) + '</div></details>' : '';
  return '<div class="update-card"><span class="eyebrow">Nova atualização</span><b>Rotina RPG ' + esc(u.tag) + '</b><span class="hint">Você está na ' + VERSION + '. Seu progresso continua depois de atualizar; se quiser, faça um backup antes.</span>' + notes +
    (update.progress >= 0 ? '<div class="bar"><i id="upd-bar" style="width:' + Math.round(update.progress * 100) + '%;background:var(--grass)"></i></div><span class="hint" id="upd-txt">Baixando… ' + Math.round(update.progress * 100) + '%</span>' : '') +
    '<div class="form-acts"><button class="btn gold-btn sm" type="button" id="upd-go"' + (update.progress >= 0 && update.progress < 1 ? ' disabled' : '') + '>Atualizar agora</button><button class="btn sm" type="button" id="upd-bk">Fazer backup</button><button class="btn sm" type="button" id="upd-later">Depois</button></div></div>';
}
function bindUpdate(p) {
  const go = $('upd-go'); if (!go) return;
  go.onclick = async () => {
    update.progress = 0; renderToday();
    const r = await installUpdate(v => { update.progress = v; const b = $('upd-bar'), t = $('upd-txt'); if (b) b.style.width = Math.round(v * 100) + '%'; if (t) t.textContent = v >= 1 ? 'Pronto! Abrindo a instalação…' : 'Baixando… ' + Math.round(v * 100) + '%'; });
    if (r.needPermission) toast('Permita "instalar apps desconhecidos" para o Rotina RPG e toque em Atualizar de novo.');
    else if (r.error) toast(r.error);
    update.progress = -1; renderToday();
  };
  $('upd-bk').onclick = async () => { try { const r = await shareBackup(exportJSON()); toast(r === 'shared' ? 'Escolha onde salvar o backup' : 'Backup baixado'); } catch (e) { toast('Não deu para exportar: ' + e.message); } };
  $('upd-later').onclick = () => { update.hidden = true; renderToday(); };
}
// ---------- calendário de 7 dias, desafio do dia e combo ----------
const CAL_IC = { gold: '🪙', potion: '🧪', gem: '💎', chest: '🎁' };
function dailyCard() {
  const c = calState(), doneToday = c.last === today();
  let h = '<div class="daily"><div class="cal-head"><span class="eyebrow">Calendário de 7 dias</span><span class="muted">' + (doneToday ? 'prêmio de hoje já pego ✔' : 'cumpra 1 missão para pegar o prêmio') + '</span></div><div class="cal">';
  for (let i = 0; i < 7; i++) {
    const got = i < c.idx || (doneToday && c.idx === 0 && false), cur = i === c.idx && !doneToday;
    const st = i < c.idx ? ' got' : cur ? ' cur' : '';
    h += '<div class="cal-d' + st + (i === 6 ? ' big' : '') + '"><b>' + (i + 1) + '</b><span>' + CAL_IC[CAL[i].ic] + '</span><small>' + CAL[i].n + '</small></div>';
  }
  h += '</div><p class="hint" style="margin:4px 0 0">Faltou um dia? Tudo bem: o calendário só pausa, não volta ao começo.</p>';
  const dc = dailyChallenge();
  if (!dc.none) {
    const v = dcProgress(dc);
    h += '<div class="dc' + (dc.claimed ? ' ok' : '') + '"><span class="eyebrow">Desafio do dia</span><b>' + (dc.claimed ? '✔ ' : '') + esc(dcName(dc)) + '</b><span class="muted">' + v + '/' + dc.target + (dc.claimed ? ' · prêmio recebido' : ' · prêmio: ouro e chance de gema') + '</span></div>';
  }
  const cb = S.combo || 0;
  h += '<div class="combo"><span class="eyebrow">Combo</span><b>' + (cb ? cb + ' seguidas no horário · XP ×' + comboMul(cb).toFixed(2) : 'Faça missões no horário para começar um combo') + '</b><span class="muted">+5% de XP por missão seguida no horário (até +50%). Atrasar zera.</span></div></div>';
  return h;
}
function worldCard() {
  const wb = worldBoss(), m = MONSTERS[wb.key];
  return '<div class="wb' + (wb.killed ? ' ok' : '') + '"><canvas id="wb-cv" width="96" height="80"></canvas><div><span class="eyebrow">Chefão do mês</span><b>' + esc(m ? m.n : 'Titã') + ' Titã</b>' +
    '<div class="bar"><i style="width:' + (wb.hp / wb.max * 100) + '%;background:#ff6a8a"></i></div>' +
    '<small class="muted">' + (wb.killed ? 'Derrotado! Volta outro titã no mês que vem.' : 'Faltam ' + wb.hp + ' golpes. Cada missão cumprida = 1 golpe (verificada = 2).') + '</small></div></div>';
}
function monthCard() {
  const M = monthStats(), pct = M.tot ? Math.round(M.done / M.tot * 100) : 0;
  let h = '<details class="month"><summary><span class="h3" style="display:inline">Resumo de ' + M.month + '</span></summary><div class="mgrid">';
  for (const d of M.days) {
    const cls = d.future ? 'f' : d.rest ? 'r' : !d.tot ? 'n' : d.done === d.tot ? 'p' : d.done ? 'h' : 'z';
    h += '<i class="m-' + cls + '" title="' + d.k.slice(8) + '"></i>';
  }
  h += '</div><p class="hint">🟩 dia perfeito · 🟨 parte · ⬛ nada · 🟧 descanso</p>';
  h += '<div class="mstats"><div><b>' + M.done + '</b><span>missões (' + pct + '%)</span></div><div><b>' + M.perfect + '</b><span>dias perfeitos</span></div><div><b>' + M.best + '</b><span>melhor sequência</span></div>' +
    '<div><b>' + (M.done ? Math.round(M.ontime / M.done * 100) : 0) + '%</b><span>no horário</span></div><div><b>' + (M.topCat || '—') + '</b><span>mais cumprida</span></div><div><b>' + (M.topHour != null ? M.topHour + 'h' : '—') + '</b><span>seu horário forte</span></div></div></details>';
  return h;
}
function focusCard() {
  const f = S.focusRun; if (!f) return '';
  const t = S.tasks.find(x => x.id === f.id), left = focusLeft();
  return '<div class="focus-card" id="focus-card"><span class="eyebrow">Modo foco</span><b class="f-name">' + esc(t ? t.name : 'Missão') + '</b>' +
    '<span class="f-time" id="focus-left">' + (left ? mmss(left) : 'Pronto!') + '</span>' +
    '<div class="bar"><i id="focus-bar" style="width:' + (100 - left / (f.min * 60000) * 100) + '%;background:var(--mana)"></i></div>' +
    '<p class="hint">Deixe o celular de lado e foque. Pode sair do app: o tempo continua contando.</p>' +
    '<div class="form-acts"><button class="btn gold-btn sm" type="button" id="focus-done"' + (left ? ' disabled' : '') + '>Concluir · verificada +50%</button><button class="btn sm" type="button" id="focus-cancel">Cancelar</button></div></div>';
}
function weeklyCard() {
  if (!S.weekly) return '';
  const done = weeklyDone();
  let h = '<span class="h3">Missões da semana</span><p class="hint">Complete as 3 até domingo. No domingo o baú da semana abre: ouro, poção e às vezes uma capa.</p><div class="v-list">';
  for (const g of S.weekly.goals) {
    const v = goalProgress(g), ok = v >= g.target;
    h += '<div class="wk-goal' + (ok ? ' ok' : '') + '"><div><b>' + (ok ? '✔ ' : '') + goalName(g) + '</b><small>' + goalDesc(g) + '</small></div><span class="muted">' + v + '/' + g.target + '</span>' +
      '<div class="bar"><i style="width:' + (v / g.target * 100) + '%;background:' + (ok ? 'var(--grass)' : 'var(--gold)') + '"></i></div></div>';
  }
  h += '</div>';
  if (done && isSunday() && S.dungeonWk !== S.weekly.wk) h += '<div class="form-acts"><button class="btn gold-btn" type="button" id="dungeon">⚔️ Entrar na Masmorra da Semana</button></div>';
  else h += '<p class="hint">⚔️ Masmorra da semana: cumpra as 3 missões da semana e entre no domingo. Recorde: ' + (S.dungeonBest || 0) + ' sala(s).</p>';
  if (S.weekly.opened) h += '<p class="hint" style="color:var(--grass)">Baú da semana aberto! Novas missões na segunda.</p>';
  else if (chestReady()) h += '<div class="form-acts"><button class="btn gold-btn" type="button" id="wk-open">Abrir o baú da semana</button></div>';
  else if (done) h += '<p class="hint" style="color:var(--gold)">Tudo feito! O baú abre no domingo.</p>';
  return h;
}
const DOW = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
function summaryCard() {
  const sm = weekSummary(weekStart(today()));
  return '<span class="h3">Resumo da semana</span><canvas id="wk-chart" class="wk-chart" width="640" height="220" aria-label="Missões feitas por dia nesta semana"></canvas>' +
    '<p class="hint">' + sm.done + ' de ' + sm.tot + ' missões até agora (' + Math.round(sm.rate * 100) + '%) · ' + sm.perfect + ' dia(s) perfeito(s) · +' + fmt(sm.xp) + ' XP</p>' +
    '<p class="hero-say"><b>' + esc(S.hero.name || 'Herói') + ':</b> "' + heroComment(sm) + '"</p>';
}
function drawWeekChart() {
  const cv = $('wk-chart'); if (!cv) return;
  const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.imageSmoothingEnabled = false;
  const Wc = 320, Hc = 110, sm = weekSummary(weekStart(today())), tk = today();
  c.clearRect(0, 0, Wc, Hc);
  c.fillStyle = '#141a36'; c.fillRect(0, 0, Wc, Hc);
  for (let i = 1; i <= 4; i++) { c.fillStyle = '#1f2750'; c.fillRect(8, 12 + (80 / 4) * (i - 1), Wc - 16, 1); }
  sm.days.forEach((d, i) => {
    const x = 12 + i * 43, bw = 30, base = 92;
    const future = d.k > tk;
    if (d.rest) { c.fillStyle = '#ff8a3a'; c.fillRect(x + 11, base - 10, 8, 6); c.fillStyle = '#ffd04a'; c.fillRect(x + 13, base - 14, 4, 5); }
    else if (d.tot) {
      c.fillStyle = '#0a0e22'; c.fillRect(x, base - 80, bw, 80);
      const h = Math.round(80 * d.done / d.tot);
      const col = d.done === d.tot ? '#6cc04a' : d.hard ? '#6ea8ff' : '#f2c14e';
      c.fillStyle = future ? '#29336a' : col; c.fillRect(x, base - h, bw, h);
      if (h > 2 && !future) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, base - h, bw, 2); }
      c.font = "700 8px 'Pixelify Sans', monospace"; c.textAlign = 'center'; c.fillStyle = '#eef0ff';
      if (!future) c.fillText(d.done + '/' + d.tot, x + bw / 2, base - h - 3 < 10 ? 10 : base - h - 3);
    }
    c.font = "700 8px 'Pixelify Sans', monospace"; c.textAlign = 'center';
    c.fillStyle = d.k === tk ? '#f2c14e' : '#a3aad6'; c.fillText(DOW[i], x + bw / 2, base + 11);
  });
}
function diaryCard(k) {
  const v = (S.diary && S.diary[k]) || '';
  return '<span class="h3">Diário de hoje</span><div class="field"><label for="diary">Como foi seu dia? Só você vê.</label><textarea id="diary" rows="3" maxlength="600" placeholder="Ex.: Acordei cedo, treinei e estudei 1 h. Amanhã quero dormir mais cedo.">' + esc(v) + '</textarea></div>' +
    '<div class="form-acts"><button class="btn sm" type="button" id="diary-save">Salvar diário</button>' + (v ? '<span class="chip ok">salvo</span>' : '') + '</div>';
}
function bindToday(p) {
  bindUpdate(p);
  const wcv = $('wb-cv'); if (wcv) { const wb = worldBoss(); renderMonThumb(wcv, wb.key, { kind: 'boss' }); }
  const dg = $('dungeon'); if (dg) dg.onclick = () => playDungeon();
  p.querySelectorAll('[data-focus]').forEach(b => b.onclick = () => { const r = focusStart(b.dataset.focus); if (r.error) toast(r.error); else { toast('Foco ligado! Bora.'); changed(); } });
  const fd = $('focus-done'); if (fd) fd.onclick = () => { const r = focusFinish(); if (r.error) toast(r.error); changed(); };
  const fc = $('focus-cancel'); if (fc) fc.onclick = () => modal({ title: 'Cancelar o foco?', text: 'O cronômetro para e a missão continua aberta.', actions: [{ label: 'Continuar focando', cls: 'gold-btn' }, { label: 'Cancelar foco', cls: 'danger', fn: () => { focusCancel(); changed(); } }] });
  const ho = $('hard-on'); if (ho) ho.onclick = () => modal({ title: 'Ligar o dia difícil?', text: 'Hoje só as missões essenciais contam para a sequência, e todas valem metade do XP. Não dá para desligar depois de concluir uma missão.', actions: [{ label: 'Cancelar' }, { label: 'Ligar', cls: 'gold-btn', fn: () => { const r = setHard(true); if (r.error) toast(r.error); else toast('Dia difícil ligado. Uma coisa de cada vez.'); changed(); } }] });
  const hf = $('hard-off'); if (hf) hf.onclick = () => { const r = setHard(false); if (r.error) toast(r.error); changed(); };
  const wo = $('wk-open'); if (wo) wo.onclick = () => { const r = openWeekly(); if (r.error) toast(r.error); else { toast(r.text); changed(); } };
  const ds = $('diary-save'); if (ds) ds.onclick = () => { saveDiary($('diary').value); toast('Diário salvo'); renderToday(); };
}
// ---------- Masmorra: as salas passam uma por uma, com os chefões ----------
function playDungeon() {
  S.dungeonWk = S.weekly.wk;
  const res = runDungeon(heroStats(), mStats);
  const ov = document.createElement('div'); ov.className = 'story';
  ov.innerHTML = '<div class="st-wrap"><canvas width="640" height="300"></canvas><div class="st-title">Masmorra da Semana</div><div class="st-box"><b class="st-who"></b><p class="st-txt"></p></div><button type="button" class="btn sm st-skip">Pular</button></div>';
  document.body.appendChild(ov);
  const cv = ov.querySelector('canvas'), who = ov.querySelector('.st-who'), tx = ov.querySelector('.st-txt');
  let i = 0, t0 = performance.now(), raf = 0, ended = false;
  const finish = () => {
    if (ended) return; ended = true; cancelAnimationFrame(raf);
    const rec = dungeonReward(res);
    who.textContent = 'Fim da masmorra'; tx.textContent = res.cleared + ' sala(s) vencida(s). Prêmio: +' + fmt(res.gold) + ' de ouro' + (res.gems ? ' e ' + res.gems + ' gema(s)' : '') + (rec ? '. NOVO RECORDE!' : '.');
    ov.onclick = () => { ov.remove(); changed(); };
    ov.querySelector('.st-skip').textContent = 'Fechar';
  };
  const loop = now => {
    const t = (now - t0) / 1000, R0 = res.rooms[i];
    if (!R0) { finish(); return; }
    const p = Math.min(1, t / 1.8), hs = heroStats().maxHp;
    const hf = (R0.before - (R0.before - R0.after) * p) / hs, bf = R0.win ? 1 - p : 1 - p * 0.6;
    who.textContent = 'Sala ' + (i + 1); tx.textContent = (MONSTERS[R0.key] ? MONSTERS[R0.key].n : '') + (p >= 1 ? (R0.win ? ' · vencido!' : ' · o herói caiu') : ' · lutando…');
    drawDuel(cv, R0.key, t, hf, bf, p >= 1 ? (R0.win ? 'VITÓRIA!' : 'DERROTA') : 'SALA ' + (i + 1));
    if (t > 2.4) { i++; t0 = now; }
    raf = requestAnimationFrame(loop);
  };
  ov.querySelector('.st-skip').onclick = e => { e.stopPropagation(); if (!ended) finish(); else { ov.remove(); changed(); } };
  raf = requestAnimationFrame(loop);
}
// Atualiza só o cronômetro do foco, sem redesenhar a aba.
let focusAlerted = false;
export function tickFocus() {
  if (!S.focusRun) { focusAlerted = false; return; }
  const el = $('focus-left'), left = focusLeft();
  if (el) { el.textContent = left ? mmss(left) : 'Pronto!'; const b = $('focus-bar'); if (b) b.style.width = (100 - left / (S.focusRun.min * 60000) * 100) + '%'; }
  if (!left && !focusAlerted) { focusAlerted = true; toast('Foco concluído! Toque em Concluir para ganhar +50%.'); if (current === 'hoje') renderToday(); }
}

// ---------- Rotina (cadastro) ----------
let editing = null; // id em edição ou 'new'
let draft = null;
const blankDraft = () => ({ name: '', time: '09:00', cat: 'est', dur: 30, days: [1, 2, 3, 4, 5], focus: false });
export function renderRoutine() {
  const p = $('p-rotina');
  if (!draft) draft = blankDraft();
  const tasks = S.tasks.slice().sort((a, b) => a.time.localeCompare(b.time));
  let html = '<p class="hint">Crie suas missões com horário, dias, categoria e duração. Você escolhe o que fazer; o jogo decide quanto XP vale, dividindo 300 XP por dia entre as missões.</p>';
  html += '<ul class="list">';
  for (const t of tasks) {
    const paused = t.pauseUntil && t.pauseUntil > today();
    html += '<li class="r-row"><span class="t-time">' + t.time + '</span><div class="t-main"><span class="t-name">' + (t.focus ? '⭐ ' : '') + esc(t.name) + '</span>' +
      '<span class="t-sub">' + (paused ? '<span class="chip late">pausada até ' + t.pauseUntil.slice(8) + '/' + t.pauseUntil.slice(5, 7) + '</span><button class="icon-btn" type="button" data-resume="' + t.id + '">Retomar</button>' : '') + '<span class="chip">' + CATS[t.cat].n + '</span><span class="chip">' + t.dur + ' min</span><span class="days">' +
      WEEKDAYS.map((d, i) => '<i class="' + (t.days.includes(i) ? 'on' : '') + '">' + d + '</i>').join('') + '</span></span></div>' +
      '<div class="r-acts"><button class="icon-btn" type="button" data-edit="' + t.id + '">Editar</button><button class="icon-btn del" type="button" data-del="' + t.id + '" aria-label="Apagar">✕</button></div></li>';
  }
  if (!tasks.length) html += '<li class="hint">Nenhuma missão ainda.</li>';
  html += '</ul>';
  html += '<form class="form" id="tform"><span class="h3" style="margin:0">' + (editing && editing !== 'new' ? 'Editar missão' : 'Nova missão') + '</span>' +
    '<div class="field"><label for="f-name">Nome</label><input id="f-name" maxlength="60" required placeholder="Ex.: Ler 20 páginas" value="' + esc(draft.name) + '"></div>' +
    '<div class="form-row"><div class="field"><label for="f-time">Horário</label><input id="f-time" type="time" required value="' + draft.time + '"></div>' +
    '<div class="field"><label for="f-dur">Duração</label><select id="f-dur">' + DURATIONS.map(d => '<option value="' + d + '"' + (d === draft.dur ? ' selected' : '') + '>' + (d >= 60 ? (d / 60) + ' h' : d + ' min') + '</option>').join('') + '</select></div></div>' +
    '<div class="field"><label for="f-cat">Categoria</label><select id="f-cat">' + Object.entries(CATS).map(([k, c]) => '<option value="' + k + '"' + (k === draft.cat ? ' selected' : '') + '>' + c.n + ' (fortalece ' + ATTRS[c.attr].n + ')</option>').join('') + '</select></div>' +
    '<label class="toggle" for="f-focus"><input type="checkbox" id="f-focus"' + (draft.focus ? ' checked' : '') + '> <span>⭐ Missão de foco: fica com uma fatia maior do XP do dia (máximo ' + FOCUS_MAX + ')</span></label>' +
    '<div class="field"><span class="lbl">Dias da semana</span><div class="daypick">' + WEEKDAYS.map((d, i) => '<button type="button" data-day="' + i + '" aria-pressed="' + draft.days.includes(i) + '" aria-label="' + WEEKDAY_NAMES[i] + '">' + d + '</button>').join('') + '</div></div>' +
    '<div class="form-acts"><button class="btn gold-btn" type="submit">' + (editing && editing !== 'new' ? 'Salvar' : 'Adicionar') + '</button>' +
    (editing && editing !== 'new' ? '<button class="btn" type="button" id="f-cancel">Cancelar</button>' : '') + '</div>' +
    '<p class="hint">Missões criadas hoje já valem XP, mas criar missões a mais só divide o XP do dia.</p></form>';
  p.innerHTML = html;

  const syncDraft = () => { draft.focus = $('f-focus').checked; draft.name = $('f-name').value; draft.time = $('f-time').value; draft.dur = Number($('f-dur').value); draft.cat = $('f-cat').value; };
  p.querySelectorAll('[data-day]').forEach(b => b.onclick = () => {
    syncDraft(); const d = Number(b.dataset.day);
    draft.days = draft.days.includes(d) ? draft.days.filter(x => x !== d) : draft.days.concat(d).sort();
    b.setAttribute('aria-pressed', draft.days.includes(d));
  });
  p.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const t = S.tasks.find(x => x.id === b.dataset.edit); if (!t) return;
    editing = t.id; draft = { name: t.name, time: t.time, cat: t.cat, dur: t.dur, days: t.days.slice(), focus: !!t.focus }; renderRoutine();
    $('f-name').focus();
  });
  p.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const t = S.tasks.find(x => x.id === b.dataset.del); if (!t) return;
    modal({ title: 'Apagar missão?', text: '"' + t.name + '" sai da sua rotina. O XP já ganho continua.', actions: [
      { label: 'Cancelar' },
      { label: 'Apagar', cls: 'danger', fn: () => { S.tasks = S.tasks.filter(x => x.id !== t.id); S.sample = false; if (editing === t.id) { editing = null; draft = null; } changed(); } }
    ] });
  });
  p.querySelectorAll('[data-resume]').forEach(b => b.onclick = () => { const t = S.tasks.find(x => x.id === b.dataset.resume); if (t) { delete t.pauseUntil; toast('Missão de volta'); changed(); } });
  const cancel = $('f-cancel'); if (cancel) cancel.onclick = () => { editing = null; draft = null; renderRoutine(); };
  $('tform').onsubmit = e => {
    e.preventDefault(); syncDraft();
    const name = draft.name.trim();
    if (!name) { toast('Dê um nome à missão.'); return; }
    if (!draft.days.length) { toast('Escolha pelo menos um dia da semana.'); return; }
    const focusN = S.tasks.filter(x => x.focus && x.id !== editing).length;
    if (draft.focus && focusN >= FOCUS_MAX) { toast('Máximo de ' + FOCUS_MAX + ' missões de foco. Tire o foco de outra antes.'); return; }
    if (editing && editing !== 'new') {
      const t = S.tasks.find(x => x.id === editing); if (t) Object.assign(t, { name, time: draft.time, cat: draft.cat, dur: draft.dur, days: draft.days, focus: draft.focus });
      toast('Missão atualizada');
    } else { S.tasks.push({ id: newId(), name, time: draft.time, cat: draft.cat, dur: draft.dur, days: draft.days, focus: draft.focus }); toast('Missão adicionada'); }
    S.sample = false; editing = null; draft = null; changed();
  };
}

// ---------- Herói ----------
export function renderHero() {
  const p = $('p-heroi'), Hs = heroStats();
  let html = '<p class="hint">Ataque ' + fmt(Hs.atk) + ' · Defesa ' + fmt(Hs.def) + ' · Vida ' + fmt(Hs.maxHp) + ' · Crítico ' + Math.round(Hs.crit * 100) + '%' +
    (Hs.block ? ' · Bloqueio ' + Math.round(Hs.block * 100) + '%' : '') +
    (furyOn() ? ' · <b style="color:var(--blood)">Fúria</b>' : '') + (tiredOn() ? ' · <b style="color:var(--mana)">Cansado</b>' : '') +
    (buffOn('forca') ? ' · <b style="color:var(--ember)">Poção de Força</b>' : '') + (buffOn('ferro') ? ' · <b style="color:var(--mana)">Poção de Ferro</b>' : '') + '</p>';
  html += '<span class="h3">Equipado</span><div class="v-list">';
  for (const sl of SLOTS) {
    const id = equippedId(sl.k), it = id && item(id), f = id ? forgeLevel(id) : 0;
    html += '<div class="eq v-item' + (it ? '' : ' v-lock') + '">' + (it ? '<canvas class="v-ic" width="44" height="44" data-hic="' + id + '"></canvas>' : '<span class="v-ic"></span>') +
      '<div><b>' + (it ? esc(it.n) + (f ? ' +' + f : '') : sl.one + ': nada') + '</b><small>' + (it ? (it.kind === 'shop' ? 'Só visual' : statLine(id)) + (it.pd ? ' · ' + it.pd : '') : sl.k === 'k' ? 'Capas vêm de conquistas e do Mercador' : 'Veja na Loja da Vila') + '</small></div><span></span></div>';
  }
  html += '</div><p class="hint">Para trocar o que o herói veste, forjar ou comprar poções, vá na aba <b>Vila</b>.</p>';
  S.potions = S.potions || {};
  const pots = Object.entries(POTIONS).filter(([k]) => S.potions[k]).map(([k, P]) => P.n + ' ×' + S.potions[k]);
  if (pots.length) html += '<p class="hint">Na bolsa: ' + pots.join(' · ') + '</p>';

  html += '<span class="h3">Atributos</span><p class="hint">Cada categoria de missão fortalece um atributo.</p><div class="attr-list">';
  const mx = Math.max(10, ...Object.values(S.attrs));
  const src = { for: 'Exercício', sab: 'Estudo, Trabalho', vit: 'Sono, Saúde', res: 'Alimentação, Casa' };
  for (const [k, a] of Object.entries(ATTRS)) {
    html += '<div class="attr-row"><span>' + a.n + '</span><div class="bar"><i style="width:' + (S.attrs[k] / mx * 100) + '%;background:var(--gold)"></i></div><span class="muted">' + Math.floor(S.attrs[k]) + '</span></div>' +
      '<p class="hint" style="margin-top:-4px">' + src[k] + ' → ' + a.d + '</p>';
  }
  html += '</div>';

  html += '<span class="h3">Pet</span>';
  const pets = S.pets || {};
  if (!Object.keys(pets).length) html += '<p class="hint">Seu primeiro pet, o Lobinho, chega num ovo quando você fizer <b>3 dias perfeitos seguidos</b>.</p>';
  else if (hasPet()) {
    const st = petStage(), nx = PET_STAGES[st.idx + 1], sad = petSad();
    html += '<div class="eq"><span class="sw" style="background:' + (sad ? 'var(--mana)' : 'var(--gold)') + '"></span><div><b>' + esc(pets[S.pet].name) + '</b><small>' + PETS[S.pet].n + ' · ' + st.n +
      (nx ? ' (' + st.days + '/' + nx.from + ' dias perfeitos para virar ' + nx.n + ')' : ' · fase final') + ' · ' + (sad ? 'Triste: a sequência quebrou e ele não ajuda até você fazer um dia perfeito' : 'Feliz') + '</small><small>' + PETS[S.pet].d + '</small></div><span></span></div>';
    html += '<div class="form-acts"><input id="pet-name" class="pick" style="flex:1;min-width:0" maxlength="16" value="' + esc(pets[S.pet].name) + '" aria-label="Nome do pet"><button class="btn sm" type="button" id="pet-save">Salvar nome</button></div>';
  }
  html += '<div class="relics">' + Object.entries(PETS).map(([id, P]) => {
    const got = !!pets[id], on = S.pet === id;
    return '<div class="relic" style="' + (got ? '' : 'opacity:.55;border-color:var(--line)') + '"><b>' + (got ? esc(pets[id].name) : P.n) + '</b><span>' + (got ? P.d : 'Como ganhar: ' + P.how) + '</span>' +
      (got ? (on ? '<span class="chip ok" style="justify-self:start">Com você</span>' : '<button class="btn sm" type="button" data-pet="' + id + '" style="justify-self:start">Levar este</button>') : '') + '</div>';
  }).join('') + '</div>';

  html += '<span class="h3">Relíquias</span>';
  const rel = S.relics.filter(r => RELICS[r]);
  html += rel.length ? '<div class="relics">' + rel.map(r => '<div class="relic"><b>' + RELICS[r].n + '</b><span>' + RELICS[r].d + '</span></div>').join('') + '</div>'
    : '<p class="hint">Nenhuma ainda. Relíquias vêm de conquistas especiais, como 7 dias perfeitos seguidos.</p>';

  html += '<span class="h3">Renascer</span>';
  html += '<p class="hint">' + (S.rebirths ? 'Você já renasceu ' + S.rebirths + ' vez(es): +' + Math.round(rebirthBonus() * 100) + '% de ataque e de vida para sempre, com aura. ' : '') +
    'No nível ' + REBIRTH_LVL + ' você pode renascer: volta ao nível 1 e à fase 1, mas fica com +10% de ataque e de vida para sempre, ganha uma aura nova e um título. Equipamentos de conquista, capas, pets, cartas, gemas e ouro continuam com você.</p>';
  html += '<div class="form-acts"><button class="btn sm' + (canRebirth() ? ' gold-btn' : '') + '" type="button" id="rebirth"' + (canRebirth() ? '' : ' disabled') + '>' + (canRebirth() ? 'Renascer agora' : 'Libera no nível ' + REBIRTH_LVL + ' (você está no ' + S.level + ')') + '</button></div>';
  html += '<span class="h3">Título</span>';
  html += S.titles.length ? '<div class="field"><select id="title-sel">' + S.titles.map(t => '<option' + (t === S.title ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></div>'
    : '<p class="hint">Conquistas dão títulos que aparecem embaixo do seu nome.</p>';

  html += '<span class="h3">Recordes</span><p class="hint">Maior sequência: ' + S.bestStreak + ' dia(s) · Fase máxima: ' + S.maxStage + ' · Monstros: ' + fmt(S.kills) + ' · Chefões: ' + S.bossKills + ' · Missões: ' + S.tasksDone + '</p>';
  p.innerHTML = html;
  p.querySelectorAll('[data-hic]').forEach(cv => { const it = item(cv.dataset.hic); renderItem(cv, it.vis, it.slot === 'k' ? 'cape' : SLOTS.find(x => x.k === it.slot).icon, 2); });
  const rb = $('rebirth'); if (rb) rb.onclick = () => modal({ title: 'Renascer?', text: 'Seu herói volta ao nível 1 e à fase 1, com +10% de ataque e de vida para sempre e uma aura nova. Conquistas, equipamentos de conquista, capas, pets, cartas, gemas e ouro continuam. Não dá para desfazer.', actions: [
    { label: 'Agora não' }, { label: 'Renascer', cls: 'gold-btn', fn: () => { const r = doRebirth(); if (r.error) toast(r.error); else { toast('Você renasceu! Título: ' + r.title); unlockStory('renascer'); changed(); setTimeout(playQueued, 800); } } }] });
  const ts = $('title-sel'); if (ts) ts.onchange = () => { S.title = ts.value; save(); renderHUD(); };
  p.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => { S.pet = b.dataset.pet; save(); toast(S.pets[S.pet].name + ' vai com você'); renderHero(); });
  const pn = $('pet-save'); if (pn) pn.onclick = () => { const v = $('pet-name').value.trim(); if (v) { S.pets[S.pet].name = v; save(); toast('Nome salvo'); renderHero(); } };
}

// ---------- Conquistas ----------
export function renderAch() {
  const p = $('p-conq'); let got = 0;
  const items = ACHIEVEMENTS.map(a => {
    const g = !!S.ach[a.id]; if (g) got++;
    const gear = a.gear && ACH_GEAR.find(g => g.id === a.gear);
    const rw = [a.title ? 'Título: ' + a.title : '', a.relic && RELICS[a.relic] ? 'Relíquia: ' + RELICS[a.relic].n : '', gear ? 'Equipamento: ' + gear.n + ' (' + gear.pd + ')' : ''].filter(Boolean).join(' · ');
    return '<li class="ach' + (g ? ' got' : '') + '"><span class="ach-ico"></span><b>' + a.n + '</b><span>' + a.d + '</span>' + (rw ? '<em>' + rw + '</em>' : '') + '</li>';
  }).join('');
  p.innerHTML = '<p class="hint">' + got + ' de ' + ACHIEVEMENTS.length + ' conquistas.</p><ul class="achs">' + items + '</ul>';
  document.querySelector('[data-tab="conq"]').textContent = 'Conquistas ' + got + '/' + ACHIEVEMENTS.length;
}

// ---------- Ajustes ----------
let permCache = null;
export async function refreshPerms() { permCache = await permissionStatus(); if (!$('p-ajustes').hidden) renderSettings(); }
export function renderSettings() {
  const p = $('p-ajustes'), t = today();
  let html = '<span class="h3">Dias de descanso</span><p class="hint">Marque até a noite anterior. No descanso o herói acampa na clareira, a sequência não quebra e no dia seguinte ele acorda Descansado.</p>';
  html += '<div class="toggle"><span class="lbl">Por semana:</span><div class="seg">' + [1, 2].map(n => '<button type="button" data-rpw="' + n + '" aria-pressed="' + (S.restPerWeek === n) + '">' + n + '</button>').join('') + '</div></div>';
  html += '<div class="week">';
  for (let i = 0; i < 7; i++) {
    const k = addDays(t, i), d = parseDay(k), on = isRest(k);
    const full = !on && restCountWeek(k) >= S.restPerWeek;
    html += '<button type="button" data-rest="' + k + '" aria-pressed="' + on + '"' + (i === 0 || full ? ' disabled' : '') + '><span>' + (i === 0 ? 'hoje' : WEEKDAY_NAMES[d.getDay()].slice(0, 3)) + '</span><b>' + d.getDate() + '</b><span>' + (on ? 'descanso' : '') + '</span></button>';
  }
  html += '</div>';

  html += '<span class="h3">Conselho do Mestre</span><p class="hint">Responda de novo as perguntas sobre sua rotina e o Mestre monta novas missões, com as de foco ⭐. Sua rotina atual é substituída se você aceitar.</p>' +
    '<div class="form-acts"><button class="btn sm" type="button" id="mentor">Falar com o Mestre</button></div>';
  html += '<span class="h3">Som</span>';
  html += '<div class="toggle"><span class="lbl">Música:</span><div class="seg"><button type="button" data-mus="1" aria-pressed="' + musicOn() + '">Ligada</button><button type="button" data-mus="0" aria-pressed="' + !musicOn() + '">Desligada</button></div></div>';
  html += '<div class="toggle"><span class="lbl">Efeitos:</span><div class="seg"><button type="button" data-sfx="1" aria-pressed="' + sfxOn() + '">Ligados</button><button type="button" data-sfx="0" aria-pressed="' + !sfxOn() + '">Desligados</button></div></div>';
  html += '<p class="hint">Cada lugar tem a sua música 8-bit; os chefões, a vila e o dia de descanso têm músicas próprias.</p>';
  html += '<span class="h3">Frases motivacionais</span>';
  html += '<div class="toggle"><div class="seg"><button type="button" data-phr="1" aria-pressed="' + S.phrasesOn + '">Ligadas</button><button type="button" data-phr="0" aria-pressed="' + !S.phrasesOn + '">Desligadas</button></div></div>';
  html += '<div class="field"><label for="custom">Suas frases (uma por linha). Elas entram no sorteio.</label><textarea id="custom" rows="3" placeholder="Ex.: Bora, Jean! O dia é seu.">' + esc(S.customPhrases.join('\n')) + '</textarea></div>';
  html += '<div class="form-acts"><button class="btn sm" type="button" id="save-phr">Salvar frases</button></div>';

  html += '<span class="h3">Permissões</span>';
  if (!isNative) html += '<p class="hint">No navegador as notificações ficam desligadas. Instale o app no Android para usar tudo.</p>';
  else {
    const pc = permCache || {};
    const st = v => v === 'granted' ? '<span class="ok-t">ativada</span>' : '<span class="bad-t">desativada</span>';
    html += '<div class="perm"><b>Notificações</b>' + st(pc.notif) + '</div><div class="perm"><b>Horário exato</b>' + st(pc.exact) + '</div>';
    html += '<div class="form-acts"><button class="btn sm" type="button" id="perm-n">Pedir notificações</button><button class="btn sm" type="button" id="perm-e">Horário exato</button></div>';
    html += '<p class="hint">Se as missões atrasarem: Configurações do Android → Apps → Rotina RPG → Bateria → Sem restrições.</p>';
  }

  if (isNative) {
    html += '<span class="h3">Ícone do app</span><p class="hint">O herói do ícone ganha equipamento conforme você sobe de nível. Em alguns celulares (Xiaomi, Samsung) o atalho some da tela inicial quando o ícone troca; se acontecer, trave o ícone.</p>' +
      '<div class="toggle"><div class="seg"><button type="button" data-icon="0" aria-pressed="' + !S.iconLock + '">Evolui</button><button type="button" data-icon="1" aria-pressed="' + !!S.iconLock + '">Travado</button></div></div>';
  }
  html += '<span class="h3">Versão</span><p class="hint">Rotina RPG ' + VERSION + (update.info ? ' · <b style="color:var(--gold)">nova versão ' + esc(update.info.tag) + ' disponível na aba Missões</b>' : '') + '</p><div class="form-acts"><button class="btn sm" type="button" id="upd-check">Procurar atualização</button></div>';
  html += '<span class="h3">Backup do herói</span><p class="hint">Salve um arquivo com todo o seu progresso. No celular, escolha o Google Drive para guardar.</p>';
  html += '<div class="form-acts"><button class="btn gold-btn sm" type="button" id="bk-exp">Exportar backup</button><label class="btn sm" for="bk-file">Importar arquivo</label><input type="file" id="bk-file" accept="application/json,.json" hidden></div>';

  html += '<span class="h3">Herói</span><div class="field"><label for="hero-name">Nome</label><input id="hero-name" maxlength="20" value="' + esc(S.hero.name) + '"></div>';
  const H = S.hero, sw = (k, list) => '<div class="swatches">' + list.map((c, i) => '<button type="button" style="background:' + c + '" data-hk="' + k + '" data-v="' + i + '" aria-pressed="' + ((H[k] || 0) === i) + '"></button>').join('') + '</div>';
  html += '<div class="hero-edit"><canvas id="hero-prev" width="120" height="132"></canvas><div>' +
    '<span class="lbl">Personagem</span><div class="seg">' + [['m', 'Herói'], ['f', 'Heroína']].map(([v, n]) => '<button type="button" data-hk="sex" data-v="' + v + '" aria-pressed="' + ((H.sex || 'm') === v) + '">' + n + '</button>').join('') + '</div>' +
    '<span class="lbl">Classe</span><div class="seg-wrap">' + Object.entries(CLASSES).map(([v, c]) => '<button type="button" class="btn sm' + ((H.cls || 'guerreiro') === v ? ' gold-btn' : '') + '" data-hk="cls" data-v="' + v + '">' + (H.sex === 'f' ? c.nf : c.n) + '</button>').join('') + '</div>' +
    '<p class="hint">' + CLASSES[H.cls || 'guerreiro'].d + '</p></div></div>' +
    '<span class="lbl">Penteado</span><div class="seg-wrap">' + HAIR_STYLES.map((n, i) => '<button type="button" class="btn sm' + ((H.style || 0) === i ? ' gold-btn' : '') + '" data-hk="style" data-v="' + i + '">' + n + '</button>').join('') + '</div>' +
    '<span class="lbl">Pele</span>' + sw('skin', SKINS) + '<span class="lbl">Cabelo</span>' + sw('hair', HAIRS) + '<span class="lbl">Roupa</span>' + sw('cloth', CLOTHES) +
    '<p class="hint">Trocar a aparência ou a classe é grátis e não perde nada.</p>';
  const bd = (S.birthday || '').split('-');
  html += '<div class="form-row"><div class="field"><label for="bd-d">Aniversário: dia</label><select id="bd-d"><option value="">--</option>' + Array.from({ length: 31 }, (_, i) => '<option' + (Number(bd[1]) === i + 1 ? ' selected' : '') + '>' + (i + 1) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="bd-m">mês</label><select id="bd-m"><option value="">--</option>' + ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].map((m, i) => '<option value="' + (i + 1) + '"' + (Number(bd[0]) === i + 1 ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></div></div>' +
    '<p class="hint">No dia do seu aniversário o herói ganha um baú de presente com a Capa Lendária e ouro.</p>';
  html += '<div class="form-acts"><button class="btn sm" type="button" id="save-name">Salvar</button><button class="btn danger sm" type="button" id="reset">Recomeçar do zero</button></div>';
  p.innerHTML = html;

  p.querySelectorAll('[data-rpw]').forEach(b => b.onclick = () => { S.restPerWeek = Number(b.dataset.rpw); changed(); });
  p.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { const r = toggleRest(b.dataset.rest); if (r.error) toast(r.error); else { toast(r.on ? 'Descanso marcado 🔥' : 'Descanso removido'); changed(); } });
  p.querySelectorAll('[data-mus]').forEach(b => b.onclick = () => { setMusic(b.dataset.mus === '1'); renderSettings(); });
  p.querySelectorAll('[data-sfx]').forEach(b => b.onclick = () => { setSfx(b.dataset.sfx === '1'); renderSettings(); });
  p.querySelectorAll('[data-phr]').forEach(b => b.onclick = () => { S.phrasesOn = b.dataset.phr === '1'; changed(); });
  $('mentor').onclick = async () => { await runMentor(); changed(); };
  $('save-phr').onclick = () => { S.customPhrases = $('custom').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 50); save(); toast('Frases salvas'); };
  if (isNative) {
    $('perm-n').onclick = async () => { await askNotifications(); refreshPerms(); changeHook(); };
    $('perm-e').onclick = async () => { await openExactSettings(); refreshPerms(); };
  }
  p.querySelectorAll('[data-icon]').forEach(b => b.onclick = () => { S.iconLock = b.dataset.icon === '1'; if (S.iconLock) S.iconIdx = S.iconIdx ?? iconTier(); save(); syncIcon(); renderSettings(); });
  $('upd-check').onclick = async () => { toast('Procurando…'); const u = await checkUpdate(); if (u) { update.hidden = false; toast('Nova versão ' + u.tag + '! Veja na aba Missões.'); renderAll(); } else toast('Você já está na versão mais nova.'); };
  $('bk-exp').onclick = async () => { try { const r = await shareBackup(exportJSON()); toast(r === 'shared' ? 'Escolha onde salvar o backup' : 'Backup baixado'); } catch (e) { toast('Não deu para exportar: ' + e.message); } };
  $('bk-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => modal({ title: 'Importar backup?', text: 'O progresso atual será substituído pelo do arquivo.', actions: [
      { label: 'Cancelar' },
      { label: 'Importar', cls: 'gold-btn', fn: () => { try { importJSON(rd.result); toast('Backup importado'); changed(); location.reload(); } catch (err) { toast(err.message); } } }
    ] });
    rd.readAsText(f);
  };
  p.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => {
    const k = b.dataset.hk, v = b.dataset.v;
    S.hero[k] = k === 'sex' || k === 'cls' ? v : Number(v);
    if (k === 'sex' && b.getAttribute('aria-pressed') !== 'true') S.hero.style = v === 'f' ? 3 : 0;
    save(); changeHook(); renderSettings(); renderHUD();
  });
  const hp = $('hero-prev'); if (hp) drawPreview(hp, S.hero);
  $('save-name').onclick = () => {
    S.hero.name = $('hero-name').value.trim() || 'Herói';
    const d = $('bd-d').value, m = $('bd-m').value;
    S.birthday = d && m ? String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') : '';
    save(); renderHUD(); toast('Salvo'); changeHook();
  };
  $('reset').onclick = () => modal({ title: 'Recomeçar do zero?', text: 'Apaga herói, nível, rotina e conquistas. Faça um backup antes se quiser guardar.', actions: [
    { label: 'Cancelar' }, { label: 'Apagar tudo', cls: 'danger', fn: () => { resetAll(); location.reload(); } }
  ] });
}

// ---------- abas ----------
let current = 'hoje';
const RENDER = { hoje: renderToday, rotina: renderRoutine, heroi: renderHero, vila: renderVila, conq: renderAch, ajustes: renderSettings };
setVillageHooks({ toast: m => toast(m), changed: () => changed(), modal: o => modal(o) });
export function initTabs() {
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    current = b.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(x => { x.setAttribute('aria-selected', x === b); $('p-' + x.dataset.tab).hidden = x !== b; });
    RENDER[current]();
    if (current === 'ajustes') refreshPerms();
  });
}
export function renderAll() {
  renderHUD(); renderNext(); renderAch();
  if (current !== 'conq') RENDER[current]();
}
// re-render leve periódico (sem mexer no formulário em edição)
export function tick() {
  renderNext();
  const a = document.activeElement;
  if (current === 'hoje' && !(a && a.id === 'diary')) renderToday();
}
export const goTab = name => { const b = document.querySelector('[data-tab="' + name + '"]'); if (b) b.click(); };
export function editTask(id) { goTab('rotina'); const b = document.querySelector('[data-edit="' + id + '"]'); if (b) b.click(); }
