'use strict';

/* =====================================================
   当たり判定・移動と演出（パーティクル・ポップアップ）
   ===================================================== */
function moveEntity(e) {
  let hitX = false, landed = false, hitCeil = false;
  e.x += e.vx;
  const top = Math.floor(e.y / T), bot = Math.floor((e.y + e.h - 0.01) / T);
  if (e.vx > 0) {
    const c = Math.floor((e.x + e.w - 0.01) / T);
    for (let r = top; r <= bot; r++) if (solid(c, r)) { e.x = c * T - e.w; e.vx = 0; hitX = true; break; }
  } else if (e.vx < 0) {
    const c = Math.floor(e.x / T);
    for (let r = top; r <= bot; r++) if (solid(c, r)) { e.x = (c + 1) * T; e.vx = 0; hitX = true; break; }
  }
  const prevBottom = e.y + e.h;
  e.y += e.vy;
  const l = Math.floor(e.x / T), rr = Math.floor((e.x + e.w - 0.01) / T);
  if (e.vy > 0) {
    const r = Math.floor((e.y + e.h - 0.01) / T);
    for (let c = l; c <= rr; c++) {
      const t = tileAt(c, r);
      if (isSolidT(t) || (t === 4 && prevBottom <= r * T + 0.5)) { e.y = r * T - e.h; e.vy = 0; landed = true; break; }
    }
  } else if (e.vy < 0) {
    const r = Math.floor(e.y / T);
    for (let c = l; c <= rr; c++) if (solid(c, r)) { e.y = (r + 1) * T; e.vy = 0; hitCeil = true; break; }
  }
  e.onGround = landed;
  return { hitX, landed, hitCeil };
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function circleRect(cx, cy, r, e) { return dist(cx, cy, clamp(cx, e.x, e.x + e.w), clamp(cy, e.y, e.y + e.h)) < r; }

/* ---------- Effects ---------- */
function burst(x, y, color, n = 10, spd = 3) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 2 * spd, vy: (Math.random() - 0.8) * spd * 1.4, life: 26 + Math.random() * 22, max: 48, r: 2 + Math.random() * 3.2, color, g: 0.16 });
}
function dust(x, y, n) { for (let i = 0; i < n; i++) particles.push({ x: x + rand(-8, 8), y, vx: rand(-1.2, 1.2), vy: rand(-1.4, -0.3), life: 18, max: 18, r: rand(2, 4), color: '#b9c2d0', g: 0.02 }); }
function popup(x, y, text, color = C.ink, size = 18) { popups.push({ x, y, text, color, size, life: 55, max: 55 }); }
