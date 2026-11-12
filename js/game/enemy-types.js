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
  bomb: { w: 26, h: 28, hp: 1, dmg: 0, color: '#3a3d48', touch: false },
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
  rockfall: { w: 40, h: 16, hp: 1, dmg: 0, color: '#a59c8e', invuln: true, touch: false }
};
const GRAVITY_TYPES = new Set(['walker', 'hopper', 'spiny', 'giant', 'mini', 'boulder', 'charger', 'spike', 'cannon', 'triple', 'bomb', 'fire', 'fan', 'warper', 'thrower', 'slime', 'slimelet', 'laser', 'snare']);
const SPAWNS = { minis: [['mini', -24, 0], ['mini', 0, 0], ['mini', 24, 0]], swarm: [['bee', -18, -8], ['bee', 2, 9], ['bee', 20, -6]] };
const FOOT = { minis: { w: 66, h: 16 }, swarm: { w: 56, h: 34 } };
const WALK_SPD = { walker: 1.15, spiny: 1.0, giant: 0.7, mini: 1.8 };
