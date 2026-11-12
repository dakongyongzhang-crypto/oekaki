'use strict';

/* =====================================================
   画面全体の描画（render）
   ===================================================== */
// mode: 'runner' = ランナー用画面 / 'builder' = ビルダー用画面 / 'single' = 2人で共有する1画面
function renderView(ox, oy, cx, cy, mode, sx, sy) {
  viewX = Math.round(cx); viewY = Math.round(cy);
  g.save();
  g.beginPath(); g.rect(ox, oy, VW, VH); g.clip();
  g.translate(ox + sx, oy + sy);
  g.save(); g.scale(VS, VS);
  drawBackground();
  g.save(); g.translate(-viewX, -viewY);
  drawStart(); drawTerrain(); drawGates(); drawLocksAndLifts(); drawGuides(); drawBossArena(); drawGoal(); drawItems(); drawEnemies(); drawPlayer(); drawParticles(); drawDarkZones(); drawDebugBoxes();
  if (mode !== 'builder' && effects.dark > 0) {
    const a = clamp(Math.min(effects.dark, 360 - effects.dark) / 20, 0, 1);
    const px = P.x + P.w / 2, py = P.y + P.h / 2;
    const grd = g.createRadialGradient(px, py, 90, px, py, 190);
    grd.addColorStop(0, 'rgba(12,13,20,0)'); grd.addColorStop(1, 'rgba(12,13,20,0.96)');
    g.globalAlpha = a; g.fillStyle = grd; g.fillRect(viewX - 20, viewY - 20, VWW + 40, VWH + 40); g.globalAlpha = 1;
  }
  if (mode !== 'runner') drawGhost();
  g.restore();
  g.restore();
  if (mode === 'builder') { drawRunnerPointer(); drawMinimap(); }
  g.restore();
}
function render() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sx = shake ? (Math.random() - 0.5) * shake * 0.6 : 0, sy = shake ? (Math.random() - 0.5) * shake * 0.6 : 0;
  const single = SPLIT === 's';
  if (single) renderView(0, 0, camX, camY, 'single', sx, sy);
  else if (SPLIT === 'o') { // オンライン対戦：自分の画面だけ
    if (netIAmRunner()) renderView(0, 0, camX, camY, 'runner', sx, sy);
    else renderView(0, 0, bCam, bCamY, 'builder', 0, 0);
  } else {
    renderView(0, 0, camX, camY, 'runner', sx, sy);
    renderView(BX, BY, bCam, bCamY, 'builder', 0, 0);
    if (SPLIT === 'h') { g.fillStyle = '#ffffff'; g.fillRect(0, VH - 4, GW, 8); g.fillStyle = C.ink; g.fillRect(0, VH - 2, GW, 4); }
    else { g.fillStyle = '#ffffff'; g.fillRect(VW - 4, 0, 8, GH); g.fillStyle = C.ink; g.fillRect(VW - 2, 0, 4, GH); }
  }
  drawHUD();
  drawDebugInfo();
  const rcx = VW / 2, rcy = VH / 2, bcx = BX + VW / 2, bcy = BY + VH / 2, hz = SPLIT === 'h';
  if (state === 'countdown') {
    const n = Math.ceil(countT / 60), f = (countT % 60) / 60;
    if (COOP) {
      // ストーリーはカウントダウン中にお話とヒントを表示（ページ選択をはさまずに次へ進めるように）
      const st = pageDef(storyIdx);
      drawCenterText(`${pageLabel(storyIdx)}「${stage.name}」`, 26, st.ex ? C.bad : C.ink, 96, 1, rcx);
      st.story.forEach((line, k) => drawCenterText(line, 15, C.ink, 136 + k * 23, 1, rcx));
      drawCenterText(`ヒント：${st.hint}`, 18, C.builder, 216, 1, rcx);
      drawCenterText(String(n), 90 + f * 30, C.runner, rcy + 60, 0.4 + f * 0.6, rcx);
    } else if (SPLIT === 'o') {
      const me = netIAmRunner();
      drawCenterText(`${MATCH.on ? `ラウンド${MATCH.round}　` : ''}ステージ「${stage.name}」`, 26, C.ink, 100, 1, GW / 2);
      drawCenterText(me ? 'あなたはランナー：ゴールをめざそう！' : 'あなたはビルダー：今のうちに敵やワナを置こう', 21, me ? C.runner : C.builder, 142, 1, GW / 2);
      drawCenterText(String(n), 100 + f * 30, C.runner, GH / 2 + 30, 0.4 + f * 0.6, GW / 2);
    } else {
    drawCenterText(`${MATCH.on ? `ラウンド${MATCH.round}　` : ''}ステージ「${stage.name}」`, hz ? 26 : 24, C.ink, hz ? 92 : 110, 1, rcx);
    drawCenterText(String(n), (hz ? 70 : 100) + f * 30, C.runner, single ? rcy - 20 : rcy + (hz ? 34 : 0), 0.4 + f * 0.6, rcx);
    if (single) drawCenterText('2人で協力しよう！', 19, C.builder, 152, 1, rcx);
    else drawCenterText('今のうちに敵やワナを置こう', hz ? 24 : 21, C.builder, bcy + 4, 1, bcx);
    }
  }
  if (banner) drawCenterText(banner.text, hz ? 64 : 60, banner.color || C.runner, rcy + (hz ? 10 : -20), clamp(banner.life / 20, 0, 1), rcx);
  if (state === 'paused') {
    g.fillStyle = 'rgba(19,21,27,0.25)'; g.fillRect(0, 0, GW, GH);
    if (NET.role === 'guest') drawCenterText('ホストがポーズ中…', 44, '#ffffff', GH / 2, 1, GW / 2);
  }
}
