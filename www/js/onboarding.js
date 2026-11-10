// Primeira abertura: criar o herói, Conselho do Mestre (perguntas sobre a rotina) e permissões.
import { S, save } from './state.js';
import { SKINS, HAIRS, CLOTHES, CATS, WEEKDAYS } from './data.js';
import { drawPreview } from './game.js';
import { isNative, askNotifications, checkExact, openExactSettings, askLocation } from './notify.js';
import { GOALS, DELAYS, TRAIN, FREE, defaultProfile, buildRoutine } from './mentor.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const browserNote = '<p class="hint">Você está no navegador: aqui isso fica desligado. No app Android esta tela pede a permissão de verdade.</p>';
const chips = (key, opts, val) => '<div class="seg-wrap" data-q="' + key + '">' +
  opts.map(o => '<button type="button" class="pick" data-v="' + o.id + '" aria-pressed="' + (String(o.id) === String(val)) + '">' + o.n + '</button>').join('') + '</div>';

// ---------- passos do Mestre (reutilizados em Ajustes) ----------
function mentorSteps(prof, routine, shell) {
  return [
    {
      html: () => shell('<span class="ob-icon">🧙</span><h1>O Conselho do Mestre</h1><p>"Antes de partir, jovem herói, me conte como são seus dias. Assim preparo as missões que mais valem para você."</p>' +
        '<div class="card box"><div class="form-row"><div class="field"><label for="q-wake">Que horas você acorda?</label><input type="time" id="q-wake" value="' + prof.wake + '"></div>' +
        '<div class="field"><label for="q-sleep">E que horas dorme?</label><input type="time" id="q-sleep" value="' + prof.sleep + '"></div></div>' +
        '<span class="lbl">Quanto tempo livre você tem por dia?</span>' + chips('free', FREE, prof.free) + '</div>' +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-next">Continuar</button></div>'),
      bind: () => {
        $('q-wake').onchange = e => { prof.wake = e.target.value || prof.wake; };
        $('q-sleep').onchange = e => { prof.sleep = e.target.value || prof.sleep; };
      }
    },
    {
      html: () => shell('<span class="ob-icon">🧙</span><h1>Sua jornada</h1>' +
        '<div class="card box"><span class="lbl">Qual é sua maior missão de vida agora?</span>' + chips('goal', GOALS, prof.goal) +
        '<span class="lbl">O que você mais adia?</span>' + chips('delay', DELAYS, prof.delay) +
        '<span class="lbl">Quantas vezes por semana você treina hoje?</span>' + chips('train', TRAIN, prof.train) + '</div>' +
        '<p class="hint">O que você mais adia e o seu objetivo viram <b>missões de foco ⭐</b>: elas ficam com uma fatia maior do XP do dia.</p>' +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-next">Ver minhas missões</button></div>')
    },
    {
      html: () => {
        routine.list = buildRoutine(prof);
        const rows = routine.list.map(t => '<div class="r-row"><span class="t-time">' + t.time + '</span><div class="t-main"><span class="t-name">' + (t.focus ? '⭐ ' : '') + esc(t.name) + '</span>' +
          '<span class="t-sub"><span class="chip">' + CATS[t.cat].n + '</span><span class="chip">' + t.dur + ' min</span><span class="days">' + WEEKDAYS.map((d, i) => '<i class="' + (t.days.includes(i) ? 'on' : '') + '">' + d + '</i>').join('') + '</span></span></div><span></span></div>').join('');
        return shell('<span class="ob-icon">📜</span><h1>Suas missões</h1><p>"Comece no seu ritmo. Quando ficar fácil, a gente aumenta o desafio."</p>' +
          '<div class="list" style="display:grid;gap:6px">' + rows + '</div>' +
          '<p class="hint">Você pode editar, apagar e criar missões depois, na aba Rotina.</p>' +
          '<div class="ob-acts"><button class="btn gold-btn" id="ob-use">Aceitar estas missões</button><button class="btn" id="ob-zero">Prefiro montar do zero</button></div>');
      },
      bind: next => {
        $('ob-use').onclick = () => { S.tasks = routine.list; S.sample = false; S.profile = { ...prof }; save(); next(); };
        $('ob-zero').onclick = () => { S.tasks = []; S.sample = false; S.profile = { ...prof }; save(); next(); };
      }
    }
  ];
}
function bindChips(root, prof) {
  root.querySelectorAll('[data-q]').forEach(g => g.querySelectorAll('.pick').forEach(b => b.onclick = () => {
    const k = g.dataset.q, v = b.dataset.v;
    prof[k] = typeof defaultProfile()[k] === 'number' ? Number(v) : v;
    g.querySelectorAll('.pick').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
}

// Refazer só as perguntas do Mestre (Ajustes)
export function runMentor() {
  return new Promise(resolve => {
    const root = $('onboard'); root.hidden = false;
    const prof = { ...defaultProfile(), ...(S.profile || {}) }, routine = {};
    const steps = mentorSteps(prof, routine, (inner) => '<div class="ob">' + inner + '<button class="btn" id="ob-close">Cancelar</button></div>');
    const done = () => { root.hidden = true; root.innerHTML = ''; resolve(); };
    const go = n => {
      if (n >= steps.length) return done();
      root.innerHTML = steps[n].html(); root.scrollTop = 0;
      bindChips(root, prof);
      const next = $('ob-next'); if (next) next.onclick = () => go(n + 1);
      $('ob-close').onclick = done;
      steps[n].bind && steps[n].bind(() => go(n + 1));
    };
    go(0);
  });
}

export function runOnboarding() {
  return new Promise(resolve => {
    const root = $('onboard'); root.hidden = false;
    const cfg = { ...S.hero, name: S.hero.name === 'Herói' ? '' : S.hero.name };
    const prof = defaultProfile(), routine = {};
    const TOTAL = 10;
    let cur = 0;
    const shell = inner => '<div class="ob"><span class="ob-step">Passo ' + (cur + 1) + ' de ' + TOTAL + '</span>' + inner + '</div>';

    const steps = [
      { html: () => shell('<h1>Rotina RPG</h1><p>Cumpra sua rotina na vida real e seu herói fica mais forte no jogo. Ele luta sozinho contra monstros, sobe de nível e ganha armas novas a cada conquista sua.</p>' +
        '<div class="card box"><p>⚔️ Missões dão XP e deixam o herói em Fúria</p><p>🛡️ Subiu de nível, cai um baú com equipamento novo</p><p>🔥 Dias de descanso não quebram sua sequência</p></div>' +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-next">Começar</button></div>') },

      { html: () => shell('<h1>Crie seu herói</h1><div class="card box">' +
        '<div class="preview"><canvas id="ob-prev" width="160" height="176"></canvas></div>' +
        '<div class="field"><label for="ob-name">Nome do herói</label><input id="ob-name" maxlength="20" placeholder="Ex.: Jean" value="' + esc(cfg.name) + '"></div>' +
        '<span class="lbl">Pele</span><div class="swatches" data-k="skin">' + SKINS.map((c, i) => '<button type="button" style="background:' + c + '" data-i="' + i + '" aria-pressed="' + (cfg.skin === i) + '" aria-label="Pele ' + (i + 1) + '"></button>').join('') + '</div>' +
        '<span class="lbl">Cabelo</span><div class="swatches" data-k="hair">' + HAIRS.map((c, i) => '<button type="button" style="background:' + c + '" data-i="' + i + '" aria-pressed="' + (cfg.hair === i) + '" aria-label="Cabelo ' + (i + 1) + '"></button>').join('') + '</div>' +
        '<span class="lbl">Roupa</span><div class="swatches" data-k="cloth">' + CLOTHES.map((c, i) => '<button type="button" style="background:' + c + '" data-i="' + i + '" aria-pressed="' + (cfg.cloth === i) + '" aria-label="Roupa ' + (i + 1) + '"></button>').join('') + '</div>' +
        '</div><div class="ob-acts"><button class="btn gold-btn" id="ob-next">Continuar</button></div>'),
        bind: () => {
          const draw = () => drawPreview($('ob-prev'), cfg); draw();
          root.querySelectorAll('.swatches').forEach(g => g.querySelectorAll('button').forEach(b => b.onclick = () => {
            cfg[g.dataset.k] = Number(b.dataset.i); g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw();
          }));
          $('ob-name').oninput = e => { cfg.name = e.target.value; };
        } },

      ...mentorSteps(prof, routine, shell),

      { html: () => shell('<span class="ob-icon">🔔</span><h1>Chamados das missões</h1><p>No horário de cada missão chega uma notificação com o som do jogo e os botões Feito e Adiar 10 min.</p>' +
        (isNative ? '' : browserNote) +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-act">Permitir notificações</button><button class="btn" id="ob-next">Agora não</button></div>'),
        bind: next => { $('ob-act').onclick = async () => { await askNotifications(); next(); }; } },

      { html: () => shell('<span class="ob-icon">⏰</span><h1>Missões no horário certo</h1><p>Para o Android não atrasar os chamados, o app usa alarmes exatos. Normalmente isso já vem ligado; se não vier, ative na tela que vai abrir.</p>' +
        (isNative ? '<p class="hint" id="ob-exact">Verificando…</p>' : browserNote) +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-act">Abrir configuração</button><button class="btn" id="ob-next">Continuar</button></div>'),
        bind: async next => {
          const act = $('ob-act');
          act.onclick = async () => { await openExactSettings(); next(); };
          if (isNative) { const st = await checkExact(); const el = $('ob-exact'); if (el) el.textContent = st === 'granted' ? 'Já está ativado. ✔' : 'Está desativado: toque em Abrir configuração.'; if (st === 'granted') act.hidden = true; }
          else act.hidden = true;
        } },

      { html: () => shell('<span class="ob-icon">🔋</span><h1>Bateria sem restrição</h1><p>Alguns celulares (Xiaomi, Samsung, Motorola) fecham apps em segundo plano e as notificações somem. Para evitar:</p>' +
        '<div class="card box"><p>1. Abra as Configurações do Android</p><p>2. Apps → Rotina RPG → Bateria</p><p>3. Escolha <b>Sem restrições</b></p></div>' +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-next">Já fiz, continuar</button></div>') },

      { html: () => shell('<span class="ob-icon">🚶</span><h1>Caminhadas</h1><p>A localização serve só para contar seus km nas caminhadas e transformar em XP verificado. Depois, para contar com o celular no bolso, o Android vai pedir "Permitir o tempo todo".</p>' +
        (isNative ? '' : browserNote) +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-act">Permitir localização</button><button class="btn" id="ob-next">Agora não</button></div>'),
        bind: next => { $('ob-act').onclick = async () => { await askLocation(); next(); }; } },

      { html: () => shell('<span class="ob-icon">⚔️</span><h1>Pronto, ' + esc(cfg.name || 'herói') + '!</h1><p>Suas missões estão na aba Missões. As que têm ⭐ são de foco e valem mais.</p>' +
        '<div class="card box"><p>O dia vale até 300 XP, dividido entre as missões.</p><p>Até 30 min de atraso vale 100%; até 2 h, 75%; depois, 50%.</p><p>A missão libera 1 h antes do horário.</p></div>' +
        '<div class="ob-acts"><button class="btn gold-btn" id="ob-next">Começar a jornada</button></div>') }
    ];

    const go = n => {
      cur = n;
      if (n >= steps.length) {
        S.hero = { name: (cfg.name || '').trim() || 'Herói', skin: cfg.skin, hair: cfg.hair, cloth: cfg.cloth };
        S.onboarded = true; S.lastNight = S.day; save(); root.hidden = true; root.innerHTML = ''; resolve(); return;
      }
      root.innerHTML = steps[n].html(); root.scrollTop = 0;
      bindChips(root, prof);
      const next = $('ob-next'); if (next) next.onclick = () => { if (n === 1) cfg.name = $('ob-name').value; go(n + 1); };
      steps[n].bind && steps[n].bind(() => go(n + 1));
    };
    go(0);
  });
}
