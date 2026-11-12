'use strict';

/* =====================================================
   ゲーム用キャンバスのサイズ合わせ
   ===================================================== */
const gcv = $('#game');
const g = gcv.getContext('2d');
let dpr = 1;
const SIDE_W = 178; // 横に並べるときのカード欄の幅（CSS の .game-body.side .builder-bar と合わせる）
function fitStage() {
  // ゲーム画面を窓に収まる最大サイズにする。カード欄は下か右の、ゲーム画面が大きくなるほうに置く
  // オフライン対戦は、窓の縦横比に合わせてゲーム画面の横幅（GW）を変えて余白をなくす
  if (curScreen !== 'scr-game') return;
  const body = $('#gameBody'), bar = body.querySelector('.builder-bar'), tp = $('#touchpad'), root = document.documentElement;
  const vw = root.clientWidth - 12, vh = window.innerHeight;
  const tpH = getComputedStyle(tp).display !== 'none' ? tp.offsetHeight + 8 : 0;
  root.style.setProperty('--topbarW', ($('.topbar').offsetWidth + 12) + 'px'); // 上のボタン列はゲーム画面の見出しと同じ行に並べる
  body.classList.remove('side');
  root.style.setProperty('--stageW', vw + 'px');
  const top = body.getBoundingClientRect().top + window.scrollY;
  const availH = vh - top - tpH - 8, barH = bar.offsetHeight;
  const flex = !COOP && !NET.role;
  const minA = flex ? 4 / 3 : 16 / 9, maxA = flex ? 2.4 : 16 / 9;
  const fit = (bw, bh) => {
    let w = Math.max(320, bw), h = Math.max(180, bh);
    if (w / h > maxA) w = h * maxA; else if (w / h < minA) h = w / minA;
    return { w: Math.floor(w), h: Math.floor(h) };
  };
  const bottom = fit(vw, availH - barH - 6), side = fit(vw - SIDE_W - 6, availH);
  const useSide = vw >= 600 && side.w * side.h > bottom.w * bottom.h * 1.04;
  body.classList.toggle('side', useSide);
  const st = useSide ? side : bottom;
  root.style.setProperty('--stageW', st.w + 'px');
  root.style.setProperty('--stageH', st.h + 'px');
  const ngw = flex ? Math.round(GH * st.w / st.h) : GW_BASE;
  if (ngw !== GW) { GW = ngw; setLayout(SPLIT); mmDirty = true; }
}
function resizeGame() {
  fitStage();
  const cssW = gcv.getBoundingClientRect().width || GW;
  dpr = Math.max(1, Math.min(cssW * (window.devicePixelRatio || 1), 2400) / GW);
  gcv.width = Math.round(GW * dpr); gcv.height = Math.round(GH * dpr);
}
window.addEventListener('resize', () => { if (curScreen === 'scr-game') resizeGame(); });
const hatch = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 10;
  const x = c.getContext('2d'); x.strokeStyle = 'rgba(36,37,43,0.16)'; x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(0, 10); x.lineTo(10, 0); x.moveTo(-5, 5); x.lineTo(5, -5); x.moveTo(5, 15); x.lineTo(15, 5); x.stroke();
  return g.createPattern(c, 'repeat');
})();
