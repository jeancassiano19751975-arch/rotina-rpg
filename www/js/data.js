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
// Armadura em 3 peças (capacete, peitoral, calças e botas), cada uma liberada num nível.
export const PIECES = [
  { k: 'h', n: 'Capacete', share: 0.3 },
  { k: 'c', n: 'Peitoral', share: 0.45 },
  { k: 'l', n: 'Calças e botas', share: 0.25 }
];
export const ARMOR_SETS = [
  { lvl: [1, 1, 1],    def: 0,  hp: 0,   main: null,      dark: null,      light: null,      names: ['Sem capacete', 'Túnica de Viajante', 'Calças de Viajante'] },
  { lvl: [2, 3, 4],    def: 2,  hp: 15,  main: '#9a6436', dark: '#6a4424', light: '#c08a52', names: ['Gorro de Couro', 'Peitoral de Couro', 'Calças de Couro'] },
  { lvl: [5, 6, 7],    def: 5,  hp: 35,  main: '#d9824a', dark: '#9a5a2e', light: '#f2ab78', names: ['Elmo de Cobre', 'Peitoral de Cobre', 'Grevas de Cobre'] },
  { lvl: [8, 9, 11],   def: 10, hp: 70,  main: '#b8bcc8', dark: '#7a7f90', light: '#e8ecf4', names: ['Elmo de Ferro', 'Couraça de Ferro', 'Grevas de Ferro'] },
  { lvl: [13, 14, 16], def: 18, hp: 140, main: '#f2c14e', dark: '#b8862a', light: '#fff0a0', names: ['Elmo de Ouro', 'Couraça de Ouro', 'Grevas de Ouro'] },
  { lvl: [19, 20, 22], def: 32, hp: 280, main: '#9b6cff', dark: '#5a36ad', light: '#d0b8ff', names: ['Elmo Mítico', 'Couraça Mítica', 'Grevas Míticas'] }
];
// Escudos: bloqueiam golpes e permitem o golpe de escudo.
export const SHIELDS = [
  { n: 'Escudo de Madeira', def: 1,  block: 0.08, lvl: 2,  main: '#9a6436', rim: '#5a3a1e', emb: '#d8a868' },
  { n: 'Broquel de Cobre',  def: 3,  block: 0.12, lvl: 4,  main: '#d9824a', rim: '#8a5a35', emb: '#ffd0a0' },
  { n: 'Escudo de Ferro',   def: 6,  block: 0.16, lvl: 7,  main: '#9aa0b0', rim: '#5a5f70', emb: '#e2e6ef' },
  { n: 'Escudo de Ouro',    def: 12, block: 0.20, lvl: 12, main: '#e8b33c', rim: '#9b6f1e', emb: '#fff4c0' },
  { n: 'Égide Mítica',      def: 22, block: 0.25, lvl: 18, main: '#7a4fd6', rim: '#3a2470', emb: '#d6f6ff' }
];
export const FORGE_MAX = 3;
export const FORGE_BONUS = 0.15; // +15% por nível de forja

// Relíquias: bônus passivos dados por conquistas.
export const RELICS = {
  cacador:    { n: 'Anel do Caçador',      d: '+5% de chance de crítico', crit: 0.05 },
  desbravador:{ n: 'Coroa do Desbravador', d: '+10% de vida',             hp: 0.10 }
};

// Espaços de equipamento (a pessoa escolhe o que vestir na Loja da vila).
export const SLOTS = [
  { k: 'w', n: 'Armas', one: 'Arma', icon: 'weapon' },
  { k: 's', n: 'Escudos', one: 'Escudo', icon: 'shield' },
  { k: 'h', n: 'Capacetes', one: 'Capacete', icon: 'helm' },
  { k: 'c', n: 'Peitorais', one: 'Peitoral', icon: 'chest' },
  { k: 'l', n: 'Calças e botas', one: 'Calças', icon: 'legs' },
  { k: 'k', n: 'Capas', one: 'Capa', icon: 'cape' }
];

// Equipamentos de conquista: visual próprio + poder especial. Atributos acompanham o seu nível.
// power: atkPct · hpPct · statPct (defesa e vida) · crit · block · speed · leech · noSlow · noFreeze · noBurn
export const ACH_GEAR = [
  { id: 'espDisc',   slot: 'w', n: 'Espada da Disciplina', how: '7 dias perfeitos seguidos',      power: { atkPct: 0.10 }, pd: '+10% de ataque',
    vis: { blade: '#f2d070', edge: '#fff6c8', guard: '#9b6f1e', len: 15, glow: true, glowC: '#ffe08a' } },
  { id: 'laminaOsso', slot: 'w', n: 'Lâmina de Osso',      how: 'Derrotar o Rei dos Ossos',       power: { crit: 0.08 }, pd: '+8% de crítico',
    vis: { blade: '#e8e0c8', edge: '#ffffff', guard: '#4a2a6a', len: 16, glow: true, glowC: '#b493ff' } },
  { id: 'escCac',    slot: 's', n: 'Escudo do Caçador',    how: 'Derrotar 500 monstros',          power: { block: 0.08 }, pd: '+8% de bloqueio',
    vis: { main: '#3f7a3a', rim: '#2a2018', emb: '#e8c060' } },
  { id: 'elmoFarao', slot: 'h', n: 'Elmo do Faraó',        how: 'Derrotar o Faraó Esquecido',     power: { noSlow: true }, pd: 'Imune a teia e lentidão',
    vis: { main: '#e8b33c', dark: '#2f6fa8', light: '#ffe08a', shape: 'farao' } },
  { id: 'coroaGelo', slot: 'h', n: 'Coroa de Gelo',        how: 'Derrotar a Rainha do Gelo',      power: { noFreeze: true }, pd: 'Imune a congelamento',
    vis: { main: '#8ad0f0', dark: '#2a5aa8', light: '#ffffff', shape: 'gelo' } },
  { id: 'gorroNatal', slot: 'h', n: 'Gorro de Natal',      how: 'Evento de Natal: derrotar o Boneco de Neve Gigante', power: { hpPct: 0.05 }, pd: '+5% de vida',
    vis: { main: '#d83a3a', dark: '#8a1e1e', light: '#ffffff', shape: 'natal' } },
  { id: 'escamas',   slot: 'c', n: 'Escamas de Dragão',    how: 'Derrotar o Dragão Ancestral',    power: { noBurn: true }, pd: 'Imune a fogo',
    vis: { main: '#b8302a', dark: '#6a1418', light: '#f0a050' } },
  { id: 'armLenda',  slot: 'c', n: 'Armadura da Lenda',    how: '100 dias perfeitos',             power: { statPct: 0.2 }, pd: '+20% de defesa e vida', boost: 1.3,
    vis: { main: '#e8eaff', dark: '#8a8ab0', light: '#ffe08a' } },
  { id: 'botasAnd',  slot: 'l', n: 'Botas do Andarilho',   how: '30 missões de Exercício',        power: { speed: 0.10 }, pd: 'Ataca 10% mais rápido',
    vis: { main: '#4a8a5a', dark: '#2a5a3a', light: '#8ad0a0' } },
  { id: 'capaMad',   slot: 'k', n: 'Capa do Madrugador',   how: '5 missões antes das 7h',         power: { hpPct: 0.08 }, pd: '+8% de vida',
    vis: { a: '#b82c26', b: '#8a1e1a', c: '#e04a40' } },
  { id: 'capaConde', slot: 'k', n: 'Capa do Conde',        how: 'Derrotar o Conde Vampiro',       power: { leech: 0.05 }, pd: 'Rouba 5% do dano como vida',
    vis: { a: '#1a1022', b: '#0a0610', c: '#a8203a' } },
  { id: 'capaAbobora', slot: 'k', n: 'Capa de Abóbora',    how: 'Evento de Halloween: derrotar 20 Abóboras Assombradas', power: { atkPct: 0.05 }, pd: '+5% de ataque',
    vis: { a: '#e87a1a', b: '#a84a0a', c: '#ffb04a' } },
  { id: 'capaLenda', slot: 'k', n: 'Capa Lendária',        how: 'Presente de aniversário',        power: { atkPct: 0.05, hpPct: 0.05 }, pd: '+5% de ataque e de vida',
    vis: { a: '#e8b33c', b: '#9b6f1e', c: '#fff0a0', sparkle: true } }
];

// Mercador: capas só de visual (ouro) e poções.
export const SHOP_CAPES = [
  { id: 'capeAzul',   n: 'Capa Azul',     price: 300,  vis: { a: '#2f5ab8', b: '#1e3a80', c: '#5a8ae0' } },
  { id: 'capeVerde',  n: 'Capa Verde',    price: 300,  vis: { a: '#2f8a3a', b: '#1e5a26', c: '#5ac06a' } },
  { id: 'capeRoxa',   n: 'Capa Roxa',     price: 500,  vis: { a: '#6a3aa8', b: '#43246e', c: '#9a6ad8' } },
  { id: 'capePreta',  n: 'Capa Sombria',  price: 800,  vis: { a: '#26222e', b: '#14121a', c: '#4a4458' } },
  { id: 'capeBranca', n: 'Capa Real',     price: 1200, vis: { a: '#ece8f4', b: '#a8a2c0', c: '#ffffff' } },
  { id: 'capeOuro',   n: 'Capa Dourada',  price: 2500, vis: { a: '#e8b33c', b: '#9b6f1e', c: '#fff0a0' } }
];
export const POTIONS = {
  vida:  { n: 'Poção de Vida',          price: 150, c: '#e84a5a', d: 'Usada sozinha: se o herói cair, levanta com vida cheia' },
  forca: { n: 'Poção de Força',         price: 120, c: '#ff8a2a', d: '+30% de ataque por 3 minutos' },
  ferro: { n: 'Poção de Pele de Ferro', price: 120, c: '#8ab0d8', d: '+30% de defesa por 3 minutos' }
};

// Personalização do herói
// Herói ou heroína, penteados e classes (Versão 4).
export const HAIR_STYLES = ['Curto', 'Espetado', 'Rabo de cavalo', 'Longo', 'Coque', 'Trança'];
export const CLASSES = {
  guerreiro: { n: 'Guerreiro', nf: 'Guerreira', d: 'Espada e escudo. +10% de vida e +10% de defesa.', wn: 'Espada' },
  mago:      { n: 'Mago',      nf: 'Maga',      d: 'Cajado que lança magia de longe. +15% de ataque, -10% de vida.', wn: 'Cajado' },
  arqueiro:  { n: 'Arqueiro',  nf: 'Arqueira',  d: 'Arco e flechas de longe. +8% de crítico e ataca 10% mais rápido.', wn: 'Arco' }
};
// Nome da arma de nível conforme a classe (as cores e o poder são os mesmos).
export const CLASS_WEAPON_NAMES = {
  mago: ['Cajado de Madeira', 'Cajado de Cobre', 'Cajado de Ferro', 'Cajado de Ouro', 'Cajado da Noite', 'Cajado Estelar'],
  arqueiro: ['Arco de Madeira', 'Arco de Cobre', 'Arco de Ferro', 'Arco de Ouro', 'Arco da Noite', 'Arco Estelar']
};
export const SKINS = ['#f3c9a0', '#e0a878', '#b97a4e', '#8a5532', '#5e3a22'];
export const HAIRS = ['#2a1c14', '#5a3a20', '#a8682e', '#e8c060', '#d8d8e0', '#c83a3a'];
export const CLOTHES = ['#3d7bd9', '#3faa5a', '#c8443a', '#8a5ad0', '#e09a2a', '#3a3a4a'];

// Monstros. draw = desenho base, pal = cores, h = altura (barra de vida), trait = jeito de lutar:
// fast (ataca rápido) · ranged (atira de longe) · web (teia: herói fica lento) · drain (rouba vida)
// freeze (congela) · fire (fogo) · regen (se regenera). fly = voa, burrow = sai do chão.
const SL = (a, c, b) => ({ a, c, b });
export const MONSTERS = {
  // Floresta
  slime:   { n: 'Slime', draw: 'slime', hp: 1, dmg: 1, spd: 14, h: 12, tiers: [SL('#5fc85a', '#a6f2a0', '#2f7a2c'), SL('#4a8ef0', '#a4ccff', '#24509a'), SL('#e0504a', '#ff9e96', '#8a2622'), SL('#a35fe0', '#d8acff', '#5a2a8a')], tierNames: ['Slime Verde', 'Slime Azul', 'Slime Vermelho', 'Slime Roxo'] },
  lobo:    { n: 'Lobo', draw: 'lobo', pal: { a: '#7a7a86', b: '#4e4e5a', c: '#b0b0ba', e: '#ffd04a' }, hp: 0.9, dmg: 1.05, spd: 26, h: 18, trait: 'fast' },
  goblin:  { n: 'Goblin', draw: 'goblin', pal: { a: '#6aa84a', b: '#3e3a2a', c: '#8a5a2a', e: '#ffe04a' }, hp: 0.8, dmg: 1, spd: 16, h: 25, trait: 'ranged', proj: 'lanca' },
  aranha:  { n: 'Aranha', draw: 'aranha', pal: { a: '#6a4a3a', b: '#3e2a20', c: '#8a6a5a', e: '#ff4040', x: '#e0b040' }, hp: 0.85, dmg: 1, spd: 20, h: 13, trait: 'web' },
  coelho:  { n: 'Coelho Raivoso', draw: 'coelho', pal: { a: '#c9b8a6', b: '#9a8676' }, hp: 0.6, dmg: 0.8, spd: 26, h: 17, trait: 'fast' },
  chefeGoblin: { n: 'Chefe Goblin', draw: 'goblin', pal: { a: '#5a983a', b: '#2e2a1e', c: '#6a3a8a', e: '#ff4040', chief: true }, hp: 1.2, dmg: 1.1, spd: 12, h: 25, img: 'chefeGoblin', imgK: 1, imgBot: 59, big: true, front: 39, h: 56 },
  slimeRei: { n: 'Slime Colossal', draw: 'slimeG', big: true, front: 24, pal: SL('#5fc85a', '#a6f2a0', '#2f7a2c'), hp: 1, dmg: 1, spd: 10, h: 40, variant: { imgFilter: 'hue-rotate(200deg) saturate(1.3)', n: 'Slime Colossal Sombrio', pal: { a: '#6a3aa8', c: '#c8a0ff', b: '#3a1a6a' } }, img: 'slimeRei', imgK: 2, imgBot: 61, big: true, front: 80, h: 118 },
  // Deserto
  escorpiao: { n: 'Escorpião', draw: 'escorpiao', pal: { a: '#c0803a', b: '#8a5a2a', c: '#e0a860', x: '#e04040' }, hp: 1, dmg: 1.4, spd: 14, h: 17 },
  mumia:   { n: 'Múmia', draw: 'mumia', pal: { a: '#d8ccb0', b: '#a89a7a', c: '#ece2c8' }, hp: 1.55, dmg: 1, spd: 8, h: 28 },
  abutre:  { n: 'Abutre', draw: 'abutre', pal: { a: '#5a4030', b: '#3e2c20' }, hp: 0.9, dmg: 1.15, spd: 18, h: 38, fly: true },
  centDeserto: { n: 'Centopeia do Deserto', draw: 'centopeia', pal: { a: '#d0702a', b: '#9a4a1a', c: '#f0a050', e: '#ffe04a', x: '#3a1a0a' }, hp: 1.1, dmg: 1.2, spd: 18, h: 11 },
  verme:   { n: 'Verme de Areia', draw: 'verme', pal: { a: '#b08050', b: '#8a5e36', c: '#c89a68', dirt: '#c9a060' }, hp: 1.3, dmg: 1.3, spd: 16, h: 30, burrow: true },
  escRei:  { n: 'Escorpião Rei', draw: 'escorpiao', pal: { a: '#3a3a4a', b: '#22222e', c: '#5a5a70', x: '#8a40e0', king: true }, hp: 1.2, dmg: 1.4, spd: 12, h: 18, img: 'escorpiaoRei', imgK: 1, imgBot: 60, big: true, front: 42, h: 57 },
  farao:   { n: 'Faraó Esquecido', draw: 'faraoG', big: true, front: 24, pal: { a: '#d8ccb0', b: '#a89a7a', c: '#ece2c8', pharaoh: true }, hp: 1.3, dmg: 1, spd: 8, h: 72, variant: { imgFilter: 'grayscale(.7) brightness(.65) contrast(1.2)', n: 'Faraó Sombrio', pal: { a: '#5a5266', b: '#3a3444', c: '#7a7288', pharaoh: true } }, img: 'farao', imgK: 2, imgBot: 62, big: true, front: 67, h: 122 },
  // Neve
  loboGelo: { n: 'Lobo de Gelo', draw: 'lobo', pal: { a: '#d8e4f0', b: '#8aa0c0', c: '#ffffff', e: '#58d4ff' }, hp: 1, dmg: 1.1, spd: 26, h: 18, trait: 'fast' },
  esqGelo: { n: 'Esqueleto Congelado', draw: 'esqueleto', pal: { a: '#cfe4f4', b: '#7a9ab8', e: '#58d4ff', ice: true, blade: '#bfe8ff' }, hp: 1.1, dmg: 1.1, spd: 12, h: 31, trait: 'freeze' },
  golem:   { n: 'Golem de Neve', draw: 'golem', pal: { a: '#e8f0f8', b: '#a8c0d8', c: '#8ad0f0', e: '#1a2a3a' }, hp: 1.7, dmg: 1.1, spd: 8, h: 30 },
  espirito: { n: 'Espírito Gélido', draw: 'espirito', pal: { a: '#bfe8ff', b: '#6aa8d8', e: '#1a3a6a' }, hp: 0.8, dmg: 1, spd: 18, h: 36, fly: true, trait: 'freeze' },
  yeti:    { n: 'Yeti', draw: 'yeti', pal: { a: '#e8eef6', b: '#a8b8cc', c: '#7a8aa0' }, hp: 1.3, dmg: 1.3, spd: 10, h: 33, img: 'yeti', imgK: 1, imgBot: 62, big: true, front: 41, h: 62 },
  rainhaGelo: { n: 'Rainha do Gelo', draw: 'rainhaG', big: true, front: 20, pal: { a: '#6aa8e8', b: '#2a5aa8', c: '#bfe8ff' }, hp: 1.1, dmg: 1.1, spd: 8, h: 78, trait: 'freeze', variant: { imgFilter: 'hue-rotate(70deg) saturate(1.4) brightness(.8)', n: 'Rainha das Sombras', pal: { a: '#7a4ab8', b: '#3a1a6a', c: '#c8a0ff' } }, img: 'rainhaGelo', imgK: 2, imgBot: 60, big: true, front: 72, h: 118 },
  // Caverna
  esqueleto: { n: 'Esqueleto', draw: 'esqueleto', pal: { a: '#e8e0c8', b: '#a89a78', e: '#ff5040' }, hp: 1, dmg: 1.1, spd: 13, h: 31 },
  arqueiro: { n: 'Arqueiro Esqueleto', draw: 'esqueleto', pal: { a: '#e8e0c8', b: '#a89a78', e: '#ff5040', bow: true }, hp: 0.8, dmg: 1, spd: 12, h: 31, trait: 'ranged', proj: 'flecha' },
  aranhaG: { n: 'Aranha Gigante', draw: 'aranha', pal: { a: '#2a2a34', b: '#16161e', c: '#4a4a5a', e: '#ff3030', x: '#e03030' }, hp: 1.3, dmg: 1.2, spd: 18, h: 13, trait: 'web' },
  centPedra: { n: 'Centopeia das Pedras', draw: 'centopeia', pal: { a: '#7a7488', b: '#4e4a5a', c: '#a8a2b8', e: '#7af0c0', x: '#2a2834' }, hp: 1.2, dmg: 1.2, spd: 18, h: 11 },
  goblinM: { n: 'Goblin Mineiro', draw: 'goblin', pal: { a: '#6a9a4a', b: '#3a3a2a', c: '#5a4a3a', e: '#ffe04a', miner: true }, hp: 1, dmg: 1.1, spd: 15, h: 25 },
  morcego: { n: 'Morcego', draw: 'morcego', pal: { a: '#4a3a5a', b: '#2e2240', c: '#6a5a7a', e: '#ff5050' }, hp: 0.8, dmg: 0.9, spd: 20, h: 36, fly: true },
  rainhaAranha: { n: 'Rainha Aranha', draw: 'aranha', pal: { a: '#5a2a7a', b: '#3a1a4e', c: '#8a5aaa', e: '#7af0c0', x: '#f2c14e', queen: true }, hp: 1.3, dmg: 1.2, spd: 14, h: 18, trait: 'web', img: 'rainhaAranha', imgK: 1, imgBot: 56, big: true, front: 42, h: 48 },
  reiOssos: { n: 'Rei dos Ossos', draw: 'reiG', big: true, front: 26, pal: { a: '#ece4cc', b: '#a89a78', e: '#b493ff', king: true }, hp: 1.2, dmg: 1.1, spd: 9, h: 74, variant: { imgFilter: 'sepia(1) saturate(2.6) brightness(1.1)', n: 'Rei dos Ossos Dourado', pal: { a: '#e8c060', b: '#a8802a', e: '#ff5040', king: true } }, img: 'reiOssos', imgK: 2, imgBot: 60, big: true, front: 76, h: 114 },
  // Pântano
  zumbiP:  { n: 'Zumbi do Pântano', draw: 'zumbi', pal: { a: '#7a9a5a', b: '#5a7a3a', shirt: '#5a6a3a', pants: '#3a3a2a', hair: '#3a4a2a', e: '#e0e040', moss: true }, hp: 1.3, dmg: 1.1, spd: 9, h: 28 },
  sapo:    { n: 'Sapo Venenoso', draw: 'sapo', pal: { a: '#3aa84a', b: '#1e6a2a', c: '#a8e070', x: '#e040a0' }, hp: 0.9, dmg: 1.2, spd: 16, h: 14, trait: 'web' },
  planta:  { n: 'Planta Carnívora', draw: 'planta', pal: { a: '#c8304a', b: '#8a1a2e', c: '#ff6a7a', x: '#ffe0e0' }, hp: 1.2, dmg: 1.3, spd: 14, h: 30, burrow: true },
  bruxa:   { n: 'Bruxa', draw: 'bruxa', pal: { a: '#4a2a6a', b: '#2a1e3a' }, hp: 0.9, dmg: 1.2, spd: 12, h: 37, trait: 'ranged', proj: 'pocao' },
  hidra:   { n: 'Hidra', draw: 'hidra', pal: { a: '#3a8a6a', b: '#1e5a44', c: '#8ad0a0', e: '#ffe04a' }, hp: 1.3, dmg: 1.2, spd: 8, h: 38, trait: 'regen', img: 'hidra', imgK: 1, imgBot: 60, big: true, front: 41, h: 58 },
  serpente: { n: 'Serpente Gigante', draw: 'serpenteG', big: true, front: 24, pal: { a: '#5a8a3a', b: '#3a6a24', c: '#a0d070', e: '#ffe04a', x: '#e0c040', dirt: '#4a4a2a' }, hp: 1.2, dmg: 1.2, spd: 10, h: 100, burrow: true, variant: { imgFilter: 'grayscale(1) brightness(1.6) contrast(.9)', n: 'Serpente Albina', pal: { a: '#e8e0d0', c: '#ffffff', x: '#e04060', e: '#ff3040', dirt: '#4a4a2a' } }, img: 'serpente', imgK: 2, imgBot: 64, big: true, front: 80, h: 124 },
  // Castelo Sombrio
  lobisomem: { n: 'Lobisomem', draw: 'lobisomem', pal: { a: '#6a5a4a', b: '#4a3e32', c: '#9a8a78', e: '#ffd04a', x: '#3a4a6a' }, hp: 1.2, dmg: 1.2, spd: 20, h: 38, trait: 'fast' },
  vampiro: { n: 'Vampiro', draw: 'vampiro', pal: { a: '#e8dce8', b: '#1a1022', x: '#a8203a', e: '#ff2a3a' }, hp: 1, dmg: 1.1, spd: 14, h: 30, trait: 'drain' },
  zumbi:   { n: 'Zumbi', draw: 'zumbi', pal: { a: '#7fb069', b: '#5e8a4c', shirt: '#3d6ea8', pants: '#4a3b2a', hair: '#3a4a2a', e: '#ff3a3a' }, hp: 1.25, dmg: 1.1, spd: 9, h: 28 },
  fantasma: { n: 'Fantasma', draw: 'espirito', pal: { a: '#e8e4f4', b: '#a8a0c8', e: '#2a1e3a' }, hp: 0.8, dmg: 1, spd: 18, h: 36, fly: true },
  morcegoV: { n: 'Morcego Vampiro', draw: 'morcego', pal: { a: '#5a1a2a', b: '#3a0e1a', c: '#8a2a3a', e: '#ffe04a' }, hp: 0.9, dmg: 1, spd: 22, h: 36, fly: true, trait: 'drain' },
  lobisomemAlfa: { n: 'Lobisomem Alfa', draw: 'lobisomem', pal: { a: '#3a3440', b: '#24202a', c: '#6a6078', e: '#ff3030', x: '#5a2030' }, hp: 1.3, dmg: 1.3, spd: 18, h: 38, trait: 'fast', img: 'lobisomemAlfa', imgK: 1, imgBot: 62, big: true, front: 38, h: 62 },
  conde:   { n: 'Conde Vampiro', draw: 'condeG', big: true, front: 22, pal: { a: '#f0e4f0', b: '#140a1a', x: '#c8203a', e: '#ff2a3a', count: true }, hp: 1.2, dmg: 1.1, spd: 10, h: 68, trait: 'drain', variant: { imgFilter: 'sepia(.6) hue-rotate(-35deg) saturate(3) brightness(.85)', n: 'Conde de Sangue', pal: { a: '#f0e4f0', b: '#5a0a14', x: '#1a0a1a', e: '#ffe04a', count: true } }, img: 'conde', imgK: 2, imgBot: 62, big: true, front: 49, h: 122 },
  // Inferno
  diabrete: { n: 'Diabrete', draw: 'diabrete', pal: { a: '#d0402e', b: '#8a1e14', c: '#f07a5a' }, hp: 0.8, dmg: 1.1, spd: 22, h: 40, fly: true },
  caoInfernal: { n: 'Cão Infernal', draw: 'lobo', pal: { a: '#3a1a14', b: '#22100c', c: '#7a2a1a', e: '#ffb020', fire: true }, hp: 1.1, dmg: 1.3, spd: 26, h: 19, trait: 'fire' },
  demonio: { n: 'Demônio', draw: 'demonio', pal: { a: '#a82a2a', b: '#5a1414', c: '#d05040' }, hp: 1.5, dmg: 1.3, spd: 9, h: 44 },
  esqFogo: { n: 'Esqueleto Flamejante', draw: 'esqueleto', pal: { a: '#3a2a2a', b: '#1e1414', e: '#ffd04a', fire: true, blade: '#ff8a2a' }, hp: 1.1, dmg: 1.3, spd: 13, h: 33, trait: 'fire' },
  senhorChamas: { n: 'Senhor das Chamas', draw: 'elemental', pal: { a: '#e8601a', b: '#8a1e0a', c: '#ffb030' }, hp: 1.3, dmg: 1.4, spd: 10, h: 44, fly: true, trait: 'fire', img: 'senhorChamas', imgK: 1, imgBot: 61, big: true, front: 36, h: 62 },
  // Versão 4: Céu, Templo Antigo e Golem de Fogo (desenhos do Jean)
  passaroT: { n: 'Pássaro da Tempestade', draw: 'abutre', pal: { a: '#3a5a9a', b: '#24386a' }, hp: 0.9, dmg: 1.15, spd: 20, h: 38, fly: true },
  slimeNuvem: { n: 'Slime de Nuvem', draw: 'slime', pal: SL('#e8f0ff', '#ffffff', '#a8b8d8'), hp: 1, dmg: 1, spd: 14, h: 12 },
  espiritoVento: { n: 'Espírito do Vento', draw: 'espirito', pal: { a: '#c8f0d8', b: '#7ac0a0', e: '#1a3a2a' }, hp: 0.9, dmg: 1.1, spd: 20, h: 36, fly: true, trait: 'fast' },
  querubim: { n: 'Querubim Sombrio', draw: 'diabrete', pal: { a: '#e8c060', b: '#9a7a2a', c: '#fff0a0' }, hp: 0.9, dmg: 1.2, spd: 22, h: 40, fly: true },
  esqTemplo: { n: 'Esqueleto Guardião', draw: 'esqueleto', pal: { a: '#e8c070', b: '#a8802a', e: '#58d4ff' }, hp: 1.2, dmg: 1.2, spd: 12, h: 31 },
  mumiaAntiga: { n: 'Múmia Antiga', draw: 'mumia', pal: { a: '#b8a888', b: '#7a6a50', c: '#d8c8a8' }, hp: 1.6, dmg: 1.1, spd: 8, h: 28 },
  escaravelho: { n: 'Escaravelho Gigante', draw: 'centopeia', pal: { a: '#2a6a6a', b: '#1a4a4a', c: '#5aa8a8', e: '#ffe04a', x: '#0a2a2a' }, hp: 1.2, dmg: 1.2, spd: 18, h: 11 },
  cobraTemplo: { n: 'Cobra do Templo', draw: 'verme', pal: { a: '#6a8a3a', b: '#4a6a2a', c: '#c8b050', dirt: '#6a7a5a' }, hp: 1.3, dmg: 1.3, spd: 16, h: 30, burrow: true },
  harpia: { n: 'Harpia Rainha', draw: 'golem', pal: { a: '#888888', dirt: '#6a5a4a' }, hp: 1.2, dmg: 1.2, spd: 16, fly: true, img: 'harpia', imgK: 1, imgBot: 59, big: true, front: 40, h: 55 },
  grifo: { n: 'Grifo', draw: 'golem', pal: { a: '#888888', dirt: '#6a5a4a' }, hp: 1.3, dmg: 1.2, spd: 12, variant: { imgFilter: 'grayscale(1) brightness(.45) contrast(1.4)', n: 'Grifo da Tempestade', pal: {} }, img: 'grifo', imgK: 2, imgBot: 62, big: true, front: 65, h: 124 },
  guardiao: { n: 'Guardião de Pedra', draw: 'golem', pal: { a: '#888888', dirt: '#6a5a4a' }, hp: 1.6, dmg: 1.1, spd: 8, img: 'guardiao', imgK: 1, imgBot: 58, big: true, front: 35, h: 58 },
  golemCorrompido: { n: 'Golem Corrompido', draw: 'golem', pal: { a: '#888888', dirt: '#6a5a4a' }, hp: 1.5, dmg: 1.3, spd: 7, variant: { imgFilter: 'hue-rotate(250deg) saturate(1.5)', n: 'Golem do Abismo', pal: {} }, img: 'golemCorrompido', imgK: 2, imgBot: 60, big: true, front: 78, h: 112 },
  golemFogo: { n: 'Golem de Fogo', draw: 'golem', pal: { a: '#888888', dirt: '#6a5a4a' }, hp: 1.4, dmg: 1.4, spd: 9, trait: 'fire', img: 'golemFogo', imgK: 1, imgBot: 58, big: true, front: 40, h: 57, anim: { idle: [0, 1, 2, 3, 4, 3, 2, 1], attack: [5, 6, 7, 8] } },
  // Eventos
  abobora: { n: 'Abóbora Assombrada', draw: 'abobora', pal: { a: '#e87a1a', b: '#a84a0a', c: '#ffb04a' }, hp: 1, dmg: 1, spd: 18, h: 20, event: 'halloween', img: 'abobora', imgK: 0.6, imgBot: 54, big: true, front: 21, h: 30, anim: { idle: [0, 1, 2, 3, 2, 1], attack: [4, 5, 6, 7] } },
  bonecoNeve: { n: 'Boneco de Neve Gigante', draw: 'bonecoNeve', pal: {}, hp: 1.3, dmg: 1.2, spd: 9, h: 50, event: 'natal', img: 'bonecoNeve', imgK: 1, imgBot: 61, big: true, front: 38, h: 62, anim: { idle: [0, 1, 2, 3, 4, 3, 2, 1] } },
  dragao:  { n: 'Dragão Ancestral', draw: 'dragaoG', big: true, front: 50, pal: { a: '#a8282a', b: '#5a1018', c: '#f0a050', e: '#ffe04a', x: '#2a0a0a' }, hp: 1.3, dmg: 1.3, spd: 10, h: 112, fly: true, trait: 'fire', variant: { imgFilter: 'saturate(.35) brightness(.72) contrast(1.35)', n: 'Dragão Negro', pal: { a: '#2e2a34', m: '#6a1420', bone: '#d8c8b0', c: '#8a2a2a', e: '#ff3020', x: '#c02020' } }, img: 'dragao', imgK: 2, imgBot: 60, big: true, front: 71, h: 116 }
};

// Biomas: 10 fases cada. mini = fase 5, boss = fase 10. Depois da fase 90 vem o Modo Pesadelo.
export const BIOMES = [
  { id: 'floresta', n: 'Floresta', mons: ['slime', 'lobo', 'goblin', 'aranha', 'coelho'], mini: 'chefeGoblin', boss: 'slimeRei', mech: 'split' },
  { id: 'deserto', n: 'Deserto', mons: ['escorpiao', 'mumia', 'abutre', 'centDeserto', 'verme'], mini: 'escRei', boss: 'farao', mech: 'summon', summon: 'mumia' },
  { id: 'neve', n: 'Neve', mons: ['loboGelo', 'esqGelo', 'golem', 'espirito'], mini: 'yeti', boss: 'rainhaGelo', mech: 'freeze' },
  { id: 'caverna', n: 'Caverna', mons: ['esqueleto', 'arqueiro', 'aranhaG', 'centPedra', 'goblinM', 'morcego'], mini: 'rainhaAranha', boss: 'reiOssos', mech: 'summon', summon: 'esqueleto' },
  { id: 'pantano', n: 'Pântano', mons: ['zumbiP', 'sapo', 'planta', 'bruxa'], mini: 'hidra', boss: 'serpente', mech: 'dig' },
  { id: 'castelo', n: 'Castelo Sombrio', mons: ['lobisomem', 'vampiro', 'zumbi', 'fantasma', 'morcegoV'], mini: 'lobisomemAlfa', boss: 'conde', mech: 'summon', summon: 'morcegoV' },
  { id: 'inferno', n: 'Inferno', mons: ['diabrete', 'caoInfernal', 'demonio', 'esqFogo'], mini: 'senhorChamas', mini2: 'golemFogo', boss: 'dragao', mech: 'dragon' },
  { id: 'ceu', n: 'Céu', mons: ['passaroT', 'slimeNuvem', 'espiritoVento', 'querubim'], mini: 'harpia', boss: 'grifo', mech: 'summon', summon: 'passaroT' },
  { id: 'templo', n: 'Templo Antigo', mons: ['esqTemplo', 'mumiaAntiga', 'escaravelho', 'cobraTemplo'], mini: 'guardiao', boss: 'golemCorrompido', mech: 'quake' }
];

// Conquistas. reward: { title } e/ou { relic }
export const ACHIEVEMENTS = [
  { id: 't1',    n: 'Primeiro Passo',      d: 'Conclua sua primeira missão',            title: 'Aprendiz' },
  { id: 't25',   n: 'Disciplina de Ferro', d: 'Conclua 25 missões',                     title: 'Disciplinado' },
  { id: 't100',  n: 'Lenda da Rotina',     d: 'Conclua 100 missões',                    title: 'Lenda da Rotina' },
  { id: 'cedo5', n: 'Madrugador',          d: 'Conclua 5 missões antes das 7h',         title: 'O Madrugador', gear: 'capaMad' },
  { id: 'perf',  n: 'Dia Perfeito',        d: 'Cumpra todas as missões de um dia' },
  { id: 'str3',  n: 'Em Chamas',           d: '3 dias perfeitos seguidos',              title: 'Chama Acesa' },
  { id: 'str7',  n: 'Hábito Forjado',      d: '7 dias perfeitos seguidos',              title: 'Mestre da Disciplina', gear: 'espDisc' },
  { id: 'pont20',n: 'Pontual',             d: 'Conclua 20 missões no horário',          title: 'Pontual' },
  { id: 'k50',   n: 'Caçador',             d: 'Derrote 50 monstros' },
  { id: 'k500',  n: 'Exterminador',        d: 'Derrote 500 monstros',                   title: 'Exterminador', relic: 'cacador', gear: 'escCac' },
  { id: 'mini',  n: 'Quebra-Ossos',        d: 'Derrote um mini-chefão' },
  { id: 'boss1', n: 'Rei Caído',           d: 'Derrote o Slime Colossal',               title: 'Matador de Slimes' },
  { id: 'boss2', n: 'Tumba Selada',        d: 'Derrote o Faraó Esquecido',              title: 'Caçador de Faraós' , gear: 'elmoFarao' },
  { id: 'boss3', n: 'Degelo',              d: 'Derrote a Rainha do Gelo',               title: 'Coração Quente', boss: 'Rainha do Gelo' , gear: 'coroaGelo' },
  { id: 'boss4', n: 'Ossos ao Pó',         d: 'Derrote o Rei dos Ossos',                title: 'Quebra-Coroas', boss: 'Rei dos Ossos' , gear: 'laminaOsso' },
  { id: 'boss5', n: 'Domador de Serpentes', d: 'Derrote a Serpente Gigante',            title: 'Domador de Serpentes', boss: 'Serpente Gigante' },
  { id: 'boss6', n: 'Amanhecer',           d: 'Derrote o Conde Vampiro',                title: 'Caçador da Noite', boss: 'Conde Vampiro' , gear: 'capaConde' },
  { id: 'boss7', n: 'Matador de Dragões',  d: 'Derrote o Dragão Ancestral',             title: 'Matador de Dragões', boss: 'Dragão Ancestral' , gear: 'escamas' },
  { id: 'st20',  n: 'Desbravador',         d: 'Chegue à fase 20',                       title: 'Desbravador', relic: 'desbravador' },
  { id: 'st71',  n: 'Pesadelo',            d: 'Chegue ao Modo Pesadelo (fase 91)',      title: 'Lenda Viva' },
  { id: 'lv5',   n: 'Aventureiro',         d: 'Alcance o nível 5' },
  { id: 'lv10',  n: 'Herói',               d: 'Alcance o nível 10',                     title: 'Herói' },
  { id: 'forja', n: 'Na Bigorna',          d: 'Forje um equipamento' },
  { id: 'andar', n: 'Andarilho',           d: 'Conclua 30 missões de Exercício',        title: 'Andarilho', gear: 'botasAnd' },
  { id: 'p100',  n: 'Lenda Viva',          d: 'Cumpra 100 dias perfeitos',              title: 'A Lenda', gear: 'armLenda' },
  { id: 'elite', n: 'Caçador de Elite',    d: 'Derrote 25 monstros de elite',           title: 'Caçador de Elite' },
  { id: 'rest',  n: 'Ao Pé da Fogueira',   d: 'Tire um dia de descanso planejado' }
];

// Pets companheiros. ability: bite (morde) · fire (fogo) · crit (+crítico) · heal (cura) · absorb (absorve dano) · leech (rouba vida)
export const PETS = {
  lobinho:     { n: 'Lobinho',            how: '3 dias perfeitos seguidos',         ability: 'bite',   d: 'Morde os monstros junto com o herói', fly: false },
  coruja:      { n: 'Coruja',             how: '20 missões de Estudo',              ability: 'crit',   d: 'Aumenta a chance de crítico',          fly: true },
  gatinho:     { n: 'Gatinho',            how: '7 vezes Dormir/Sono no horário',    ability: 'heal',   d: 'Cura o herói aos poucos',              fly: false },
  slimePet:    { n: 'Slime de Estimação', how: 'Derrotar o Slime Colossal',         ability: 'absorb', d: 'Absorve parte do dano recebido',       fly: false },
  morceguinho: { n: 'Morceguinho',        how: 'Derrotar o Conde Vampiro',          ability: 'leech',  d: 'O herói rouba vida a cada golpe',      fly: true },
  dragaozinho: { n: 'Dragãozinho',        how: 'Derrotar o Dragão Ancestral',       ability: 'fire',   d: 'Cospe fogo nos monstros',              fly: true }
};
export const PET_STAGES = [{ n: 'Filhote', from: 0, k: 1 }, { n: 'Jovem', from: 7, k: 1.5 }, { n: 'Adulto', from: 30, k: 2 }];
