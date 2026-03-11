// Synthesized audio engine — Web Audio API, no external files needed
import mainStageTheme from './music/Interstellar.wav';
import bossBattleTheme from './music/Horsehead_Nebula.wav';

let ac = null;
let master = null;
let sfxOut = null;
let musicOut = null;
let musicRunning = false;
let schedulerTimer = null;
let nextNoteTime = 0;
let currentStep = 0;
let activeTrack = 0;
let STEP_DUR = 0;

const LOOK_AHEAD = 0.15;
const TICK_MS    = 30;

export function initAudio() {
  if (ac) { ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();

// ─── Volume Controls ──────────────────────────────────────────────────────────

  master = ac.createGain();
  master.gain.value = 0.95;
  master.connect(ac.destination);

  sfxOut = ac.createGain();
  sfxOut.gain.value = 0.85;
  sfxOut.connect(master);

  musicOut = ac.createGain();
  musicOut.gain.value = 0.25;
  musicOut.connect(master);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function hz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function synth(type, freq, gainVal, dur, dest, t = ac.currentTime) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g); g.connect(dest);
  o.type = type;
  if (typeof freq === 'function') freq(o.frequency);
  else o.frequency.value = freq;
  g.gain.setValueAtTime(gainVal, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(gainVal, dur, hpHz, lpHz, dest, t = ac.currentTime) {
  const len = Math.ceil(ac.sampleRate * (dur + 0.1));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;

  const g = ac.createGain();
  g.gain.setValueAtTime(gainVal, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);

  let tail = src;
  if (hpHz) { const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hpHz; tail.connect(f); tail = f; }
  if (lpHz) { const f = ac.createBiquadFilter(); f.type = 'lowpass';  f.frequency.value = lpHz; tail.connect(f); tail = f; }
  tail.connect(g);

  src.start(t); src.stop(t + dur + 0.1);
}

// ─── SFX ──────────────────────────────────────────────────────────────────────

export function sfxShoot() {
  if (!ac) return;
  synth('square',   880, 0.16, 0.06, sfxOut);
  synth('square',   660, 0.07, 0.05, sfxOut);
}

export function sfxFocusShoot() {
  if (!ac) return;
  synth('sawtooth', 1320, 0.12, 0.055, sfxOut);
}

export function sfxEnemyDie() {
  if (!ac) return;
  const t = ac.currentTime;
  noise(0.45, 0.18, 1200, null, sfxOut, t);
  synth('sawtooth', f => {
    f.setValueAtTime(380, t);
    f.exponentialRampToValueAtTime(80, t + 0.2);
  }, 0.22, 0.22, sfxOut, t);
}

export function sfxBigExplosion() {
  if (!ac) return;
  const t = ac.currentTime;
  noise(0.85, 0.9, 60, 5000, sfxOut, t);
  synth('sine',     80,  0.5, 0.7, sfxOut, t);
  synth('sawtooth', 110, 0.3, 0.5, sfxOut, t);
  synth('sine', f => {
    f.setValueAtTime(55, t);
    f.exponentialRampToValueAtTime(28, t + 0.9);
  }, 0.45, 1.0, sfxOut, t);
}

export function sfxPlayerHit() {
  if (!ac) return;
  const t = ac.currentTime;
  noise(0.6, 0.35, 250, 3500, sfxOut, t);
  synth('sawtooth', f => {
    f.setValueAtTime(200, t);
    f.exponentialRampToValueAtTime(70, t + 0.35);
  }, 0.5, 0.38, sfxOut, t);
}

export function sfxBomb() {
  if (!ac) return;
  const t = ac.currentTime;
//  OG Bomb -------------------------------
//  noise(1.0, 1.0, 40, 8000, sfxOut, t);
//  synth('sine', 50, 0.55, 1.1, sfxOut, t);
//  synth('sawtooth', f => {
//    f.setValueAtTime(55, t);
//    f.exponentialRampToValueAtTime(2800, t + 0.55);
//  }, 0.55, 0.7, sfxOut, t);

//  Big Explosion Bomb -------------------------------
  noise(0.85, 0.9, 60, 5000, sfxOut, t);
  synth('sine',     80,  0.5, 0.7, sfxOut, t);
  synth('sawtooth', 110, 0.3, 0.5, sfxOut, t);
  synth('sine', f => {
    f.setValueAtTime(55, t);
    f.exponentialRampToValueAtTime(28, t + 0.9);
  }, 0.45, 1.0, sfxOut, t);
}

export function sfxWaveClear() {
  if (!ac) return;
  const t = ac.currentTime;
  [69, 72, 76, 81].forEach((m, i) => synth('triangle', hz(m), 0.28, 0.5, sfxOut, t + i * 0.13));
}

export function sfxBossWarning() {
  if (!ac) return;
  const t = ac.currentTime;
  synth('sawtooth', 220, 0.4, 0.35, sfxOut, t);
  synth('sawtooth', 220, 0.4, 0.35, sfxOut, t + 0.45);
  synth('sawtooth', 440, 0.5, 0.6,  sfxOut, t + 0.9);
}

// ─── Andy's Custom SFX ────────────────────────────────────────────────────────

export function sfxScoreTally() {
  if (!ac) return;
  const t = ac.currentTime;
  [81].forEach((m, i) => synth('triangle', hz(m), 0.28, 0.5, sfxOut, t + i * 0.13));
}

export function sfxAssWarning() {
  if (!ac) return;
  const t = ac.currentTime;
  synth('sawtooth', 70, 1.9, 4, sfxOut, t);
  synth('sawtooth', 70, 1.9, 4, sfxOut, t + 1);
  synth('sawtooth', 70, 1.9, 4,  sfxOut, t + 2);
}

export function sfxExplodeSmush() {
  if (!ac) return;
  const t = ac.currentTime;
  synth('sawtooth', 20, 1.9, 2, sfxOut, t);
}

export function sfxPause() {
  if (!ac) return;
  const t = ac.currentTime;
  [69, 81].forEach((m, i) => synth('triangle', hz(m), 0.28, 0.5, sfxOut, t + i * 0.13));
}

// ─── Music tracks ─────────────────────────────────────────────────────────────
// All tracks: bass=32 steps (loops 2×), lead+arp=64 steps, 16th-note resolution

const TRACKS = [

  // ── Track 0: SECTOR-1 ─ 168 BPM, A minor (original) ─────────────────────
  {
    name: 'SECTOR-1',
    bpm: 168,
    bass: [
      45,null,null,null, 45,null,null,null,
      40,null,null,null, 40,null,null,null,
      38,null,null,null, 38,null,null,null,
      43,null,null,null, 45,null,null,null,
    ],
    lead: [
      69,null,72,null, 76,null,72,null,
      69,null,67,null, 64,null,67,null,
      69,null,72,null, 76,null,79,null,
      76,null,72,null, 69,null,65,null,

      67,null,71,null, 74,null,71,null,
      67,null,65,null, 62,null,65,null,
      64,null,67,null, 71,null,74,null,
      72,null,69,null, 67,null,64,null,
    ],
    arp: [
      81,null,null,null, 84,null,null,null,
      81,null,null,null, 79,null,null,null,
      76,null,null,null, 79,null,null,null,
      81,null,null,null, 76,null,null,null,

      79,null,null,null, 83,null,null,null,
      79,null,null,null, 76,null,null,null,
      74,null,null,null, 76,null,null,null,
      79,null,null,null, 74,null,null,null,
    ],
    kicks:  new Set([0, 8, 16, 24]),
    snares: new Set([8, 24]),
    hihats: new Set([0, 4, 8, 12, 16, 20, 24, 28]),
    loop: 64,
  },

  // ── Track 1: ASSAULT ─ 200 BPM, D minor ──────────────────────────────────
  // Four-on-the-floor kick, 16th-note hihats, supersaw lead
  // Progression: Dm | C | Gm | F
  {
    name: 'ASSAULT',
    bpm: 200,
    bass: [
      38,null,38,null, 45,null,null,45,    // Dm: D D A A
      38,null,null,38, 36,null,38,null,    // C:  D..D C D
      43,null,43,null, 50,null,null,43,    // Gm: G G D3 G
      41,null,null,41, 45,null,null,null,  // F:  F..F A...
    ],
    lead: [
      // Bar 1 — Dm: aggressive ascending
      62,null,65,null, 67,null,69,null,   // D4 F4 G4 A4
      72,null,70,null, 69,null,67,null,   // C5 Bb4 A4 G4
      // Bar 2 — C: flowing run
      65,null,67,null, 69,null,72,null,   // F4 G4 A4 C5
      74,null,72,null, 69,null,65,null,   // D5 C5 A4 F4
      // Bar 3 — Gm: climbs high
      67,null,70,null, 72,null,74,null,   // G4 Bb4 C5 D5
      75,null,74,null, 72,null,70,null,   // Eb5 D5 C5 Bb4
      // Bar 4 — F/Dm: resolution
      69,null,72,null, 74,null,72,null,   // A4 C5 D5 C5
      69,null,67,null, 65,null,62,null,   // A4 G4 F4 D4
    ],
    arp: [
      62,null,null,null, 65,null,null,null,   // Dm asc: D4 F4
      69,null,null,null, 74,null,null,null,   // A4 D5
      74,null,null,null, 69,null,null,null,   // Dm desc: D5 A4
      65,null,null,null, 62,null,null,null,   // F4 D4
      67,null,null,null, 70,null,null,null,   // Gm asc: G4 Bb4
      74,null,null,null, 79,null,null,null,   // D5 G5
      69,null,null,null, 72,null,null,null,   // cadence: A4 C5
      65,null,null,null, 62,null,null,null,   // F4 D4
    ],
    kicks:  new Set([0, 4, 8, 12, 16, 20, 24, 28]),
    snares: new Set([8, 24]),
    hihats: new Set([0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30]),
    loop: 64,
  },

  // ── Track 2: IRON PHOENIX ─ 175 BPM, F minor ─────────────────────────────
  // Syncopated kick, menacing low register, half-time power
  // Progression: Fm | Db | Ab | Eb
  {
    name: 'IRON PHOENIX',
    bpm: 175,
    bass: [
      41,null,null,41, 48,null,null,null,   // Fm: F2..F2, C3
      41,null,null,null, 37,null,null,37,   // Db: F2..., Db2..Db2
      44,null,null,44, 51,null,null,null,   // Ab: Ab2..Ab2, Eb3
      39,null,null,39, 41,null,null,null,   // Eb: Eb2..Eb2, F2
    ],
    lead: [
      // Bar 1 — Fm: dark opening
      65,null,68,null, 70,null,72,null,   // F4 Ab4 Bb4 C5
      73,null,72,null, 70,null,68,null,   // Db5 C5 Bb4 Ab4
      // Bar 2 — Db: rising drama
      73,null,75,null, 77,null,75,null,   // Db5 Eb5 F5 Eb5
      73,null,72,null, 70,null,68,null,   // Db5 C5 Bb4 Ab4
      // Bar 3 — Ab: full power
      68,null,72,null, 75,null,77,null,   // Ab4 C5 Eb5 F5
      80,null,77,null, 75,null,72,null,   // Ab5 F5 Eb5 C5
      // Bar 4 — Eb: resolution
      75,null,72,null, 70,null,68,null,   // Eb5 C5 Bb4 Ab4
      65,null,68,null, 70,null,65,null,   // F4 Ab4 Bb4 F4
    ],
    arp: [
      65,null,null,null, 68,null,null,null,   // Fm: F4 Ab4
      72,null,null,null, 77,null,null,null,   // C5 F5
      72,null,null,null, 68,null,null,null,   // desc: C5 Ab4
      65,null,null,null, 63,null,null,null,   // F4 Eb4
      61,null,null,null, 65,null,null,null,   // Db: Db4 F4
      68,null,null,null, 73,null,null,null,   // Ab4 Db5
      63,null,null,null, 67,null,null,null,   // Eb: Eb4 G4
      70,null,null,null, 75,null,null,null,   // Bb4 Eb5
    ],
    kicks:  new Set([0, 8, 12, 16, 24, 28]),
    snares: new Set([8, 24]),
    hihats: new Set([0, 4, 8, 12, 16, 20, 24, 28]),
    loop: 64,
  },

  // ── Track 3: THUNDER ZERO ─ 215 BPM, A minor ─────────────────────────────
  // Maximum tempo — 8th-note arpeggios, blazing runs, relentless 16th hihats
  // Progression: Am | F | C | G
  {
    name: 'THUNDER ZERO',
    bpm: 215,
    bass: [
      45,null,45,null, 40,null,null,45,    // Am: A2 A2 E2 A2
      45,null,null,45, 43,null,null,null,  // A2..A2, G2
      41,null,41,null, 45,null,null,41,    // F:  F2 F2 A2 F2
      43,null,null,43, 47,null,null,null,  // G:  G2..G2, B2
    ],
    lead: [
      // Bar 1 — Am: blazing run
      69,null,72,null, 74,null,76,null,   // A4 C5 D5 E5
      79,null,76,null, 74,null,72,null,   // G5 E5 D5 C5
      // Bar 2 — Am/F: climbs to A5
      72,null,74,null, 76,null,79,null,   // C5 D5 E5 G5
      81,null,79,null, 76,null,74,null,   // A5 G5 E5 D5
      // Bar 3 — F: dramatic sweep
      77,null,79,null, 81,null,79,null,   // F5 G5 A5 G5
      77,null,76,null, 74,null,72,null,   // F5 E5 D5 C5
      // Bar 4 — G/Em: rush back to root
      79,null,81,null, 83,null,81,null,   // G5 A5 B5 A5
      79,null,77,null, 76,null,69,null,   // G5 F5 E5 A4
    ],
    arp: [
      // Am — 8th-note arp (note every 2 steps)
      69,null,72,null, 76,null,72,null,   // A C E C
      69,null,72,null, 76,null,81,null,   // A C E A5
      81,null,76,null, 72,null,69,null,   // A5 E C A (desc)
      72,null,76,null, 81,null,76,null,   // C E A5 E
      // F (F5=77 A5=81 C6=84)
      77,null,81,null, 84,null,81,null,   // F A C A
      77,null,81,null, 84,null,77,null,   // F A C F
      // G/Em (G5=79 B5=83 D6=86 / E5=76 G5=79 B5=83)
      79,null,83,null, 86,null,83,null,   // G B D B
      76,null,79,null, 83,null,79,null,   // E G B G
    ],
    kicks:  new Set([0, 8, 16, 24]),
    snares: new Set([8, 24]),
    hihats: new Set([0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30]),
    loop: 64,
  },

  // ── Track 4: ANNIHILATOR ─ 235 BPM, E minor ──────────────────────────────
  // Boss battle theme — 8th-note kick, relentless 16th hihats, screaming lead
  // Progression: Em | C | G | D
  // NOT listed in TRACK_NAMES — triggered automatically for the boss fight
  {
    name: 'ANNIHILATOR',
    bpm: 235,
    bass: [
      // 8th-note power root+fifth pattern
      40,null,47,null, 40,null,47,null,   // Em: E2 B2 E2 B2
      36,null,43,null, 36,null,43,null,   // C:  C2 G2 C2 G2
      43,null,50,null, 43,null,50,null,   // G:  G2 D3 G2 D3
      38,null,45,null, 38,null,40,null,   // D:  D2 A2 D2 E2
    ],
    lead: [
      // Bar 1 — Em: blast upward
      76,null,79,null, 83,null,84,null,   // E5 G5 B5 C6
      84,null,81,null, 79,null,76,null,   // C6 A5 G5 E5
      // Bar 2 — C: high register run
      72,null,76,null, 79,null,83,null,   // C5 E5 G5 B5
      84,null,83,null, 79,null,72,null,   // C6 B5 G5 C5
      // Bar 3 — G: peak intensity
      79,null,81,null, 83,null,84,null,   // G5 A5 B5 C6
      83,null,81,null, 79,null,76,null,   // B5 A5 G5 E5
      // Bar 4 — D: fierce close + root drop
      74,null,76,null, 79,null,83,null,   // D5 E5 G5 B5
      84,null,83,null, 79,null,64,null,   // C6 B5 G5 E4 (dramatic drop)
    ],
    arp: [
      // Em — 8th-note ascending/descending arpeggios
      64,null,67,null, 71,null,76,null,   // E4 G4 B4 E5
      79,null,76,null, 71,null,67,null,   // G5 E5 B4 G4
      71,null,76,null, 79,null,83,null,   // B4 E5 G5 B5
      83,null,79,null, 76,null,71,null,   // B5 G5 E5 B4
      // C — 8th-note
      60,null,64,null, 67,null,72,null,   // C4 E4 G4 C5
      76,null,72,null, 67,null,64,null,   // E5 C5 G4 E4
      // G — 8th-note
      67,null,71,null, 74,null,79,null,   // G4 B4 D5 G5
      83,null,79,null, 74,null,71,null,   // B5 G5 D5 B4
      // D — 8th-note
      62,null,66,null, 69,null,74,null,   // D4 F#4 A4 D5
      78,null,74,null, 69,null,62,null,   // F#5 D5 A4 D4
    ],
    kicks:  new Set([0, 4, 8, 12, 16, 20, 24, 28]),  // every 8th note
    snares: new Set([8, 24]),
    hihats: new Set([0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30]),
    loop: 64,
  },
];

// First 4 tracks are player-selectable; index 4 (ANNIHILATOR) is boss-only
export const TRACK_NAMES    = TRACKS.slice(0, 4).map(t => t.name);
export const BOSS_TRACK_IDX = 4;

// ─── Sequencer ────────────────────────────────────────────────────────────────

function scheduleStep(step, t) {
  const track = TRACKS[activeTrack];
  const s32 = step % 32;
  const s64 = step % track.loop;

  // Bass (low-pass filtered square)
  const bn = track.bass[s32];
  if (bn !== null) {
    const o  = ac.createOscillator();
    const lp = ac.createBiquadFilter();
    const g  = ac.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 820;
    o.connect(lp); lp.connect(g); g.connect(musicOut);
    o.type = 'square'; o.frequency.value = hz(bn);
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + STEP_DUR * 3.6);
    o.start(t); o.stop(t + STEP_DUR * 4);
  }

  // Lead — supersaw (two slightly detuned sawtooths)
  const ln = track.lead[s64];
  if (ln !== null) {
    const freq = hz(ln);
    const dur  = STEP_DUR * 1.8;
    const stop = STEP_DUR * 2;
    for (const detune of [1, 1.004]) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(musicOut);
      o.type = 'sawtooth'; o.frequency.value = freq * detune;
      g.gain.setValueAtTime(detune === 1 ? 0.1 : 0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + stop);
    }
  }

  // Arp (triangle)
  const an = track.arp[s64];
  if (an !== null) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(musicOut);
    o.type = 'triangle'; o.frequency.value = hz(an);
    g.gain.setValueAtTime(0.11, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + STEP_DUR * 0.85);
    o.start(t); o.stop(t + STEP_DUR * 1.1);
  }

  // Kick — punchy sine with click transient
  if (track.kicks.has(s32)) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(musicOut);
    o.type = 'sine';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.15);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.start(t); o.stop(t + 0.22);
    noise(0.22, 0.018, 3500, null, musicOut, t);
  }

  // Snare (noise + tone)
  if (track.snares.has(s32)) {
    noise(0.28, 0.12, 1800, null, musicOut, t);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(musicOut);
    o.type = 'sine'; o.frequency.value = 200;
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.start(t); o.stop(t + 0.12);
  }

  // Hi-hat
  if (track.hihats.has(s32)) {
    noise(0.06, 0.055, 10000, null, musicOut, t);
  }
}

function tick() {
  if (!ac || !musicRunning) return;
  while (nextNoteTime < ac.currentTime + LOOK_AHEAD) {
    scheduleStep(currentStep, nextNoteTime);
    nextNoteTime += STEP_DUR;
    currentStep++;
  }
}

let wavAudio = null;

export function startMusic(trackIndex = 0) {
  if (wavAudio) { wavAudio.pause(); wavAudio = null; }
  const src = trackIndex === BOSS_TRACK_IDX ? bossBattleTheme : mainStageTheme;
  wavAudio = new Audio(src);
  wavAudio.loop = true;
  wavAudio.play().catch(() => {});
}

export function stopMusic() {
  if (wavAudio) { wavAudio.pause(); wavAudio = null; }
}

// Stop the current track and immediately start another (e.g. boss music)
export function switchMusic(trackIndex) {
  stopMusic();
  startMusic(trackIndex);
}
