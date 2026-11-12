'use strict';

/* =====================================================
   効果音（Web Audio）
   ===================================================== */
const SFX = {
  ctx: null, on: true, lastPaint: 0,
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f1, f2, dur, type = 'square', vol = 0.05, delay = 0) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.08, freq = 1500) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  },
  jump() { this.tone(320, 640, 0.11, 'square', 0.035); },
  swim() { this.tone(380, 760, 0.12, 'sine', 0.05); this.tone(600, 900, 0.06, 'sine', 0.03, 0.05); },
  noiseAt(dur, vol, freq, delay = 0, type = 'highpass') {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  },
  slash() { this.noise(0.13, 0.12, 2600); this.tone(760, 220, 0.1, 'sawtooth', 0.025); },
  hurt() { this.tone(220, 70, 0.22, 'square', 0.07); this.noise(0.12, 0.08, 500); },
  tick() { this.tone(500, 380, 0.05, 'square', 0.035); },
  kill() { this.tone(520, 900, 0.07, 'square', 0.045); this.tone(900, 1400, 0.08, 'square', 0.035, 0.06); },
  place() { this.tone(240, 520, 0.09, 'triangle', 0.07); },
  paint() { if (!this.ctx) return; const n = this.ctx.currentTime; if (n - this.lastPaint < 0.05) return; this.lastPaint = n; this.tone(880 + Math.random() * 200, 700, 0.03, 'sine', 0.018); },
  crumble() { this.noise(0.08, 0.06, 900); },
  pick() { this.tone(660, 990, 0.1, 'triangle', 0.06); this.tone(990, 1320, 0.12, 'triangle', 0.05, 0.08); },
  deny() { this.tone(170, 120, 0.12, 'square', 0.035); },
  shoot() { this.tone(180, 90, 0.12, 'square', 0.04); this.noise(0.07, 0.05, 700); },
  count(go) { this.tone(go ? 880 : 440, go ? 880 : 440, go ? 0.3 : 0.12, 'triangle', 0.07); },
  win() {
    // ゴールのファンファーレ：駆け上がるアルペジオ → ジャーンという和音（シンバルつき） → キラキラ
    this.tone(392, 1568, 0.22, 'sine', 0.035);
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.1, 'square', 0.032, 0.05 + i * 0.065));
    const d = 0.4;
    [523, 659, 784].forEach(f => { this.tone(f, f, 0.9, 'triangle', 0.06, d); this.tone(f * 1.006, f * 1.006, 0.9, 'triangle', 0.025, d); });
    this.tone(1047, 1047, 0.9, 'square', 0.022, d);
    this.tone(131, 131, 0.7, 'triangle', 0.1, d);
    this.tone(170, 45, 0.25, 'sine', 0.14, d);
    this.noiseAt(0.8, 0.07, 6000, d);
    [2093, 2637, 3136, 4186, 3136, 4186].forEach((f, i) => this.tone(f, f * 1.03, 0.14, 'sine', 0.03, d + 0.18 + i * 0.08));
  },
  lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, f * 0.97, 0.24, 'triangle', 0.07, i * 0.16)); }
};

/* =====================================================
   Extra sounds
   ===================================================== */
Object.assign(SFX, {
  boing() { this.tone(180, 720, 0.18, 'sine', 0.08); },
  boom() { this.noise(0.5, 0.25, 260); this.tone(120, 40, 0.4, 'square', 0.06); },
  thud() { this.noise(0.2, 0.16, 220); this.tone(90, 50, 0.2, 'square', 0.05); },
  zap() { this.noise(0.25, 0.14, 3200); this.tone(1400, 200, 0.2, 'sawtooth', 0.04); },
  fwoosh() { this.noise(0.35, 0.07, 900); },
  clank() { this.tone(1800, 1500, 0.07, 'square', 0.03); this.tone(2400, 2000, 0.06, 'square', 0.02, 0.03); },
  special() { [300, 450, 600].forEach((f, i) => this.tone(f, f * 1.5, 0.12, 'triangle', 0.05, i * 0.06)); },
  erase() { if (!this.ctx) return; const n = this.ctx.currentTime; if (n - this.lastPaint < 0.05) return; this.lastPaint = n; this.noise(0.04, 0.05, 1800); },
  warp() { this.tone(900, 260, 0.16, 'sine', 0.05); },
  whoosh() { this.noise(0.2, 0.05, 1300); },
  charge() { this.tone(200, 900, 0.8, 'sawtooth', 0.018); },
  beam() { this.tone(1300, 1150, 0.45, 'square', 0.028); this.noise(0.3, 0.05, 2600); },
  splat() { this.tone(320, 110, 0.16, 'triangle', 0.07); this.noise(0.1, 0.06, 600); }
});
