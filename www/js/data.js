// Tabelas fixas do jogo: categorias, equipamentos, monstros, biomas, conquistas.

export const DAILY_XP = 300;          // orçamento de XP por dia
export const OFFLINE_CAP_H = 8;       // limite do progresso offline
export const KILLS_PER_STAGE = 5;

export const CATS = {
  exe: { n: 'Exercício',   w: 1.3, attr: 'for' },
  est: { n: 'Estudo',      w: 1.2, attr: 'sab' },
  son: { n: 'Sono',        w: 1.1, attr: 'vit' },
  ali: { n: 'Alimentação', w: 0.9, attr: 'res' },
  cas: { n: 'Casa',        w: 0.8, attr: 'res' },
  tra: { n: 'Trabalho',    w: 1.0, attr: 'sab' },
  sau: { n: 'Saúde',       w: 1.0, attr: 'vit' }
};

export const ATTRS = {
  for: { n: 'Força',       d: 'mais dano' },
  sab: { n: 'Sabedoria',   d: 'mais crítico' },
  vit: { n: 'Vitalidade',  d: 'mais vida' },
  res: { n: 'Resistência', d: 'mais defesa' }
};

export const DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];
export const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// Equipamento principal: liberado por NÍVEL (só a rotina dá XP).
export const WEAPONS = [
  { n: 'Espada de Madeira', atk: 0,  lvl: 1,  blade: '#a8743c', edge: '#c9935a', guard: '#6e4a26', len: 10 },
  { n: 'Espada de Cobre',   atk: 4,  lvl: 3,  blade: '#d9824a', edge: '#f2ab78', guard: '#8a5a35', len: 11 },
  { n: 'Espada de Ferro',   atk: 10, lvl: 6,  blade: '#aab0bf', edge: '#e2e6ef', guard: '#5a5f70', len: 12 },
  { n: 'Espada de Ouro',    atk: 22, lvl: 10, blade: '#e8b33c', edge: '#ffe08a', guard: '#9b6f1e', len: 13 },
  { n: 'Lâmina da Noite',   atk: 45, lvl: 15, blade: '#7a4fd6', edge: '#b493ff', guard: '#3a2470', len: 15, glow: true },
  { n: 'Lâmina Estelar',    atk: 95, lvl: 21, blade: '#58d4ff', edge: '#d6f6ff', guard: '#2f6fa8', len: 17, glow: true }
];
export const ARMORS = [
  { n: 'Roupas de Viajante', def: 0,  hp: 0,   lvl: 1,  main: null,      dark: null,      legs: '#5a4632', helm: null },
  { n: 'Armadura de Couro',  def: 1,  hp: 12,  lvl: 2,  main: '#9a6436', dark: '#74482a', legs: '#6b4426', helm: '#9a6436' },
  { n: 'Armadura de Cobre',  def: 3,  hp: 30,  lvl: 5,  main: '#d9824a', dark: '#a85a2e', legs: '#a85a2e', helm: '#e39a66' },
  { n: 'Armadura de Ferro',  def: 7,  hp: 60,  lvl: 8,  main: '#b8bcc8', dark: '#7f8496', legs: '#7f8496', helm: '#cfd3dc' },
  { n: 'Armadura de Ouro',   def: 14, hp: 120, lvl: 13, main: '#f2c14e', dark: '#c18f2a', legs: '#c18f2a', helm: '#ffd96e' },
  { n: 'Armadura Mítica',    def: 28, hp: 260, lvl: 19, main: '#9b6cff', dark: '#6a43c9', legs: '#5a36ad', helm: '#c3a6ff' }
];
export const FORGE_MAX = 3;
export const FORGE_BONUS = 0.15; // +15% por nível de forja

// Relíquias: itens especiais raros dados por conquistas.
export const RELICS = {
  disciplina: { n: 'Espada da Disciplina', d: '+10% de ataque e brilho dourado na arma', atk: 0.10 },
  madrugador: { n: 'Capa do Madrugador',   d: '+8% de vida e uma capa vermelha',      hp: 0.08 },
  cacador:    { n: 'Anel do Caçador',      d: '+5% de chance de crítico',              crit: 0.05 },
  desbravador:{ n: 'Coroa do Desbravador', d: '+10% de vida',                          hp: 0.10 }
};

// Personalização do herói
export const SKINS = ['#f3c9a0', '#e0a878', '#b97a4e', '#8a5532', '#5e3a22'];
export const HAIRS = ['#2a1c14', '#5a3a20', '#a8682e', '#e8c060', '#d8d8e0', '#c83a3a'];
export const CLOTHES = ['#3d7bd9', '#3faa5a', '#c8443a', '#8a5ad0', '#e09a2a', '#3a3a4a'];

// Monstros. h = altura (px) para barra de vida; fly = voa; burrow = sai do chão.
export const MONSTERS = {
  slime:     { n: 'Slime',          hp: 1.0, dmg: 1.0, spd: 14, h: 12 },
  coelho:    { n: 'Coelho Raivoso', hp: 0.6, dmg: 0.8, spd: 26, h: 11 },
  zumbi:     { n: 'Zumbi',          hp: 1.25,dmg: 1.1, spd: 9,  h: 27 },
  morcego:   { n: 'Morcego',        hp: 0.8, dmg: 0.9, spd: 20, h: 34, fly: true },
  escorpiao: { n: 'Escorpião',      hp: 1.0, dmg: 1.4, spd: 14, h: 14 },
  mumia:     { n: 'Múmia',          hp: 1.55,dmg: 1.0, spd: 8,  h: 28 },
  abutre:    { n: 'Abutre',         hp: 0.9, dmg: 1.15,spd: 18, h: 36, fly: true },
  verme:     { n: 'Verme de Areia', hp: 1.3, dmg: 1.3, spd: 16, h: 24, burrow: true }
};

export const BIOMES = [
  { id: 'floresta', n: 'Floresta', from: 1, to: 10,
    mons: ['slime', 'coelho', 'zumbi', 'morcego'],
    mini: { base: 'zumbi', n: 'Zumbi Brutamontes' },
    boss: { base: 'slime', n: 'Slime Colossal', mech: 'split' } },
  { id: 'deserto', n: 'Deserto', from: 11, to: 9999,
    mons: ['escorpiao', 'mumia', 'abutre', 'verme'],
    mini: { base: 'escorpiao', n: 'Escorpião Rei' },
    boss: { base: 'mumia', n: 'Faraó Esquecido', mech: 'summon' } }
];

// Conquistas. reward: { title } e/ou { relic }
export const ACHIEVEMENTS = [
  { id: 't1',    n: 'Primeiro Passo',      d: 'Conclua sua primeira missão',            title: 'Aprendiz' },
  { id: 't25',   n: 'Disciplina de Ferro', d: 'Conclua 25 missões',                     title: 'Disciplinado' },
  { id: 't100',  n: 'Lenda da Rotina',     d: 'Conclua 100 missões',                    title: 'Lenda da Rotina' },
  { id: 'cedo5', n: 'Madrugador',          d: 'Conclua 5 missões antes das 7h',         title: 'O Madrugador', relic: 'madrugador' },
  { id: 'perf',  n: 'Dia Perfeito',        d: 'Cumpra todas as missões de um dia' },
  { id: 'str3',  n: 'Em Chamas',           d: '3 dias perfeitos seguidos',              title: 'Chama Acesa' },
  { id: 'str7',  n: 'Hábito Forjado',      d: '7 dias perfeitos seguidos',              title: 'Mestre da Disciplina', relic: 'disciplina' },
  { id: 'pont20',n: 'Pontual',             d: 'Conclua 20 missões no horário',          title: 'Pontual' },
  { id: 'k50',   n: 'Caçador',             d: 'Derrote 50 monstros' },
  { id: 'k500',  n: 'Exterminador',        d: 'Derrote 500 monstros',                   title: 'Exterminador', relic: 'cacador' },
  { id: 'mini',  n: 'Quebra-Ossos',        d: 'Derrote um mini-chefão' },
  { id: 'boss1', n: 'Rei Caído',           d: 'Derrote o Slime Colossal',               title: 'Matador de Slimes' },
  { id: 'boss2', n: 'Tumba Selada',        d: 'Derrote o Faraó Esquecido',              title: 'Caçador de Faraós' },
  { id: 'st20',  n: 'Desbravador',         d: 'Chegue à fase 20',                       title: 'Desbravador', relic: 'desbravador' },
  { id: 'lv5',   n: 'Aventureiro',         d: 'Alcance o nível 5' },
  { id: 'lv10',  n: 'Herói',               d: 'Alcance o nível 10',                     title: 'Herói' },
  { id: 'forja', n: 'Na Bigorna',          d: 'Forje um equipamento' },
  { id: 'rest',  n: 'Ao Pé da Fogueira',   d: 'Tire um dia de descanso planejado' }
];
