'use strict';

/* =====================================================
   ゲーム用キャンバスのサイズ合わせ
   ===================================================== */
const gcv = $('#game');
const g = gcv.getContext('2d');
let dpr = 1;
function fitStage() {
  // ゲーム画面を窓に収まる最大サイズにする。横長の画面では、カード欄を右側に縦に並べてさらに大きくする
  if (curScreen !== 'scr-game') return;
  const body = $('#gameBody'), bar = body.querySelector('.builder-bar'), tp = $('#touchpad'), root = document.documentElement;
  const vw = root.clientWidth - 20, vh = window.innerHeight;
  const tpH = getComputedStyle(tp).display !== 'none' ? tp.offsetHeight + 10 : 0;
  root.style.setProperty('--topbarW', ($('.topbar').offsetWidth + 12) + 'px'); // 上のボタン列はゲーム画面の見出しと同じ行に並べる
  body.classList.remove('side');
  root.style.setProperty('--stageW', Math.min(vw, 1600) + 'px');
  const top = body.getBoundingClientRect().top + window.scrollY;
  const availH = vh - top - tpH - 10, barH = bar.offsetHeight;
  const wBottom = Math.min(vw, (availH - barH - 8) * 16 / 9);
  const wSide = Math.min(vw - 246, availH * 16 / 9);
  const side = vw >= 900 && wSide > wBottom + 30;
  body.classList.toggle('side', side);
  root.style.setProperty('--stageW', Math.floor(Math.max(320, side ? wSide : wBottom)) + 'px');
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
