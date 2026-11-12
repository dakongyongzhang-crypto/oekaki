'use strict';

/* =====================================================
   ラウンド終了・結果画面・ポーズ
   ===================================================== */
function endRound(winner, reason) {
  if (state === 'over') return;
  state = 'over'; overT = 75;
  if (COOP) {
    COOP_STATS.tries++;
    if (winner === 'runner') { COOP_STATS.clears++; const t = (roundLen() - timeLeft) / 60; if (COOP_STATS.best == null || t < COOP_STATS.best) COOP_STATS.best = t; }
  } else SCORE[winner]++;
  let winIdx = -1;
  if (MATCH.on) {
    winIdx = winner === 'runner' ? MATCH.runner : 1 - MATCH.runner;
    MATCH.players[winIdx].wins++;
    if (MATCH.players[winIdx].wins >= MATCH.target) MATCH.over = true;
    MATCH.history.push({ round: MATCH.round, winIdx, role: winner, stage: stage.name });
  }
  updateScoreUI();
  lastResult = { winner, reason, time: roundLen() - timeLeft, winIdx };
  stopPaint();
  BGM.stop(0.25);
  if (winner === 'runner') SFX.win(); else SFX.lose();
  banner = { text: winner === 'runner' ? (bossInfo ? 'CLEAR!' : 'GOAL!') : (reason.includes('時間') ? 'TIME UP' : 'K.O.'), life: 75, color: winner === 'runner' ? C.runner : C.builder };
}
function showResult() {
  if (MATCH.on && MATCH.over) { if (NET.role === 'host') netSendVictory(); showVictory(); return; }
  const r = lastResult;
  const title = $('#resTitle');
  title.textContent = r.winner === 'runner' ? 'ランナーの勝ち！' : 'ビルダーの勝ち！';
  title.className = 'hand ' + (r.winner === 'runner' ? 'r' : 'b');
  const secs = Math.floor(r.time / 60);
  $('#resReason').textContent = `ステージ「${stage.name}」：` + r.reason + `（${Math.floor(secs / 60)}分${String(secs % 60).padStart(2, '0')}秒）`;
  const prog = Math.round(progress() * 100);
  $('#resCols').innerHTML = `
    <div><h4 style="color:var(--runner)">${MATCH.on ? 'プレイヤー' + roleWho('runner').label : 'P1'} ランナー：${escapeHtml(CH.name)}</h4>
      <p><span>到達度</span><b>${r.winner === 'runner' ? 100 : prog}%</b></p>
      <p><span>残りHP</span><b>${Math.ceil(P.hp)} / ${P.maxHp}</b></p>
      <p><span>倒した敵</span><b>${ST.kills}</b></p>
      <p><span>壊した壁</span><b>${ST.broken}マス</b></p></div>
    <div><h4 style="color:var(--builder)">${MATCH.on ? 'プレイヤー' + roleWho('builder').label : 'P2'} ビルダー</h4>
      <p><span>使ったカード</span><b>${ST.placed}回</b></p>
      <p><span>ペンで描いたマス</span><b>${ST.painted}</b></p>
      <p><span>与えたダメージ</span><b>${ST.dmg}</b></p>
      <p><span>${MATCH.on ? 'マッチ' : '通算成績'}</span><b>${MATCH.on ? `A ${MATCH.players[0].wins} − ${MATCH.players[1].wins} B` : `${SCORE.runner} − ${SCORE.builder}`}</b></p></div>`;
  ['#btnRetry', '#btnRedeck', '#btnRedraw'].forEach(sel => { $(sel).hidden = MATCH.on; });
  if (NET.role && !COOP) { $('#btnRedraw').hidden = false; $('#btnRedeck').hidden = !MATCH.on; netUpdateWait(); } // オンライン：自分のぶんだけ組み直せる（フリーのホストはキャラ、ゲストはデッキ）
  $('#btnNextRound').hidden = !MATCH.on || MATCH.over;
  $('#btnRematch').hidden = !MATCH.on || !MATCH.over;
  const rm = $('#resMatch'); rm.hidden = !MATCH.on;
  if (MATCH.on) {
    const w = MATCH.players[r.winIdx], nextRunner = roleWho('builder');
    title.textContent = MATCH.over ? `プレイヤー${w.label}の優勝！` : `プレイヤー${w.label}の勝ち！`;
    rm.innerHTML = `${scoreHtml()}<br><small>${MATCH.over ? `${MATCH.target}本先取を達成！` : `${r.winner === 'runner' ? 'ランナー' : 'ビルダー'}として勝利。次はプレイヤー${nextRunner.label}がランナーです`}</small>`;
  }
  $('#btnRetry').textContent = COOP ? 'もう一度挑戦' : '同じ設定で再戦';
  $('#btnNextPage').hidden = true; $('#btnStoryMap').hidden = !COOP;
  if (COOP) {
    $('#btnRedeck').hidden = true; $('#btnRedraw').hidden = true;
    const win = r.winner === 'runner', rem = Math.ceil(timeLeft / 60);
    // ページの長さが違っても公平になるよう、残り時間は「割合」で評価する
    const score = win ? Math.round(rem / pageDef(storyIdx).time * 400) + Math.ceil(P.hp / P.maxHp * 100) : 0;
    const rank = !win ? '—' : score >= 330 ? 'S' : score >= 250 ? 'A' : score >= 170 ? 'B' : 'C';
    const sv = storySave[COOP_LV];
    const got = { silver: win, gold: win && rank === 'S', rainbow: win && ST.dmg === 0 };
    sv.medals = sv.medals || [];
    const prevM = sv.medals[storyIdx] || {}, isNew = {};
    for (const k of Object.keys(got)) isNew[k] = got[k] && !prevM[k];
    const exBefore = exOpen(COOP_LV);
    if (win) sv.medals[storyIdx] = { silver: !!(prevM.silver || got.silver), gold: !!(prevM.gold || got.gold), rainbow: !!(prevM.rainbow || got.rainbow) };
    if (MEDAL_ORDER.indexOf(bestMedal(got)) > MEDAL_ORDER.indexOf(bestMedal(prevM))) [1568, 2093, 2637].forEach((f, i) => SFX.tone(f, f * 1.02, 0.18, 'sine', 0.04, 1.3 + i * 0.12));
    if (win) {
      const order = 'CBAS';
      if (!sv.ranks[storyIdx] || order.indexOf(rank) > order.indexOf(sv.ranks[storyIdx])) sv.ranks[storyIdx] = rank;
      sv.open = Math.max(sv.open, Math.min(STORY.length, storyIdx + 2));
      saveStory(); updateScoreUI();
    }
    title.textContent = win ? `${pageLabel(storyIdx)} クリア！ ランク ${rank}` : 'ざんねん…';
    title.className = 'hand ' + (win ? 'r' : 'b');
    $('#btnNextPage').hidden = !win || storyIdx === EX_IDX;
    $('#btnNextPage').textContent = storyIdx >= STORY.length - 1 ? 'エンディングへ' : '次のページへ';
    $('#resCols').innerHTML = `
      <div><h4 style="color:var(--runner)">P1 ランナー：${escapeHtml(CH.name)}</h4>
        <p><span>到達度</span><b>${win ? 100 : Math.round(progress() * 100)}%</b></p>
        <p><span>残りHP</span><b>${Math.ceil(P.hp)} / ${P.maxHp}</b></p>
        <p><span>残り時間</span><b>${win ? rem + '秒' : '—'}</b></p></div>
      <div><h4 style="color:var(--builder)">P2 サポーター</h4>
        <p><span>使ったカード</span><b>${ST.placed}回</b></p>
        <p><span>置いたブロック</span><b>${ST.painted}マス</b></p>
        <p><span>スコア</span><b>${win ? score : '—'}</b></p></div>`;
    const cm = $('#resMatch'); cm.hidden = false;
    cm.innerHTML = `${pageLabel(storyIdx)}「${pageDef(storyIdx).name}」（大王の強さ：${CPU_LV[COOP_LV].name}）　ベスト <b>${sv.ranks[storyIdx] || '—'}</b>
      <div class="res-medals">${(() => { const k = bestMedal(got); if (!k) return ''; const nb = MEDAL_ORDER.indexOf(k) > MEDAL_ORDER.indexOf(bestMedal(prevM)); return `<span class="res-medal">${medalOne(k, ' big' + (nb ? ' new' : ''))}<small>${MEDAL_JP[k][0]}メダル（${MEDAL_JP[k][1]}）${nb ? ' <b class="newtag">NEW!</b>' : ''}</small></span>`; })()}</div>${!exBefore && exOpen(COOP_LV) ? '<p class="ex-unlock">全ページで金メダル以上！ EXステージが解放された！</p>' : ''}`;
  }
  $('#result').classList.remove('hidden');
  if (NET.role === 'host') netSendResult();
  BGM.play('menu');
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function togglePause() {
  if (state === 'over') return;
  if (state === 'paused') { state = prevState; $('#btnPause').textContent = 'ポーズ'; BGM.duck(false); $('#pauseMenu').classList.add('hidden'); }
  else {
    prevState = state; state = 'paused'; stopPaint(); $('#btnPause').textContent = '再開'; BGM.duck(true); for (const k in keys) keys[k] = false;
    $('#pauseNote').textContent = MATCH.on ? 'タイトルへ戻ると、このマッチは中断されます。Esc か P でも再開できます'
      : COOP ? 'ページ選択やタイトルへ戻ると、このページは最初からになります。Esc か P でも再開できます'
      : 'Esc か P でも再開できます';
    $('#btnPauseStory').hidden = !COOP;
    $('#pauseMenu').classList.remove('hidden');
  }
}
$('#btnResume').addEventListener('click', e => { e.currentTarget.blur(); if (state === 'paused') togglePause(); gcv.focus({ preventScroll: true }); });
$('#btnPauseTitle').addEventListener('click', () => { $('#pauseMenu').classList.add('hidden'); $('#btnPause').textContent = 'ポーズ'; BGM.duck(false); quitToTitle(); });
$('#btnPauseStory').addEventListener('click', () => { $('#pauseMenu').classList.add('hidden'); $('#btnPause').textContent = 'ポーズ'; BGM.duck(false); storySel = storyIdx; showStory(); });
$('#btnPause').addEventListener('click', e => {
  e.currentTarget.blur();
  if (NET.role === 'guest') { if (confirm('接続を切って、タイトルに戻りますか？')) quitToTitle(); return; }
  togglePause();
});
$('#btnMute').addEventListener('click', e => {
  SFX.on = !SFX.on; e.currentTarget.textContent = SFX.on ? '効果音 ON' : '効果音 OFF';
  e.currentTarget.setAttribute('aria-pressed', String(!SFX.on)); e.currentTarget.blur();
});
$('#btnRetry').addEventListener('click', () => { if (NET.role && !COOP) { netOnlineRetry(); return; } resetRound(); gcv.focus({ preventScroll: true }); });
$('#btnRedeck').addEventListener('click', () => { if (NET.role && !COOP) { netRedo('deck'); return; } $('#result').classList.add('hidden'); show('scr-deck'); refreshDeckUI(); });
$('#btnRedraw').addEventListener('click', () => { if (NET.role && !COOP) { netRedo('draw'); return; } $('#result').classList.add('hidden'); show('scr-draw'); });
$('#btnTitle').addEventListener('click', quitToTitle);
