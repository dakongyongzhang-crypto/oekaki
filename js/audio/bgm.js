'use strict';

/* =====================================================
   BGM（Web Audio でその場で鳴らすオリジナル曲）
   ===================================================== */
const BGM = (() => {
  const _ = null, H = -1; // _ = 休符, H = 前の音を伸ばす
  const SONGS = {
    menu: {
      bpm: 96, lead: 'triangle', leadVol: 0.06, bassType: 'triangle', bassVol: 0.09, arpType: 'sine', arpVol: 0.022, arpEvery: 2, arpOct: 12,
      mel: [
        [76, H, H, H, 72, H, 74, H, 76, H, H, H, 79, H, H, H],
        [77, H, H, H, 76, H, 74, H, 72, H, H, H, H, H, H, H],
        [72, H, H, H, 74, H, 76, H, 79, H, H, H, 76, H, H, H],
        [74, H, H, H, H, H, H, H, 71, H, 72, H, 74, H, H, H],
        [81, H, H, H, 79, H, 76, H, 72, H, H, H, 76, H, H, H],
        [77, H, H, H, 81, H, H, H, 79, H, 77, H, 76, H, H, H],
        [76, H, 74, H, 72, H, H, H, 67, H, 72, H, 76, H, H, H],
        [74, H, H, H, H, H, H, H, _, _, _, _, _, _, _, _]
      ],
      roots: [45, 41, 48, 43],
      bass: [0, H, H, H, H, H, H, H, 7, H, H, H, H, H, H, H],
      chords: [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]],
      kick: 'x.......x.......', snare: '................', hat: '....x.......x...'
    },
    game: {
      bpm: 140, lead: 'square', leadVol: 0.034, bassType: 'triangle', bassVol: 0.12, arpType: 'square', arpVol: 0.011, arpEvery: 1, arpOct: 0,
      mel: [
        [76, H, 79, H, 84, H, 79, H, 81, H, 79, H, 76, H, 74, H],
        [74, H, H, H, 79, H, 74, H, 71, H, 74, H, 79, H, H, H],
        [76, H, 72, H, 76, H, 81, H, 79, H, 76, H, 72, H, 76, H],
        [77, H, H, H, 76, H, 74, H, 72, H, H, H, _, _, 74, 76],
        [79, H, 79, 76, 84, H, H, H, 83, H, 81, H, 79, H, 76, H],
        [74, H, 79, H, 83, H, 86, H, 83, H, 79, H, 74, H, 79, H],
        [81, H, H, H, 79, H, 76, H, 72, H, 76, H, 79, H, 81, H],
        [77, H, 76, H, 74, H, 72, H, 74, H, H, H, 79, H, H, H]
      ],
      roots: [48, 43, 45, 41],
      bass: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, 7, 12, _],
      chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
      kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.'
    },
    cave: {
      bpm: 128, lead: 'square', leadVol: 0.032, bassType: 'triangle', bassVol: 0.12, arpType: 'triangle', arpVol: 0.03, arpEvery: 1, arpOct: 0,
      mel: [
        [69, H, 72, H, 76, H, 72, H, 69, H, 72, H, 76, H, 81, H],
        [79, H, H, H, 74, H, 71, H, 67, H, 71, H, 74, H, H, H],
        [77, H, 76, H, 72, H, 69, H, 72, H, H, H, 65, H, 69, H],
        [68, H, H, H, 71, H, H, H, 74, H, H, H, 76, H, H, H],
        [81, H, H, H, 76, H, 81, H, 84, H, 83, H, 81, H, 76, H],
        [79, H, 74, H, 79, H, 83, H, 79, H, H, H, 74, H, 71, H],
        [72, H, 77, H, 81, H, 77, H, 72, H, 69, H, 72, H, 77, H],
        [76, H, H, H, 74, H, H, H, 71, H, H, H, 68, H, H, H]
      ],
      roots: [45, 43, 41, 40],
      bass: [0, _, 0, _, 12, _, 0, _, 0, _, 0, _, 12, _, 10, _],
      chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]],
      kick: 'x.....x...x.....', snare: '....x.......x..x', hat: '..x...x...x...x.'
    }
  };
  let ctx = null, out = null, leadBus = null, delay = null, noiseBuf = null;
  let timer = null, cur = null, curKey = '', step = 0, nextT = 0, tempo = 1, tr = 0, bpm = 120;
  let enabled = true;
  try { enabled = localStorage.getItem('rr-bgm') !== 'off'; } catch (_e) {}
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    if (ctx) return true;
    if (!SFX.ctx) return false;
    ctx = SFX.ctx;
    out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    leadBus = ctx.createGain(); leadBus.connect(out);
    delay = ctx.createDelay(1);
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    leadBus.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(out);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function fade(v, dur) {
    const t = ctx.currentTime;
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(v, t + dur);
  }
  function tone(m, t, dur, type, vol, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(mtof(m + tr), t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.012, dur * 0.55)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || out); o.start(t); o.stop(t + dur + 0.03);
  }
  function kick(t, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
  }
  function hit(t, dur, v, type, f) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 0.5, dur + 0.02);
  }
  const holdLen = (arr, i) => { let n = 1; while (i + n < arr.length && arr[i + n] === H) n++; return n; };
  function scheduleStep(s, t) {
    const S = cur, sd = 60 / (bpm * tempo) / 4;
    const bar = Math.floor(s / 16) % S.mel.length, i = s % 16;
    const m = S.mel[bar][i];
    if (m > 0) tone(m, t, holdLen(S.mel[bar], i) * sd * 0.92, S.lead, S.leadVol, leadBus);
    const b = S.bass[i];
    if (b !== _ && b !== H) tone(S.roots[bar % S.roots.length] + b, t, holdLen(S.bass, i) * sd * 0.9, S.bassType, S.bassVol);
    if (i % S.arpEvery === 0) { const ch = S.chords[bar % S.chords.length]; tone(ch[(i / S.arpEvery) % ch.length] + S.arpOct, t, sd * S.arpEvery * 0.8, S.arpType, S.arpVol); }
    if (S.kick[i] === 'x') kick(t, 0.14);
    if (S.snare[i] === 'x') hit(t, 0.12, 0.07, 'bandpass', 1900);
    if (S.hat[i] === 'x') hit(t, 0.035, 0.025, 'highpass', 7000);
  }
  function tick() {
    if (!cur || !ctx) return;
    const now = ctx.currentTime;
    if (!enabled || nextT < now - 0.05) { nextT = now + 0.05; if (!enabled) return; }
    while (nextT < now + 0.15) { scheduleStep(step, nextT); nextT += 60 / (bpm * tempo) / 4; step++; }
  }
  function play(name, opt = {}) {
    if (!ensure()) return;
    const key = `${name}:${opt.tr || 0}:${opt.bpm || ''}`;
    if (key === curKey && cur && !opt.restart) return;
    curKey = key; cur = SONGS[name]; tr = opt.tr || 0; bpm = opt.bpm || cur.bpm; tempo = 1; step = 0;
    nextT = ctx.currentTime + 0.08;
    delay.delayTime.value = Math.min(0.9, 60 / bpm / 4 * 3);
    fade(enabled ? 1 : 0, 0.15);
    if (!timer) timer = setInterval(tick, 25);
  }
  function stop(f = 0.4) {
    if (!ctx) return;
    const was = curKey; curKey = ''; fade(0, f);
    setTimeout(() => { if (curKey === '' && was) cur = null; }, f * 1000 + 30);
  }
  return {
    play, stop,
    duck(on) { if (ctx && enabled && cur) fade(on ? 0.25 : 1, 0.2); },
    setTempo(m) { tempo = m; },
    setEnabled(v) { enabled = v; try { localStorage.setItem('rr-bgm', v ? 'on' : 'off'); } catch (_e) {} if (ctx) fade(v && cur ? 1 : 0, 0.2); },
    get enabled() { return enabled; }
  };
})();
const STAGE_MUSIC = { '真っ白なページ': ['cave', 5, 168], 'はじまりの草原': ['game', 0, 132], 'トゲトゲ谷': ['game', 2, 138], 'とびらの森': ['game', 5, 136], 'くものうえ': ['game', 7, 140], 'がけっぷち山': ['game', 2, 146], 'どうくつ迷路': ['cave', 0, 128], 'あらしの空': ['cave', 3, 140], '消しゴム大王の城': ['cave', 5, 150], 'のはら': ['game', 0, 140], 'やまみち': ['game', 2, 148], 'うきしま': ['game', 5, 134], 'どうくつ': ['cave', 0, 128], 'まぜこぜ': ['game', 3, 152] };
function playStageMusic() { const [n, t, b] = STAGE_MUSIC[stage.name] || ['game', 0, 140]; BGM.play(n, { tr: t, bpm: b, restart: true }); }
function musicForScreen(id) { if (id === 'scr-victory' || id === 'scr-ending') BGM.play('game', { tr: 5, bpm: 150 }); else if (id !== 'scr-game') BGM.play('menu'); }
function toggleBgm() {
  SFX.init();
  BGM.setEnabled(!BGM.enabled);
  const b = $('#btnBgm'); b.textContent = BGM.enabled ? 'BGM ON' : 'BGM OFF'; b.setAttribute('aria-pressed', String(BGM.enabled));
  if (BGM.enabled && curScreen !== 'scr-game') musicForScreen(curScreen);
}
$('#btnBgm').textContent = BGM.enabled ? 'BGM ON' : 'BGM OFF';
$('#btnBgm').setAttribute('aria-pressed', String(BGM.enabled));
$('#btnBgm').addEventListener('click', e => { toggleBgm(); e.currentTarget.blur(); });
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { SFX.init(); if (curScreen !== 'scr-game') musicForScreen(curScreen); }, { capture: true }));
document.addEventListener('visibilitychange', () => { if (!SFX.ctx) return; if (document.hidden) SFX.ctx.suspend(); else SFX.ctx.resume(); });
