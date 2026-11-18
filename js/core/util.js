'use strict';

/* =====================================================
   共通ユーティリティ（DOM取得・数学・乱数・フォント）
   ===================================================== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const rand = (a, b) => a + Math.random() * (b - a);
function hash2(x, y) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// スマホ表示で縦持ちのときは、画面全体を90°回して横画面で表示する（body.rot）。
// そのときの「画面の横幅・高さ」と、タッチ位置を要素の中の割合（0〜1）に直す関数
const isRot = () => document.body.classList.contains('rot');
const viewW = () => isRot() ? window.innerHeight : window.innerWidth;
const viewH = () => isRot() ? window.innerWidth : window.innerHeight;
function localFrac(e, el) {
  const r = el.getBoundingClientRect();
  if (isRot()) return { fx: (e.clientY - r.top) / r.height, fy: (r.right - e.clientX) / r.width }; // 90°回っているので、縦横を入れかえて読む
  return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
}
const FONT = "'Yusei Magic','Zen Maru Gothic','Hiragino Maru Gothic ProN','Yu Gothic',sans-serif";
