'use strict';

/* =====================================================
   追加カードの見た目（敵・ワナ・弾・カードアイコン）
   ===================================================== */
// 敵の向き（e.dir）で顔の向きが決まる種類
const EXTRA_FACE_DIR = new Set(['bat', 'tate', 'frog', 'dropper', 'piston', 'arrow']);
function spikyBall(ctx, cx, cy, R, n, rot, col, fl) {
  ctx.beginPath();
  for (let k = 0; k < n * 2; k++) { const a = rot + k / (n * 2) * TAU, rr = k % 2 ? R * 0.72 : R; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fillStyle = fl ? '#ffffff' : col; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = C.ink; ctx.stroke();
}
function drawExtraShape(ctx, type, w, h, o, fill, d) {
  const t = o.t || 0, e = o.e || {}, f = o.face || 1;
  switch (type) {
    case 'bat': {
      const flap = Math.sin(t * 0.45), cx = w / 2, cy = h * 0.55;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + s * 5, cy - 3);
        ctx.lineTo(cx + s * (w / 2), cy - 8 - flap * 7); ctx.lineTo(cx + s * (w / 2 - 4), cy + 2 - flap * 2); ctx.lineTo(cx + s * (w / 2 - 9), cy - 1 - flap * 3); ctx.lineTo(cx + s * 6, cy + 4);
        ctx.closePath(); ctx.fillStyle = fill('#4b3f70'); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, h * 0.36, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx - 4, cy - 12); ctx.lineTo(cx - 1, cy - 7); ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx + 4, cy - 12); ctx.lineTo(cx + 1, cy - 7); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe24a'; ctx.beginPath(); ctx.arc(cx - 3 + f, cy - 1, 1.8, 0, TAU); ctx.arc(cx + 3 + f, cy - 1, 1.8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 2, cy + 3); ctx.lineTo(cx - 1, cy + 6); ctx.lineTo(cx, cy + 3); ctx.moveTo(cx + 2, cy + 3); ctx.lineTo(cx + 1, cy + 6); ctx.lineTo(cx, cy + 3); ctx.fill();
      break;
    }
    case 'mole': {
      const pop = e.pop != null ? e.pop : 1;
      ctx.save(); ctx.beginPath(); ctx.rect(-4, -10, w + 8, h + 6); ctx.clip();
      ctx.translate(0, (1 - pop) * (h + 4));
      ctx.beginPath(); ctx.moveTo(3, h + 2); ctx.lineTo(3, h * 0.45); ctx.quadraticCurveTo(w / 2, -h * 0.25, w - 3, h * 0.45); ctx.lineTo(w - 3, h + 2); ctx.closePath();
      ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.58, w * 0.22, h * 0.16, 0, 0, TAU); ctx.fillStyle = fill('#e8c49a'); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.5, 3, 0, TAU); ctx.fillStyle = '#ff8fb1'; ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.33); ctx.lineTo(w * 0.4, h * 0.33); ctx.moveTo(w * 0.6, h * 0.33); ctx.lineTo(w * 0.7, h * 0.33); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(w / 2, h + 1, w / 2 + 3, 5, 0, Math.PI, 0); ctx.fillStyle = '#8a6440'; ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#6b4c30'; for (const x of [0.25, 0.5, 0.72]) { ctx.beginPath(); ctx.arc(w * x, h - 1, 1.6, 0, TAU); ctx.fill(); }
      break;
    }
    case 'tate': {
      const st = Math.sin(t * 0.25) * h * 0.1;
      ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.78); ctx.lineTo(w * 0.3 + st, h); ctx.moveTo(w * 0.7, h * 0.78); ctx.lineTo(w * 0.7 - st, h); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.5, w / 2 - 3, h * 0.38, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      eyes(ctx, w / 2 - f * 2, h * 0.44, w * 0.13, 2.8, f, true);
      const sx = f > 0 ? w - 9 : -3;
      rrect(ctx, sx, h * 0.12, 12, h * 0.76, 4); ctx.fillStyle = fill('#c9cdd6'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 6, h * 0.24); ctx.lineTo(sx + 6, h * 0.76); ctx.moveTo(sx + 2, h * 0.48); ctx.lineTo(sx + 10, h * 0.48); ctx.strokeStyle = '#e0313f'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = C.ink;
      break;
    }
    case 'frog': {
      ctx.save(); ctx.translate(w / 2, 0); ctx.scale(f, 1); ctx.translate(-w / 2, 0);
      const air = Math.abs(o.vy || 0) > 1;
      ctx.lineWidth = 2; ctx.beginPath();
      if (air) { ctx.moveTo(w * 0.25, h * 0.8); ctx.lineTo(w * 0.05, h * 1.05); ctx.moveTo(w * 0.45, h * 0.85); ctx.lineTo(w * 0.3, h * 1.08); }
      else { ctx.moveTo(w * 0.2, h * 0.75); ctx.quadraticCurveTo(w * 0.05, h * 0.95, w * 0.3, h); ctx.moveTo(w * 0.7, h * 0.8); ctx.lineTo(w * 0.78, h); }
      ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.6, w / 2 - 1, h * 0.36, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      for (const x of [0.42, 0.72]) { ctx.beginPath(); ctx.arc(w * x, h * 0.28, 5, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(w * x + 1, h * 0.28, 2.6, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.beginPath(); ctx.arc(w * x + 1.6, h * 0.28, 1.4, 0, TAU); ctx.fillStyle = C.ink; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(w * 0.55, h * 0.62); ctx.quadraticCurveTo(w * 0.78, h * 0.72, w * 0.95, h * 0.55); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'spitter': {
      const open = (e.recoil || 0) > 0 ? 1 : 0.35;
      ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.quadraticCurveTo(w / 2 - 4, h * 0.7, w / 2, h * 0.45); ctx.strokeStyle = '#2a8a4a'; ctx.lineWidth = 3; ctx.stroke();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w / 2 + s * 7, h * 0.8, 7, 3.5, s * 0.5, 0, TAU); ctx.fillStyle = fill('#5cb85c'); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke(); }
      const cx = w / 2, cy = h * 0.32;
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 0.01; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 6, 4, a, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, TAU); ctx.fillStyle = fill('#ffd166'); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + f * 3, cy + 1, 3.5 * open + 1, 4 * open + 1, 0, 0, TAU); ctx.fillStyle = '#7a2a3a'; ctx.fill();
      break;
    }
    case 'eye': {
      const cx = w / 2, cy = h / 2, R = w / 2 - 1, a = o.aim != null ? o.aim : 0;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * R * 0.8, cy - 2); ctx.quadraticCurveTo(cx + s * (R + 9), cy - 12 + Math.sin(t * 0.3) * 3, cx + s * (R + 6), cy + 4); ctx.closePath(); ctx.fillStyle = fill('#d9c2f0'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = fill('#ffffff'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(224,49,63,0.6)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const b of [0.6, 2.4, 4]) { ctx.moveTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.lineTo(cx + Math.cos(b + 0.2) * R * 0.65, cy + Math.sin(b + 0.2) * R * 0.65); }
      ctx.stroke(); ctx.strokeStyle = C.ink;
      const ix = cx + Math.cos(a) * R * 0.38, iy = cy + Math.sin(a) * R * 0.38;
      ctx.beginPath(); ctx.arc(ix, iy, R * 0.45, 0, TAU); ctx.fillStyle = fill('#c46be0'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(ix, iy, R * 0.22, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
      ctx.beginPath(); ctx.arc(ix - 2, iy - 2, 1.6, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      break;
    }
    case 'dropper': {
      const flap = Math.sin(t * 0.4), cx = w / 2, cy = h * 0.5;
      ctx.beginPath(); ctx.moveTo(cx - 4, cy - 2); ctx.lineTo(cx - 14, cy - 12 - flap * 6); ctx.lineTo(cx + 4, cy - 4); ctx.closePath(); ctx.fillStyle = fill('#a9d6f2'); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.36, h * 0.38, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + f * w * 0.32, cy - 3); ctx.lineTo(cx + f * w * 0.52, cy); ctx.lineTo(cx + f * w * 0.32, cy + 3); ctx.closePath(); ctx.fillStyle = '#ffb020'; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + f * 6, cy - 3, 2.2, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 4, cy - 2); ctx.lineTo(cx + 14, cy - 12 + flap * 6); ctx.lineTo(cx - 4, cy - 4); ctx.closePath(); ctx.fillStyle = fill('#a9d6f2'); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      if (!(e.timer > 0)) { ctx.beginPath(); ctx.arc(cx, h + 3, 6, 0, TAU); ctx.fillStyle = '#a59c8e'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); }
      break;
    }
    case 'ninja': {
      ctx.beginPath(); ctx.moveTo(w * 0.32, h * 0.8); ctx.lineTo(w * 0.3, h); ctx.moveTo(w * 0.68, h * 0.8); ctx.lineTo(w * 0.7, h); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.5, w / 2 - 1, h * 0.38, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      rrect(ctx, 3, h * 0.33, w - 6, h * 0.17, 3); ctx.fillStyle = fill('#f5e6c8'); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.fillRect(w / 2 - 6 + f * 2, h * 0.39, 4, 2.4); ctx.fillRect(w / 2 + 2 + f * 2, h * 0.39, 4, 2.4);
      ctx.beginPath(); ctx.moveTo(w / 2 - f * (w / 2 - 2), h * 0.22); ctx.quadraticCurveTo(w / 2 - f * (w / 2 + 8), h * 0.14 + Math.sin(t * 0.3) * 3, w / 2 - f * (w / 2 + 12), h * 0.28); ctx.strokeStyle = '#e0313f'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = C.ink;
      rrect(ctx, 2, h * 0.17, w - 4, 5, 2); ctx.fillStyle = fill('#e0313f'); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      break;
    }
    case 'puffer': {
      const cx = w / 2, cy = h / 2, big = w > 34, R = Math.min(w, h) / 2 - 1;
      if (big) spikyBall(ctx, cx, cy, R + 4, 10, t * 0.02, '#f7d77a', o.flash);
      ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 1, h / 2 - 1, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.18, w * 0.3, h * 0.18, 0, 0, Math.PI); ctx.fillStyle = fill('#fff5d6'); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - f * (w / 2 - 1), cy); ctx.lineTo(cx - f * (w / 2 + 6), cy - 6); ctx.lineTo(cx - f * (w / 2 + 6), cy + 6); ctx.closePath(); ctx.fillStyle = fill('#e8a83a'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      eyes(ctx, cx + f * 3, cy - h * 0.1, w * 0.13, big ? 3.6 : 2.6, f, big);
      ctx.beginPath(); ctx.arc(cx + f * w * 0.3, cy + 3, big ? 3 : 2, 0, TAU); ctx.lineWidth = 1.4; ctx.stroke();
      break;
    }
    case 'jelly': {
      ctx.strokeStyle = 'rgba(160,80,140,0.8)'; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let k = 0; k < 4; k++) { const x = w * (0.2 + k * 0.2); ctx.moveTo(x, h * 0.5); ctx.quadraticCurveTo(x + Math.sin(t * 0.1 + k) * 4, h * 0.75, x + Math.sin(t * 0.1 + k + 1) * 3, h); }
      ctx.stroke(); ctx.strokeStyle = C.ink;
      ctx.beginPath(); ctx.moveTo(1, h * 0.55); ctx.quadraticCurveTo(w / 2, -h * 0.25, w - 1, h * 0.55); ctx.quadraticCurveTo(w / 2, h * 0.68, 1, h * 0.55); ctx.closePath();
      ctx.fillStyle = fill('rgba(245,166,214,0.9)'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(w * 0.38, h * 0.32, 1.8, 0, TAU); ctx.arc(w * 0.62, h * 0.32, 1.8, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffe24a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(w * 0.8, h * 0.1); ctx.lineTo(w * 0.9, h * 0.2); ctx.lineTo(w * 0.84, h * 0.24); ctx.lineTo(w * 0.96, h * 0.34); ctx.stroke(); ctx.strokeStyle = C.ink;
      break;
    }
    case 'ufo': {
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.42, w * 0.24, h * 0.36, 0, Math.PI, 0); ctx.fillStyle = 'rgba(160,220,255,0.8)'; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.32, 4, 0, TAU); ctx.fillStyle = '#7ddc94'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.6, w / 2 - 1, h * 0.26, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(w * (0.18 + k * 0.16), h * 0.62, 2.2, 0, TAU); ctx.fillStyle = ((t >> 3) + k) % 2 ? '#ffe24a' : '#ff7fa6'; ctx.fill(); }
      break;
    }
    case 'snowman': {
      ctx.beginPath(); ctx.arc(w / 2, h * 0.7, w * 0.45, 0, TAU); ctx.fillStyle = fill('#ffffff'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.32, w * 0.32, 0, TAU); ctx.fillStyle = fill('#ffffff'); ctx.fill(); ctx.stroke();
      const arm = (e.recoil || 0) > 0 ? -1 : 0.3;
      ctx.beginPath(); ctx.moveTo(w / 2 + f * w * 0.35, h * 0.62); ctx.lineTo(w / 2 + f * w * 0.62, h * (0.55 + arm * 0.2)); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = C.ink;
      rrect(ctx, w * 0.26, h * 0.02, w * 0.48, h * 0.14, 2); ctx.fillStyle = fill('#e0313f'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(w * 0.42 + f * 2, h * 0.3, 1.8, 0, TAU); ctx.arc(w * 0.58 + f * 2, h * 0.3, 1.8, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w / 2 + f * 2, h * 0.36); ctx.lineTo(w / 2 + f * 11, h * 0.39); ctx.lineTo(w / 2 + f * 2, h * 0.42); ctx.closePath(); ctx.fillStyle = '#ff9a3d'; ctx.fill();
      ctx.fillStyle = C.ink; for (const y of [0.62, 0.74, 0.86]) { ctx.beginPath(); ctx.arc(w / 2, h * y, 1.6, 0, TAU); ctx.fill(); }
      break;
    }
    case 'catapult': {
      const sq = (e.recoil || 0) / 12;
      rrect(ctx, 0, h - 4, w, 4, 2); ctx.fillStyle = fill('#5a6072'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      const top = 1 + sq * 5;
      ctx.beginPath(); for (let i = 0; i <= 4; i++) { const x = w * 0.2 + (i % 2) * w * 0.6, y = h - 4 - (h - 4 - top - 4) * i / 4; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.lineWidth = 1.8; ctx.stroke();
      rrect(ctx, 2, top, w - 4, 5, 2); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(w * 0.36, top + 2.5); ctx.lineTo(w * 0.5, top - 3); ctx.lineTo(w * 0.5, top + 2.5); ctx.fill();
      break;
    }
    case 'pendulum': {
      const a = o.rot || 0, L = 80, bx = w / 2 + Math.sin(a) * L, by = h / 2 + Math.cos(a) * L;
      ctx.strokeStyle = '#6b7080'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = C.ink;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 6, 0, TAU); ctx.fillStyle = '#5a6072'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      spikyBall(ctx, bx, by, 15, 8, a * 2, '#7a8091', false);
      ctx.beginPath(); ctx.arc(bx, by, 9, 0, TAU); ctx.fillStyle = '#5a6072'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx - 3, by - 3, 2.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      break;
    }
    case 'piston': {
      const ext = o.ext != null ? o.ext : (e.ext || 0);
      if (ext > 0) {
        const x0 = f > 0 ? w : -ext;
        ctx.fillStyle = '#9aa1b3'; ctx.fillRect(x0, 11, ext, 6); ctx.lineWidth = 1.5; ctx.strokeRect(x0, 11, ext, 6);
        rrect(ctx, f > 0 ? w + ext - 14 : -ext - 2, 4, 16, 20, 5); ctx.fillStyle = '#e0313f'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      }
      rrect(ctx, 1, 1, w - 2, h - 2, 4); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2 - f * 5, h * 0.35); ctx.lineTo(w / 2 + f * 5, h * 0.5); ctx.lineTo(w / 2 - f * 5, h * 0.65); ctx.lineWidth = 2.4; ctx.stroke();
      break;
    }
    case 'mine': {
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.7, w / 2 - 1, h * 0.45, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.3, 2.6, 0, TAU); ctx.fillStyle = (t >> 4) % 2 ? '#ff3b4f' : '#7a1c26'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      break;
    }
    case 'geyser': {
      rrect(ctx, 0, 2, w, h - 2, 3); ctx.fillStyle = fill('#4a5a6e'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, 4, w * 0.3, 2.5, 0, 0, TAU); ctx.fillStyle = '#3e8fd6'; ctx.fill();
      break;
    }
    case 'blackhole': {
      const cx = w / 2, cy = h / 2, r = o.rot || 0;
      ctx.beginPath(); ctx.arc(cx, cy, w / 2 + 3, 0, TAU); ctx.fillStyle = 'rgba(138,108,200,0.35)'; ctx.fill();
      ctx.strokeStyle = '#8a6cc8'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, w / 2 - k * 3, r + k * 2, r + k * 2 + Math.PI * 1.2); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.26, 0, TAU); ctx.fillStyle = d.color; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
      break;
    }
    case 'arrow': {
      rrect(ctx, 1, 1, w - 2, h - 2, 3); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(36,37,43,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(3, h * 0.35); ctx.lineTo(w - 3, h * 0.35); ctx.moveTo(3, h * 0.7); ctx.lineTo(w - 3, h * 0.7); ctx.stroke(); ctx.strokeStyle = C.ink;
      const mx = f > 0 ? w - 2 : 2, rec = (e.recoil || 0) > 0 ? 0 : 5;
      ctx.beginPath(); ctx.arc(mx, h / 2, 5, 0, TAU); ctx.fillStyle = '#2f333f'; ctx.fill();
      if (rec) { ctx.beginPath(); ctx.moveTo(mx, h / 2); ctx.lineTo(mx + f * rec, h / 2 - 3); ctx.lineTo(mx + f * rec, h / 2 + 3); ctx.closePath(); ctx.fillStyle = '#c9cdd6'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); }
      break;
    }
    case 'sawv': drawEnemyShape(ctx, 'saw', w, h, o); break;
    case 'spikeball': {
      spikyBall(ctx, w / 2, h / 2, w / 2 + 2, 9, o.rot || 0, '#d9dce4', o.flash);
      ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.32, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2 - 3, h / 2 - 3, 2.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      break;
    }
    case 'homing': {
      const aim = o.aim != null ? o.aim : -Math.PI / 4, rec = o.recoil || 0;
      ctx.save(); ctx.translate(w / 2, h * 0.45); ctx.rotate(aim);
      rrect(ctx, -4 - rec * 0.6, -7, 24, 14, 6); ctx.fillStyle = fill('#e8eef5'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(19 - rec * 0.6, 0, 4, -Math.PI / 2, Math.PI / 2); ctx.fillStyle = '#e0313f'; ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(1, h); ctx.lineTo(1, h * 0.55); ctx.quadraticCurveTo(w / 2, h * 0.02, w - 1, h * 0.55); ctx.lineTo(w - 1, h); ctx.closePath();
      ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.66, 4.5, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.66, 2, 0, TAU); ctx.fillStyle = '#e0313f'; ctx.fill();
      break;
    }
  }
}
// 敵の後ろ（front=false）・前（front=true）に描く予告線など
function drawExtraEnemyExtras(e, front) {
  const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  if (!front) {
    if (e.type === 'geyser' && e.wh > 0) {
      const top = e.y - e.wh, ww = e.w - 4;
      g.save(); g.fillStyle = 'rgba(126,196,240,0.75)'; g.fillRect(e.x + 2, top, ww, e.wh + 2);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath();
      for (let k = 0; k < 2; k++) { const x = e.x + 6 + k * 10, o = (tick * 4 + k * 13) % 30; for (let y = top + o; y < e.y; y += 30) { g.moveTo(x, y); g.lineTo(x, Math.min(e.y, y + 12)); } }
      g.stroke();
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(e.x + 2 + ww * (k + 0.5) / 3, top + Math.sin(tick * 0.4 + k) * 2, 6, 0, TAU); g.fillStyle = 'rgba(200,232,252,0.9)'; g.fill(); }
      g.restore();
    }
    if (e.type === 'sawv' && e.spawnT <= 0) {
      g.save(); g.setLineDash([3, 5]); g.strokeStyle = 'rgba(36,37,43,0.3)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(ecx, e.homeY - 90 + e.h / 2); g.lineTo(ecx, e.homeY + 90 + e.h / 2); g.stroke(); g.restore();
    }
    if (e.type === 'blackhole' && e.spawnT <= 0) {
      g.save(); g.setLineDash([4, 8]); g.lineDashOffset = tick * 0.6; g.strokeStyle = 'rgba(138,108,200,0.35)'; g.lineWidth = 2;
      g.beginPath(); g.arc(ecx, ecy, 190, 0, TAU); g.stroke(); g.restore();
    }
    if (e.type === 'ufo' && e.beam) {
      g.save(); g.globalAlpha = 0.35 + Math.sin(tick * 0.5) * 0.1;
      g.beginPath(); g.moveTo(ecx - 12, e.y + e.h - 2); g.lineTo(ecx + 12, e.y + e.h - 2); g.lineTo(ecx + 30, e.y + e.h + 320); g.lineTo(ecx - 30, e.y + e.h + 320); g.closePath();
      g.fillStyle = '#fff3a0'; g.fill(); g.restore();
    }
    return;
  }
  if (e.type === 'eye' && e.spawnT <= 0 && e.cyc >= 50 && e.cyc < 130) {
    const len = 340, fast = e.cyc >= 110;
    g.save(); g.setLineDash([5, 6]); g.lineDashOffset = -tick * 2;
    g.strokeStyle = (tick >> (fast ? 1 : 3)) % 2 ? 'rgba(209,41,63,0.85)' : 'rgba(209,41,63,0.3)'; g.lineWidth = fast ? 2.5 : 1.6;
    g.beginPath(); g.moveTo(ecx + Math.cos(e.aim) * 16, ecy + Math.sin(e.aim) * 16); g.lineTo(ecx + Math.cos(e.aim) * len, ecy + Math.sin(e.aim) * len); g.stroke(); g.restore();
  }
  if (e.type === 'mole' && e.hide && e.spawnT <= 0 && (tick >> 4) % 2) {
    g.save(); g.fillStyle = 'rgba(36,37,43,0.35)'; g.font = `${Math.round(12 * TXS)}px ${FONT}`; g.textAlign = 'center'; g.fillText('…', ecx, e.y + 6); g.restore();
  }
}
// 追加の弾。描いたら true
function drawExtraBullet(b) {
  if (b.kind === 'seed') {
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.beginPath(); g.ellipse(0, 0, b.r, b.r * 0.7, 0, 0, TAU); g.fillStyle = '#8a5a2b'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.moveTo(-b.r * 0.4, 0); g.lineTo(b.r * 0.4, 0); g.strokeStyle = '#d9b07a'; g.stroke(); g.restore(); return true;
  }
  if (b.kind === 'snow') {
    g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#7ec8e3'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.arc(b.x - 2, b.y - 2, 2, 0, TAU); g.fillStyle = '#d6efff'; g.fill(); return true;
  }
  if (b.kind === 'shuri') {
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.beginPath();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr = k % 2 ? b.r * 0.35 : b.r * 1.2; if (k) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = '#9aa1b3'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fillStyle = C.ink; g.fill(); g.restore(); return true;
  }
  if (b.kind === 'arrow') {
    const s = Math.sign(b.vx) || 1;
    g.save(); g.lineCap = 'round'; g.strokeStyle = '#8a6440'; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x - s * 14, b.y); g.lineTo(b.x + s * 4, b.y); g.stroke();
    g.beginPath(); g.moveTo(b.x + s * 9, b.y); g.lineTo(b.x + s * 2, b.y - 4); g.lineTo(b.x + s * 2, b.y + 4); g.closePath(); g.fillStyle = '#c9cdd6'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = '#e0313f'; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x - s * 14, b.y - 3); g.lineTo(b.x - s * 10, b.y); g.lineTo(b.x - s * 14, b.y + 3); g.stroke(); g.restore(); return true;
  }
  if (b.kind === 'missile') {
    g.save(); g.translate(b.x, b.y); g.rotate(Math.atan2(b.vy, b.vx));
    g.beginPath(); g.moveTo(-10, 0); g.lineTo(-15 - Math.random() * 4, -2.5); g.lineTo(-15 - Math.random() * 4, 2.5); g.closePath(); g.fillStyle = '#ffb020'; g.fill();
    rrect(g, -10, -4.5, 18, 9, 4); g.fillStyle = '#e8eef5'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.arc(6, 0, 3.5, -Math.PI / 2, Math.PI / 2); g.fillStyle = '#e0313f'; g.fill(); g.restore(); return true;
  }
  return false;
}
// 追加の塗りマス（ペン）。描いたら true
function drawExtraPaintCell(ctx, kind, cx, cy, rad, hp) {
  if (kind === 11) {
    const s = rad * 0.9; rrect(ctx, cx - s, cy - s, s * 2, s * 2, 2);
    ctx.fillStyle = '#3d4250'; ctx.fill(); ctx.strokeStyle = '#1d2028'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy - s * 0.6); ctx.lineTo(cx + s * 0.6, cy - s * 0.6); ctx.stroke();
    if (hp < 6) { ctx.strokeStyle = '#eef0f5'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy); ctx.lineTo(cx, cy + s * 0.2); ctx.lineTo(cx + s * 0.4, cy - s * 0.3); if (hp < 3) { ctx.moveTo(cx, cy + s * 0.2); ctx.lineTo(cx + s * 0.2, cy + s * 0.65); } ctx.stroke(); }
    return true;
  }
  if (kind === 12) {
    ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy + rad * 0.15, rad * 0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,122,61,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath();
    const o = Math.sin(tick * 0.2 + cx) * 2; ctx.moveTo(cx - 3, cy - rad - 1); ctx.quadraticCurveTo(cx - 6 + o, cy - rad - 5, cx - 3, cy - rad - 9); ctx.stroke();
    return true;
  }
  if (kind === 13) {
    const s = rad * 0.86; rrect(ctx, cx - s, cy - s, s * 2, s * 2, 4);
    ctx.fillStyle = 'rgba(199,211,230,0.7)'; ctx.fill(); ctx.strokeStyle = 'rgba(90,96,114,0.7)'; ctx.lineWidth = 1.3; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    return true;
  }
  if (kind === 14) {
    ctx.fillStyle = '#ff5ca8'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath();
    ctx.moveTo(cx - rad * 0.5, cy - rad * 0.3); ctx.lineTo(cx - rad * 0.15, cy); ctx.lineTo(cx - rad * 0.5, cy + rad * 0.3);
    ctx.moveTo(cx + rad * 0.5, cy - rad * 0.3); ctx.lineTo(cx + rad * 0.15, cy); ctx.lineTo(cx + rad * 0.5, cy + rad * 0.3); ctx.stroke();
    return true;
  }
  return false;
}
// 追加カードのアイコン（絵だけでは伝わりにくいもの）。描いたら true
function drawExtraIcon(ctx, id, W, H) {
  const k = H / 38;
  const shape = (type, x, y, s, o) => { const e = ETYPES[type]; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawEnemyShape(ctx, type, e.w, e.h, Object.assign({ t: 0, face: 1 }, o)); ctx.restore(); };
  switch (id) {
    case 'slip': {
      rrect(ctx, W * 0.12, H * 0.62, W * 0.76, H * 0.16, 4); ctx.fillStyle = '#9fe0f4'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.2, H * 0.7); ctx.lineTo(W * 0.32, H * 0.66); ctx.moveTo(W * 0.55, H * 0.71); ctx.lineTo(W * 0.68, H * 0.66); ctx.stroke();
      ctx.strokeStyle = C.runner; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(W * 0.25, H * 0.42); ctx.lineTo(W * 0.7, H * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.76, H * 0.42); ctx.lineTo(W * 0.67, H * 0.34); ctx.lineTo(W * 0.67, H * 0.5); ctx.closePath(); ctx.fillStyle = C.runner; ctx.fill();
      ctx.strokeStyle = 'rgba(232,48,95,0.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(W * 0.1, H * (0.28 + i * 0.1)); ctx.lineTo(W * 0.2, H * (0.28 + i * 0.1)); } ctx.stroke();
      return true;
    }
    case 'float': {
      for (const [x, y, r] of [[0.3, 0.6, 0.13], [0.55, 0.38, 0.17], [0.76, 0.66, 0.1]]) { ctx.beginPath(); ctx.arc(W * x, H * y, H * r, 0, TAU); ctx.fillStyle = 'rgba(160,220,255,0.45)'; ctx.fill(); ctx.strokeStyle = '#3e8fd6'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.arc(W * x - H * r * 0.35, H * y - H * r * 0.35, H * r * 0.25, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
      ctx.strokeStyle = C.builder; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(W * 0.14, H * 0.9); ctx.lineTo(W * 0.14, H * 0.2); ctx.moveTo(W * 0.08, H * 0.3); ctx.lineTo(W * 0.14, H * 0.18); ctx.lineTo(W * 0.2, H * 0.3); ctx.stroke();
      return true;
    }
    case 'seal': {
      ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.75); ctx.lineTo(W * 0.62, H * 0.2); ctx.strokeStyle = '#9aa1b3'; ctx.lineWidth = 5 * k; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.75); ctx.lineTo(W * 0.62, H * 0.2); ctx.strokeStyle = '#e8eef5'; ctx.lineWidth = 2.6 * k; ctx.stroke();
      rrect(ctx, W * 0.22, H * 0.66, W * 0.18, H * 0.12, 3); ctx.fillStyle = '#a0703f'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.4, 0, TAU); ctx.moveTo(W / 2 - H * 0.28, H / 2 - H * 0.28); ctx.lineTo(W / 2 + H * 0.28, H / 2 + H * 0.28); ctx.strokeStyle = C.bad; ctx.lineWidth = 3 * k; ctx.stroke();
      return true;
    }
    case 'pendulum': {
      const s = H / 112; ctx.save(); ctx.translate(W / 2 - 8 * s, H * 0.04); ctx.scale(s, s);
      drawEnemyShape(ctx, 'pendulum', 16, 16, { rot: 0.55 }); ctx.restore();
      ctx.strokeStyle = 'rgba(36,37,43,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(W / 2, H * 0.11, H * 0.72, Math.PI * 0.25, Math.PI * 0.75); ctx.stroke(); ctx.setLineDash([]);
      return true;
    }
    case 'geyser': {
      const s = H / 34; ctx.save(); ctx.translate(W / 2 - 12 * s, H * 0.82); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(126,196,240,0.85)'; ctx.fillRect(2, -24, 20, 26);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(5 + i * 7, -24, 5, 0, TAU); ctx.fillStyle = 'rgba(200,232,252,1)'; ctx.fill(); }
      drawEnemyShape(ctx, 'geyser', 24, 12, {}); ctx.restore();
      return true;
    }
    case 'ufo': {
      ctx.beginPath(); ctx.moveTo(W / 2 - 6 * k, H * 0.45); ctx.lineTo(W / 2 + 6 * k, H * 0.45); ctx.lineTo(W / 2 + 14 * k, H * 0.95); ctx.lineTo(W / 2 - 14 * k, H * 0.95); ctx.closePath(); ctx.fillStyle = 'rgba(255,243,160,0.8)'; ctx.fill();
      shape('ufo', W / 2 - 25 * k * 0.9, H * 0.08, k * 0.9, { t: 8 });
      return true;
    }
    case 'piston': {
      const s = H / 40; shape('piston', W * 0.12, H / 2 - 15 * s, s, { ext: 34 });
      return true;
    }
    case 'eye': {
      ctx.strokeStyle = 'rgba(209,41,63,0.8)'; ctx.lineWidth = 1.8; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(W * 0.4, H * 0.5); ctx.lineTo(W * 0.95, H * 0.75); ctx.stroke(); ctx.setLineDash([]);
      const s = H / 38; shape('eye', W * 0.1, H / 2 - 15 * s, s, { aim: 0.45 });
      return true;
    }
    case 'blackhole': {
      ctx.strokeStyle = 'rgba(138,108,200,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.45, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const s = H / 40; shape('blackhole', W / 2 - 14 * s, H / 2 - 14 * s, s, { rot: 0.5 });
      return true;
    }
  }
  return false;
}
