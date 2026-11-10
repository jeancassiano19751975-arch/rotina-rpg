// Equipamentos: catálogo, o que está vestido, forja por peça, poderes, capas e poções.
import { S, bus, save } from './state.js';
import { WEAPONS, ARMOR_SETS, SHIELDS, PIECES, ACH_GEAR, SHOP_CAPES, POTIONS, SLOTS, FORGE_MAX, FORGE_BONUS } from './data.js';

const PIECE_IDX = { h: 0, c: 1, l: 2 };
const ICON = Object.fromEntries(SLOTS.map(s => [s.k, s.icon]));
export const slotIcon = slot => ICON[slot];

// ---------- catálogo ----------
let CAT = null;
function catalog() {
  if (CAT) return CAT;
  CAT = {};
  WEAPONS.forEach((w, i) => { CAT['w' + i] = { id: 'w' + i, slot: 'w', kind: 'level', tier: i, n: w.n, lvl: w.lvl, vis: w }; });
  SHIELDS.forEach((x, i) => { CAT['s' + i] = { id: 's' + i, slot: 's', kind: 'level', tier: i, n: x.n, lvl: x.lvl, vis: x }; });
  ['h', 'c', 'l'].forEach(k => ARMOR_SETS.forEach((A, i) => {
    const pi = PIECE_IDX[k];
    if (k === 'h' && i === 0) return;               // "sem capacete" é a ausência
    CAT[k + i] = { id: k + i, slot: k, kind: 'level', tier: i, n: A.names[pi], lvl: A.lvl[pi], vis: A };
  }));
  ACH_GEAR.forEach(g => { CAT[g.id] = { ...g, kind: 'gear' }; });
  SHOP_CAPES.forEach(c => { CAT[c.id] = { ...c, slot: 'k', kind: 'shop' }; });
  return CAT;
}
export const item = id => catalog()[id] || null;
export const itemsOf = slot => Object.values(catalog()).filter(x => x.slot === slot);

export function owned(id) {
  const it = item(id); if (!it) return false;
  if (it.kind === 'level') return S.level >= it.lvl;
  if (it.kind === 'gear') return !!(S.gear && S.gear[id]);
  if (it.kind === 'shop') return !!(S.owned && S.owned[id]);
  return false;
}
// Melhor peça por nível (o que se ganha sozinho com a rotina).
export function bestLevel(slot) {
  let best = null;
  for (const it of itemsOf(slot)) if (it.kind === 'level' && owned(it.id) && (!best || it.tier > best.tier)) best = it;
  return best ? best.id : null;
}
export function equippedId(slot) {
  const e = S.equip && S.equip[slot];
  if (e === 'none') return null;
  if (e && owned(e)) return e;
  return slot === 'k' ? null : bestLevel(slot);
}
export function equip(id) {
  const it = item(id); if (!it || !owned(id)) return false;
  S.equip = S.equip || {}; S.equip[it.slot] = id; save(); return true;
}
export function unequip(slot) { S.equip = S.equip || {}; S.equip[slot] = 'none'; save(); }

// ---------- atributos de cada peça ----------
export const forgeLevel = id => (S.forgeItem && S.forgeItem[id]) || 0;
function baseLevelStats(slot, tier) {
  if (slot === 'w') return { atk: WEAPONS[tier].atk };
  if (slot === 's') return { def: SHIELDS[tier].def, block: SHIELDS[tier].block };
  const A = ARMOR_SETS[tier], sh = PIECES[PIECE_IDX[slot]].share;
  return { def: A.def * sh, hp: A.hp * sh };
}
// Peças de conquista acompanham o nível: 90% da melhor peça de nível daquele espaço (mínimo: a 1ª de verdade).
function gearBase(it) {
  if (it.slot === 'k') return {};
  const bid = bestLevel(it.slot);
  let tier = bid ? item(bid).tier : 0;
  if (it.slot !== 'w' && tier < 1) tier = 1;
  if (it.slot === 's' && !bid) tier = 0;
  const b = baseLevelStats(it.slot, tier), k = it.boost || 0.9;
  const out = {};
  for (const key of Object.keys(b)) out[key] = key === 'block' ? b[key] : b[key] * k;
  if (it.slot === 'w') out.atk = Math.max(2, out.atk);
  return out;
}
export function itemStats(id) {
  const it = item(id); if (!it) return {};
  const base = it.kind === 'level' ? baseLevelStats(it.slot, it.tier) : it.kind === 'gear' ? gearBase(it) : {};
  const f = forgeLevel(id), m = 1 + FORGE_BONUS * f, out = {};
  for (const key of Object.keys(base)) out[key] = key === 'block' ? base[key] + 0.02 * f : base[key] * m;
  return out;
}
export function powers() {
  const P = {};
  for (const s of SLOTS) {
    const id = equippedId(s.k), it = id && item(id);
    if (!it || !it.power) continue;
    for (const [k, v] of Object.entries(it.power)) P[k] = typeof v === 'number' ? (P[k] || 0) + v : v || P[k];
  }
  return P;
}
export function statLine(id) {
  const st = itemStats(id), parts = [];
  if (st.atk) parts.push('+' + Math.round(st.atk) + ' ataque');
  if (st.def) parts.push('+' + (Math.round(st.def * 10) / 10) + ' defesa');
  if (st.hp) parts.push('+' + Math.round(st.hp) + ' vida');
  if (st.block) parts.push(Math.round(st.block * 100) + '% bloqueio');
  return parts.join(' · ') || 'Só visual';
}

// ---------- visual do que está vestido ----------
export function look() {
  const get = s => { const id = equippedId(s); return id ? item(id) : null; };
  const w = get('w') || item('w0'), sh = get('s'), h = get('h'), c = get('c'), l = get('l'), k = get('k');
  return {
    weapon: w.vis, shield: sh ? sh.vis : null,
    helm: h ? h.vis : ARMOR_SETS[0], helmTier: h ? (h.vis.shape || h.tier) : 0,
    chest: c ? c.vis : ARMOR_SETS[0], legs: l ? l.vis : ARMOR_SETS[0],
    cape: k ? k.vis : null
  };
}

// ---------- forja (Ferreiro) ----------
function forgeTier(id) {
  const it = item(id);
  if (it.kind === 'level') return it.tier;
  const b = bestLevel(it.slot); return (b ? item(b).tier : 0) + 1;
}
export function forgeCost(id) { return Math.round(150 * (forgeTier(id) + 1) * Math.pow(forgeLevel(id) + 1, 2)); }
export function doForge(id) {
  const it = item(id);
  if (!it || !owned(id)) return { error: 'Você não tem essa peça.' };
  if (it.slot === 'k') return { error: 'Capas não são forjadas.' };
  if (forgeLevel(id) >= FORGE_MAX) return { error: 'Já está no máximo (+' + FORGE_MAX + ').' };
  const st = itemStats(id); if (!st.atk && !st.def && !st.hp && !st.block) return { error: 'Essa peça não tem atributos para forjar.' };
  const c = forgeCost(id);
  if (S.gold < c) return { error: 'Faltam ' + Math.ceil(c - S.gold).toLocaleString('pt-BR') + ' de ouro.' };
  S.gold -= c; S.forgeItem = S.forgeItem || {}; S.forgeItem[id] = forgeLevel(id) + 1; S.forged = true;
  save(); bus.emit('forged', it);
  return { ok: true, level: S.forgeItem[id] };
}

// ---------- Mercador ----------
export const potionPrice = k => Math.round(POTIONS[k].price * (1 + (S.maxStage || 1) / 10));
export function buyCape(id) {
  const c = item(id); if (!c || c.kind !== 'shop') return { error: 'Item não encontrado.' };
  if (owned(id)) return { error: 'Você já tem essa capa.' };
  if (S.gold < c.price) return { error: 'Faltam ' + (c.price - Math.floor(S.gold)).toLocaleString('pt-BR') + ' de ouro.' };
  S.gold -= c.price; S.owned = S.owned || {}; S.owned[id] = true; equip(id); save();
  return { ok: true };
}
export function buyPotion(k) {
  const p = potionPrice(k);
  if (S.gold < p) return { error: 'Faltam ' + (p - Math.floor(S.gold)).toLocaleString('pt-BR') + ' de ouro.' };
  S.gold -= p; S.potions = S.potions || {}; S.potions[k] = (S.potions[k] || 0) + 1; save();
  return { ok: true };
}
export function usePotion(k) {
  S.potions = S.potions || {};
  if (!S.potions[k]) return { error: 'Você não tem essa poção.' };
  if (k === 'vida') return { error: 'A Poção de Vida é usada sozinha quando o herói cai.' };
  S.potions[k]--; S.buffs = S.buffs || {};
  S.buffs[k] = Math.max(Date.now(), S.buffs[k] || 0) + 180000; save();
  return { ok: true };
}
export const buffOn = k => !!(S.buffs && S.buffs[k] > Date.now());

// ---------- desbloqueio dos equipamentos de conquista ----------
const COND = {
  espDisc: () => !!S.ach.str7, capaMad: () => !!S.ach.cedo5, escCac: () => !!S.ach.k500,
  elmoFarao: () => !!S.bosses['Faraó Esquecido'], coroaGelo: () => !!S.bosses['Rainha do Gelo'],
  laminaOsso: () => !!S.bosses['Rei dos Ossos'], capaConde: () => !!S.bosses['Conde Vampiro'],
  escamas: () => !!S.bosses['Dragão Ancestral'], botasAnd: () => ((S.catDone && S.catDone.exe) || 0) >= 30,
  armLenda: () => (S.perfectDays || 0) >= 100, gorroNatal: () => !!(S.evt && S.evt.boneco),
  capaAbobora: () => ((S.evt && S.evt.abobora) || 0) >= 20, capaLenda: () => !!(S.evt && S.evt.bday)
};
export function checkGear() {
  S.gear = S.gear || {};
  for (const g of ACH_GEAR) {
    if (S.gear[g.id] || !COND[g.id] || !COND[g.id]()) continue;
    S.gear[g.id] = Date.now();
    if (g.slot === 'k' && !(S.equip && S.equip.k)) { S.equip = S.equip || {}; S.equip.k = g.id; }   // primeira capa já vai no herói
    bus.emit('chest', { kind: ICON[g.slot], item: g.vis, name: g.n });
  }
}

// Saves antigos (até a 1.1): forja por espaço vira forja por peça.
// Ouro gasto forjando peça sem atributos (espada de madeira, roupa de viajante) volta para o jogador.
export function refundEmptyForge() {
  if (!S.forgeItem) return 0;
  let back = 0;
  for (const id of Object.keys(S.forgeItem)) {
    const it = item(id); if (!it || it.kind !== 'level') continue;
    const st = itemStats(id); if (st.atk || st.def || st.hp || st.block) continue;
    const t = it.tier;
    for (let f = 0; f < S.forgeItem[id]; f++) back += Math.round(150 * (t + 1) * Math.pow(f + 1, 2));
    delete S.forgeItem[id];
  }
  if (back) { S.gold += back; save(); }
  return back;
}
export function migrateGear3() {
  if (S.gearV === 3) return;
  S.forgeItem = S.forgeItem || {};
  const f = S.forge || {};
  const w = bestLevel('w'), sh = bestLevel('s'), c = bestLevel('c');
  if (f.w && w) S.forgeItem[w] = f.w;
  if (f.s && sh) S.forgeItem[sh] = f.s;
  if (f.a && c) S.forgeItem[c] = f.a;
  S.equip = S.equip || {}; S.gear = S.gear || {}; S.owned = S.owned || {};
  S.potions = S.potions || { vida: 0, forca: 0, ferro: 0 }; S.buffs = S.buffs || {};
  // conquistas que já tinham sido feitas: as peças chegam sem baú
  for (const g of ACH_GEAR) if (COND[g.id] && COND[g.id]()) S.gear[g.id] = S.gear[g.id] || Date.now();
  if ((S.relics || []).includes('madrugador') && S.gear.capaMad && !S.equip.k) S.equip.k = 'capaMad';
  S.gearV = 3;
}
