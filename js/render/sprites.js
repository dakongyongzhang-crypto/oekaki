'use strict';

/* =====================================================
   描画の基本（角丸・手描き線）と敵のスプライト
   ===================================================== */
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function jit(x, y) { return (hash2(Math.round(x) * 7 + 3, Math.round(y) * 13 + 5) - 0.5) * 2.4; }
function wline(ctx, x0, y0, x1, y1) {
  const ax = x0 + jit(x0, y0), ay = y0 + jit(y0, x0), bx = x1 + jit(x1, y1), by = y1 + jit(y1, x1);
  const mx = (x0 + x1) / 2 + jit(x0 + x1, y0 + y1) * 0.8, my = (y0 + y1) / 2 + jit(y0 + y1, x0 + x1) * 0.8;
  ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by);
}
function eyes(ctx, cx, cy, sp, er, face, angry) {
  for (const s of [-1, 1]) {
    const ex = cx + s * sp;
    ctx.beginPath(); ctx.arc(ex, cy, er, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(ex + (face || 0) * er * 0.4, cy + 0.4, er * 0.48, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
    if (angry) { ctx.beginPath(); ctx.moveTo(ex + s * er * 1.1, cy - er * 1.9); ctx.lineTo(ex - s * er * 0.9, cy - er * 1.2); ctx.lineWidth = 1.8; ctx.stroke(); }
  }
}
function drawFlame(ctx, x, base, w, hh, t) {
  if (hh <= 0) return;
  const fl = Math.sin(t * 0.7) * 3;
  for (const [col, sc] of [['#ff7a3d', 1], ['#ffd166', 0.6]]) {
    const ww = w * sc, xx = x + (w - ww) / 2, h2 = hh * (sc === 1 ? 1 : 0.7);
    ctx.beginPath(); ctx.moveTo(xx, base);
    ctx.quadraticCurveTo(xx - ww * 0.25, base - h2 * 0.55, xx + ww / 2 + fl, base - h2);
    ctx.quadraticCurveTo(xx + ww * 1.25, base - h2 * 0.55, xx + ww, base);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
}
function drawEnemyShape(ctx, type, w, h, o = {}) {
  const t = o.t || 0, fl = !!o.flash, d = ETYPES[type];
  const fill = c => fl ? '#ffffff' : c;
  ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch (type) {
    case 'walker': case 'giant': case 'mini': case 'spiny': {
      const st = Math.sin(t * (type === 'mini' ? 0.45 : 0.25)) * h * 0.12;
      const lw = type === 'giant' ? 3 : 2;
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.78); ctx.lineTo(w * 0.3 + st, h); ctx.moveTo(w * 0.7, h * 0.78); ctx.lineTo(w * 0.7 - st, h); ctx.stroke();
      if (type === 'spiny') {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = Math.PI * (1.12 + k * 0.19), ca = Math.cos(a), sa = Math.sin(a);
          const bx = w / 2 + ca * (w / 2 - 3), by = h * 0.47 + sa * (h * 0.4 - 2);
          const tx = w / 2 + ca * (w / 2 + 5), ty = h * 0.47 + sa * (h * 0.4 + 7);
          ctx.moveTo(bx - 3.5 * sa, by + 3.5 * ca); ctx.lineTo(tx, ty); ctx.lineTo(bx + 3.5 * sa, by - 3.5 * ca); ctx.closePath();
        }
        ctx.fillStyle = fill('#f4f4f6'); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.47, w / 2 - 1, h * 0.4, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
      eyes(ctx, w / 2, h * 0.43, w * 0.17, clamp(w * 0.11, 2.2, 5.5), o.face, true);
      if (type === 'giant') {
        ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.66);
        for (let k = 0; k < 4; k++) { ctx.lineTo(w * (0.395 + k * 0.07), h * 0.72); ctx.lineTo(w * (0.43 + k * 0.07), h * 0.66); }
        ctx.stroke();
      }
      break;
    }
    case 'hopper': {
      const stretch = clamp(-(o.vy || 0) * 0.04, -0.15, 0.3);
      const bodyR = w * 0.4, springTop = h * 0.62 - stretch * h * 0.3;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const y = h - (h - springTop) * i / 5; const x = w / 2 + (i === 0 || i === 5 ? 0 : (i % 2 ? 5 : -5)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      const by = springTop - bodyR + 3;
      ctx.beginPath(); ctx.arc(w / 2, by, bodyR, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      eyes(ctx, w / 2, by - 1, bodyR * 0.42, 3, o.face, false);
      ctx.beginPath(); ctx.arc(w / 2, by + 4, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 1.5; ctx.stroke();
      break;
    }
    case 'flyer': {
      const flap = Math.sin(t * 0.35), cx = w / 2, cy = h * 0.58, r = h * 0.36;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + s * r * 0.5, cy - 2); ctx.lineTo(cx + s * (w / 2 + 1), cy - 7 - flap * 8); ctx.lineTo(cx + s * (w / 2 - 5), cy + 4 - flap * 3); ctx.closePath();
        ctx.fillStyle = fill('#fde8cc'); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      eyes(ctx, cx, cy - 1, r * 0.42, 2.7, o.face, true);
      break;
    }
    case 'bee': {
      const flap = Math.sin(t * 0.9), f = o.face || 1;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.22 - flap * 2, w * 0.2, h * 0.26, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.22 + flap * 2, w * 0.18, h * 0.24, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.ellipse(w / 2, h * 0.62, w / 2 - 1, h * 0.36, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.clip();
      ctx.fillStyle = C.ink; ctx.fillRect(w * 0.36, 0, w * 0.12, h); ctx.fillRect(w * 0.6, 0, w * 0.1, h); ctx.restore();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.62, w / 2 - 1, h * 0.36, 0, 0, TAU); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(w / 2 + f * w * 0.3, h * 0.56, 1.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w / 2 - f * (w / 2 - 1), h * 0.54); ctx.lineTo(w / 2 - f * (w / 2 + 4), h * 0.63); ctx.lineTo(w / 2 - f * (w / 2 - 1), h * 0.72); ctx.fill();
      break;
    }
    case 'boulder': {
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(o.rot || 0);
      const R = w / 2 - 1; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, rr = R * (0.9 + 0.05 * ((k * 7) % 3)); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 0.2); ctx.lineTo(-R * 0.1, R * 0.05); ctx.lineTo(-R * 0.2, R * 0.45); ctx.moveTo(R * 0.3, -R * 0.55); ctx.lineTo(R * 0.45, -R * 0.15); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'charger': {
      const f = o.face || 1;
      ctx.save(); ctx.translate(w / 2, 0); ctx.scale(f, 1); ctx.translate(-w / 2, 0);
      const st = o.mode === 'dash' ? Math.sin(t * 0.9) * 4 : Math.sin(t * 0.2) * 1.2;
      ctx.beginPath(); for (const lx of [0.22, 0.38, 0.6, 0.74]) { ctx.moveTo(w * lx, h * 0.7); ctx.lineTo(w * lx + st * (lx < 0.5 ? 1 : -1), h); } ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.46, h * 0.5, w * 0.42, h * 0.34, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.58, h * 0.22); ctx.lineTo(w * 0.66, h * 0.03); ctx.lineTo(w * 0.73, h * 0.24); ctx.closePath(); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.88, h * 0.56, w * 0.09, h * 0.15, 0, 0, TAU); ctx.fillStyle = fill('#f5c9a0'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.8, h * 0.7); ctx.quadraticCurveTo(w * 0.94, h * 0.78, w * 0.97, h * 0.55); ctx.lineTo(w * 0.87, h * 0.68); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(w * 0.72, h * 0.42, 2.2, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
      ctx.beginPath(); ctx.moveTo(w * 0.64, h * 0.3); ctx.lineTo(w * 0.79, h * 0.36); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'crusher': {
      rrect(ctx, 1, 1, w - 2, h - 2, 4); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(36,37,43,0.45)'; ctx.beginPath();
      ctx.moveTo(5, 5); ctx.lineTo(9, 9); ctx.moveTo(w - 5, 5); ctx.lineTo(w - 9, 9); ctx.moveTo(5, h - 5); ctx.lineTo(9, h - 9); ctx.moveTo(w - 5, h - 5); ctx.lineTo(w - 9, h - 9); ctx.stroke();
      ctx.strokeStyle = C.ink; eyes(ctx, w / 2, h * 0.4, w * 0.18, 3.6, o.face, true);
      rrect(ctx, w * 0.28, h * 0.62, w * 0.44, h * 0.16, 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); for (let k = 1; k < 4; k++) { const x = w * 0.28 + w * 0.44 * k / 4; ctx.moveTo(x, h * 0.62); ctx.lineTo(x, h * 0.78); } ctx.stroke();
      break;
    }
    case 'ghost': {
      ctx.beginPath(); ctx.moveTo(2, h * 0.45); ctx.arc(w / 2, h * 0.45, w / 2 - 2, Math.PI, 0); ctx.lineTo(w - 2, h - 4);
      const seg = (w - 4) / 4; let x = w - 2;
      for (let k = 0; k < 4; k++) { const nx = x - seg; ctx.quadraticCurveTo(x - seg / 2, h + (k % 2 ? -6 : 2) + Math.sin(t * 0.15 + k) * 2, nx, h - 4); x = nx; }
      ctx.closePath(); ctx.fillStyle = fill('rgba(255,255,255,0.92)'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      const f = (o.face || 0) * 2; ctx.fillStyle = C.ink; ctx.beginPath();
      ctx.moveTo(w * 0.37 + f + 2.6, h * 0.42); ctx.ellipse(w * 0.37 + f, h * 0.42, 2.6, 4, 0, 0, TAU);
      ctx.moveTo(w * 0.63 + f + 2.6, h * 0.42); ctx.ellipse(w * 0.63 + f, h * 0.42, 2.6, 4, 0, 0, TAU);
      ctx.moveTo(w * 0.5 + f + 3, h * 0.64); ctx.ellipse(w * 0.5 + f, h * 0.64, 3, 3.6, 0, 0, TAU); ctx.fill();
      break;
    }
    case 'spike': {
      const n = 4, tw = w / n;
      ctx.beginPath();
      for (let i = 0; i < n; i++) { ctx.moveTo(i * tw + 1, h); ctx.lineTo(i * tw + tw / 2, 1); ctx.lineTo((i + 1) * tw - 1, h); ctx.closePath(); }
      ctx.fillStyle = fill('#d9dce4'); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.lineWidth = 2.4; ctx.stroke();
      break;
    }
    case 'cannon': case 'triple': {
      const aim = o.aim != null ? o.aim : -Math.PI / 4, rec = o.recoil || 0;
      const barrels = type === 'triple' ? [-0.32, 0, 0.32] : [0];
      for (const da of barrels) {
        ctx.save(); ctx.translate(w / 2, h * 0.45); ctx.rotate(aim + da);
        ctx.beginPath(); ctx.rect(-4 - rec * 0.6, type === 'triple' ? -4.5 : -6, type === 'triple' ? 21 : 23, type === 'triple' ? 9 : 12);
        ctx.fillStyle = fill('#4a4e5a'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(1, h); ctx.lineTo(1, h * 0.55); ctx.quadraticCurveTo(w / 2, h * 0.02, w - 1, h * 0.55); ctx.lineTo(w - 1, h); ctx.closePath();
      ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, h * 0.64, 3.6, 0, TAU); ctx.fillStyle = fill('#ffd166'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      if (type === 'triple') { ctx.beginPath(); ctx.arc(w * 0.25, h * 0.82, 2, 0, TAU); ctx.arc(w * 0.75, h * 0.82, 2, 0, TAU); ctx.fillStyle = C.ink; ctx.fill(); }
      break;
    }
    case 'bomb': {
      const R = w / 2 - 1, cx = w / 2, cy = h - R - 1;
      ctx.beginPath(); ctx.moveTo(cx + R * 0.35, cy - R * 0.85); ctx.quadraticCurveTo(cx + R * 0.6, cy - R * 1.4, cx + R * 0.95, cy - R * 1.2); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - R * 0.35, cy - R * 0.35, R * 0.22, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
      const sx = cx + R * 0.95, sy = cy - R * 1.2, sp = 3 + Math.sin(t * 0.8) * 1.5;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr = k % 2 ? sp * 0.45 : sp * 1.4; const x = sx + Math.cos(a) * rr, y = sy + Math.sin(a) * rr; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fillStyle = '#ffb020'; ctx.fill();
      break;
    }
    case 'saw': {
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(o.rot || 0);
      const R = w / 2 - 1; ctx.beginPath();
      for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, rr = k % 2 ? R * 0.78 : R; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fillStyle = '#cfd3dc'; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, TAU); ctx.fillStyle = '#6b7080'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R * 0.6, 0); ctx.lineTo(-R * 0.38, 0); ctx.moveTo(R * 0.38, 0); ctx.lineTo(R * 0.6, 0); ctx.lineWidth = 1.3; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'fire': {
      rrect(ctx, 0, 2, w, h - 2, 3); ctx.fillStyle = fill('#4a4e5a'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(w * k / 4, 5); ctx.lineTo(w * k / 4, h - 2); } ctx.lineWidth = 1.2; ctx.strokeStyle = '#ff9a5a'; ctx.stroke();
      break;
    }
    case 'firebar': {
      const cx = w / 2, cy = h / 2, a = o.rot || 0, n = o.balls || 4, sp = o.spacing || 16;
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * sp * n, cy + Math.sin(a) * sp * n); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      for (let i = 1; i <= n; i++) {
        const bx = cx + Math.cos(a) * sp * i, by = cy + Math.sin(a) * sp * i;
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, TAU); ctx.fillStyle = '#ff7a3d'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(bx - 1.5, by - 1.5, 2.8, 0, TAU); ctx.fillStyle = '#ffd166'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fillStyle = fill('#6b5b4b'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, TAU); ctx.fillStyle = '#ffd166'; ctx.fill();
      break;
    }
    case 'fan': {
      const f = o.face || 1;
      ctx.beginPath(); ctx.moveTo(w / 2, h * 0.6); ctx.lineTo(w / 2, h - 3); ctx.lineWidth = 2.5; ctx.stroke();
      rrect(ctx, w * 0.15, h - 5, w * 0.7, 5, 2); ctx.fillStyle = fill('#5a6072'); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.save(); ctx.translate(w / 2, h * 0.38);
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.24, h * 0.36, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      const r = o.rot || 0; ctx.beginPath();
      for (let k = 0; k < 3; k++) { const a = r + k * TAU / 3; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * w * 0.18, Math.sin(a) * h * 0.3); }
      ctx.lineWidth = 2; ctx.stroke();
      const off = f < 0 ? Math.PI : 0;
      ctx.beginPath(); ctx.arc(f * w * 0.1, 0, h * 0.3, -Math.PI * 0.42 + off, Math.PI * 0.42 + off); ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'warper': {
      const f = o.face || 1;
      ctx.strokeStyle = '#2f3a4a'; ctx.lineWidth = 2.2; ctx.beginPath();
      ctx.moveTo(w / 2 - f * (w / 2 - 3), h * 0.47); ctx.lineTo(w / 2 - f * (w / 2 + 7), h * 0.38 + Math.sin(t * 0.3) * 2);
      ctx.moveTo(w / 2 - f * (w / 2 - 3), h * 0.5); ctx.lineTo(w / 2 - f * (w / 2 + 6), h * 0.58 + Math.sin(t * 0.3 + 1) * 2);
      ctx.stroke(); ctx.strokeStyle = C.ink;
      ctx.beginPath(); ctx.arc(w / 2, h * 0.55, w / 2 - 1, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(w / 2, h * 0.55, w / 2 - 2, 0, TAU); ctx.clip(); ctx.fillStyle = '#2f3a4a'; ctx.fillRect(0, h * 0.36, w, h * 0.2); ctx.restore();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(w / 2 - 8 + f * 2, h * 0.42, 5, 3); ctx.fillRect(w / 2 + 3 + f * 2, h * 0.42, 5, 3);
      ctx.beginPath(); ctx.arc(w / 2, h * 0.78, 3, 0, Math.PI * 1.5); ctx.lineWidth = 1.4; ctx.strokeStyle = C.ink; ctx.stroke();
      break;
    }
    case 'thrower': {
      const f = o.face || 1;
      ctx.beginPath(); ctx.moveTo(w * 0.35, h * 0.8); ctx.lineTo(w * 0.32, h); ctx.moveTo(w * 0.65, h * 0.8); ctx.lineTo(w * 0.68, h); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.52, w / 2 - 2, h * 0.34, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.26, w * 0.36, h * 0.14, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = fill('#e0313f'); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2, h * 0.26); ctx.lineTo(w / 2 + f * w * 0.5, h * 0.28); ctx.lineWidth = 2.2; ctx.stroke();
      eyes(ctx, w / 2 + f * 2, h * 0.46, w * 0.15, 2.8, f, false);
      if (!o.empty) { ctx.save(); ctx.translate(w / 2 + f * (w / 2 + 1), h * (o.throwing ? 0.2 : 0.5)); ctx.rotate(-0.6 * f); drawBoomerang(ctx, 0, 0, 7); ctx.restore(); }
      break;
    }
    case 'slime': case 'slimelet': {
      const sq = clamp((o.vy || 0) * 0.03, -0.2, 0.2), f = o.face || 1;
      ctx.save(); ctx.translate(w / 2, h); ctx.scale(1 + sq, 1 - sq); ctx.translate(-w / 2, -h);
      ctx.beginPath(); ctx.moveTo(1, h); ctx.bezierCurveTo(0, -h * 0.25, w, -h * 0.25, w - 1, h); ctx.closePath();
      ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = type === 'slime' ? 2 : 1.6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.38, w * 0.08, h * 0.12, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
      const er = type === 'slime' ? 2 : 1.4; ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(w * 0.42 + f * 2, h * 0.55, er, 0, TAU); ctx.arc(w * 0.62 + f * 2, h * 0.55, er, 0, TAU); ctx.fill();
      ctx.restore();
      break;
    }
    case 'shadow': {
      ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.75); ctx.lineTo(w * 0.28, h); ctx.moveTo(w * 0.7, h * 0.75); ctx.lineTo(w * 0.72, h);
      ctx.strokeStyle = 'rgba(75,58,107,0.9)'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.42, w * 0.46, h * 0.38, 0, 0, TAU); ctx.fillStyle = fill('rgba(75,58,107,0.88)'); ctx.fill();
      ctx.fillStyle = '#ff5c84'; ctx.beginPath(); ctx.arc(w * 0.38 + (o.face || 1) * 2, h * 0.36, 2.4, 0, TAU); ctx.arc(w * 0.62 + (o.face || 1) * 2, h * 0.36, 2.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.ink;
      break;
    }
    case 'laser': {
      const f = o.face || 1;
      rrect(ctx, 1, 10, w - 2, h - 10, 3); ctx.fillStyle = fill('#5a4a6b'); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.rect(f > 0 ? w / 2 : -3, 6, w / 2 + 3, 6); ctx.fillStyle = fill('#3d3448'); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(w / 2, 12, w * 0.3, Math.PI, 0); ctx.closePath(); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(f > 0 ? w + 3 : -3, 9, 3.2, 0, TAU); ctx.fillStyle = o.charging ? '#ff5c84' : '#f2c1ff'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      break;
    }
    case 'snare': {
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.6, w / 2 - 1, h * 0.45, 0, 0, TAU); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = 'rgba(160,112,63,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 0; k < 4; k++) { const x = w * (0.2 + k * 0.2); ctx.moveTo(x, h * 0.3); ctx.quadraticCurveTo(x + 2, h * 0.6, x, h * 0.9); }
      ctx.stroke(); ctx.strokeStyle = C.ink;
      ctx.beginPath(); ctx.ellipse(w * 0.32, h * 0.4, w * 0.08, h * 0.12, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
      break;
    }
    case 'rockfall': {
      for (const [rx, ry, rr] of [[w * 0.28, h * 0.62, h * 0.38], [w * 0.62, h * 0.58, h * 0.46], [w * 0.46, h * 0.22, h * 0.3]]) {
        ctx.beginPath();
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, q = rr * (0.85 + 0.15 * ((k * 5) % 3) / 2); const x = rx + Math.cos(a) * q, y = ry + Math.sin(a) * q; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      }
      break;
    }
    case 'boss': {
      const f = o.face || -1;
      rrect(ctx, 4, h * 0.2, w - 8, h * 0.78, 14); ctx.fillStyle = fill('#fbe6ee'); ctx.fill();
      ctx.save(); rrect(ctx, 4, h * 0.2, w - 8, h * 0.78, 14); ctx.clip();
      ctx.fillStyle = fl ? '#ffffff' : '#3e7bd6'; ctx.fillRect(0, h * 0.6, w, h);
      if (o.angry) { ctx.fillStyle = 'rgba(232,48,95,0.25)'; ctx.fillRect(0, 0, w, h * 0.6); }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(0, h * 0.66, w, 4); ctx.fillRect(0, h * 0.9, w, 4);
      ctx.restore();
      rrect(ctx, 4, h * 0.2, w - 8, h * 0.78, 14); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.28, h * 0.22); ctx.lineTo(w * 0.3, h * 0.02); ctx.lineTo(w * 0.42, h * 0.13); ctx.lineTo(w * 0.5, 0); ctx.lineTo(w * 0.58, h * 0.13); ctx.lineTo(w * 0.7, h * 0.02); ctx.lineTo(w * 0.72, h * 0.22); ctx.closePath();
      ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      eyes(ctx, w / 2 + f * 4, h * 0.36, w * 0.17, 6.5, f, true);
      ctx.beginPath(); ctx.moveTo(w * 0.32 + f * 3, h * 0.5);
      for (let k = 0; k < 6; k++) ctx.lineTo(w * (0.32 + (k + 0.5) * 0.06) + f * 3, h * (k % 2 ? 0.5 : 0.55));
      ctx.lineTo(w * 0.68 + f * 3, h * 0.5); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = `${Math.round(h * 0.15)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ケシ', w / 2, h * 0.79);
      break;
    }
    case 'thunder': {
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.88);
      ctx.quadraticCurveTo(-2, h * 0.55, w * 0.18, h * 0.38);
      ctx.quadraticCurveTo(w * 0.22, h * 0.0, w * 0.45, h * 0.18);
      ctx.quadraticCurveTo(w * 0.62, -h * 0.14, w * 0.78, h * 0.28);
      ctx.quadraticCurveTo(w + 2, h * 0.4, w * 0.88, h * 0.88);
      ctx.closePath(); ctx.fillStyle = fill(d.color); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      eyes(ctx, w / 2, h * 0.54, w * 0.12, 2.8, o.face, true);
      break;
    }
    default: drawExtraShape(ctx, type, w, h, o, fill, d); // 追加カード（sprites-extra.js）
  }
}
function drawBoomerang(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.5); ctx.quadraticCurveTo(x, y - s * 1.1, x + s, y + s * 0.5);
  ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 5.5; ctx.stroke();
  ctx.strokeStyle = '#e8a24a'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = C.ink;
}
function drawWeight(ctx, cx, cy, s) {
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.85, s * 0.32, Math.PI, 0); ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(1.6, s * 0.16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy - s * 0.8); ctx.lineTo(cx + s * 0.6, cy - s * 0.8); ctx.lineTo(cx + s * 1.05, cy + s * 0.85); ctx.lineTo(cx - s * 1.05, cy + s * 0.85); ctx.closePath();
  ctx.fillStyle = '#5a6072'; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = `${Math.round(s * 0.95)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('重', cx, cy + s * 0.08);
}
function drawHeart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * 0.4, x - s * 0.5, y - s * 1.1, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s * 1.1, y - s * 0.4, x, y + s * 0.35);
  ctx.closePath();
}
