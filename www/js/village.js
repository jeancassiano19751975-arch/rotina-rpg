// Aba Vila: Loja (ver e equipar), Ferreiro (forjar), Mercador (capas e poções) e Biblioteca (bestiário).
import { S, save } from './state.js';
import { SLOTS, SHOP_CAPES, POTIONS, BIOMES, MONSTERS, FORGE_MAX } from './data.js';
import {
  item, itemsOf, owned, equippedId, equip, unequip, forgeLevel, forgeCost, doForge, statLine,
  potionPrice, buyCape, buyPotion, usePotion, buffOn, slotIcon
} from './gear.js';
import { fmt } from './rules.js';
import { drawVillage, renderItem, renderMonThumb, clearVillageCache } from './game.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const V = { sel: 'loja', slot: 'w', t: 0, hit: 0, hx: null, raf: 0, last: 0 };
let hooks = { toast: () => {}, changed: () => {}, modal: () => {} };
export const setVillageHooks = h => { hooks = { ...hooks, ...h }; };

export const MERC_LVL = 3;
const mercOpen = () => S.level >= MERC_LVL;
const libOpen = () => (S.miniKills || 0) >= 1;
const PLACES = [
  { id: 'loja', n: 'Loja' }, { id: 'ferreiro', n: 'Ferreiro' },
  { id: 'mercador', n: 'Mercador' }, { id: 'biblioteca', n: 'Biblioteca' }
];

// ---------- cena animada ----------
function loop(now) {
  const cv = $('vila-cv');
  if (!cv || $('p-vila').hidden || document.hidden) { V.raf = 0; return; }
  if (V.last && now - V.last < 45) { V.raf = requestAnimationFrame(loop); return; }   // ~20 quadros por segundo bastam
  const dt = Math.min(0.1, ((now - (V.last || now)) / 1000)); V.last = now;
  V.t += dt; V.hit = Math.max(0, V.hit - dt);
  const o = { t: V.t, sel: V.sel, merc: mercOpen(), lib: libOpen(), hit: V.hit, hx: V.hx };
  try { drawVillage(cv, o); V.hx = o.hx; V.spots = o.spots; }
  catch (e) { console.warn('vila', e); }            // um erro de desenho nunca para a animação
  V.raf = requestAnimationFrame(loop);
}
// Sempre reinicia (antes, se a animação parasse por erro, ela nunca mais voltava).
function startLoop() { if (V.raf) cancelAnimationFrame(V.raf); V.last = 0; V.raf = requestAnimationFrame(loop); }

function pick(id) {
  if (id === 'mercador' && !mercOpen()) { hooks.toast('O Mercador chega à vila no nível ' + MERC_LVL + '.'); return; }
  if (id === 'biblioteca' && !libOpen()) { hooks.toast('A Biblioteca abre depois do primeiro mini-chefão.'); return; }
  V.sel = id; renderVila();
}

// ---------- ícones ----------
function iconFor(it) {
  if (it.slot === 'k') return { kind: 'cape', vis: it.vis };
  return { kind: slotIcon(it.slot), vis: it.vis };
}
const ic = (key, size = 44) => '<canvas class="v-ic" width="' + size + '" height="' + size + '" data-ic="' + esc(key) + '"></canvas>';
function paintIcons(root) {
  root.querySelectorAll('[data-ic]').forEach(cv => {
    const k = cv.dataset.ic;
    if (k.startsWith('potion:')) { renderItem(cv, POTIONS[k.slice(7)], 'potion', 2); return; }
    const it = item(k); if (!it) return;
    const f = iconFor(it); renderItem(cv, f.vis, f.kind, 2);
  });
  root.querySelectorAll('[data-mon]').forEach(cv => {
    const [key, kind, v] = cv.dataset.mon.split('|'), def = MONSTERS[key];
    renderMonThumb(cv, key, { kind, unknown: cv.dataset.unk === '1', pal: v && def.variant ? def.variant.pal : null });
  });
}

// ---------- Loja ----------
function lockText(it) {
  if (it.kind === 'level') return 'Chega no nível ' + it.lvl;
  if (it.kind === 'shop') return 'À venda no Mercador · ' + fmt(it.price) + ' ouro';
  return 'Como ganhar: ' + it.how;
}
function shopHTML() {
  let h = '<p class="hint">Tudo o que você pode vestir. As peças de nível chegam sozinhas com a rotina; as de conquista têm poderes especiais e acompanham o seu nível. Toque em <b>Equipar</b> para escolher o que o herói usa.</p>';
  h += '<div class="seg-wrap">' + SLOTS.map(s => '<button type="button" class="btn sm' + (V.slot === s.k ? ' gold-btn' : '') + '" data-slot="' + s.k + '">' + s.n + '</button>').join('') + '</div>';
  const eq = equippedId(V.slot);
  const list = itemsOf(V.slot).sort((a, b) => (a.kind === 'level' ? 0 : a.kind === 'gear' ? 1 : 2) - (b.kind === 'level' ? 0 : b.kind === 'gear' ? 1 : 2) || (a.lvl || 0) - (b.lvl || 0));
  h += '<div class="v-list">';
  for (const it of list) {
    const got = owned(it.id), on = eq === it.id, f = forgeLevel(it.id);
    const tag = it.kind === 'gear' ? '<span class="chip focus">conquista</span>' : it.kind === 'shop' ? '<span class="chip">só visual</span>' : '';
    const info = got ? (it.slot === 'k' && it.kind === 'shop' ? 'Só visual' : statLine(it.id)) + (it.pd ? ' · <b class="pw">' + it.pd + '</b>' : '')
      : lockText(it) + (it.pd ? ' · poder: ' + it.pd : '');
    let act;
    if (!got) act = '<span class="chip">🔒</span>';
    else if (on) act = '<span class="chip ok">Equipado</span>';
    else act = '<button class="btn sm gold-btn" type="button" data-eq="' + it.id + '">Equipar</button>';
    h += '<div class="eq v-item' + (got ? '' : ' v-lock') + (on ? ' v-on' : '') + '">' + ic(it.id) +
      '<div><b>' + esc(it.n) + (f ? ' +' + f : '') + '</b> ' + tag + '<small>' + info + '</small></div>' + act + '</div>';
  }
  h += '</div>';
  if (V.slot === 'k' && eq) h += '<div class="form-acts"><button class="btn sm" type="button" id="cape-off">Tirar a capa</button></div>';
  if (V.slot === 's' && eq) h += '<div class="form-acts"><button class="btn sm" type="button" id="shield-off">Guardar o escudo</button></div>';
  return h;
}

// ---------- Ferreiro ----------
function forgeHTML() {
  let h = '<p class="hint">O ferreiro fortalece a peça que você está usando: cada +1 deixa ela 15% mais forte (escudo: +2% de bloqueio). Vai até +' + FORGE_MAX + '. A forja fica na peça, mesmo se você trocar e voltar.</p><div class="v-list">';
  for (const s of SLOTS) {
    if (s.k === 'k') continue;
    const id = equippedId(s.k);
    if (!id) { h += '<div class="eq v-item v-lock"><span class="v-ic"></span><div><b>' + s.one + '</b><small>Nada equipado</small></div><span></span></div>'; continue; }
    const it = item(id), f = forgeLevel(id);
    let act;
    if (f >= FORGE_MAX) act = '<span class="chip ok">+' + FORGE_MAX + ' máx</span>';
    else { const c = forgeCost(id); act = '<button class="btn sm' + (S.gold >= c ? ' gold-btn' : '') + '" type="button" data-forge="' + id + '">Forjar +' + (f + 1) + ' · ' + fmt(c) + '</button>'; }
    h += '<div class="eq v-item">' + ic(id) + '<div><b>' + esc(it.n) + (f ? ' +' + f : '') + '</b><small>' + s.one + ' · ' + statLine(id) + '</small></div>' + act + '</div>';
  }
  return h + '</div>';
}

// ---------- Mercador ----------
function mercHTML() {
  if (!mercOpen()) return '<p class="hint">O Mercador chega à vila no nível ' + MERC_LVL + '.</p>';
  S.potions = S.potions || {};
  let h = '<span class="h3">Poções</span><p class="hint">O preço sobe conforme você avança nas fases.</p><div class="v-list">';
  for (const [k, P] of Object.entries(POTIONS)) {
    const n = S.potions[k] || 0, pr = potionPrice(k), on = buffOn(k);
    const left = on ? Math.ceil((S.buffs[k] - Date.now()) / 60000) : 0;
    h += '<div class="eq v-item">' + ic('potion:' + k) + '<div><b>' + P.n + '</b> <span class="chip">' + n + ' na bolsa</span>' + (on ? ' <span class="chip ok">ativa ' + left + ' min</span>' : '') + '<small>' + P.d + '</small></div>' +
      '<div class="v-acts"><button class="btn sm' + (S.gold >= pr ? ' gold-btn' : '') + '" type="button" data-buyp="' + k + '">Comprar · ' + fmt(pr) + '</button>' +
      (k !== 'vida' && n ? '<button class="btn sm" type="button" data-usep="' + k + '">Usar</button>' : '') + '</div></div>';
  }
  h += '</div><span class="h3">Capas</span><p class="hint">Só visual: deixam o herói com a sua cara.</p><div class="v-list">';
  for (const c of SHOP_CAPES) {
    const got = owned(c.id), on = equippedId('k') === c.id;
    const act = on ? '<span class="chip ok">Equipada</span>' : got ? '<button class="btn sm gold-btn" type="button" data-eq="' + c.id + '">Equipar</button>'
      : '<button class="btn sm' + (S.gold >= c.price ? ' gold-btn' : '') + '" type="button" data-buyc="' + c.id + '">Comprar · ' + fmt(c.price) + '</button>';
    h += '<div class="eq v-item">' + ic(c.id) + '<div><b>' + c.n + '</b><small>' + (got ? 'Sua' : fmt(c.price) + ' de ouro') + '</small></div>' + act + '</div>';
  }
  return h + '</div>';
}

// ---------- Biblioteca (Bestiário) ----------
function libHTML() {
  if (!libOpen()) return '<p class="hint">A Biblioteca abre depois do primeiro mini-chefão.</p>';
  const B = S.bestiary || {};
  const seenAll = new Set();
  const card = (key, kind, v) => {
    const def = MONSTERS[key]; if (!def) return '';
    const bk = v ? key + '_v' : key, n = B[bk] || 0, name = v ? def.variant.n : def.n;
    seenAll.add(bk);
    return '<div class="bst' + (n ? '' : ' unk') + '"><canvas width="72" height="60" data-mon="' + key + '|' + kind + (v ? '|v' : '') + '" data-unk="' + (n ? 0 : 1) + '"></canvas>' +
      '<b>' + (n ? esc(name) : '???') + '</b><small>' + (n ? fmt(n) + ' derrotad' + (n === 1 ? 'o' : 'os') : v ? 'Chefão do Pesadelo' : kind === 'boss' ? 'Chefão' : kind === 'mini' ? 'Mini-chefão' : 'Não visto') + '</small></div>';
  };
  let h = '', total = 0, seen = 0;
  const count = (key, v) => { total++; if (B[v ? key + '_v' : key]) seen++; };
  let body = '';
  BIOMES.forEach(b => {
    const list = [...b.mons.map(k => [k, 'normal']), [b.mini, 'mini'], [b.boss, 'boss']];
    list.forEach(([k]) => count(k));
    if (MONSTERS[b.boss] && MONSTERS[b.boss].variant) count(b.boss, true);
    body += '<span class="h3">' + b.n + '</span><div class="bst-grid">' + list.map(([k, kind]) => card(k, kind)).join('') +
      (MONSTERS[b.boss] && MONSTERS[b.boss].variant ? card(b.boss, 'boss', true) : '') + '</div>';
  });
  const extra = Object.keys(MONSTERS).filter(k => !seenAll.has(k) && (B[k] || MONSTERS[k].event));
  if (extra.length) { extra.forEach(k => count(k)); body += '<span class="h3">Raros e de eventos</span><div class="bst-grid">' + extra.map(k => card(k, 'normal')).join('') + '</div>'; }
  h += '<p class="hint">Bestiário: ' + seen + ' de ' + total + ' monstros descobertos. Os chefões de outra cor aparecem no Modo Pesadelo (depois da fase 70).' +
    ' Elites derrotados: ' + fmt(S.eliteKills || 0) + '.</p>' + body;
  return h;
}

// ---------- aba ----------
export function renderVila() {
  const p = $('p-vila');
  clearVillageCache();          // roupa ou pet podem ter mudado
  let h = '<div class="scene-wrap box v-scene"><canvas id="vila-cv" width="640" height="300" aria-label="Vila: toque num prédio"></canvas></div>';
  h += '<div class="seg-wrap v-nav">' + PLACES.map(pl => {
    const lock = (pl.id === 'mercador' && !mercOpen()) || (pl.id === 'biblioteca' && !libOpen());
    return '<button type="button" class="btn sm' + (V.sel === pl.id ? ' gold-btn' : '') + '" data-place="' + pl.id + '">' + (lock ? '🔒 ' : '') + pl.n + '</button>';
  }).join('') + '</div>';
  h += '<div id="v-body">' + (V.sel === 'loja' ? shopHTML() : V.sel === 'ferreiro' ? forgeHTML() : V.sel === 'mercador' ? mercHTML() : libHTML()) + '</div>';
  p.innerHTML = h;
  paintIcons(p);
  startLoop();

  const cv = $('vila-cv');
  cv.onclick = e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 320, y = (e.clientY - r.top) / r.height * 150;
    const s = (V.spots || []).find(s => x >= s.x0 - 4 && x <= s.x1 + 4 && y >= s.y0 - 6 && y <= s.y1);
    if (s) pick(s.id);
  };
  p.querySelectorAll('[data-place]').forEach(b => b.onclick = () => pick(b.dataset.place));
  p.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { V.slot = b.dataset.slot; renderVila(); });
  p.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { if (equip(b.dataset.eq)) { hooks.toast(item(b.dataset.eq).n + ' equipad' + (/a$/.test(item(b.dataset.eq).n.split(' ')[0]) ? 'a' : 'o')); hooks.changed(); } });
  const co = $('cape-off'); if (co) co.onclick = () => { unequip('k'); hooks.changed(); };
  const so = $('shield-off'); if (so) so.onclick = () => { unequip('s'); hooks.changed(); };
  p.querySelectorAll('[data-forge]').forEach(b => b.onclick = () => {
    const r = doForge(b.dataset.forge);
    if (r.error) hooks.toast(r.error); else { V.hit = 1.4; hooks.toast('Tum! Tum! Forjado: agora é +' + r.level); hooks.changed(); }
  });
  p.querySelectorAll('[data-buyp]').forEach(b => b.onclick = () => { const r = buyPotion(b.dataset.buyp); if (r.error) hooks.toast(r.error); else { hooks.toast(POTIONS[b.dataset.buyp].n + ' na bolsa'); hooks.changed(); } });
  p.querySelectorAll('[data-usep]').forEach(b => b.onclick = () => { const r = usePotion(b.dataset.usep); if (r.error) hooks.toast(r.error); else { hooks.toast(POTIONS[b.dataset.usep].n + ': ativa por 3 minutos'); hooks.changed(); } });
  p.querySelectorAll('[data-buyc]').forEach(b => b.onclick = () => { const r = buyCape(b.dataset.buyc); if (r.error) hooks.toast(r.error); else { hooks.toast(item(b.dataset.buyc).n + ' comprada e equipada'); hooks.changed(); } });
}
