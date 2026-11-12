'use strict';

/* =====================================================
   マウス／タッチ入力（ビルダー）
   ===================================================== */
const hover = { sx: 0, sy: 0, on: false };
let painting = false, lastPaint = null;
function gpos(e) { const r = gcv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * GW, y: (e.clientY - r.top) / r.height * GH }; }
const builderActive = () => state === 'play' || state === 'countdown';
const bwx = sx => (sx - BX) / VS + (SPLIT === 's' ? camX : bCam); // ビルダー画面上の座標 → ワールド座標
const bwy = sy => (sy - BY) / VS + (SPLIT === 's' ? camY : bCamY);
const inBuilder = p => p.x >= BX && p.y >= BY;
function mmRect() { if (SPLIT === 's') return null; return isH() ? { x: 14, y: GH - 20, w: GW - 28, h: 12, horiz: true } : { x: GW - 24, y: 66, w: 12, h: GH - 86, horiz: false }; }
const inMM = p => { const m = mmRect(); if (!m) return false; return p.x >= m.x - 6 && p.x <= m.x + m.w + 6 && p.y >= m.y - 6 && p.y <= m.y + m.h + 6; };
function mmSeek(p) {
  const m = mmRect();
  if (m.horiz) bCamT = clamp((p.x - m.x) / m.w * WW - VWW / 2, 0, Math.max(0, WW - VWW));
  else bCamTY = clamp((p.y - m.y) / m.h * WH - VWH / 2, 0, Math.max(0, WH - VWH));
}
function scrollBuilder(d) {
  if (isH()) bCamT = clamp(bCamT + d, 0, Math.max(0, WW - VWW));
  else bCamTY = clamp(bCamTY + d, 0, Math.max(0, WH - VWH));
}
let pointerIsDown = false; // 扉のスイッチは「押している＋カーソルが乗っている」あいだだけ開く
gcv.addEventListener('pointerdown', e => {
  if (netPtrIntercept()) { e.preventDefault(); SFX.init(); netPointer('d', e); return; }
  e.preventDefault(); SFX.init(); pointerIsDown = true;
  const p = gpos(e);
  if (!inBuilder(p)) { hover.on = false; return; }
  hover.sx = p.x; hover.sy = p.y;
  try { gcv.setPointerCapture(e.pointerId); } catch (_) {}
  if (inMM(p)) { mmDrag = true; hover.on = false; mmSeek(p); return; }
  if (COOP && builderActive()) { const gt = gateAt(bwx(p.x), bwy(p.y)); if (gt) { hover.on = true; holdGate = gt; gt.hold = true; if (!gt.open) setGate(gt, true); return; } const lf = liftAt(bwx(p.x), bwy(p.y)); if (lf) { hover.on = true; holdLift = lf; lf.hold = true; return; } }
  if (SPLIT !== 's' && (e.button === 1 || e.button === 2)) { panDrag = { sx: p.x, sy: p.y, cx: bCamT, cy: bCamTY }; hover.on = false; return; }
  hover.on = true;
  if (!builderActive()) return;
  if (CARD[tool].cat === 'pen') {
    painting = true; paintInk = (paintInk + 1) % INKS.length;
    lastPaint = { x: bwx(p.x), y: bwy(p.y) }; paintAt(lastPaint.x, lastPaint.y);
  } else tryPlace(p.x, p.y);
});
gcv.addEventListener('pointermove', e => {
  if (netPtrIntercept()) { netPointer('m', e); return; }
  const p = gpos(e);
  if (mmDrag) { mmSeek(p); return; }
  if (panDrag) {
    if (isH()) bCamT = clamp(panDrag.cx - (p.x - panDrag.sx) / VS, 0, Math.max(0, WW - VWW));
    else bCamTY = clamp(panDrag.cy - (p.y - panDrag.sy) / VS, 0, Math.max(0, WH - VWH));
    return;
  }
  hover.sx = Math.max(p.x, BX); hover.sy = Math.max(p.y, BY); hover.on = painting || (inBuilder(p) && !inMM(p));
  gcv.style.cursor = !inBuilder(p) ? 'default' : inMM(p) ? (isH() ? 'ew-resize' : 'ns-resize') : 'crosshair';
  if (painting && builderActive()) { const w = { x: bwx(hover.sx), y: bwy(hover.sy) }; paintLine(lastPaint, w); lastPaint = w; }
});
const stopPaint = () => { painting = false; lastPaint = null; };
const endPointer = () => { stopPaint(); panDrag = null; mmDrag = false; };
const releaseGate = () => { if (holdGate) { holdGate.hold = false; holdGate.grace = 14; holdGate = null; } if (holdLift) { holdLift.hold = false; holdLift.grace = 20; holdLift = null; } };
gcv.addEventListener('pointerup', e => { if (netPtrIntercept()) { netPointer('u', e); return; } pointerIsDown = false; releaseGate(); endPointer(); if (e.pointerType !== 'mouse') hover.on = false; });
gcv.addEventListener('pointercancel', e => { if (netPtrIntercept()) { netPointer('u', e); return; } pointerIsDown = false; releaseGate(); endPointer(); hover.on = false; });
gcv.addEventListener('pointerleave', () => {
  if (netPtrIntercept()) { if (NET.role === 'guest' && netIAmBuilder() && !NET.vsDown) { hover.on = false; NET.mv = { t: 'pm', x: 0, y: 0, on: 0 }; } return; }
  if (!painting) hover.on = false;
});
gcv.addEventListener('contextmenu', e => e.preventDefault());
let wheelAcc = 0;
gcv.addEventListener('wheel', e => {
  e.preventDefault();
  if (NET.role && !netIAmBuilder()) return;
  if (SPLIT === 's') {
    wheelAcc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (Math.abs(wheelAcc) >= 60 && DECK.length) {
      const i = Math.max(0, DECK.indexOf(tool));
      const order = COOP ? DECK.filter(d => d !== 's_heart') : DECK; // ホイールでは回復を飛ばす（うっかり使わないように）
      const j = Math.max(0, order.indexOf(tool));
      selectTool(order[(j + (wheelAcc > 0 ? 1 : -1) + order.length) % order.length]); wheelAcc = 0;
    }
    return;
  }
  const r = gcv.getBoundingClientRect(), unit = e.deltaMode === 1 ? 16 : 1;
  const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
  scrollBuilder(d * (GW / r.width) / VS);
}, { passive: false });
$('#btnBView').addEventListener('pointerdown', e => e.preventDefault());
$('#btnBView').addEventListener('click', () => {
  if (!P) return;
  if (isH()) bCamT = clamp(P.x - 200, 0, Math.max(0, WW - VWW));
  else bCamTY = clamp(P.y - VWH * 0.7, 0, Math.max(0, WH - VWH));
});
