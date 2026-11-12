'use strict';

/* =====================================================
   敵の種類ごとの基本データ
   ===================================================== */
const ETYPES = {
  walker: { w: 30, h: 26, hp: 3, dmg: 15, color: '#b693e8', stomp: true },
  hopper: { w: 28, h: 28, hp: 3, dmg: 15, color: '#7fd1b9', stomp: true },
  flyer: { w: 34, h: 24, hp: 2, dmg: 12, color: '#f2a65a', stomp: true },
  spiny: { w: 30, h: 24, hp: 3, dmg: 15, color: '#ff9a6b' },
  giant: { w: 52, h: 46, hp: 9, dmg: 25, color: '#9a78d6', stomp: true },
  mini: { w: 18, h: 16, hp: 1, dmg: 8, color: '#cdb3f2', stomp: true },
  boulder: { w: 32, h: 32, hp: 6, dmg: 20, color: '#b3aa9b', word: 'ゴロン!' },
  charger: { w: 38, h: 28, hp: 3, dmg: 18, color: '#e0a458', stomp: true },
  crusher: { w: 38, h: 38, hp: 6, dmg: 25, color: '#a3a9b6', word: 'ズドン!' },
  ghost: { w: 30, h: 30, hp: 2, dmg: 12, color: '#ffffff', stomp: true },
  bee: { w: 18, h: 14, hp: 1, dmg: 8, color: '#ffd23f', stomp: true },
  spike: { w: 40, h: 16, hp: 2, dmg: 20, color: '#c9cdd6', snap: true, word: 'チクッ!' },
  cannon: { w: 30, h: 30, hp: 4, dmg: 10, color: '#8b90a0', snap: true, stomp: true },
  triple: { w: 34, h: 30, hp: 5, dmg: 10, color: '#7380a0', snap: true, stomp: true },
  bomb: { w: 26, h: 28, hp: 1, dmg: 0, color: '#3a3d48', touch: false, invuln: true }, // 攻撃しても解除できない
  saw: { w: 30, h: 30, hp: 1, dmg: 20, color: '#cfd3dc', invuln: true, word: 'ザクッ!' },
  fire: { w: 24, h: 12, hp: 1, dmg: 0, color: '#ff7a3d', snap: true, invuln: true, touch: false },
  firebar: { w: 16, h: 16, hp: 1, dmg: 0, color: '#ff7a3d', invuln: true, touch: false, reach: 66 },
  fan: { w: 28, h: 32, hp: 3, dmg: 0, color: '#8fd0e8', snap: true, touch: false, stomp: true },
  thunder: { w: 56, h: 26, hp: 3, dmg: 0, color: '#6d7790', touch: false },
  boss: { w: 92, h: 84, hp: 999, dmg: 25, color: '#f7c6d4', invuln: true, stomp: true, word: 'ドスン!' },
  warper: { w: 28, h: 28, hp: 2, dmg: 14, color: '#5ec2b7', stomp: true },
  thrower: { w: 28, h: 30, hp: 3, dmg: 12, color: '#7bb661', stomp: true },
  slime: { w: 32, h: 22, hp: 3, dmg: 12, color: '#9be15d', stomp: true },
  slimelet: { w: 18, h: 13, hp: 1, dmg: 8, color: '#b9ef8a', stomp: true },
  shadow: { w: 30, h: 40, hp: 2, dmg: 15, color: '#4b3a6b', stomp: true, word: 'ゾクッ!' },
  laser: { w: 28, h: 24, hp: 4, dmg: 0, color: '#c46be0', snap: true, touch: false, stomp: true },
  snare: { w: 30, h: 10, hp: 1, dmg: 0, color: '#f2dc8c', snap: true, touch: false },
  rockfall: { w: 40, h: 16, hp: 1, dmg: 0, color: '#a59c8e', invuln: true, touch: false },
  // 追加カード（動きは enemies-extra.js、見た目は sprites-extra.js）
  // shield = 正面からの攻撃が効かない / sneaky = ランナーの画面ではほとんど見えない / cull = 描画範囲を広げる
  bat: { w: 30, h: 20, hp: 2, dmg: 12, color: '#7a6aa8', stomp: true },
  mole: { w: 30, h: 26, hp: 3, dmg: 14, color: '#a0703f', snap: true, stomp: true },
  tate: { w: 32, h: 30, hp: 3, dmg: 15, color: '#8fa6d9', stomp: true, shield: true },
  frog: { w: 30, h: 24, hp: 3, dmg: 14, color: '#6cc46c', stomp: true },
  spitter: { w: 28, h: 34, hp: 3, dmg: 12, color: '#e05a8a', snap: true, stomp: true },
  eye: { w: 30, h: 30, hp: 3, dmg: 12, color: '#ffffff', stomp: true, cull: 320 },
  dropper: { w: 36, h: 24, hp: 2, dmg: 12, color: '#4fa3d9', stomp: true },
  ninja: { w: 26, h: 30, hp: 3, dmg: 14, color: '#3a3f58', stomp: true },
  puffer: { w: 30, h: 26, hp: 3, dmg: 14, color: '#f2c14e', stomp: true, word: 'チクッ!' },
  jelly: { w: 28, h: 30, hp: 2, dmg: 14, color: '#f5a6d6', word: 'ビリビリ!' },
  ufo: { w: 50, h: 24, hp: 3, dmg: 12, color: '#b0bccd', stomp: true, cull: 400 },
  snowman: { w: 30, h: 38, hp: 4, dmg: 12, color: '#ffffff', snap: true, stomp: true },
  catapult: { w: 36, h: 14, hp: 2, dmg: 0, color: '#33b06a', snap: true, touch: false },
  pendulum: { w: 16, h: 16, hp: 1, dmg: 0, color: '#6b7080', invuln: true, touch: false, reach: 95 },
  piston: { w: 24, h: 30, hp: 4, dmg: 0, color: '#d97a3a', snap: true, touch: false, stomp: true, cull: 80 },
  mine: { w: 22, h: 8, hp: 1, dmg: 0, color: '#5a6072', snap: true, touch: false, sneaky: true },
  geyser: { w: 24, h: 12, hp: 1, dmg: 0, color: '#3e8fd6', snap: true, invuln: true, touch: false, cull: 160 },
  blackhole: { w: 28, h: 28, hp: 1, dmg: 0, color: '#2b2140', invuln: true, touch: false, reach: 30, cull: 190 },
  arrow: { w: 24, h: 20, hp: 3, dmg: 0, color: '#a0703f', touch: false, stomp: true },
  sawv: { w: 30, h: 30, hp: 1, dmg: 20, color: '#cfd3dc', invuln: true, word: 'ザクッ!', cull: 100 },
  spikeball: { w: 26, h: 26, hp: 1, dmg: 18, color: '#7a8091', invuln: true, word: 'グサッ!' },
  homing: { w: 30, h: 30, hp: 4, dmg: 10, color: '#6f8f5a', snap: true, stomp: true }
};
const GRAVITY_TYPES = new Set(['walker', 'hopper', 'spiny', 'giant', 'mini', 'boulder', 'charger', 'spike', 'cannon', 'triple', 'bomb', 'fire', 'fan', 'warper', 'thrower', 'slime', 'slimelet', 'laser', 'snare',
  'mole', 'tate', 'spitter', 'ninja', 'snowman', 'catapult', 'piston', 'mine', 'geyser', 'homing']);
const SPAWNS = { minis: [['mini', -24, 0], ['mini', 0, 0], ['mini', 24, 0]], swarm: [['bee', -18, -8], ['bee', 2, 9], ['bee', 20, -6]] };
const FOOT = { minis: { w: 66, h: 16 }, swarm: { w: 56, h: 34 } };
const WALK_SPD = { walker: 1.15, spiny: 1.0, giant: 0.7, mini: 1.8 };
