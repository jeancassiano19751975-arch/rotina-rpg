// Frases motivacionais com a voz do jogo.
import { S } from './state.js';

const P = {
  missao: [
    'O dia não se conquista sozinho. Sua missão começa agora.',
    'Os monstros estão esperando. Bora?',
    'Pequenas vitórias fazem grandes heróis.',
    'Seu eu do futuro agradece esta missão.',
    'A espada não se afia sozinha.',
    'Uma missão de cada vez, guerreiro.',
    'Hora de mostrar do que você é feito.'
  ],
  feito: [
    'Missão cumprida! Sua espada ficou mais afiada.',
    'Mais um passo na jornada, guerreiro.',
    'Disciplina é o seu superpoder.',
    'Feito é melhor que perfeito.',
    'Os monstros sentiram essa.',
    'Isso! Mais forte que ontem.',
    'A lenda cresce a cada missão.'
  ],
  atraso: [
    'Antes tarde do que nunca. O herói não desiste.',
    'Atrasou, mas não fugiu da batalha.',
    'Amanhã a gente pega no horário. Hoje, valeu por não desistir.',
    'Chegou cansado, mas chegou. Isso conta.'
  ],
  nivel: [
    'Você está ficando mais forte, dentro e fora do jogo.',
    'Novo nível, novo você.',
    'Os monstros já ouviram falar de você.',
    'Cada nível é uma prova do que você fez de verdade.'
  ],
  sequencia: [
    'A chama está acesa. Não deixe apagar.',
    'Isso já não é sorte, é hábito.',
    'Lendas são feitas assim, um dia de cada vez.'
  ],
  queda: [
    'Todo herói cai. O que importa é levantar.',
    'Um dia ruim não apaga sua jornada.',
    'Respira. Amanhã é uma nova fase.',
    'A derrota de hoje é o treino de amanhã.'
  ],
  manha: [
    'Bom dia, guerreiro! Que batalhas vamos vencer hoje?',
    'O sol nasceu e o seu herói está pronto.',
    'Novo dia, novas missões. Vamos com tudo.',
    'Café, coragem e missão cumprida.'
  ],
  manhaDificil: [
    'Semana pesada? Hoje dá pra recomeçar, uma missão por vez.',
    'Sem pressão: comece pela missão mais fácil.',
    'O herói te espera. Nem que seja um passo hoje.'
  ],
  noite: [
    'Dia perfeito! Descanse, você mereceu.',
    'Missões cumpridas. A vila dorme em paz graças a você.'
  ],
  noiteParcial: [
    'Hoje não foi 100%, mas você apareceu. Isso conta.',
    'Descansa. Amanhã o herói volta com tudo.'
  ],
  descanso: [
    'Hoje é dia de descanso. Seu herói está recuperando as forças.',
    'Até heróis precisam de uma fogueira e uma boa noite de sono.',
    'Descansar também faz parte da jornada.'
  ]
};

const last = {};
export function phrase(moment) {
  if (!S.phrasesOn) return '';
  let list = P[moment] || P.feito;
  if (['missao', 'manha', 'feito'].includes(moment) && S.customPhrases.length) list = list.concat(S.customPhrases);
  if (list.length === 1) return list[0];
  let p;
  do { p = list[Math.floor(Math.random() * list.length)]; } while (p === last[moment]);
  last[moment] = p;
  return p;
}
