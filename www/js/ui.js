// Interface: HUD, abas, rotina, herói, conquistas, ajustes, toast e modal.
import { S, save, today, addDays, parseDay, tMin, tGame, nowMin, newId, exportJSON, importJSON, resetAll } from './state.js';
import { CLOTHES, CATS, ATTRS, DURATIONS, WEEKDAYS, WEEKDAY_NAMES, WEAPONS, ARMOR_SETS, PIECES, SHIELDS, PETS, PET_STAGES, FORGE_MAX, RELICS, ACHIEVEMENTS } from './data.js';
import {
  fmt, fmtTime, xpNeed, petStage, petSad, hasPet, heroStats, weaponTier, armorTier, shieldTier, pieceTier, forgeCost, doForge, tasksOn, isRest, baseXP, lateInfo,
  predictXP, completeTask, toggleRest, restCountWeek, furyOn, tiredOn, restedOn
} from './rules.js';
import { FOCUS_MAX } from './mentor.js';
import { runMentor } from './onboarding.js';
import { permissionStatus, askNotifications, askLocation, openExactSettings, shareBackup, isNative } from './notify.js';

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
  let html = '<p class="hint">Hoje, ' + dname + ': ' + doneN + ' de ' + list.length + ' missões. O jogo decide o XP de cada uma; o dia vale até 300 XP.' +
    (restedOn() ? ' <b style="color:var(--grass)">Descansado: +10% nas missões da manhã.</b>' : '') + '</p>';
  if (S.sample) html += '<p class="hint" style="color:var(--gold);border:2px dashed var(--gold-d);padding:6px 10px">Rotina de exemplo. Monte a sua na aba Rotina.</p>';
  if (!list.length) html += '<p class="hint">Nenhuma missão para hoje. Adicione na aba Rotina.</p>';
  html += '<ul class="list">';
  for (const t of list) {
    const done = lg[t.id], li = lateInfo(t, n);
    let chips = (t.focus ? '<span class="chip focus">⭐ foco</span>' : '') + '<span class="chip">' + CATS[t.cat].n + '</span><span class="chip">' + t.dur + ' min</span>';
    let sub;
    if (done) {
      sub = '+' + done.xp + ' XP';
      if (done.late) chips += '<span class="chip late">atrasada</span>'; else chips += '<span class="chip ok">no horário</span>';
      if (done.verified) chips += '<span class="chip ver">verificada</span>';
    } else if (li.locked) sub = 'Libera às ' + li.unlockAt;
    else { sub = 'Vale ' + predictXP(t) + ' XP'; if (li.late) chips += '<span class="chip late">' + li.label + '</span>'; }
    html += '<li class="task' + (done ? ' done' : '') + (li.locked && !done ? ' locked' : '') + (nx === t ? ' next-up' : '') + '">' +
      '<button class="check" type="button" data-done="' + t.id + '" aria-label="Concluir ' + esc(t.name) + '"' + (done || li.locked ? ' disabled' : '') + '>' + CHECK_SVG + '</button>' +
      '<span class="t-time">' + t.time + '</span>' +
      '<div class="t-main"><span class="t-name">' + esc(t.name) + '</span><span class="t-sub"><span>' + sub + '</span>' + chips + '</span></div></li>';
  }
  html += '</ul>';
  p.innerHTML = html;
  p.querySelectorAll('[data-done]').forEach(b => b.onclick = () => {
    const r = completeTask(b.dataset.done);
    if (r.error) toast(r.error); else changed();
  });
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
    html += '<li class="r-row"><span class="t-time">' + t.time + '</span><div class="t-main"><span class="t-name">' + (t.focus ? '⭐ ' : '') + esc(t.name) + '</span>' +
      '<span class="t-sub"><span class="chip">' + CATS[t.cat].n + '</span><span class="chip">' + t.dur + ' min</span><span class="days">' +
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
  const wt = weaponTier(), Wp = WEAPONS[wt], nW = WEAPONS[wt + 1];
  const st = shieldTier(), Sh = st >= 0 ? SHIELDS[st] : null, nS = SHIELDS[st + 1];
  const swW = 'linear-gradient(135deg,' + Wp.edge + ' 0 40%,' + Wp.blade + ' 40% 70%,' + Wp.guard + ' 70%)';
  const cloth = CLOTHES[S.hero.cloth] || '#3d7bd9';
  const forgeBtn = k => {
    const f = S.forge[k] || 0;
    if (f >= FORGE_MAX) return '<span class="chip ok">+' + FORGE_MAX + ' máx</span>';
    const c = forgeCost(k);
    return '<button class="btn sm' + (S.gold >= c ? ' gold-btn' : '') + '" type="button" data-forge="' + k + '"' + (S.gold >= c ? '' : ' disabled') + '>Forjar +' + (f + 1) + ' · ' + fmt(c) + '</button>';
  };
  const row = (sw, name, sub, act) => '<div class="eq"><span class="sw" style="background:' + sw + '"></span><div><b>' + name + '</b><small>' + sub + '</small></div>' + (act || '<span></span>') + '</div>';
  let html = '<p class="hint">Ataque ' + fmt(Hs.atk) + ' · Defesa ' + fmt(Hs.def) + ' · Vida ' + fmt(Hs.maxHp) + ' · Crítico ' + Math.round(Hs.crit * 100) + '%' +
    (Hs.block ? ' · Bloqueio ' + Math.round(Hs.block * 100) + '%' : '') +
    (furyOn() ? ' · <b style="color:var(--blood)">Fúria</b>' : '') + (tiredOn() ? ' · <b style="color:var(--mana)">Cansado</b>' : '') + '</p>';
  html += '<span class="h3">Arma e escudo</span>';
  html += row(swW, Wp.n + (S.forge.w ? ' +' + S.forge.w : ''), '+' + Wp.atk + ' ataque' + (nW ? ' · próxima: ' + nW.n + ' no nível ' + nW.lvl : ' · melhor arma'), forgeBtn('w'));
  html += Sh
    ? row('radial-gradient(circle at 50% 45%,' + Sh.emb + ' 0 18%,' + Sh.main + ' 20% 60%,' + Sh.rim + ' 62%)', Sh.n + (S.forge.s ? ' +' + S.forge.s : ''),
        '+' + Sh.def + ' defesa · ' + Math.round(Hs.block * 100) + '% de bloqueio' + (nS ? ' · próximo: ' + nS.n + ' no nível ' + nS.lvl : ' · melhor escudo'), forgeBtn('s'))
    : row('repeating-linear-gradient(45deg,var(--shadow) 0 4px,var(--panel) 4px 8px)', 'Sem escudo', 'O primeiro escudo chega no nível ' + SHIELDS[0].lvl + '. Ele bloqueia golpes e dá o golpe de escudo.');
  html += '<span class="h3">Armadura</span>';
  PIECES.forEach((pc, i) => {
    const t = pieceTier(i), A = ARMOR_SETS[t], nx = ARMOR_SETS[t + 1];
    const c1 = A.main || (i === 1 ? cloth : '#5a4632'), c2 = A.dark || '#2a2a3a';
    const name = A.names[i] + (i === 1 && S.forge.a && t > 0 ? ' +' + S.forge.a : '');
    const sub = (t ? '+' + Math.round(A.def * pc.share * 10) / 10 + ' defesa, +' + Math.round(A.hp * pc.share) + ' vida' : 'Sem proteção') +
      (nx ? ' · próxima: ' + nx.names[i] + ' no nível ' + nx.lvl[i] : ' · a melhor');
    html += row('linear-gradient(180deg,' + (A.light || c1) + ' 0 25%,' + c1 + ' 25% 70%,' + c2 + ' 70%)', name, sub, i === 1 ? forgeBtn('a') : '');
  });
  html += '<p class="hint">A forja do peitoral fortalece a armadura inteira.</p>';
  html += '<p class="hint">Equipamento novo só vem subindo de nível, com a rotina. O ouro dos monstros serve para forjar: cada +1 deixa a peça 15% mais forte. Peça nova começa do +0.</p>';

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
  html += S.relics.length ? '<div class="relics">' + S.relics.map(r => '<div class="relic"><b>' + RELICS[r].n + '</b><span>' + RELICS[r].d + '</span></div>').join('') + '</div>'
    : '<p class="hint">Nenhuma ainda. Relíquias vêm de conquistas especiais, como 7 dias perfeitos seguidos.</p>';

  html += '<span class="h3">Título</span>';
  html += S.titles.length ? '<div class="field"><select id="title-sel">' + S.titles.map(t => '<option' + (t === S.title ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></div>'
    : '<p class="hint">Conquistas dão títulos que aparecem embaixo do seu nome.</p>';

  html += '<span class="h3">Recordes</span><p class="hint">Maior sequência: ' + S.bestStreak + ' dia(s) · Fase máxima: ' + S.maxStage + ' · Monstros: ' + fmt(S.kills) + ' · Chefões: ' + S.bossKills + ' · Missões: ' + S.tasksDone + '</p>';
  p.innerHTML = html;
  p.querySelectorAll('[data-forge]').forEach(b => b.onclick = () => {
    const r = doForge(b.dataset.forge);
    if (r.error) toast(r.error); else { toast('Forjado! Agora é +' + r.level); renderAll(); }
  });
  const ts = $('title-sel'); if (ts) ts.onchange = () => { S.title = ts.value; save(); renderHUD(); };
  p.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => { S.pet = b.dataset.pet; save(); toast(S.pets[S.pet].name + ' vai com você'); renderHero(); });
  const pn = $('pet-save'); if (pn) pn.onclick = () => { const v = $('pet-name').value.trim(); if (v) { S.pets[S.pet].name = v; save(); toast('Nome salvo'); renderHero(); } };
}

// ---------- Conquistas ----------
export function renderAch() {
  const p = $('p-conq'); let got = 0;
  const items = ACHIEVEMENTS.map(a => {
    const g = !!S.ach[a.id]; if (g) got++;
    const rw = [a.title ? 'Título: ' + a.title : '', a.relic ? 'Relíquia: ' + RELICS[a.relic].n : ''].filter(Boolean).join(' · ');
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
  html += '<span class="h3">Frases motivacionais</span>';
  html += '<div class="toggle"><div class="seg"><button type="button" data-phr="1" aria-pressed="' + S.phrasesOn + '">Ligadas</button><button type="button" data-phr="0" aria-pressed="' + !S.phrasesOn + '">Desligadas</button></div></div>';
  html += '<div class="field"><label for="custom">Suas frases (uma por linha). Elas entram no sorteio.</label><textarea id="custom" rows="3" placeholder="Ex.: Bora, Jean! O dia é seu.">' + esc(S.customPhrases.join('\n')) + '</textarea></div>';
  html += '<div class="form-acts"><button class="btn sm" type="button" id="save-phr">Salvar frases</button></div>';

  html += '<span class="h3">Permissões</span>';
  if (!isNative) html += '<p class="hint">No navegador as notificações e o GPS ficam desligados. Instale o app no Android para usar tudo.</p>';
  else {
    const pc = permCache || {};
    const st = v => v === 'granted' ? '<span class="ok-t">ativada</span>' : '<span class="bad-t">desativada</span>';
    html += '<div class="perm"><b>Notificações</b>' + st(pc.notif) + '</div><div class="perm"><b>Horário exato</b>' + st(pc.exact) + '</div><div class="perm"><b>Localização</b>' + st(pc.loc) + '</div>';
    html += '<div class="form-acts"><button class="btn sm" type="button" id="perm-n">Pedir notificações</button><button class="btn sm" type="button" id="perm-e">Horário exato</button><button class="btn sm" type="button" id="perm-l">Pedir localização</button></div>';
    html += '<p class="hint">Se as missões atrasarem: Configurações do Android → Apps → Rotina RPG → Bateria → Sem restrições.</p>';
  }

  html += '<span class="h3">Backup do herói</span><p class="hint">Salve um arquivo com todo o seu progresso. No celular, escolha o Google Drive para guardar.</p>';
  html += '<div class="form-acts"><button class="btn gold-btn sm" type="button" id="bk-exp">Exportar backup</button><label class="btn sm" for="bk-file">Importar arquivo</label><input type="file" id="bk-file" accept="application/json,.json" hidden></div>';

  html += '<span class="h3">Herói</span><div class="field"><label for="hero-name">Nome</label><input id="hero-name" maxlength="20" value="' + esc(S.hero.name) + '"></div>';
  html += '<div class="form-acts"><button class="btn sm" type="button" id="save-name">Salvar nome</button><button class="btn danger sm" type="button" id="reset">Recomeçar do zero</button></div>';
  p.innerHTML = html;

  p.querySelectorAll('[data-rpw]').forEach(b => b.onclick = () => { S.restPerWeek = Number(b.dataset.rpw); changed(); });
  p.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { const r = toggleRest(b.dataset.rest); if (r.error) toast(r.error); else { toast(r.on ? 'Descanso marcado 🔥' : 'Descanso removido'); changed(); } });
  p.querySelectorAll('[data-phr]').forEach(b => b.onclick = () => { S.phrasesOn = b.dataset.phr === '1'; changed(); });
  $('mentor').onclick = async () => { await runMentor(); changed(); };
  $('save-phr').onclick = () => { S.customPhrases = $('custom').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 50); save(); toast('Frases salvas'); };
  if (isNative) {
    $('perm-n').onclick = async () => { await askNotifications(); refreshPerms(); changeHook(); };
    $('perm-e').onclick = async () => { await openExactSettings(); refreshPerms(); };
    $('perm-l').onclick = async () => { await askLocation(); refreshPerms(); };
  }
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
  $('save-name').onclick = () => { S.hero.name = $('hero-name').value.trim() || 'Herói'; save(); renderHUD(); toast('Nome salvo'); };
  $('reset').onclick = () => modal({ title: 'Recomeçar do zero?', text: 'Apaga herói, nível, rotina e conquistas. Faça um backup antes se quiser guardar.', actions: [
    { label: 'Cancelar' }, { label: 'Apagar tudo', cls: 'danger', fn: () => { resetAll(); location.reload(); } }
  ] });
}

// ---------- abas ----------
let current = 'hoje';
const RENDER = { hoje: renderToday, rotina: renderRoutine, heroi: renderHero, conq: renderAch, ajustes: renderSettings };
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
  if (current === 'hoje') renderToday();
}
