'use strict';

/* =====================================================
   キャラ作成：ラクガキからキャラのスプライトを作る
   ===================================================== */
function makeCharacter(an) {
  const p = deriveParams(an);
  const bodyH = p.h - p.legH;
  const tw = p.w * 2, th = bodyH * 2;
  const { minX, minY, maxX, maxY } = an.bbox;
  const k0 = Math.min(tw / (maxX - minX), th / (maxY - minY));
  const minW = 3.4 / k0;
  const pad = minW / 2 + 6;
  const bx = minX - pad, by = minY - pad, bw = maxX - minX + pad * 2, bh = maxY - minY + pad * 2;
  const m = 4; // sticker outline
  const k = Math.min((tw - m * 2) / bw, (th - m * 2) / bh);
  const base = document.createElement('canvas'); base.width = tw; base.height = th;
  const bc = base.getContext('2d');
  const ox = (tw - bw * k) / 2, oy = th - m - bh * k;
  bc.setTransform(k, 0, 0, k, ox - bx * k, oy - by * k);
  for (const s of D.strokes) paintStroke(bc, s, minW);
  bc.setTransform(1, 0, 0, 1, 0, 0);
  const mk = () => { const c = document.createElement('canvas'); c.width = tw; c.height = th; return [c, c.getContext('2d')]; };
  const [sil, sl] = mk();
  for (let a = 0; a < 12; a++) sl.drawImage(base, Math.cos(a / 12 * TAU) * m, Math.sin(a / 12 * TAU) * m);
  sl.globalCompositeOperation = 'source-in'; sl.fillStyle = '#ffffff'; sl.fillRect(0, 0, tw, th);
  const [shd, hl] = mk();
  hl.drawImage(sil, 0, 0); hl.globalCompositeOperation = 'source-in'; hl.fillStyle = 'rgba(36,37,43,0.3)'; hl.fillRect(0, 0, tw, th);
  const [spr, sc] = mk();
  sc.drawImage(shd, 2, 2); sc.drawImage(sil, 0, 0); sc.drawImage(base, 0, 0);
  const name = ($('#charName').value || '').trim() || 'ラクガキくん';
  return Object.assign(p, { spr, name, stats: an.stats, color: an.domHex });
}
