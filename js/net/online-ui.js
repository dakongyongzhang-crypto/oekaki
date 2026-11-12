'use strict';

/* =====================================================
   オンライン：接続画面のボタン
   ===================================================== */
// コピーボタン：押したあと2.5秒だけ結果を表示する
function bindCopyButton(btnSel, taSel) {
  $(btnSel).addEventListener('click', async e => {
    const b = e.currentTarget; const ok = await copyText($(taSel));
    b.textContent = ok ? 'コピーしました！' : 'うまくコピーできません（文字を選んでコピーしてください）';
    setTimeout(() => { b.textContent = 'コピー'; }, 2500);
  });
}
$('#btnOnline').addEventListener('click', () => { SFX.init(); netClose(false); onShow('onPick'); show('scr-online'); });
$('#btnOnHost').addEventListener('click', async () => {
  SFX.init();
  if (typeof RTCPeerConnection === 'undefined') { onShow('onHost'); setStatus('hostStatus', 'このブラウザはオンライン通信（WebRTC）に対応していません。Chrome・Edge・Firefox・Safariの新しいものを使ってください。', 'err'); return; }
  onShow('onHost'); $('#hostCode').value = ''; $('#hostReply').value = ''; $('#onModes').hidden = true; $('#btnHostConnect').disabled = true;
  setStatus('hostStatus', '接続コードを作っています…（数秒かかります）');
  try {
    $('#hostCode').value = await netHostCreate(); $('#btnHostConnect').disabled = false;
    setStatus('hostStatus', '① のコードをコピーして、相手に送ってください。相手から「返事コード」が届いたら、② に貼り付けて「接続」を押します。');
  } catch (e) { setStatus('hostStatus', '接続コードを作れませんでした：' + e.message, 'err'); }
});
bindCopyButton('#btnCopyHost', '#hostCode');
$('#btnHostConnect').addEventListener('click', async () => {
  const t = $('#hostReply').value.trim();
  if (!t) { setStatus('hostStatus', '② の欄に、相手から届いた返事コードを貼り付けてください。', 'err'); return; }
  setStatus('hostStatus', 'つないでいます…');
  try {
    await netHostAccept(t);
    setTimeout(() => { if (!NET.open && NET.role === 'host') setStatus('hostStatus', 'まだつながりません。コードが新しいものか確認してください（ホストがコードを作り直したら、相手も返事コードを作り直す必要があります）。', 'err'); }, 25000);
  } catch (e) { setStatus('hostStatus', '接続できませんでした：' + e.message, 'err'); }
});
$('#btnOnlineGo').addEventListener('click', () => { NET.vsMode = null; startCoop(); });
$('#btnOnlineVs').addEventListener('click', () => netBeginVsHost('free'));
$('#btnOnlineMatch').addEventListener('click', () => netBeginVsHost('match'));
$$('#onModes .target-pick .btn').forEach(b => b.addEventListener('click', () => { MATCH.target = +b.dataset.t; $$('.target-pick .btn').forEach(x => x.classList.toggle('on', +x.dataset.t === MATCH.target)); }));
$('#btnOnGuest').addEventListener('click', () => {
  SFX.init(); onShow('onGuest'); $('#guestCode').value = ''; $('#guestAnswer').value = ''; $('#guestAnswerBox').hidden = true;
  setStatus('guestStatus', typeof RTCPeerConnection === 'undefined' ? 'このブラウザはオンライン通信（WebRTC）に対応していません。' : 'ホストから届いた接続コードを ① に貼り付けて、「返事コードを作る」を押してください。', typeof RTCPeerConnection === 'undefined' ? 'err' : '');
});
$('#btnGuestMake').addEventListener('click', async () => {
  const t = $('#guestCode').value.trim();
  if (!t) { setStatus('guestStatus', '① の欄に、ホストから届いた接続コードを貼り付けてください。', 'err'); return; }
  $('#btnGuestMake').disabled = true; setStatus('guestStatus', '返事コードを作っています…（数秒かかります）');
  try {
    $('#guestAnswer').value = await netGuestAnswer(t); $('#guestAnswerBox').hidden = false;
    setStatus('guestStatus', '② の返事コードをコピーして、ホストに送ってください。ホストが「接続」を押すと、自動でつながります。');
  } catch (e) { setStatus('guestStatus', 'うまくいきませんでした：' + e.message, 'err'); }
  $('#btnGuestMake').disabled = false;
});
bindCopyButton('#btnCopyGuest', '#guestAnswer');
['#btnOnBack1', '#btnOnBack2', '#btnOnBack0'].forEach(id => $(id).addEventListener('click', () => { if (id === '#btnOnBack0') { netClose(false); show('scr-title'); } else { netClose(false); onShow('onPick'); } }));
$('#btnWaitLeave').addEventListener('click', () => quitToTitle());
$('#btnRedoCancel1').addEventListener('click', netRedoCancel);
$('#btnRedoCancel2').addEventListener('click', netRedoCancel);
window.addEventListener('beforeunload', () => { if (NET.role) netSend({ t: 'bye' }); });
