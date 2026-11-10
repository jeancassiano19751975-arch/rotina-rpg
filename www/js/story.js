// História em capítulos: cenas animadas em pixel art dentro do jogo (não é vídeo).
// Cada capítulo libera ao derrotar um chefão pela primeira vez e fica no Livro de Histórias (Biblioteca).
import { S, save } from './state.js';
import { drawStoryFrame } from './game.js';
import { SFX } from './audio.js';
import { MONSTERS } from './data.js';

const N = () => S.hero.name || (S.hero.sex === 'f' ? 'Heroína' : 'Herói');
const O = () => (S.hero.sex === 'f' ? 'a' : 'o');   // "o herói" / "a heroína"

// Falas: who = narrador | mestre | heroi | boss | nevoa
export const CHAPTERS = [
  { id: 'prologo', n: 'Prólogo: A Névoa da Preguiça', bg: 'floresta', nevoa: true, lines: () => [
    ['narrador', 'O Reino de Rotina dormia. Uma névoa roxa, a Névoa da Preguiça, se espalhava a cada dia esquecido.'],
    ['narrador', 'Dela nasciam monstros. E quanto mais dias perdidos, mais fortes eles ficavam.'],
    ['mestre', N() + '! Finalmente você chegou. Eu sou o Mestre, guardião desta vila.'],
    ['mestre', 'A névoa tem medo de uma coisa só: de quem cumpre o que promete. Cada missão sua acende a sua força.'],
    ['heroi', 'Então é isso. Cada dia cumprido é um golpe na névoa.'],
    ['mestre', 'Sete guardiões foram corrompidos. Liberte-os e descubra quem está por trás disso. Vá!']
  ] },
  { id: 'slimeRei', n: 'Capítulo 1: O Coração da Floresta', bg: 'floresta', boss: 'slimeRei', lines: () => [
    ['narrador', 'O Slime Colossal se desfez em gotas de luz. A floresta respirou de novo.'],
    ['mestre', 'Ele não era mau. Só tinha engolido névoa demais.'],
    ['heroi', 'Se a névoa corrompe até um slime... de onde ela vem?'],
    ['mestre', 'Os sábios do deserto guardavam essa resposta. Siga para as areias.']
  ] },
  { id: 'farao', n: 'Capítulo 2: A Inscrição do Faraó', bg: 'deserto', boss: 'farao', lines: () => [
    ['boss', 'Mil anos... de sono... a névoa me acordou com raiva.'],
    ['narrador', 'Ao cair, o Faraó apontou para uma parede da pirâmide.'],
    ['narrador', '"Quando os dias forem esquecidos, o Senhor da Névoa roubará o Coração do Tempo."'],
    ['heroi', 'Senhor da Névoa... então existe alguém por trás de tudo.'],
    ['mestre', 'E ele está com pressa. O frio já tomou as montanhas.']
  ] },
  { id: 'rainhaGelo', n: 'Capítulo 3: O Inverno Sem Fim', bg: 'neve', boss: 'rainhaGelo', lines: () => [
    ['boss', 'Eu só queria que os dias parassem... que nada mais mudasse...'],
    ['heroi', 'Parar não é descansar. Descanso faz parte do caminho.'],
    ['boss', 'Ele me prometeu paz. A névoa... era mentira.'],
    ['narrador', 'O gelo derreteu, e um túnel escuro apareceu sob a montanha.']
  ] },
  { id: 'reiOssos', n: 'Capítulo 4: O Mapa dos Ossos', bg: 'caverna', boss: 'reiOssos', lines: () => [
    ['boss', 'Meu exército nunca dormia... nunca parava... e mesmo assim perdemos.'],
    ['heroi', 'Fazer tudo de uma vez cansa. É um passo por dia.'],
    ['narrador', 'Na coroa do Rei havia um mapa: a névoa saía de um castelo, além do pântano.'],
    ['mestre', 'O pântano engole os desatentos. Cuidado.']
  ] },
  { id: 'serpente', n: 'Capítulo 5: A Sombra no Pântano', bg: 'pantano', boss: 'serpente', nevoa: true, lines: () => [
    ['narrador', 'A Serpente afundou na lama. Então a névoa se juntou numa forma escura.'],
    ['nevoa', 'Que esforço bonito. Mas amanhã você vai cansar. Todos cansam.'],
    ['heroi', 'Talvez eu canse. Mas eu volto. Sempre volto.'],
    ['nevoa', 'Veremos... no castelo.'],
    ['narrador', 'E a sombra sumiu, rindo.']
  ] },
  { id: 'conde', n: 'Capítulo 6: O Servo do Castelo', bg: 'castelo', boss: 'conde', lines: () => [
    ['boss', 'Eu só servia... ele me deu noites sem fim em troca de obediência.'],
    ['boss', 'Ele foi para o fogo. Acorrentou o último dragão para queimar o caminho até o céu.'],
    ['heroi', 'Então o dragão também é prisioneiro.'],
    ['mestre', 'Liberte-o, ' + N() + '. Um dragão livre é um aliado.']
  ] },
  { id: 'dragao', n: 'Capítulo 7: O Dragão Liberto', bg: 'inferno', boss: 'dragao', lines: () => [
    ['narrador', 'As correntes quebraram. Os olhos do Dragão Ancestral voltaram a ser dourados.'],
    ['boss', 'Obrigado, pequeno guerreiro. A névoa fugiu para as nuvens, para longe do seu alcance.'],
    ['heroi', 'Nada está longe do meu alcance se eu for todo dia um pouco.'],
    ['narrador', 'O dragão soprou uma ponte de nuvens até o céu.']
  ] },
  { id: 'grifo', n: 'Capítulo 8: Acima das Nuvens', bg: 'ceu', boss: 'grifo', lines: () => [
    ['boss', 'Eu guardava o caminho do Templo... e a névoa me fez esquecer por quê.'],
    ['heroi', 'Agora você lembra?'],
    ['boss', 'Lembro. O Coração do Tempo está no Templo Antigo. Corra, antes que ele o quebre.'],
    ['mestre', 'Esta é a última porta, ' + N() + '.']
  ] },
  { id: 'golemCorrompido', n: 'Capítulo 9: O Coração do Tempo', bg: 'templo', boss: 'golemCorrompido', nevoa: true, lines: () => [
    ['narrador', 'O Golem caiu, e atrás dele brilhava o Coração do Tempo: cada batida, um dia vivido.'],
    ['nevoa', 'Você venceu os guardiões... mas eu sou feito dos dias que você esquecer.'],
    ['nevoa', 'Cada vez que você desistir, eu volto. Mais escuro. Mais forte.'],
    ['heroi', 'Então eu não vou desistir.'],
    ['narrador', 'A névoa explodiu e cobriu o reino de novo. Começava o Modo Pesadelo.']
  ] },
  { id: 'pesadelo', n: 'Capítulo 10: O Pesadelo', bg: 'floresta', nevoa: true, lines: () => [
    ['narrador', 'No Pesadelo, os lugares conhecidos mudaram de cor, e os guardiões voltaram mais fortes.'],
    ['mestre', 'Não é o mesmo caminho, ' + N() + '. É o mesmo caminho... mais difícil. Como a vida.'],
    ['heroi', 'Eu já sei como se vence: um dia de cada vez.']
  ] },
  { id: 'final', n: 'Final: O Senhor da Névoa', bg: 'templo', boss: 'golemCorrompido', nevoa: true, lines: () => [
    ['nevoa', 'Impossível... você não parou. Nem nos dias difíceis.'],
    ['heroi', 'Nos dias difíceis eu fiz o essencial. Isso também conta.'],
    ['narrador', 'A Névoa da Preguiça se desfez no ar. O Coração do Tempo voltou a bater forte.'],
    ['mestre', 'Você salvou o reino. Mas a névoa sempre tenta voltar... por isso o caminho continua.'],
    ['narrador', 'FIM DA PRIMEIRA JORNADA. Obrigado por jogar, ' + N() + '.']
  ] },
  { id: 'renascer', n: 'Extra: O Renascimento', bg: 'floresta', lines: () => [
    ['mestre', 'Você escolheu recomeçar. Não do zero: com tudo o que aprendeu.'],
    ['heroi', 'Mais forte desta vez.'],
    ['narrador', 'Uma aura nova envolveu ' + O() + ' ' + (S.hero.sex === 'f' ? 'heroína' : 'herói') + '. A jornada começou de novo.']
  ] }
];
export const chapter = id => CHAPTERS.find(c => c.id === id);
export const unlocked = id => !!(S.story && S.story[id]);
export function unlock(id) {
  S.story = S.story || {};
  if (S.story[id] || !chapter(id)) return false;
  S.story[id] = Date.now(); S.storyQueue = (S.storyQueue || []).concat(id); save(); return true;
}
// Saves antigos: libera os capítulos dos chefões que já foram derrotados (sem assistir de uma vez).
export function syncStory() {
  S.story = S.story || {};
  const before = Object.keys(S.story).length;
  if (S.onboarded && !S.story.prologo) { S.story.prologo = Date.now(); S.storyQueue = ['prologo']; }
  const BN = { slimeRei: 'Slime Colossal', farao: 'Faraó Esquecido', rainhaGelo: 'Rainha do Gelo', reiOssos: 'Rei dos Ossos', serpente: 'Serpente Gigante', conde: 'Conde Vampiro', dragao: 'Dragão Ancestral', grifo: 'Grifo', golemCorrompido: 'Golem Corrompido' };
  for (const [id, n] of Object.entries(BN)) if (S.bosses && S.bosses[n] && !S.story[id]) S.story[id] = Date.now();
  if (Object.keys(S.story).length !== before) save();
}

// ---------- tocar uma cena ----------
let playing = false;
export const isPlaying = () => playing;
export function playChapter(id) {
  const ch = chapter(id); if (!ch || playing) return Promise.resolve();
  playing = true;
  const lines = ch.lines();
  return new Promise(done => {
    const ov = document.createElement('div'); ov.className = 'story';
    ov.innerHTML = '<div class="st-wrap"><canvas width="640" height="300"></canvas><div class="st-title"></div><div class="st-box"><b class="st-who"></b><p class="st-txt"></p><span class="st-next">toque para continuar ▸</span></div>' +
      '<button type="button" class="btn sm st-skip">Pular</button></div>';
    document.body.appendChild(ov);
    const cv = ov.querySelector('canvas'), who = ov.querySelector('.st-who'), txt = ov.querySelector('.st-txt'), title = ov.querySelector('.st-title');
    title.textContent = ch.n;
    let i = -1, shown = 0, full = '', t0 = performance.now(), raf = 0, finished = false;
    const NAMES = { narrador: '', mestre: 'Mestre', heroi: () => N(), boss: () => ch.boss && MONSTERS[ch.boss] ? MONSTERS[ch.boss].n : 'Chefão', nevoa: 'Senhor da Névoa' };
    const next = () => {
      if (i >= 0 && shown < full.length) { shown = full.length; txt.textContent = full; return; }
      i++;
      if (i >= lines.length) return end();
      const [w, l] = lines[i]; full = l; shown = 0;
      const nm = typeof NAMES[w] === 'function' ? NAMES[w]() : NAMES[w];
      who.textContent = nm || ''; who.hidden = !nm; txt.classList.toggle('narr', w === 'narrador');
      txt.textContent = ''; SFX.warn();
    };
    const end = () => {
      if (finished) return; finished = true;
      cancelAnimationFrame(raf); ov.classList.add('out');
      setTimeout(() => { ov.remove(); playing = false; done(); }, 350);
    };
    const loop = now => {
      const t = (now - t0) / 1000;
      if (shown < full.length) { shown = Math.min(full.length, shown + 1.2); txt.textContent = full.slice(0, Math.floor(shown)); }
      const speaker = i >= 0 && i < lines.length ? lines[i][0] : '';
      try { drawStoryFrame(cv, { bg: ch.bg, boss: ch.boss, nevoa: ch.nevoa || speaker === 'nevoa', speaker, defeated: !!ch.boss && ch.id !== 'final' && ch.id !== 'prologo' }, t); } catch (e) { console.warn('cena', e); }
      raf = requestAnimationFrame(loop);
    };
    ov.querySelector('.st-skip').onclick = e => { e.stopPropagation(); end(); };
    ov.onclick = next;
    raf = requestAnimationFrame(loop);
    setTimeout(next, 700);
  });
}
// Mostra os capítulos que ficaram na fila (um de cada vez).
export async function playQueued() {
  if (playing || document.hidden) return;
  const q = S.storyQueue || []; if (!q.length) return;
  const id = q.shift(); S.storyQueue = q; save();
  await playChapter(id);
  if ((S.storyQueue || []).length) setTimeout(playQueued, 600);
}
