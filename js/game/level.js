'use strict';

/* =====================================================
   ステージのテーマとステージ生成（対戦・協力）／ラウンドの初期化
   ===================================================== */
// ステージの種類（毎回ランダムに1つ選ばれ、地形パーツの出やすさが変わる）
const THEMES = [
  { name: 'のはら', bg: 'meadow', terr: '#e3e6ee', grass: true, hmin: 13, hmax: 23, w: { flat: 3, gap: 3, up: 2, down: 2, pillar: 2, float: 2, bricks: 3, stairs: 1, mound: 2, islands: 1, planks: 1 } },
  { name: 'やまみち', bg: 'mountain', terr: '#e7e2d6', grass: true, hmin: 10, hmax: 23, w: { flat: 1, gap: 2, up: 4, down: 3, stairs: 3, stairsDown: 3, valley: 3, mound: 2, bricks: 1, pillar: 1, planks: 1 } },
  { name: 'うきしま', bg: 'sky', terr: '#e1e9f3', grass: true, hmin: 12, hmax: 22, w: { flat: 1, gap: 2, float: 4, islands: 5, pillars: 3, bricks: 1, planks: 2 } },
  { name: 'どうくつ', bg: 'cave', terr: '#d8dbe5', grass: false, hmin: 13, hmax: 23, w: { flat: 2, gap: 2, tunnel: 5, stal: 3, up: 1, down: 1, pillar: 2, mound: 1, bricks: 1 } },
  { name: 'まぜこぜ', bg: 'forest', terr: '#e3e6ee', grass: true, hmin: 12, hmax: 23, w: { flat: 2, gap: 2, up: 2, down: 2, pillar: 1, float: 1, bricks: 1, stairs: 1, stairsDown: 1, mound: 1, valley: 1, islands: 1, pillars: 1, planks: 1, tunnel: 1, stal: 1 } }
];
let stage = THEMES[0];
let gates = [], holdGate = null, guides = [], bossInfo = null, bossCut = null, locks = [], lifts = [], darkZones = [], holdLift = null; // guides = 協力モードでブロックを置くと良い場所
const COOP_STAGE = { name: 'いっしょにゴール', terr: '#e3e6ee', grass: true };
// 協力モード専用ステージ：サポーターの助けがないと越えられない「大穴」「絶壁」「スイッチ扉」が交互に出てくる
function genCoopLevel(rng, ri, seed) {
  const st = pageDef(storyIdx);
  ROWS = Math.ceil(GH * (AREA_W + AREA_OV * 2) / GW_BASE / T); // 協力モードは視点を引いているので、そのぶん下に地面を足す
  const SCR = AREA_W / T; // 1エリアの列数（48）
  LW = (st.kinds.length + 4) * SCR; tiles = new Uint8Array(LW * ROWS); // 生成用の仮の長さ（あとで実際の長さに詰め直す）
  items = []; gates = []; guides = [];
  stage = { name: st.name, bg: st.bg, terr: st.terr, grass: st.grass !== false };
  let c = 0, h = 26;
  const col = (cc, hh) => { for (let r = Math.max(0, hh); r < ROWS; r++) tiles[idx(cc, r)] = 1; };
  const flat = n => { for (let i = 0; i < n; i++) col(c++, h); };
  const padTo = target => { while (c < target) col(c++, h); };
  const gateDefs = [], lockDefs = [], liftDefs = [];
  const MAXW = { pit: 26, wall: 10, spikes: 22, key: 18, lift: 16, dark: 39, gate: 15, darkpit: 33 };
  const hole = holeMaker(rng);
  st.kinds.forEach((kind, n) => {
    const s0 = c;
    // 助走（洞くつでは天井つき）。段差は画面の境目には置かず、助走の途中に作る
    const lead = n === 0 ? 8 : clamp(ri(4, 14), 3, SCR - 2 - MAXW[kind]);
    const stepAt = n > 0 && lead >= 7 ? ri(3, lead - 3) : -1;
    const tunnel = st.cave && n > 0 && rng() < 0.5;
    for (let i = 0; i < lead; i++) {
      if (i === stepAt) h = clamp(h + ri(-2, 2), 20, 27);
      if (tunnel) for (let r = 0; r <= h - 6; r++) tiles[idx(c, r)] = 1;
      col(c++, h);
    }
    if (lead >= 5 && rng() < 0.3) items.push({ type: 'heart', x: (s0 + 2) * T + T / 2, y: (h - 3) * T, taken: false });
    if (kind === 'pit') {
      flat(2); const pw = hole.noJump(st.ex ? ri(16, 18) : ri(13, 16)); guides.push({ kind: 'bridge', row: h, c0: c, c1: c + pw - 1 }); c += pw; flat(3); // ジャンプでは越えられない幅（キャラに合わせる）
    } else if (kind === 'wall') {
      flat(4); const wh = ri(9, 10); guides.push({ kind: 'pad', row: h - 1, c0: c - 3, c1: c - 2 });
      for (let i = 0; i < 3; i++) { col(c, h); for (let r = h - wh; r < h; r++) tiles[idx(c, r)] = 1; c++; }
      flat(3);
    } else if (kind === 'spikes') {
      flat(3); const len = st.ex ? ri(15, 16) : ri(11, 14); guides.push({ kind: 'bridge', row: h - 1, c0: c, c1: c + len - 1 });
      for (let i = 0; i < len; i++) { col(c, h); tiles[idx(c, h)] = 8; c++; }
      flat(3);
    } else if (kind === 'key') {
      // 高い所のカギを取ると扉が開く（ジャンプだけでは届かない）
      flat(5); const kc = c + 1, ky = (h - 11) * T + 6;
      guides.push({ kind: 'pad', row: h - 1, c0: kc, c1: kc + 1 });
      items.push({ type: 'key', x: (kc + 1) * T, y: ky, taken: false, lock: lockDefs.length });
      flat(9); const dc = c; col(dc, h);
      for (let r = 0; r < h; r++) tiles[idx(dc, r)] = 10;
      c++; lockDefs.push({ c: dc, h });
      flat(3);
    } else if (kind === 'lift') {
      // ジャンプ台でも届かない崖。P2がレバーを押さえているあいだだけリフトが上がる
      flat(6); const lc = c; flat(3);
      const top = Math.max(2, h - ri(13, 14));
      for (let i = 0; i < 4; i++) { col(c, h); for (let r = top; r < h; r++) tiles[idx(c, r)] = 1; c++; }
      liftDefs.push({ x: lc * T, w: 3 * T, yBottom: h * T - 10, yTop: top * T - 10, sx: (lc - 4) * T + T / 2, sy: (h - 6) * T });
      flat(3);
    } else if (kind === 'darkpit') {
      // 暗闇の中の大穴：照らしながら橋をかける
      flat(3); const z0 = c; flat(3);
      const pw = hole.noJump(ri(14, 16)); guides.push({ kind: 'bridge', row: h, c0: c, c1: c + pw - 1 }); c += pw;
      flat(4); darkZones.push({ x0: z0 * T, x1: c * T }); flat(2);
    } else if (kind === 'dark') {
      // 暗闇ゾーン：P2のカーソルのまわりだけが明るい。小さな穴とトゲが隠れている
      flat(3); const z0 = c;
      for (let k = 0; k < 3; k++) {
        flat(ri(3, 5));
        if (rng() < 0.55) c += hole.jumpable(0.15, 0.3, 5); // 暗闇の中の小さな穴（跳び越えられる）
        else { const m = ri(3, 4); for (let i = 0; i < m; i++) { col(c, h); tiles[idx(c, h)] = 8; c++; } }
      }
      flat(4); darkZones.push({ x0: z0 * T, x1: c * T });
      flat(2);
    } else {
      flat(11); const gc = c; col(gc, h);
      for (let r = 0; r < h; r++) tiles[idx(gc, r)] = 7;
      c++;
      gateDefs.push({ c: gc, h, sx: (gc - 7) * T + T / 2, sy: (h - 6) * T });
      flat(3);
    }
    padTo(c <= s0 + SCR ? s0 + SCR : Math.ceil(c / SCR) * SCR);
  });
  let bossDef = null;
  if (st.boss) {
    // ボス戦エリア（ちょうど1画面）：助走 → 消しカスの海にかかる長い橋（大王が守る） → スイッチの台 → 行き止まりの壁
    const s0 = c;
    items.push({ type: 'heart', x: (c + 1) * T + T / 2, y: (h - 3) * T, taken: false });
    flat(3);
    const b0 = c, blen = 37;
    for (let i = 0; i < blen; i++) { tiles[idx(c, h)] = 9; c++; }
    const b1 = c; flat(5);
    for (let i = 0; i < 3; i++) { for (let r = 0; r < ROWS; r++) tiles[idx(c, r)] = 1; c++; }
    bossDef = { arenaStart: s0 * T + 10, b0, b1, h, min: b0 * T, max: b1 * T, sx: (b1 + 2) * T + T / 2, sy: h * T, spawned: false };
  } else flat(SCR); // ゴールのエリア
  // 実際の長さに詰め直す
  const old = tiles, oldLW = LW;
  LW = c; const N = LW * ROWS;
  tiles = new Uint8Array(N);
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < LW; cc++) tiles[r * LW + cc] = old[r * oldLW + cc];
  paintCol = new Uint8Array(N); paintKind = new Uint8Array(N); paintHp = new Uint8Array(N);
  paintT = new Int32Array(N); paintExp = new Int32Array(N); origTile = new Uint8Array(N);
  for (const ld of lockDefs) { const cells = []; for (let r = 0; r < ld.h; r++) cells.push(idx(ld.c, r)); locks.push({ cells, c: ld.c, h: ld.h, open: false }); }
  lifts = liftDefs.map(l => Object.assign(l, { y: l.yBottom, hold: false, grace: 0 }));
  for (const gd of gateDefs) { const cells = []; for (let r = 0; r < gd.h; r++) cells.push(idx(gd.c, r)); gates.push({ cells, c: gd.c, h: gd.h, sx: gd.sx, sy: gd.sy, open: false, hold: false, grace: 0 }); }
  const gcCol = LW - 12; goalX = gcCol * T;
  let r = 0; while (r < ROWS && !solid(gcCol, r)) r++; goalY = r * T;
  bossInfo = bossDef;
  if (bossInfo) { goalX = bossInfo.sx; goalY = bossInfo.sy; }
  clouds = [];
  const cr = mulberry32(seed ^ 0x9e3779b9);
  for (let x = -200; x < LW * T * 0.55 + 2200; x += cr() * 260 + 170) clouds.push({ x, y: 40 + cr() * 150, s: 0.6 + cr() * 0.7, v: cr() });
  startPos = { c: 3, r: 0 }; while (startPos.r < ROWS && !solid(3, startPos.r)) startPos.r++;
  startSign = { x: 2 * T, y: startPos.r * T };
  setLayout('s');
}

// キャラに合わせた穴の大きさ：助走つきジャンプで跳べる横の距離と、体の幅から決める
function jumpReach() { const ch = CH || {}; return (ch.runSpeed || 4) * 2 * (ch.jumpV || 11) / GRAV; }
function holeMaker(rng) {
  const w = (CH && CH.w) || 36, reach = jumpReach();
  const minT = Math.ceil((w + 24) / T); // 体より広くないと「穴」にならない
  return {
    // 跳び越えられる穴（k = 跳べる距離のどれくらいを使うか）
    jumpable: (k0, k1, maxT = 99) => clamp(Math.round((w + reach * (k0 + rng() * (k1 - k0))) / T), minT, Math.max(minT, maxT)),
    // ジャンプだけでは絶対に越えられない穴（協力：橋が必要）
    noJump: base => Math.max(base, Math.ceil((w + reach + 40) / T))
  };
}
function genLevel(seed) {
  const rng = mulberry32(seed);
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  LW = 300; ROWS = 27; gates = []; holdGate = null; guides = []; bossInfo = null; bossCut = null; locks = []; lifts = []; darkZones = []; holdLift = null;
  if (COOP) { genCoopLevel(rng, ri, seed); return; }
  const N = LW * ROWS;
  tiles = new Uint8Array(N); paintCol = new Uint8Array(N); paintKind = new Uint8Array(N); paintHp = new Uint8Array(N);
  paintT = new Int32Array(N); paintExp = new Int32Array(N); origTile = new Uint8Array(N);
  items = [];
  stage = THEMES[Math.floor(rng() * THEMES.length)];
  const HMIN = stage.hmin, HMAX = stage.hmax, hole = holeMaker(rng);
  let c = 0, h = ri(18, 22), lastHeart = 0;
  const col = (cc, hh, to = ROWS) => { if (cc < 0 || cc >= LW) return; for (let r = Math.max(0, hh); r < Math.min(to, ROWS); r++) tiles[idx(cc, r)] = 1; };
  const flat = n => { for (let i = 0; i < n && c < LW; i++) col(c++, h); };
  const ceil = (cc, bottom) => { if (cc < 0 || cc >= LW) return; for (let r = 0; r <= bottom; r++) tiles[idx(cc, r)] = 1; };
  const setT = (cc, r, t) => { if (cc >= 0 && cc < LW && r >= 0 && r < ROWS) tiles[idx(cc, r)] = t; };
  const heart = (x, y, chance) => { if (c - lastHeart > 50 && rng() < chance) { items.push({ type: 'heart', x, y, taken: false }); lastHeart = c; } };
  const entries = Object.entries(stage.w), total = entries.reduce((s, [, w]) => s + w, 0);
  const pick = () => { let x = rng() * total; for (const [k, w] of entries) { x -= w; if (x < 0) return k; } return 'flat'; };
  flat(16);
  let prev = '';
  while (c < LW - 60) {
    let seg = pick(); if (seg === prev && rng() < 0.5) seg = pick(); prev = seg;
    switch (seg) {
      case 'flat': flat(ri(4, 9)); break;
      case 'gap': c += hole.jumpable(0.25, 0.55); flat(ri(3, 6)); break;
      case 'up': h = Math.max(HMIN, h - ri(1, 3)); flat(ri(4, 8)); break;
      case 'down': h = Math.min(HMAX, h + ri(1, 3)); flat(ri(4, 8)); break;
      case 'pillar': {
        flat(3); const ph = ri(2, 3);
        for (let i = 0; i < 2; i++) { col(c, h); for (let r = h - ph; r < h; r++) setT(c, r, 2); c++; }
        flat(4); break;
      }
      case 'float': {
        const half = hole.jumpable(0.12, 0.28), gap = half * 2 + 3, start = c; c += gap;
        const mid = start + half;
        for (let i = 0; i < 3; i++) setT(mid + i, h - 2, 4);
        flat(ri(3, 5)); break;
      }
      case 'bricks': {
        flat(2); const len = ri(3, 5), pr = h - 4;
        for (let i = 0; i < len; i++) { col(c, h); setT(c, pr, 2); c++; }
        heart((c - len / 2) * T, (pr - 1) * T + 6, 0.75);
        flat(3); break;
      }
      case 'stairs': { const n = ri(2, 4); for (let s = 0; s < n; s++) { h = Math.max(HMIN, h - 1); flat(2); } flat(ri(3, 5)); break; }
      case 'stairsDown': { const n = ri(2, 4); for (let s = 0; s < n; s++) { h = Math.min(HMAX, h + 1); flat(2); } flat(ri(3, 5)); break; }
      case 'mound': {
        flat(2); const k = ri(1, 2);
        for (let s = 0; s < k; s++) { h = Math.max(HMIN, h - 1); flat(2); }
        flat(ri(1, 3));
        for (let s = 0; s < k; s++) { h = Math.min(HMAX, h + 1); flat(2); }
        break;
      }
      case 'valley': {
        flat(2); const d = Math.min(ri(2, 3), HMAX - h); h += d;
        const len = ri(3, 6); flat(len);
        heart((c - len / 2) * T, (h - 1) * T + 4, 0.4);
        h -= d; flat(3); break;
      }
      case 'islands': {
        const n = ri(3, 5);
        for (let k = 0; k < n; k++) {
          c += hole.jumpable(0.12, 0.3); h = clamp(h + ri(-1, 1), HMIN, HMAX);
          const w = ri(2, 4);
          for (let i = 0; i < w; i++) { col(c, h, h + 3); c++; }
          if (k === n - 1) heart((c - w / 2) * T, (h - 1) * T + 4, 0.35);
        }
        c += hole.jumpable(0.12, 0.3); flat(4); break;
      }
      case 'pillars': {
        const n = ri(3, 5);
        for (let k = 0; k < n; k++) {
          c += hole.jumpable(0.08, 0.22); h = clamp(h + ri(-2, 1), HMIN, HMAX);
          const w = ri(2, 3); for (let i = 0; i < w; i++) col(c++, h);
        }
        c += hole.jumpable(0.08, 0.22); flat(4); break;
      }
      case 'planks': {
        const len = ri(9, 12), c0 = c; flat(len);
        const p1 = h - 3, p2 = h - 6;
        for (let i = 1; i <= 3; i++) setT(c0 + i, p1, 4);
        if (p2 >= 5) { for (let i = 5; i <= 7; i++) setT(c0 + i, p2, 4); heart((c0 + 6) * T + T / 2, (p2 - 1) * T + 4, 0.8); }
        else heart((c0 + 2) * T + T / 2, (p1 - 1) * T + 4, 0.6);
        break;
      }
      case 'tunnel': {
        flat(2); const len = ri(6, 12);
        for (let i = 0; i < len; i++) { ceil(c, h - 6); col(c++, h); }
        flat(4); break; // 出口は4マス平ら（大きいキャラでも天井から出てから次の段差に挑める）
      }
      case 'stal': {
        const len = ri(7, 11), c0 = c; flat(len);
        const k = ri(2, 3);
        for (let j = 0; j < k; j++) ceil(c0 + 1 + Math.floor(rng() * (len - 4)), h - ri(6, 9)); // 最後の3マスには置かない
        break;
      }
    }
  }
  flat(LW - c);
  const gcCol = LW - 12; goalX = gcCol * T;
  let r = 0; while (r < ROWS && !solid(gcCol, r)) r++; goalY = r * T;
  clouds = [];
  const cr = mulberry32(seed ^ 0x9e3779b9);
  for (let x = -200; x < LW * T * 0.55 + 2200; x += cr() * 260 + 170) clouds.push({ x, y: 40 + cr() * 150, s: 0.6 + cr() * 0.7, v: cr() });
  startPos = { c: 3, r: 0 }; while (startPos.r < ROWS && !solid(3, startPos.r)) startPos.r++;
  let sr = 0; while (sr < ROWS && !solid(1, sr)) sr++; startSign = { x: 2 * T, y: sr * T };
  setLayout(NET.role && !COOP ? 'o' : 'h');
}
function resetRound() {
  const seed = NET.role === 'guest' ? NET.seed : ((Math.random() * 1e9) | 0); NET.seed = seed; // オンラインでは、ホストの乱数の種をゲストにも渡して同じステージを作る
  genLevel(seed); NET.baseGuides = guides.length;
  backdrop = genBackdrop(stage.bg || 'meadow', (Math.random() * 1e9) | 0);
  const sx = startPos.c * T, sy0 = startPos.r * T - CH.h;
  P = {
    x: sx, y: sy0, w: CH.w, h: CH.h, vx: 0, vy: 0, onGround: false, facing: 1,
    hp: CH.maxHp, maxHp: CH.maxHp, inv: 0, kb: 0, atkT: 0, atkCd: 0, coyote: 0, jumpBuf: 0, noCut: 0,
    safeX: sx, safeY: sy0, squash: 1, walk: 0, wind: 0, onIce: false, glued: false
  };
  enemies = []; bullets = []; particles = []; popups = [];
  energy = COOP ? 60 : EMAX; timeLeft = roundLen(); tick = 0; state = 'countdown'; countT = COOP ? 300 : 180; camX = 0; shake = 0; hitStop = 0; banner = null; // 対戦：ビルダーはエネルギー満タンで始まる
  effects = { dark: 0, rev: 0, heavy: 0, boost: 0, freeze: 0, slip: 0, float: 0, seal: 0 };
  cpu = { energy: 40, timer: 90 };
  trail = []; spawnQueue = []; crumbling = [];
  atkPressed = false; painting = false; lastPaint = null; penLive = 0;
  ST = { kills: 0, broken: 0, placed: 0, painted: 0, dmg: 0, startX: sx, startY: sy0 };
  $('#result').classList.add('hidden'); $('#pauseMenu').classList.add('hidden');
  SFX.count(false);
  updateToolAvailability();
  camX = clamp(P.x + P.w / 2 - VWW * 0.3, 0, Math.max(0, WW - VWW)); camY = clamp(P.y + P.h / 2 - VWH * 0.55, 0, Math.max(0, WH - VWH));
  scrIdx = Math.floor((P.x + P.w / 2) / AREA_W); if (SPLIT === 's') { camX = areaCamX(scrIdx, P.x + P.w / 2); camY = Math.max(0, WH - VWH); camSlide = { from: camX, to: camX, t: 1 }; }
  if (isH()) { bCam = bCamT = clamp(480, 0, Math.max(0, WW - VWW)); bCamY = bCamTY = 0; }
  else { bCam = bCamT = 0; bCamY = bCamTY = clamp(camY - 400, 0, Math.max(0, WH - VWH)); }
  mmDirty = true; cardCd = {}; supUses = { ...SUPPORT_LIMIT }; if (COOP && pageDef(storyIdx).limit) for (const k in supUses) supUses[k] = pageDef(storyIdx).limit; refreshDebugUI();
  playStageMusic();
  if (NET.role === 'host') netHostBegin();
}
