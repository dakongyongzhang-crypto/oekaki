'use strict';

/* =====================================================
   ステージの背景（空・遠景・天気）
   ===================================================== */
// ステージごとの背景（空の色・遠景・中景・天気）
const BGS = {
  meadow: { sky: ['#d6ebff', '#f7fbff'], grid: 'rgba(150,185,220,0.35)', clouds: true, sun: '#ffd84a' },
  canyon: { sky: ['#ffc996', '#fff1df'], grid: 'rgba(200,140,100,0.22)', sun: '#ff8f45', weather: 'dust' },
  forest: { sky: ['#c9e6cc', '#f0f9ee'], grid: 'rgba(110,165,120,0.22)', weather: 'fireflies' },
  sky: { sky: ['#a9d7ff', '#eef8ff'], grid: 'rgba(140,185,230,0.3)', clouds: true, weather: 'birds' },
  mountain: { sky: ['#c6d8ee', '#f3f7fc'], grid: 'rgba(140,170,205,0.28)', clouds: true, weather: 'snow' },
  cave: { sky: ['#2e3246', '#1a1d28'], grid: 'rgba(255,255,255,0.05)', weather: 'dust', dark: true },
  storm: { sky: ['#7f849f', '#c3c7d8'], grid: 'rgba(50,55,85,0.14)', weather: 'rain', lightning: true },
  castle: { sky: ['#b28acb', '#ffd3bd'], grid: 'rgba(110,70,130,0.16)', weather: 'embers', moon: true },
  ex: { sky: ['#120d22', '#3a1f57'], grid: 'rgba(255,255,255,0.05)', weather: 'stars', moon: true, dark: true }
};
let backdrop = { bg: 'meadow', far: [], mid: [] };
function genBackdrop(bg, seed) {
  const rnd = mulberry32(seed ^ 0x51ed1), R = (a, b) => a + rnd() * (b - a), pick = a => a[Math.floor(rnd() * a.length)];
  const far = [], mid = [], spanF = WW * 0.15 + 2800, spanM = WW * 0.35 + 2800;
  const each = (span, step, fn) => { for (let x = -300; x < span; x += step()) fn(x); };
  const GLOW = ['#7fe0ff', '#c79bff', '#7dffb5'];
  switch (bg) {
    case 'canyon':
      each(spanF, () => R(300, 520), x => far.push({ t: 'mesa', x, w: R(260, 420), h: R(170, 260), col: pick(['#f0c39a', '#ebb98c']), k: rnd() }));
      each(spanM, () => R(220, 420), x => mid.push(rnd() < 0.55 ? { t: 'spire', x, w: R(50, 80), h: R(180, 280), col: '#e2a679' } : { t: 'cactus', x, h: R(120, 180), col: '#9cc48a' }));
      break;
    case 'forest':
      each(spanF, () => R(70, 120), x => far.push({ t: 'tree', x, w: R(110, 160), h: R(230, 320), col: pick(['#a9d3a8', '#b3d9ad']), trunk: '#b39072' }));
      each(spanM, () => R(220, 380), x => mid.push({ t: 'tree', x, w: R(150, 200), h: R(300, 380), col: '#8fc48d', trunk: '#9c7656' }));
      break;
    case 'sky':
      far.push({ t: 'rainbow', x: 700, w: 760 });
      each(spanF, () => R(200, 340), x => far.push({ t: 'cloudbank', x, w: R(300, 460), h: R(80, 130), y: R(430, 510) }));
      each(spanM, () => R(320, 620), x => mid.push({ t: 'cloudbank', x, w: R(200, 300), h: R(55, 85), y: R(170, 330) }));
      break;
    case 'mountain':
      each(spanF, () => R(240, 420), x => far.push({ t: 'mountain', x, w: R(420, 640), h: R(260, 380), col: pick(['#c3d2e6', '#b7c8de']) }));
      each(spanM, () => R(110, 220), x => mid.push({ t: 'pine', x, w: R(70, 100), h: R(160, 240), col: pick(['#8fb7a3', '#86ae9a']) }));
      break;
    case 'cave':
      each(spanF, () => R(150, 280), x => far.push({ t: 'stal', x, w: R(60, 120), h: R(120, 230), col: '#3b4056', glow: rnd() < 0.4 ? pick(GLOW) : null }));
      each(spanM, () => R(220, 420), x => mid.push({ t: 'stal', x, w: R(40, 70), h: R(80, 160), col: '#4a5068', glow: rnd() < 0.6 ? pick(GLOW) : null }));
      break;
    case 'storm':
      each(spanF, () => R(220, 380), x => far.push({ t: 'stormcloud', x, w: R(380, 560), h: R(100, 150), y: R(50, 130) }));
      each(spanM, () => R(520, 900), x => mid.push({ t: 'tornado', x, h: R(260, 360), ph: rnd() * 6 }));
      break;
    case 'ex':
      each(spanF, () => R(380, 620), x => far.push({ t: 'castle', x, w: R(260, 380), h: R(200, 280) }));
      each(spanM, () => R(160, 320), x => mid.push({ t: 'chunk', x, y: R(160, 420), w: R(40, 90), h: R(26, 44), ph: rnd() * 6 }));
      break;
    case 'castle':
      each(spanF, () => R(400, 640), x => far.push({ t: 'castle', x, w: R(260, 380), h: R(200, 280) }));
      each(spanM, () => R(260, 460), x => mid.push({ t: 'banner', x, h: R(200, 280), col: pick(['#e8305f', '#6b3fd0', '#ffb020']) }));
      break;
    default:
      each(spanF, () => R(280, 460), x => far.push({ t: 'hill', x, w: R(500, 800), h: R(110, 170), col: pick(['#cfe8c2', '#d8edc9']) }));
      each(spanM, () => R(260, 520), x => mid.push({ t: 'tree', x, w: R(90, 130), h: R(190, 260), col: '#b5dba4', trunk: '#c9a27c' }));
  }
  return { bg, far, mid };
}
function drawBgShape(el, sx, t) {
  const B = VWH;
  g.save(); g.lineWidth = 2; g.strokeStyle = 'rgba(36,37,43,0.14)'; g.lineJoin = 'round';
  switch (el.t) {
    case 'hill':
      g.beginPath(); g.moveTo(sx - el.w / 2, B); g.quadraticCurveTo(sx, B - el.h * 2, sx + el.w / 2, B); g.closePath(); g.fillStyle = el.col; g.fill(); g.stroke(); break;
    case 'tree': {
      g.fillStyle = el.trunk; g.fillRect(sx - el.w * 0.07, B - el.h * 0.5, el.w * 0.14, el.h * 0.5);
      g.beginPath();
      for (const [dx, dy, rr] of [[0, 0.68, 0.42], [-0.28, 0.55, 0.3], [0.28, 0.56, 0.3]]) { const cx = sx + el.w * dx, cy = B - el.h * dy, r = el.w * rr; g.moveTo(cx + r, cy); g.arc(cx, cy, r, 0, TAU); }
      g.fillStyle = el.col; g.fill(); g.stroke(); break;
    }
    case 'mesa': {
      const w = el.w, h = el.h; g.beginPath(); g.moveTo(sx - w / 2, B); g.lineTo(sx - w * 0.38, B - h * 0.9);
      for (let k = 0; k <= 6; k++) g.lineTo(sx - w * 0.38 + w * 0.76 * k / 6, B - h + (Math.floor(k * 37 + el.k * 100) % 3) * 6);
      g.lineTo(sx + w / 2, B); g.closePath(); g.fillStyle = el.col; g.fill(); g.stroke();
      g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(sx - w * 0.42 + k * 4, B - h * k / 4.5); g.lineTo(sx + w * 0.42 - k * 4, B - h * k / 4.5); }
      g.strokeStyle = 'rgba(160,100,60,0.22)'; g.stroke(); break;
    }
    case 'spire': {
      const w = el.w, h = el.h; g.beginPath(); g.moveTo(sx - w / 2, B); g.lineTo(sx - w * 0.35, B - h * 0.6); g.lineTo(sx - w * 0.2, B - h); g.lineTo(sx + w * 0.15, B - h * 0.94); g.lineTo(sx + w * 0.3, B - h * 0.55); g.lineTo(sx + w / 2, B); g.closePath();
      g.fillStyle = el.col; g.fill(); g.stroke(); break;
    }
    case 'cactus':
      g.strokeStyle = el.col; g.lineCap = 'round'; g.lineWidth = 16; g.beginPath();
      g.moveTo(sx, B); g.lineTo(sx, B - el.h); g.moveTo(sx, B - el.h * 0.5); g.lineTo(sx - 26, B - el.h * 0.5); g.lineTo(sx - 26, B - el.h * 0.75);
      g.moveTo(sx, B - el.h * 0.62); g.lineTo(sx + 24, B - el.h * 0.62); g.lineTo(sx + 24, B - el.h * 0.85); g.stroke(); break;
    case 'mountain': {
      const w = el.w, h = el.h; g.beginPath(); g.moveTo(sx - w / 2, B); g.lineTo(sx, B - h); g.lineTo(sx + w / 2, B); g.closePath(); g.fillStyle = el.col; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(sx - w * 0.14, B - h * 0.72); g.lineTo(sx, B - h); g.lineTo(sx + w * 0.14, B - h * 0.72); g.lineTo(sx + w * 0.06, B - h * 0.78); g.lineTo(sx, B - h * 0.7); g.lineTo(sx - w * 0.07, B - h * 0.77); g.closePath();
      g.fillStyle = '#ffffff'; g.fill(); break;
    }
    case 'pine': {
      const w = el.w, h = el.h; g.fillStyle = '#9b7a5a'; g.fillRect(sx - 5, B - h * 0.22, 10, h * 0.22); g.beginPath();
      for (let k = 0; k < 3; k++) { const y0 = B - h * 0.18 - k * h * 0.25, ww = w * (1 - k * 0.22); g.moveTo(sx - ww / 2, y0); g.lineTo(sx, y0 - h * 0.4); g.lineTo(sx + ww / 2, y0); g.closePath(); }
      g.fillStyle = el.col; g.fill(); g.stroke(); break;
    }
    case 'cloudbank': {
      g.beginPath();
      for (let k = 0; k < 5; k++) { const cx = sx - el.w / 2 + el.w * (k + 0.5) / 5, r = el.h * (0.45 + (k % 2) * 0.2); g.moveTo(cx + r, el.y); g.arc(cx, el.y, r, 0, TAU); }
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); break;
    }
    case 'rainbow': {
      g.globalAlpha = 0.45; g.lineWidth = 14;
      ['#ff8a8a', '#ffc46b', '#fff07a', '#9fe6a0', '#8ec9ff', '#c7a6ff'].forEach((col, k) => { g.strokeStyle = col; g.beginPath(); g.arc(sx, B + 60, el.w / 2 - k * 14, Math.PI, 0); g.stroke(); });
      break;
    }
    case 'stal': {
      const w = el.w, h = el.h; g.beginPath(); g.moveTo(sx - w / 2, -10); g.lineTo(sx - w * 0.15, h * 0.6); g.lineTo(sx, h); g.lineTo(sx + w * 0.12, h * 0.55); g.lineTo(sx + w / 2, -10); g.closePath();
      g.fillStyle = el.col; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.stroke();
      if (el.glow) {
        const gr = g.createRadialGradient(sx, h, 2, sx, h, 36); gr.addColorStop(0, el.glow); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = 0.55 + Math.sin(t * 2 + sx * 0.01) * 0.25; g.fillStyle = gr; g.beginPath(); g.arc(sx, h, 36, 0, TAU); g.fill();
        g.globalAlpha = 1; g.beginPath(); g.moveTo(sx, h - 10); g.lineTo(sx + 6, h + 2); g.lineTo(sx, h + 14); g.lineTo(sx - 6, h + 2); g.closePath(); g.fillStyle = el.glow; g.fill();
      }
      break;
    }
    case 'stormcloud': {
      g.beginPath();
      for (let k = 0; k < 6; k++) { const cx = sx - el.w / 2 + el.w * (k + 0.5) / 6, r = el.h * (0.4 + (k * 7 % 3) * 0.12); g.moveTo(cx + r, el.y); g.arc(cx, el.y, r, 0, TAU); }
      g.fillStyle = 'rgba(88,92,118,0.75)'; g.fill(); break;
    }
    case 'tornado':
      g.strokeStyle = 'rgba(240,240,250,0.55)'; g.lineWidth = 3;
      for (let k = 0; k < 9; k++) { const y = 80 + el.h * k / 9, rw = 70 * (1 - k / 11), off = Math.sin(t * 3 + el.ph + k * 0.6) * 12; g.beginPath(); g.ellipse(sx + off, y, rw, 9, 0, 0, TAU); g.stroke(); }
      break;
    case 'chunk': {
      const y = el.y + Math.sin(t * 0.8 + el.ph) * 10;
      g.translate(sx, y); g.rotate(Math.sin(t * 0.5 + el.ph) * 0.35);
      rrect(g, -el.w / 2, -el.h / 2, el.w, el.h, 6); g.fillStyle = 'rgba(251,230,238,0.28)'; g.fill();
      g.fillStyle = 'rgba(62,123,214,0.3)'; g.fillRect(-el.w / 2 + 2, 0, el.w - 4, el.h / 2 - 2);
      rrect(g, -el.w / 2, -el.h / 2, el.w, el.h, 6); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
      break;
    }
    case 'castle': {
      const w = el.w, h = el.h, towers = [[-0.42, 0.75], [0, 1], [0.42, 0.8]], tw = w * 0.16;
      g.beginPath(); g.rect(sx - w / 2, B - h * 0.45, w, h * 0.45);
      for (const [fx, fh] of towers) g.rect(sx + w * fx - tw / 2, B - h * fh, tw, h * fh);
      g.fillStyle = 'rgba(96,64,128,0.5)'; g.fill();
      g.beginPath(); for (const [fx, fh] of towers) { const tx = sx + w * fx; g.moveTo(tx - tw * 0.65, B - h * fh); g.lineTo(tx, B - h * fh - tw * 1.1); g.lineTo(tx + tw * 0.65, B - h * fh); g.closePath(); }
      g.fillStyle = 'rgba(70,40,100,0.55)'; g.fill();
      g.fillStyle = 'rgba(255,214,120,0.75)'; for (const [fx, fh] of towers) g.fillRect(sx + w * fx - 4, B - h * fh * 0.7, 8, 12);
      break;
    }
    case 'banner': {
      g.strokeStyle = 'rgba(60,40,80,0.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx, B); g.lineTo(sx, B - el.h); g.stroke();
      const wv = Math.sin(t * 3 + sx * 0.02) * 6, top = B - el.h;
      g.beginPath(); g.moveTo(sx, top); g.quadraticCurveTo(sx + 30, top + wv, sx + 60, top + 6); g.lineTo(sx + 60, top + 40); g.quadraticCurveTo(sx + 30, top + 34 - wv, sx, top + 34); g.closePath();
      g.globalAlpha = 0.7; g.fillStyle = el.col; g.fill(); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(sx + 20, top + 13, 18, 10); break;
    }
  }
  g.restore();
}
function drawWeather(kind, t) {
  const base = { snow: 50, rain: 80, fireflies: 22, dust: 30, birds: 4, embers: 28, stars: 70 }[kind] || 0;
  const n = Math.round(base * VWW / 960), W = VWW + 60, H = VWH + 40, mod = (a, m) => ((a % m) + m) % m;
  g.save();
  if (kind === 'snow') {
    g.fillStyle = 'rgba(255,255,255,0.95)';
    for (let i = 0; i < n; i++) { const x = mod(i * 137.5 + t * 16 + Math.sin(t * 0.8 + i) * 18 - viewX * 0.5, W) - 30, y = mod(i * 71.3 + t * (26 + (i % 5) * 7), H) - 20; g.beginPath(); g.arc(x, y, 1.5 + (i % 3), 0, TAU); g.fill(); }
  } else if (kind === 'rain') {
    g.strokeStyle = 'rgba(70,80,120,0.4)'; g.lineWidth = 1.6; g.beginPath();
    for (let i = 0; i < n; i++) { const x = mod(i * 53.7 - t * 160 - viewX * 0.6, W) - 30, y = mod(i * 97.1 + t * 520, H) - 20; g.moveTo(x, y); g.lineTo(x - 7, y + 20); }
    g.stroke();
  } else if (kind === 'fireflies') {
    for (let i = 0; i < n; i++) {
      const x = mod(i * 211 + Math.sin(t * 0.5 + i) * 40 - viewX * 0.3, W) - 30, y = 120 + mod(i * 37, 240) + Math.sin(t * 1.2 + i * 2) * 14, a = Math.max(0, 0.4 + 0.4 * Math.sin(t * 3 + i * 1.7));
      g.fillStyle = '#fff3a0'; g.globalAlpha = a * 0.3; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); g.globalAlpha = a; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
    }
  } else if (kind === 'dust') {
    g.fillStyle = BGS[backdrop.bg].dark ? 'rgba(255,255,255,0.18)' : 'rgba(150,100,60,0.22)';
    for (let i = 0; i < n; i++) { const x = mod(i * 173 + t * 12 - viewX * 0.4, W) - 30, y = mod(i * 61 + Math.sin(t * 0.7 + i) * 20 + t * 4, H) - 20; g.beginPath(); g.arc(x, y, 1.5 + (i % 3) * 0.8, 0, TAU); g.fill(); }
  } else if (kind === 'birds') {
    g.strokeStyle = 'rgba(60,70,90,0.55)'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < n; i++) { const x = mod(i * 470 + t * 50 - viewX * 0.2, W + 200) - 100, y = 70 + i * 34 + Math.sin(t * 2 + i) * 8, f = Math.sin(t * 8 + i) * 4; g.moveTo(x - 9, y - f); g.quadraticCurveTo(x - 4, y - 4, x, y); g.quadraticCurveTo(x + 4, y - 4, x + 9, y - f); }
    g.stroke();
  } else if (kind === 'stars') {
    for (let i = 0; i < n; i++) {
      const x = mod(i * 157.3 - viewX * 0.04, W) - 30, y = mod(i * 89.7, VWH * 0.62), a = 0.35 + 0.45 * Math.sin(t * 2 + i * 1.3);
      g.globalAlpha = Math.max(0.05, a); g.fillStyle = i % 5 ? '#ffffff' : '#ffd23f'; g.fillRect(x, y, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
    }
    g.globalAlpha = 1;
  } else if (kind === 'embers') {
    for (let i = 0; i < n; i++) { const x = mod(i * 191 + Math.sin(t + i) * 16 - viewX * 0.4, W) - 30, y = mod(i * 83 - t * (22 + (i % 4) * 6), H) - 20; g.fillStyle = i % 2 ? 'rgba(255,150,80,0.7)' : 'rgba(255,210,120,0.6)'; g.beginPath(); g.arc(x, y, 1.6 + (i % 3) * 0.6, 0, TAU); g.fill(); }
  }
  g.restore();
}
function drawBackground() {
  const cfg = BGS[backdrop.bg] || BGS.meadow, t = tick / 60;
  const sky = g.createLinearGradient(0, 0, 0, VWH); sky.addColorStop(0, cfg.sky[0]); sky.addColorStop(1, cfg.sky[1]);
  g.fillStyle = sky; g.fillRect(-10, -10, VWW + 20, VWH + 20);
  if (cfg.sun) {
    const x = VWW * 0.78 - viewX * 0.02, y = 100;
    g.save(); g.strokeStyle = cfg.sun; g.lineWidth = 4; g.lineCap = 'round'; g.globalAlpha = 0.6; g.beginPath();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * 0.2; g.moveTo(x + Math.cos(a) * 52, y + Math.sin(a) * 52); g.lineTo(x + Math.cos(a) * 68, y + Math.sin(a) * 68); }
    g.stroke(); g.globalAlpha = 0.85; g.beginPath(); g.arc(x, y, 40, 0, TAU); g.fillStyle = cfg.sun; g.fill(); g.restore();
  }
  if (cfg.moon) {
    // 三日月は別キャンバスで「丸から丸をくりぬいて」作る（空の色で塗りつぶさない）
    const x = VWW * 0.75 - viewX * 0.02, y = 105;
    g.save(); g.shadowColor = 'rgba(255,236,190,0.55)'; g.shadowBlur = 10;
    g.drawImage(moonSprite(), x - 60, y - 60);
    g.restore();
  }
  for (const el of backdrop.far) { const sx = el.x - viewX * 0.15; if (sx > -500 && sx < VWW + 500) drawBgShape(el, sx, t); }
  if (cfg.lightning) {
    const ph = tick % 420;
    if (ph < 10 || (ph > 16 && ph < 22)) {
      const bx = mod1(Math.floor(tick / 420) * 397, VWW);
      g.save(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-10, -10, VWW + 20, VWH + 20);
      g.strokeStyle = 'rgba(255,250,200,0.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bx, 40);
      for (let k = 1; k <= 6; k++) g.lineTo(bx + (k % 2 ? 22 : -18), 40 + k * 45);
      g.stroke(); g.restore();
    }
  }
  if (cfg.clouds) {
    g.save(); g.strokeStyle = C.cloud; g.lineWidth = 2; g.lineCap = 'round';
    for (const cl of clouds) {
      const sx = cl.x - viewX * 0.45, cy = cl.y - viewY * 0.45;
      if (sx < -160 || sx > VWW + 160 || cy < -100 || cy > VWH + 100) continue;
      const s = cl.s;
      g.beginPath();
      g.moveTo(sx - 50 * s, cy + 10 * s);
      g.quadraticCurveTo(sx - 58 * s, cy - 12 * s, sx - 30 * s, cy - 10 * s);
      g.quadraticCurveTo(sx - 22 * s, cy - 34 * s, sx + 4 * s, cy - 22 * s);
      g.quadraticCurveTo(sx + 26 * s, cy - 38 * s, sx + 38 * s, cy - 12 * s);
      g.quadraticCurveTo(sx + 62 * s, cy - 8 * s, sx + 50 * s, cy + 10 * s);
      g.closePath(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill(); g.stroke();
    }
    g.restore();
  }
  for (const el of backdrop.mid) { const sx = el.x - viewX * 0.35; if (sx > -400 && sx < VWW + 400) drawBgShape(el, sx, t); }
  const gs = T / VS;
  g.strokeStyle = cfg.grid; g.lineWidth = 1 / VS * 0.8; g.beginPath();
  const ox = -(viewX % gs), oy = -(viewY % gs);
  for (let x = ox; x < VWW; x += gs) { g.moveTo(x, 0); g.lineTo(x, VWH); }
  for (let y = oy; y < VWH; y += gs) { g.moveTo(0, y); g.lineTo(VWW, y); }
  g.stroke();
  if (cfg.weather) drawWeather(cfg.weather, t);
}
function mod1(a, m) { return ((a % m) + m) % m; }
let moonCv = null;
function moonSprite() {
  if (moonCv) return moonCv;
  moonCv = document.createElement('canvas'); moonCv.width = moonCv.height = 120;
  const c = moonCv.getContext('2d');
  c.beginPath(); c.arc(60, 60, 42, 0, TAU); c.fillStyle = '#fff4d6'; c.fill();
  c.lineWidth = 2.5; c.strokeStyle = 'rgba(150,110,60,0.45)'; c.stroke();
  c.fillStyle = 'rgba(220,190,140,0.35)';
  for (const [cx, cy, r] of [[36, 72, 5], [46, 90, 4], [30, 56, 3]]) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); }
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000000';
  c.beginPath(); c.arc(86, 40, 42, 0, TAU); c.fill();
  return moonCv;
}
