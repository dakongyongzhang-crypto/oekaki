'use strict';

/* =====================================================
   メインループと起動時の初期化
   ===================================================== */
let lastTs = 0, acc = 0; const STEP = 1000 / 60;
function loop(ts) {
  requestAnimationFrame(loop);
  if (curScreen === 'scr-victory' && VIC) { drawVictory(ts); lastTs = ts; return; }
  if (curScreen !== 'scr-game' || !CH || !P) { lastTs = ts; return; }
  let dt = ts - lastTs; lastTs = ts; if (dt > 100) dt = 100;
  if (dt > 0) dbgFps = lerp(dbgFps, 1000 / dt, 0.05);
  acc += dt * (DBG.on ? DBG.speed : 1); let n = 0;
  while (acc >= STEP && n < 5) { step(); acc -= STEP; n++; }
  if (n >= 5) acc = 0;
  if (NET.role === 'host' && NET.live) netHostTick(ts);
  render();
}
requestAnimationFrame(loop);

/* ---------- 起動時の初期化 ---------- */
resizeGame();
buildDeckScreen();
refreshDeckUI();
refreshDebugUI();
if (navigator.maxTouchPoints > 0) $('#touchpad').classList.add('force');
updateDrawTools();
analyzeAndShow();
