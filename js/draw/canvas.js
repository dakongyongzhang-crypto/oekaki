'use strict';

/* =====================================================
   キャラ作成：お絵かきキャンバス
   ===================================================== */
const PALETTE = [
  ['赤', '#e5383b'], ['橙', '#f4842d'], ['黄', '#f2c12e'], ['黄緑', '#8cc63f'], ['緑', '#2a9d5c'], ['水色', '#3ec1d3'],
  ['青', '#2f6fdf'], ['紫', '#8e5bd6'], ['ピンク', '#f27eb1'], ['茶', '#8a5a3c'], ['灰', '#8f939e'], ['黒', '#24252b']
];
const DS = 400;
const dc = $('#drawCanvas');
dc.width = DS; dc.height = DS;
const dctx = dc.getContext('2d', { willReadFrequently: true });
const D = { strokes: [], cur: null, color: '#24252b', size: 10, eraser: false, analysis: null };

const palEl = $('#palette');
PALETTE.forEach(([name, hex]) => {
  const b = document.createElement('button');
  b.className = 'swatch'; b.dataset.hex = hex; b.style.setProperty('--sw', hex);
  b.title = name; b.setAttribute('aria-label', name);
  b.addEventListener('click', () => setColor(hex));
  palEl.appendChild(b);
});
$('#customColor').addEventListener('input', e => setColor(e.target.value));
function setColor(hex) { D.color = hex.toLowerCase(); D.eraser = false; updateDrawTools(); }
function updateDrawTools() {
  $$('.swatch').forEach(s => s.classList.toggle('on', !D.eraser && s.dataset.hex === D.color));
  $('#btnPen').classList.toggle('on', !D.eraser);
  $('#btnEraser').classList.toggle('on', D.eraser);
  const dot = $('#sizeDot'); const px = Math.max(3, D.size * 0.9);
  dot.style.width = dot.style.height = px + 'px';
  dot.style.background = D.eraser ? 'transparent' : D.color;
  dot.style.border = D.eraser ? '2px dashed var(--ink)' : 'none';
  $('#sizeVal').textContent = D.size + 'px';
}
$('#size').addEventListener('input', e => { D.size = +e.target.value; updateDrawTools(); });
$('#btnPen').addEventListener('click', () => { D.eraser = false; updateDrawTools(); });
$('#btnEraser').addEventListener('click', () => { D.eraser = true; updateDrawTools(); });
$('#btnUndo').addEventListener('click', undo);
$('#btnClear').addEventListener('click', () => { D.strokes = []; redrawDrawing(); analyzeAndShow(); });
$('#btnSample').addEventListener('click', () => sampleDoodle());
function undo() { D.strokes.pop(); redrawDrawing(); analyzeAndShow(); }

function dpos(e) { const r = dc.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * DS, y: (e.clientY - r.top) / r.height * DS }; }
function strokePath(ctx, pts) {
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
  else if (pts.length === 2) ctx.lineTo(pts[1].x, pts[1].y);
  else {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const l = pts[pts.length - 1]; ctx.lineTo(l.x, l.y);
  }
}
function paintStroke(ctx, s, minW = 0) {
  ctx.save();
  ctx.globalCompositeOperation = s.eraser ? 'destination-out' : 'source-over';
  ctx.strokeStyle = s.eraser ? '#000' : s.color;
  ctx.lineWidth = s.eraser ? s.size : Math.max(s.size, minW);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  strokePath(ctx, s.pts); ctx.stroke();
  ctx.restore();
}
function redrawDrawing() {
  dctx.clearRect(0, 0, DS, DS);
  for (const s of D.strokes) paintStroke(dctx, s);
  if (D.cur) paintStroke(dctx, D.cur);
  $('#drawHint').hidden = D.strokes.length > 0 || !!D.cur;
}
dc.addEventListener('pointerdown', e => {
  e.preventDefault(); SFX.init();
  try { dc.setPointerCapture(e.pointerId); } catch (_) {}
  D.cur = { color: D.color, size: D.size, eraser: D.eraser, pts: [dpos(e)] };
  redrawDrawing();
});
dc.addEventListener('pointermove', e => {
  if (!D.cur) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of (evs.length ? evs : [e])) {
    const p = dpos(ev), l = D.cur.pts[D.cur.pts.length - 1];
    if (Math.hypot(p.x - l.x, p.y - l.y) < 2) continue;
    D.cur.pts.push(p);
    dctx.save();
    dctx.globalCompositeOperation = D.cur.eraser ? 'destination-out' : 'source-over';
    dctx.strokeStyle = D.cur.eraser ? '#000' : D.cur.color; dctx.lineWidth = D.cur.size; dctx.lineCap = 'round';
    dctx.beginPath(); dctx.moveTo(l.x, l.y); dctx.lineTo(p.x, p.y); dctx.stroke();
    dctx.restore();
  }
});
function endStroke() {
  if (!D.cur) return;
  D.strokes.push(D.cur); D.cur = null;
  redrawDrawing(); analyzeAndShow();
}
dc.addEventListener('pointerup', endStroke);
dc.addEventListener('pointercancel', endStroke);
