'use strict';

/* =====================================================
   キーボード・タッチパッド入力（ランナー）
   ===================================================== */
const keys = Object.create(null);
const K_LEFT = ['ArrowLeft', 'KeyA', 'TouchLeft'], K_RIGHT = ['ArrowRight', 'KeyD', 'TouchRight'];
const K_JUMP = ['ArrowUp', 'KeyW', 'Space', 'TouchJump'], K_ATK = ['KeyJ', 'KeyF', 'KeyX', 'TouchAtk'];
const GAME_KEYS = new Set([...K_LEFT, ...K_RIGHT, ...K_JUMP, ...K_ATK, 'ArrowDown', 'KeyS']);
const held = a => a.some(k => keys[k]);
function pressJump() { if (P) P.jumpBuf = 8; }
function pressAtk() { atkPressed = true; }
window.addEventListener('keydown', e => {
  if (curScreen === 'scr-draw') {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.target.tagName !== 'INPUT') { e.preventDefault(); undo(); }
    return;
  }
  if (curScreen !== 'scr-game') return;
  if (e.code === 'F2' && DBG.on) { e.preventDefault(); DBG.panel = !DBG.panel; refreshDebugUI(); return; }
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat && NET.role !== 'guest') togglePause(); return; }
  const m = /^(Digit|Numpad)([1-8])$/.exec(e.code);
  if (m) { const id = DECK[+m[2] - 1]; if (id && (!NET.role || netIAmBuilder())) selectTool(id); return; }
  if (e.code === 'KeyM') { if (!e.repeat) toggleBgm(); return; }
  if (e.repeat) return;
  if (NET.role && !netIAmRunner()) return; // この機械はランナーではない（ランナーの操作はもう片方のPCから届く）
  if (NET.role === 'guest') { if (GAME_KEYS.has(e.code)) netSend({ t: 'key', c: e.code, d: 1 }); return; } // ゲストがランナー：キー操作をホストへ送る
  keys[e.code] = true;
  if (K_JUMP.includes(e.code)) pressJump();
  if (K_ATK.includes(e.code)) pressAtk();
});
window.addEventListener('keyup', e => {
  if (curScreen === 'scr-game' && GAME_KEYS.has(e.code)) e.preventDefault();
  if (NET.role && !netIAmRunner()) return;
  if (NET.role === 'guest') { if (GAME_KEYS.has(e.code)) netSend({ t: 'key', c: e.code, d: 0 }); return; }
  keys[e.code] = false;
});
window.addEventListener('blur', () => {
  if (NET.role === 'host' && !netIAmRunner()) return; // 相手のキー入力を消さない
  if (NET.role === 'guest' && netIAmRunner()) netSend({ t: 'keys0' });
  for (const k in keys) keys[k] = false;
});
document.addEventListener('visibilitychange', () => { if (document.hidden && NET.role !== 'guest' && curScreen === 'scr-game' && (state === 'play' || state === 'countdown')) togglePause(); });

$$('.tp').forEach(b => {
  const k = b.dataset.k;
  const down = e => {
    e.preventDefault(); SFX.init();
    if (NET.role && !netIAmRunner()) return;
    if (NET.role === 'guest') { netSend({ t: 'key', c: k, d: 1 }); b.classList.add('down'); return; }
    keys[k] = true; b.classList.add('down'); if (k === 'TouchJump') pressJump(); if (k === 'TouchAtk') pressAtk();
  };
  const up = e => {
    e.preventDefault();
    if (NET.role === 'guest' && netIAmRunner()) netSend({ t: 'key', c: k, d: 0 });
    if (NET.role) { b.classList.remove('down'); return; }
    keys[k] = false; b.classList.remove('down');
  };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
