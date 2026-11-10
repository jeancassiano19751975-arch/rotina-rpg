// Música 8-bit e efeitos sonoros, tudo gerado na hora (sem arquivos de áudio).
// Cada bioma tem a sua música; chefão, vila e dia de descanso têm músicas próprias.
import { S, save } from './state.js';

let ac = null, master = null, musicBus = null, sfxBus = null;
function ctx() {
  if (ac) return ac;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
  } catch (e) { ac = null; }
  return ac;
}
export const musicOn = () => S.musicOn !== false;
export const sfxOn = () => S.sfxOn !== false;
export function setMusic(on) { S.musicOn = on; save(); if (!on) stopMusic(); }
export function setSfx(on) { S.sfxOn = on; save(); }

// O navegador só deixa tocar som depois de um toque na tela.
let unlocked = false;
export function unlockAudio() {
  if (unlocked) return; const c = ctx(); if (!c) return;
  unlocked = true; if (c.state === 'suspended') c.resume();
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlockAudio, { once: false, passive: true }));
document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) ac.suspend(); else if (unlocked) ac.resume();
});

// ---------- notas ----------
const freq = n => 440 * Math.pow(2, (n - 69) / 12);
function note(bus, n, t, d, type, vol, slide) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq(n), t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq(n + slide), t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.setValueAtTime(vol, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.02);
}
let noiseBuf = null;
function noise(bus, t, d, vol, hp = 1000) {
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + d + 0.02);
}

// ---------- músicas ----------
const MODES = {
  maior: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10], dorico: [0, 2, 3, 5, 7, 9, 10],
  frigio: [0, 1, 3, 5, 7, 8, 10], harmonica: [0, 2, 3, 5, 7, 8, 11], lidio: [0, 2, 4, 6, 7, 9, 11]
};
const TRACKS = {
  floresta: { root: 60, mode: 'maior', bpm: 112, prog: [0, 5, 3, 4], lead: 'square', seed: 3 },
  deserto: { root: 62, mode: 'harmonica', bpm: 100, prog: [0, 1, 0, 4], lead: 'square', seed: 7 },
  neve: { root: 64, mode: 'menor', bpm: 88, prog: [0, 5, 2, 6], lead: 'triangle', seed: 11 },
  caverna: { root: 57, mode: 'menor', bpm: 84, prog: [0, 3, 5, 4], lead: 'triangle', seed: 13 },
  pantano: { root: 65, mode: 'dorico', bpm: 96, prog: [0, 3, 0, 6], lead: 'square', seed: 17 },
  castelo: { root: 62, mode: 'harmonica', bpm: 104, prog: [0, 5, 3, 4], lead: 'sawtooth', seed: 19 },
  inferno: { root: 64, mode: 'frigio', bpm: 132, prog: [0, 1, 0, 6], lead: 'sawtooth', seed: 23 },
  ceu: { root: 67, mode: 'lidio', bpm: 116, prog: [0, 1, 4, 0], lead: 'triangle', seed: 29 },
  templo: { root: 59, mode: 'harmonica', bpm: 92, prog: [0, 3, 4, 0], lead: 'triangle', seed: 31 },
  chefao: { root: 60, mode: 'harmonica', bpm: 150, prog: [0, 5, 6, 4], lead: 'sawtooth', seed: 37, boss: true },
  vila: { root: 65, mode: 'maior', bpm: 100, prog: [0, 3, 4, 0], lead: 'square', seed: 41 },
  descanso: { root: 57, mode: 'maior', bpm: 70, prog: [0, 3, 0, 4], lead: 'triangle', seed: 43, calm: true }
};
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// Melodia fixa de cada música (4 compassos de 16 passos), sorteada uma vez a partir da semente.
const MEL = {};
function melody(id) {
  if (MEL[id]) return MEL[id];
  const T = TRACKS[id], out = []; let deg = 4;
  for (let i = 0; i < 64; i++) {
    const r = rnd(T.seed * 100 + i);
    const play = i % 4 === 0 ? r < 0.85 : i % 2 === 0 ? r < (T.calm ? 0.2 : 0.5) : r < (T.boss ? 0.35 : 0.12);
    if (play) { deg += Math.round((rnd(T.seed * 300 + i) - 0.5) * 4); deg = Math.max(0, Math.min(11, deg)); out.push(deg); } else out.push(null);
  }
  return (MEL[id] = out);
}
const degNote = (T, d) => T.root + MODES[T.mode][((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);

let current = null, step = 0, nextT = 0, timer = null;
function tick() {
  if (!current || !ac || ac.state !== 'running') return;
  const T = TRACKS[current], dur = 60 / T.bpm / 4, mel = melody(current);
  while (nextT < ac.currentTime + 0.25) {
    const bar = Math.floor(step / 16) % 4, s16 = step % 16, chord = T.prog[bar];
    // baixo
    if (s16 % 4 === 0) note(musicBus, degNote(T, chord) - 24, nextT, dur * (T.calm ? 3.5 : 1.8), 'triangle', 0.09);
    // arpejo do acorde
    if (!T.calm || s16 % 4 === 0) { const a = [0, 2, 4, 2][s16 % 4]; note(musicBus, degNote(T, chord + a) - 12, nextT, dur * 0.9, 'square', T.boss ? 0.018 : 0.014); }
    // melodia
    const m = mel[(step) % 64]; if (m != null) note(musicBus, degNote(T, m), nextT, dur * (T.calm ? 3 : 1.7), T.lead, T.lead === 'sawtooth' ? 0.016 : 0.028);
    // bateria simples
    if (!T.calm) { if (s16 % 8 === 0) note(musicBus, 36, nextT, 0.12, 'sine', 0.12, -12); if (s16 % 8 === 4) noise(musicBus, nextT, 0.08, 0.035, 2000); if (T.boss && s16 % 2 === 1) noise(musicBus, nextT, 0.03, 0.015, 6000); }
    step++; nextT += dur;
  }
}
export function playTrack(id) {
  if (!musicOn() || !TRACKS[id]) { if (!musicOn()) stopMusic(); return; }
  if (!ctx() || !unlocked) { current = id; return; }
  if (current === id && timer) return;
  current = id; step = 0; nextT = ac.currentTime + 0.05;
  if (!timer) timer = setInterval(tick, 60);
}
export function stopMusic() { current = null; if (timer) { clearInterval(timer); timer = null; } }
// chamado a cada quadro pelo jogo com a música que deveria estar tocando
export function wantTrack(id) { if (current !== id || (!timer && unlocked && musicOn())) playTrack(id); }

// ---------- efeitos ----------
function sfx(fn) { if (!sfxOn() || !ctx() || !unlocked || ac.state !== 'running') return; fn(ac.currentTime); }
export const SFX = {
  hit: () => sfx(t => { noise(sfxBus, t, 0.06, 0.05, 1500); note(sfxBus, 52, t, 0.06, 'square', 0.03, -5); }),
  crit: () => sfx(t => { noise(sfxBus, t, 0.12, 0.07, 800); note(sfxBus, 72, t, 0.1, 'square', 0.04, 7); }),
  hurt: () => sfx(t => note(sfxBus, 45, t, 0.15, 'sawtooth', 0.04, -7)),
  kill: () => sfx(t => { note(sfxBus, 64, t, 0.06, 'square', 0.04); note(sfxBus, 76, t + 0.06, 0.1, 'square', 0.04); }),
  boss: () => sfx(t => { note(sfxBus, 40, t, 0.5, 'sawtooth', 0.06, -5); note(sfxBus, 47, t + 0.1, 0.5, 'sawtooth', 0.04, -5); }),
  warn: () => sfx(t => note(sfxBus, 81, t, 0.08, 'square', 0.03)),
  magic: () => sfx(t => note(sfxBus, 84, t, 0.18, 'triangle', 0.05, -12)),
  arrow: () => sfx(t => { noise(sfxBus, t, 0.05, 0.03, 4000); note(sfxBus, 70, t, 0.05, 'triangle', 0.04, 5); }),
  done: () => sfx(t => { note(sfxBus, 76, t, 0.08, 'square', 0.05); note(sfxBus, 81, t + 0.08, 0.12, 'square', 0.05); }),
  level: () => sfx(t => [72, 76, 79, 84].forEach((n, i) => note(sfxBus, n, t + i * 0.1, i === 3 ? 0.3 : 0.1, 'square', 0.05))),
  chest: () => sfx(t => [67, 72, 79].forEach((n, i) => note(sfxBus, n, t + i * 0.12, i === 2 ? 0.35 : 0.1, 'triangle', 0.07))),
  coin: () => sfx(t => { note(sfxBus, 83, t, 0.05, 'square', 0.03); note(sfxBus, 88, t + 0.05, 0.08, 'square', 0.03); }),
  forge: () => sfx(t => { noise(sfxBus, t, 0.06, 0.08, 3000); note(sfxBus, 93, t, 0.05, 'square', 0.03); noise(sfxBus, t + 0.25, 0.06, 0.08, 3000); note(sfxBus, 93, t + 0.25, 0.05, 'square', 0.03); })
};
