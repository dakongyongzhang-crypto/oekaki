'use strict';

/* =====================================================
   オンライン：接続（WebRTC・接続コード）
   P1（ランナー）＝ホストがゲーム全体を動かす。P2（サポーター）＝ゲストは操作を送り、状態を受け取って描くだけ。
   接続は「接続コード」をコピペで交換する方式（サーバー不要）。
   ===================================================== */
const RTC_CFG = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
const r1 = v => Math.round(v * 10) / 10;
const sumArr = a => { let h = 0; for (let i = 0; i < a.length; i++) h = (h * 31 + a[i]) | 0; return h; };
function netToast(msg, ms = 4500) {
  let el = $('#netToast');
  if (!el) { el = document.createElement('div'); el.id = 'netToast'; el.className = 'net-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(netToast.t); netToast.t = setTimeout(() => { el.hidden = true; }, ms);
}
function setStatus(id, msg, cls) { const el = $('#' + id); el.textContent = msg; el.className = 'net-status' + (cls ? ' ' + cls : ''); }
function onShow(id) { ['onPick', 'onHost', 'onGuest', 'onWait'].forEach(x => { $('#' + x).hidden = x !== id; }); }
async function copyText(ta) {
  try { await navigator.clipboard.writeText(ta.value); return true; } catch (_e) {}
  try { ta.focus(); ta.select(); return document.execCommand('copy'); } catch (_e) { return false; }
}

/* ---------- 接続コード（SDPを圧縮して文字にする） ---------- */
const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/=+$/, ''); };
const unb64 = str => { while (str.length % 4) str += '='; const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
async function pipeBytes(stream, bytes) {
  const w = stream.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
async function codeEncode(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') { try { return 'RR1z' + b64(await pipeBytes(new CompressionStream('deflate-raw'), raw)); } catch (_e) {} }
  return 'RR1r' + b64(raw);
}
async function codeDecode(text) {
  const t = (text || '').replace(/\s+/g, '');
  if (!/^RR1[zr][A-Za-z0-9+/]+$/.test(t)) throw new Error('コードの形が正しくありません');
  let bytes = unb64(t.slice(4));
  if (t[3] === 'z') bytes = await pipeBytes(new DecompressionStream('deflate-raw'), bytes);
  return JSON.parse(new TextDecoder().decode(bytes));
}
function waitIce(pc, ms) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    let tm = 0;
    const chk = () => { if (pc.iceGatheringState === 'complete') done(); };
    const done = () => { pc.removeEventListener('icegatheringstatechange', chk); clearTimeout(tm); res(); };
    pc.addEventListener('icegatheringstatechange', chk); tm = setTimeout(done, ms);
  });
}

/* ---------- 接続の確立 ---------- */
function netCleanup() {
  clearInterval(NET.pingTimer); clearInterval(NET.mTimer);
  const pc = NET.pc, dc = NET.dc || NET.dcPending;
  NET.pc = NET.dc = NET.dcPending = null;
  setTimeout(() => { try { dc && dc.close(); } catch (_e) {} try { pc && pc.close(); } catch (_e) {} }, 250);
  NET.open = NET.live = NET.guestReady = false; NET.queue = [];
}
function netClose(sendBye) {
  if (sendBye) netSend({ t: 'bye' });
  NET.closing = true;
  const r = NET.role; NET.role = null; netCleanup();
  document.body.classList.remove('net-host', 'net-guest', 'net-notool', 'net-hidecards'); $('#netPill').hidden = true; $('#resWait').hidden = true;
  NET.vsMode = null; NET.runnerSide = 'host'; NET.ready = [false, false]; NET.vsDown = false; NET.busy = [false, false]; NET.redo = null;
  if (r === 'host') { pointerIsDown = false; releaseGate(); }
  NET.closing = false;
}
function netBind(dc) {
  NET.dcPending = dc;
  dc.onopen = () => { NET.dc = dc; NET.open = true; NET.lastRx = performance.now(); netOnOpen(); };
  dc.onmessage = e => { NET.lastRx = performance.now(); netOnMessage(e.data); };
  dc.onclose = () => { if (NET.dc === dc || NET.dcPending === dc) netOnClose('close'); };
  dc.onerror = () => {};
}
function netWatch(pc) {
  const failed = () => {
    if (NET.pc !== pc) return;
    if (!NET.open) {
      const id = NET.role === 'host' ? 'hostStatus' : 'guestStatus';
      setStatus(id, '接続できませんでした。学校や会社のWi-Fi、一部のスマホ回線などでは、つながらないことがあります。自宅のネット同士でもう一度ためしてください。', 'err');
    } else netOnClose('failed');
  };
  pc.oniceconnectionstatechange = () => { if (pc.iceConnectionState === 'failed') failed(); };
  pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') failed(); };
}
async function netHostCreate() {
  netCleanup(); NET.role = 'host';
  const pc = NET.pc = new RTCPeerConnection(RTC_CFG);
  netBind(pc.createDataChannel('rr', { ordered: true })); netWatch(pc);
  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc, 4500);
  return codeEncode({ v: 1, d: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
}
async function netHostAccept(text) {
  const o = await codeDecode(text);
  if (!o || o.v !== 1 || !o.d || o.d.type !== 'answer') throw new Error('これは「返事コード」ではありません');
  await NET.pc.setRemoteDescription(o.d);
}
async function netGuestAnswer(text) {
  const o = await codeDecode(text);
  if (!o || o.v !== 1 || !o.d || o.d.type !== 'offer') throw new Error('これは「接続コード」ではありません（ホストが作ったコードを貼ってください）');
  netCleanup(); NET.role = 'guest';
  const pc = NET.pc = new RTCPeerConnection(RTC_CFG);
  pc.ondatachannel = e => netBind(e.channel); netWatch(pc);
  await pc.setRemoteDescription(o.d);
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc, 4500);
  return codeEncode({ v: 1, d: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
}
function netOnOpen() {
  netSend({ t: 'hello', v: 1 });
  NET.pingTimer = setInterval(() => {
    netSend({ t: 'ping', ts: performance.now() });
    if (performance.now() - NET.lastRx > 10000) netOnClose('timeout');
    updateNetPill();
  }, 2000);
  SFX.pick();
  if (NET.role === 'host') {
    setStatus('hostStatus', '接続できました！ 下のボタンでゲームに進みましょう。', 'ok');
    $('#onModes').hidden = false; $('#btnHostConnect').disabled = true;
  } else {
    NET.mTimer = setInterval(netFlushMove, 33);
    onShow('onWait'); $('#waitTitle').textContent = '接続できました！';
    $('#waitMsg').textContent = 'ホストがキャラを描いています…。ゲームが始まるまで、このままお待ちください。';
    show('scr-online');
  }
}
function netOnClose(reason) {
  if (NET.closing || !NET.role) return;
  const role = NET.role;
  clearInterval(NET.pingTimer); clearInterval(NET.mTimer);
  NET.open = false; NET.live = false;
  if (role === 'host') {
    pointerIsDown = false; releaseGate(); stopPaint(); for (const k in keys) keys[k] = false;
    if (curScreen === 'scr-game' && (state === 'play' || state === 'countdown')) togglePause();
    netToast('相手との接続が切れました。ポーズメニューの「タイトルへ戻る」で戻れます。', 9000);
  } else {
    netToast('ホストとの接続が切れました。タイトルに戻ります。', 7000);
    netClose(false); quitToTitle();
  }
}
function netSend(obj) {
  const dc = NET.dc;
  if (!dc || dc.readyState !== 'open') return false;
  try { const s = JSON.stringify(obj); dc.send(s); NET.bytes += s.length; return true; } catch (_e) { return false; }
}
function updateNetPill() {
  const el = $('#netPill'); if (!NET.role || !NET.open) { el.hidden = true; return; }
  el.hidden = false; el.textContent = `通信 ${NET.rtt ? Math.round(NET.rtt) + 'ms' : '…'}`;
}

/* ---------- 受信 ---------- */
function netOnMessage(raw) {
  let m; try { m = JSON.parse(raw); } catch (_e) { return; }
  if (m.t === 'ping') { netSend({ t: 'pong', ts: m.ts }); return; }
  if (m.t === 'pong') { NET.rtt = performance.now() - m.ts; updateNetPill(); return; }
  if (m.t === 'prep') { netOnPrep(m); return; }
  if (m.t === 'redo') { NET.busy[m.i] = !!m.on; netUpdateWait(); return; }
  if (m.t === 'bye') {
    if (NET.role === 'guest') { netToast('ホストが部屋を閉じました。タイトルに戻ります。', 6000); netClose(false); quitToTitle(); }
    else { NET.open = false; NET.live = false; netToast('相手が退出しました。', 6000); if (curScreen === 'scr-game' && (state === 'play' || state === 'countdown')) togglePause(); }
    return;
  }
  if (NET.role === 'host') { netHostInput(m); return; }
  if (NET.role === 'guest') {
    if (!NET.guestReady && m.t === 'snap') { NET.queue.push(m); return; }
    netGuestMsg(m);
  }
}
