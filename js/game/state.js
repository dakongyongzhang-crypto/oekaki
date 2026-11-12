'use strict';

/* =====================================================
   ゲームの状態（ラウンド中に変わる変数）とタイル判定
   ===================================================== */
let CH = null, P = null;
const NET = { role: null, open: false, live: false, closing: false, dc: null, dcPending: null, pc: null, seed: null, seq: 0, idc: 0, fx: [], queue: [], guestReady: false,
  shadow: null, mP: null, mE: null, mB: null, gE: new Map(), gB: new Map(), small: {}, sE: '', sB: '', baseGuides: 0, camTarget: 0, camTargetY: 0, bTarget: 0, bSent: 0, bPend: false, pts: [], vsDown: false, mv: null, rtt: 0, bytes: 0, lastRx: 0,
  vsMode: null, runnerSide: 'host', ready: [false, false], busy: [false, false], redo: null };
let tiles, paintCol, paintKind, paintHp, paintT, paintExp, origTile, items, clouds, goalX, goalY;
let enemies = [], bullets = [], particles = [], popups = [];
let state = 'countdown', prevState = 'play', countT = 0, timeLeft = 0, energy = 0, tick = 0, camX = 0, shake = 0, hitStop = 0, overT = 0, banner = null;
let tool = DECK[0], paintInk = -1, atkPressed = false, inkWarnT = 0, penLive = 0;
let effects = { dark: 0, rev: 0, heavy: 0, boost: 0, freeze: 0 };
// 協力モードのエリア：1エリア960px（画面いっぱい）。視点を引いて、前後のエリアが160pxずつ重なって見えるようにする
const AREA_W = 960, AREA_OV = 160;
function areaCamX(i, pc) {
  let x = i * AREA_W - AREA_OV;
  if (bossInfo && pc > bossInfo.arenaStart) x = WW - VWW; // ボス部屋は部屋全体を見せる
  return clamp(x, 0, Math.max(0, WW - VWW));
}
let camSlide = { from: 0, to: 0, t: 1 }, scrIdx = 0, viewX = 0, viewY = 0, camY = 0, bCamY = 0, bCamTY = 0, startPos = { c: 3, r: 20 }, startSign = { x: 40, y: 420 }, bCam = 0, bCamT = 0, panDrag = null, mmDrag = false, mmCanvas = null, mmDirty = true;
let cardCd = {}; // カードごとの再使用待ち時間（フレーム）
const THORN_CD = 60;
const inGoalZone = (x, y, w, h) => stage.vertical ? y < goalY + 50 : (x + w > goalX - 40 && x < goalX + 100);
const inStartZone = (c, r) => stage.vertical ? r >= ROWS - 3 : c <= 5;
const nearView = (x, y) => Math.abs(x - (camX + VWW / 2)) < VWW && Math.abs(y - (camY + VWH / 2)) < VWH;
const farBehind = e => stage.vertical ? e.y > camY + VWH + 500 : e.x < camX - 520;
const reachedGoal = () => bossInfo ? false : stage.vertical ? (P.onGround && P.y + P.h <= goalY + 1) : (P.x + P.w >= goalX + 4);
function progress() { return stage.vertical ? clamp((ST.startY - P.y) / (ST.startY - (goalY - P.h)), 0, 1) : clamp((P.x - ST.startX) / (goalX - ST.startX), 0, 1); }
const thornCells = (wx, wy) => { const c = Math.round(wx / T) - 1, r = Math.round(wy / T) - 1; return [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]]; };
let trail = [], spawnQueue = [], crumbling = [], shadowSpr = null, shadowFor = null;
let ST = {}; const SCORE = { runner: 0, builder: 0 }; let lastResult = null;

const idx = (c, r) => r * LW + c;
function tileAt(c, r) { if (c < 0 || c >= LW) return 1; if (r < 0 || r >= ROWS) return 0; return tiles[r * LW + c]; }
const isSolidT = t => t === 1 || t === 2 || t === 3 || t === 7 || t === 8 || t === 9 || t === 10; // 9 = ボス戦の橋 / 10 = カギの扉
const solid = (c, r) => isSolidT(tileAt(c, r));
const isFloorT = t => isSolidT(t) || t === 4;
