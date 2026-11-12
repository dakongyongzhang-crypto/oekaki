'use strict';

/* =====================================================
   ステージのしかけ（スイッチ扉・カギ・リフト・暗闇）
   ===================================================== */
function setGate(gt, open) {
  gt.open = open;
  for (const i of gt.cells) tiles[i] = open ? 0 : 7;
  if (open) SFX.tick(); else SFX.thud();
}
function liftAt(wx, wy) { for (const lf of lifts) if (dist(wx, wy, lf.sx, lf.sy) < 40) return lf; return null; }
function openLock(i) {
  const lk = locks[i]; if (!lk || lk.open) return;
  lk.open = true;
  for (const ci of lk.cells) tiles[ci] = 0;
  for (let r = 0; r < lk.h; r += 2) burst(lk.c * T + T / 2, r * T + T / 2, '#b98a5c', 2, 2);
  banner = { text: 'カギで扉がひらいた！', life: 60, color: '#2a9d5c' }; SFX.pick(); SFX.thud();
}
function updateLifts() {
  for (const lf of lifts) {
    let dy = 0;
    if (lf.hold) dy = -2.2; else if (lf.grace > 0) lf.grace--; else dy = 1.6;
    const ny = clamp(lf.y + dy, lf.yTop, lf.yBottom), d = ny - lf.y;
    if (d && P.onLift === lf) P.y += d;
    lf.y = ny;
  }
}
function drawKey(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(-8, 0, 8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-8, 0, 3, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.rect(0, -3, 16, 6); ctx.rect(10, 3, 3, 5); ctx.rect(15, 3, 3, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawLocksAndLifts() {
  for (const lk of locks) {
    if (lk.open) continue;
    const x = lk.c * T; if (x < viewX - 60 || x > viewX + VWW + 60) continue;
    g.save();
    g.fillStyle = '#c69764'; g.fillRect(x + 1, 0, T - 2, lk.h * T);
    g.strokeStyle = 'rgba(80,50,20,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + T / 2, 0); g.lineTo(x + T / 2, lk.h * T); g.stroke();
    g.fillStyle = '#5a6072'; for (let y = 30; y < lk.h * T; y += 70) g.fillRect(x, y, T, 6);
    g.strokeStyle = C.ink; g.lineWidth = 2.2; g.strokeRect(x + 1, -2, T - 2, lk.h * T + 2);
    const ky = lk.h * T - 50;
    g.beginPath(); g.arc(x + T / 2, ky, 6, 0, TAU); g.fillStyle = '#ffd23f'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + T / 2, ky + 2); g.lineTo(x + T / 2, ky + 10); g.lineWidth = 3; g.stroke();
    g.font = `14px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 3.5; g.strokeStyle = '#fff';
    g.strokeText('カギが必要', x + T / 2, ky - 18); g.fillStyle = '#8a5a3c'; g.fillText('カギが必要', x + T / 2, ky - 18);
    g.restore();
  }
  for (const lf of lifts) {
    if (lf.x + lf.w < viewX - 200 || lf.x > viewX + VWW + 200) continue;
    g.save();
    g.strokeStyle = 'rgba(60,64,80,0.7)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(lf.x + 6, lf.y); g.lineTo(lf.x + 6, lf.yTop - 30); g.moveTo(lf.x + lf.w - 6, lf.y); g.lineTo(lf.x + lf.w - 6, lf.yTop - 30); g.stroke();
    g.beginPath(); g.arc(lf.x + lf.w / 2, lf.yTop - 34, 10, 0, TAU); g.fillStyle = '#8b90a0'; g.fill(); g.strokeStyle = C.ink; g.stroke();
    g.beginPath(); g.moveTo(lf.x + 6, lf.yTop - 30); g.lineTo(lf.x + lf.w - 6, lf.yTop - 30); g.stroke();
    g.fillStyle = '#ffd23f'; g.fillRect(lf.x, lf.y, lf.w, 10);
    g.fillStyle = C.ink; for (let k = 0; k < lf.w; k += 12) { g.beginPath(); g.moveTo(lf.x + k, lf.y + 10); g.lineTo(lf.x + k + 6, lf.y); g.lineTo(lf.x + k + 10, lf.y); g.lineTo(lf.x + k + 4, lf.y + 10); g.closePath(); g.fill(); }
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(lf.x, lf.y, lf.w, 10);
    // レバー
    const on = lf.hold;
    g.fillStyle = '#6b7080'; g.fillRect(lf.sx - 14, lf.sy + 6, 28, 10); g.strokeRect(lf.sx - 14, lf.sy + 6, 28, 10);
    g.beginPath(); g.moveTo(lf.sx, lf.sy + 8); g.lineTo(lf.sx + (on ? -14 : 14), lf.sy - 18); g.lineWidth = 4; g.stroke();
    g.beginPath(); g.arc(lf.sx + (on ? -14 : 14), lf.sy - 18, 6, 0, TAU); g.fillStyle = on ? '#33b06a' : '#e5383b'; g.fill(); g.lineWidth = 2; g.stroke();
    g.font = `13px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 3.5; g.strokeStyle = '#fff';
    const label = on ? 'リフト上昇中！' : 'P2：カーソルを合わせて長押し';
    g.strokeText(label, lf.sx, lf.sy - 32); g.fillStyle = on ? '#2a9d5c' : C.bad; g.fillText(label, lf.sx, lf.sy - 32);
    g.restore();
  }
}
let darkCv = null;
function drawDarkZones() {
  if (!darkZones.length) return;
  const zs = darkZones.filter(z => z.x1 > viewX - 200 && z.x0 < viewX + VWW + 200);
  if (!zs.length) return;
  if (!darkCv || darkCv.width !== VWW || darkCv.height !== VWH) { darkCv = document.createElement('canvas'); darkCv.width = VWW; darkCv.height = VWH; }
  const c = darkCv.getContext('2d');
  c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, VWW, VWH);
  c.fillStyle = 'rgba(10,11,18,0.97)'; c.fillRect(0, 0, VWW, VWH);
  c.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => { const gr = c.createRadialGradient(x, y, r * 0.4, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  hole(P.x + P.w / 2 - viewX, P.y + P.h / 2 - viewY, 64);
  if (hover.on) hole(bwx(hover.sx) - viewX, bwy(hover.sy) - viewY, 150);
  c.globalCompositeOperation = 'source-over';
  g.save(); g.beginPath();
  for (const z of zs) g.rect(z.x0, viewY - 10, z.x1 - z.x0, VWH + 20);
  g.clip(); g.drawImage(darkCv, viewX, viewY); g.restore();
  for (const z of zs) {
    const lx = clamp(z.x0 + 170, viewX + 180, z.x1 - 170);
    g.save(); g.font = `15px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 3.5; g.strokeStyle = '#fff';
    g.strokeText('暗闇！ P2のカーソルが明かり', lx, 112); g.fillStyle = '#6b3fd0'; g.fillText('暗闇！ P2のカーソルが明かり', lx, 112);
    g.restore();
  }
}
function gateAt(wx, wy) { for (const gt of gates) if (dist(wx, wy, gt.sx, gt.sy) < 40) return gt; return null; }
function updateGates() {
  for (const gt of gates) {
    if (gt.hold || !gt.open) continue;
    if (gt.grace > 0) { gt.grace--; continue; }
    const box = { x: gt.c * T, y: 0, w: T, h: gt.h * T };
    if (overlap(P, box) || enemies.some(e => !e.dead && overlap(e, box))) continue;
    setGate(gt, false);
  }
}
function drawGates() {
  for (const gt of gates) {
    const x = gt.c * T;
    if (x < viewX - 300 || x > viewX + VWW + 300) continue;
    g.save();
    if (!gt.open) {
      g.fillStyle = '#9aa0b8'; g.fillRect(x + 2, 0, T - 4, gt.h * T);
      g.strokeStyle = '#4a4e5a'; g.lineWidth = 2; g.beginPath();
      for (let y = 10; y < gt.h * T; y += 26) { g.moveTo(x + 2, y); g.lineTo(x + T - 2, y); }
      g.moveTo(x + T / 2, 0); g.lineTo(x + T / 2, gt.h * T); g.stroke();
      g.strokeStyle = C.ink; g.lineWidth = 2.2; g.strokeRect(x + 2, -2, T - 4, gt.h * T + 2);
    } else {
      g.setLineDash([5, 6]); g.strokeStyle = 'rgba(42,157,92,0.8)'; g.lineWidth = 2; g.strokeRect(x + 2, 0, T - 4, gt.h * T); g.setLineDash([]);
    }
    // スイッチ
    g.setLineDash([3, 6]); g.strokeStyle = 'rgba(36,37,43,0.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(gt.sx, gt.sy); g.quadraticCurveTo((gt.sx + x) / 2, gt.sy - 60, x + T / 2, gt.sy - 20); g.stroke(); g.setLineDash([]);
    rrect(g, gt.sx - 20, gt.sy - 20, 40, 40, 9); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2.2; g.stroke();
    g.beginPath(); g.arc(gt.sx, gt.sy, 12 + (gt.hold ? Math.sin(tick * 0.4) * 1.5 : 0), 0, TAU);
    g.fillStyle = gt.open ? '#33b06a' : '#e5383b'; g.fill(); g.stroke();
    g.font = `13px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const label = gt.open ? (gt.hold ? 'あいてる！' : 'まもなく閉まる') : 'カーソルを合わせて長押し';
    g.lineWidth = 3.5; g.strokeStyle = '#fff'; g.strokeText(label, gt.sx, gt.sy - 28); g.fillStyle = gt.open ? '#2a9d5c' : C.bad; g.fillText(label, gt.sx, gt.sy - 28);
    g.restore();
  }
}
