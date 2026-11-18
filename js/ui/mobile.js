'use strict';

/* =====================================================
   スマホ表示／PC表示の切り替え
   - タッチ操作の小さい画面なら自動でスマホ表示（body.mobile）
   - 上のボタンで手動で切り替えられる（ブラウザに覚えておく）
   - スマホ表示のオンライン対戦では、自分の役割の画面を全面に出し、
     ランナーの操作ボタンを画面に重ねる（body.mob-net。fitStage で付け外し）
   ===================================================== */
const UI_KEY = 'rr-ui';
let uiPref = null;
try { uiPref = localStorage.getItem(UI_KEY); } catch (_e) {}
const autoMobile = () => matchMedia('(any-pointer:coarse)').matches && Math.min(screen.width, screen.height) < 700;
const isMobileUI = () => uiPref ? uiPref === 'mobile' : autoMobile();
// スマホ表示は常に横画面：縦持ちなら画面全体を回す（rot）。横レイアウトを使うときは land
function updateOrient() {
  const m = document.body.classList.contains('mobile'), portrait = window.innerHeight > window.innerWidth;
  document.body.classList.toggle('rot', m && portrait);
  document.body.classList.toggle('land', m);
}
window.addEventListener('resize', () => { const was = isRot(); updateOrient(); if (was !== isRot() && typeof curScreen !== 'undefined' && curScreen === 'scr-game') resizeGame(); });
function applyUIMode() {
  const m = isMobileUI();
  document.body.classList.toggle('mobile', m);
  updateOrient();
  $('#btnUiMode').textContent = m ? '表示：スマホ' : '表示：PC';
  $('#btnUiMode').setAttribute('aria-pressed', String(m));
  if (curScreen === 'scr-game') resizeGame();
}
$('#btnUiMode').addEventListener('click', () => {
  uiPref = isMobileUI() ? 'pc' : 'mobile';
  try { localStorage.setItem(UI_KEY, uiPref); } catch (_e) {}
  applyUIMode();
});
// 全画面（対応しているブラウザだけボタンを出す。iPhone の Safari は非対応）
const canFullscreen = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
function toggleFullscreen() {
  const d = document, el = d.documentElement;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else {
    const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    if (r && r.then) r.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_e) {} }).catch(() => {});
  }
}
$('#btnFull').hidden = !canFullscreen;
// タイトルの「あそびかた」（スマホ表示では説明をたたんでおく）
$('#btnRules').addEventListener('click', () => { const on = document.body.classList.toggle('show-rules'); $('#btnRules').setAttribute('aria-expanded', String(on)); $('#btnRules').textContent = on ? 'あそびかたを閉じる' : 'あそびかた'; });
$('#btnFull').addEventListener('click', toggleFullscreen);

/* ---------- PWA：オフライン対応とアプリとして追加 ---------- */
const isStandalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
let installPrompt = null;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function updateInstallButton() { $('#btnInstall').hidden = isStandalone() || !(installPrompt || isIOS); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; updateInstallButton(); });
window.addEventListener('appinstalled', () => { installPrompt = null; updateInstallButton(); });
$('#btnInstall').addEventListener('click', async () => {
  if (installPrompt) { installPrompt.prompt(); try { await installPrompt.userChoice; } catch (_e) {} installPrompt = null; updateInstallButton(); return; }
  if (isIOS) netToast('Safari の共有ボタン（□に↑）→「ホーム画面に追加」で、アプリとして遊べます', 9000);
});
updateInstallButton();
// アプリとして開いているときは、全画面ボタンはいらない
if (isStandalone()) $('#btnFull').hidden = true;

/* ---------- 起動したら自動で横画面にする ----------
   - アプリとして開いているとき：すぐに画面の向きを横に固定する
   - ブラウザで開いているとき（Android の Chrome など）：全画面と向きの固定は「画面に触れたあと」しかできないので、
     起動後に最初に画面に触れたとき、自動で全画面にして横向きに固定する
   - iPhone は向きを変える機能がないので、縦持ちなら画面ごと回して横画面で見せる（body.rot） */
function lockLandscape() {
  try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (_e) {}
}
(function autoLandscape() {
  if (!isMobileUI()) return;
  lockLandscape();
  if (isStandalone() || !canFullscreen) return;
  const once = () => {
    document.removeEventListener('pointerup', once, true); document.removeEventListener('click', once, true);
    const d = document;
    if (!isMobileUI() || d.fullscreenElement || d.webkitFullscreenElement) return;
    toggleFullscreen();
  };
  document.addEventListener('pointerup', once, true); document.addEventListener('click', once, true);
})();
