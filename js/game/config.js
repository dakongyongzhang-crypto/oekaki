'use strict';

/* =====================================================
   ゲーム定数と画面分割レイアウト
   ===================================================== */
// GW = ゲーム画面の論理的な横幅。オフライン対戦では窓の縦横比に合わせて変わる（fitStage）。高さ GH は常に 540
let GW = 960; const GH = 540, T = 20, GW_BASE = 960;
let ROWS = 27, LW = 300;
// 画面を上下に2分割（上：ランナー / 下：ビルダー）。各画面はステージの高さまるごとを 1/2 の縮尺で映す
// 画面分割レイアウト。横に進むステージ＝上下分割（1/2縮尺）、上に登るステージ＝左右分割（等倍）
// VW,VH = 1画面の大きさ（キャンバス座標） / BX,BY = ビルダー画面の左上 / VWW,VWH = 1画面に映るワールドの広さ / WW,WH = ステージ全体の広さ
let SPLIT = 'h', VW = GW, VH = GH / 2, VS = 0.5, BX = 0, BY = GH / 2, VWW = GW * 2, VWH = GH, WW = 6000, WH = 540, TXS = 1.7;
// mode: 'h' = 上下分割 / 'v' = 左右分割 / 's' = 分割なし（協力モード。2人で同じ画面を見る）
const isH = () => SPLIT === 'h' || SPLIT === 'o'; // ビルダーの視点が横にスクロールする配置
function setLayout(mode) {
  SPLIT = mode;
  if (mode === 's' || mode === 'o') GW = GW_BASE; // 協力・オンラインは16:9のまま（相手と見える範囲をそろえる）
  if (mode === 'v') { VW = GW / 2; VH = GH; VS = 1; BX = GW / 2; BY = 0; TXS = 1; }
  else if (mode === 'o') { VW = GW; VH = GH; VS = 1; BX = 0; BY = 0; TXS = 1; } // オンライン対戦：自分の役割の画面だけを全面に表示
  else if (mode === 's') { VW = GW; VH = GH; VS = COOP ? GW / (AREA_W + AREA_OV * 2) : 1; BX = 0; BY = 0; TXS = COOP ? 1.25 : 1; }
  else { VW = GW; VH = GH / 2; VS = 0.5; BX = 0; BY = GH / 2; TXS = 1.7; }
  VWW = VW / VS; VWH = VH / VS; WW = LW * T; WH = ROWS * T;
}
const GRAV = 0.55, SAFE_R = 110, VS_SAFE_R = 80, VS_HP_MUL = 1.5, VS_DMG_MUL = 1.2, EMAX = 100, EREGEN = 0.3, MAX_EN = 30, SPAWN = 40; // EREGEN = 対戦のビルダーのエネルギー回復（1フレームあたり）
const VS_PEN_MAX = 40; // 対戦：ペン系カードで同時に置いておけるマスの上限（分厚い壁で進めなくなるのを防ぐ）
const ROUND_T = 60 * 60, COOP_T = 80 * 60, DECK_MAX = 8, BOMB_R = 105, BOMB_DMG = 35;
const C = { paper: '#f7f9fc', grid: '#d6e2f1', ink: '#24252b', terr: '#e3e6ee', brick: '#ffe58a', plank: '#c99a68', grass: '#4f9a52', cloud: '#a8bed6', runner: '#e8305f', builder: '#2a5bd7', bad: '#d1293f' };
const INKS = ['#2a5bd7', '#6b3fd0', '#16899b', '#d03f86'];
