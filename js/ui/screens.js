'use strict';

/* =====================================================
   画面の切り替え
   ===================================================== */
let curScreen = 'scr-title';
function show(id) {
  curScreen = id;
  document.body.classList.toggle('ingame', id === 'scr-game');
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
  musicForScreen(id);
  if (NET.role === 'host' && NET.open) netOnHostScreen(id);
  if (NET.vsMode && (id === 'scr-draw' || id === 'scr-deck')) netFixTexts();
  if ((id === 'scr-draw' || id === 'scr-deck') && typeof updateSetupNav === 'function') updateSetupNav();
}
$('#btnStart').addEventListener('click', () => { SFX.init(); startFree(); });
