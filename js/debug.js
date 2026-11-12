'use strict';

/* =====================================================
   デバッグモード
   ===================================================== */
const DBG = { on: false, panel: true, inv: false, fly: false, energy: false, noLimit: false, freezeTime: false, noCpu: false, hitbox: false, info: false, speed: 1 };
try { DBG.on = localStorage.getItem('rr-debug') === '1'; } catch (_e) {}
let dbgFps = 60;
const dbg = k => DBG.on && DBG[k];
function refreshDebugUI() {
  const b = $('#btnDebug'); b.textContent = DBG.on ? 'デバッグ ON' : 'デバッグ OFF'; b.classList.toggle('on', DBG.on); b.setAttribute('aria-pressed', String(DBG.on));
  $('#dbgPanel').hidden = !(DBG.on && DBG.panel);
  ['#btnDbgUnlock', '#btnDbgMedal', '#btnDbgReset'].forEach(id => { $(id).hidden = !DBG.on; });
  $$('#dbgPanel [data-dbg]').forEach(cb => { cb.checked = !!DBG[cb.dataset.dbg]; });
  $$('#dbgPanel [data-speed]').forEach(x => x.classList.toggle('on', +x.dataset.speed === DBG.speed));
  const boss = $('#dbgPanel [data-act="boss"]'); if (boss) boss.disabled = !bossInfo;
}
function dbgWarp(x) {
  if (!P) return;
  P.x = clamp(x, 0, WW - P.w - 1);
  const c = Math.floor((P.x + P.w / 2) / T); let r = 0;
  while (r < ROWS - 1 && !solid(c, r)) r++;
  P.y = Math.max(0, r * T - P.h - 30); P.vx = 0; P.vy = 0; P.safeX = P.x; P.safeY = P.y; P.inv = 60;
}
function dbgAction(a) {
  if (!P || curScreen !== 'scr-game') return;
  const live = state === 'play' || state === 'countdown';
  if (a === 'prev') { if (COOP) { scrIdx = Math.max(0, scrIdx - 1); dbgWarp(scrIdx * AREA_W + 60); } else dbgWarp(P.x - 900); }
  else if (a === 'next') dbgWarp(COOP ? (scrIdx + 1) * AREA_W + 60 : P.x + 900);
  else if (a === 'boss' && bossInfo) dbgWarp(bossInfo.arenaStart + 30);
  else if (a === 'goal') dbgWarp(goalX - 160);
  else if (a === 'heal') P.hp = P.maxHp;
  else if (a === 'keys') { locks.forEach((_, i) => openLock(i)); items.forEach(it => { if (it.type === 'key') it.taken = true; }); }
  else if (a === 'clear' && live) endRound('runner', 'デバッグで即クリア');
  else if (a === 'fail' && live) endRound('builder', 'デバッグで即失敗');
}
$('#btnDebug').addEventListener('click', e => {
  DBG.on = !DBG.on; DBG.panel = true;
  try { localStorage.setItem('rr-debug', DBG.on ? '1' : '0'); } catch (_e) {}
  refreshDebugUI(); e.currentTarget.blur();
});
$$('#dbgPanel [data-dbg]').forEach(cb => cb.addEventListener('change', () => { DBG[cb.dataset.dbg] = cb.checked; cb.blur(); if (cb.dataset.dbg === 'noLimit') updateToolAvailability(); }));
$$('#dbgPanel [data-speed]').forEach(b => b.addEventListener('click', () => { DBG.speed = +b.dataset.speed; refreshDebugUI(); b.blur(); }));
$$('#dbgPanel [data-act]').forEach(b => b.addEventListener('click', () => { dbgAction(b.dataset.act); b.blur(); }));
