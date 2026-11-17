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
function applyUIMode() {
  const m = isMobileUI();
  document.body.classList.toggle('mobile', m);
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
