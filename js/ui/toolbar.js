'use strict';

/* =====================================================
   ビルダーのツールバー
   ===================================================== */
const toolsEl = $('#tools');
function buildToolbar() {
  toolsEl.innerHTML = '';
  DECK.forEach((id, i) => {
    const c = CARD[id];
    const b = document.createElement('button');
    b.className = 'tool'; b.dataset.id = id; b.tabIndex = -1;
    b.innerHTML = `<span class="tk">${i + 1}</span><span class="tu"></span><canvas width="104" height="76"></canvas><span class="tx"><span class="tn">${c.name}</span><span class="tc">コスト ${c.costLabel}</span></span>`;
    b.title = c.desc;
    let lastPd = 0;
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (NET.role && !netIAmBuilder()) return; lastPd = performance.now(); selectTool(id); });
    b.addEventListener('click', e => { e.preventDefault(); if ((NET.role && !netIAmBuilder()) || performance.now() - lastPd < 700) return; selectTool(id); });
    toolsEl.appendChild(b);
    iconCanvas(b.querySelector('canvas'), id, 52, 38);
  });
  selectTool(DECK[0]);
}
function selectTool(id) {
  if (NET.role === 'guest') { // ゲスト：回復は選んだ瞬間にホストへ依頼する。それ以外は選択を記録してホストにも伝える
    if (id !== 's_heart') { tool = id; $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.id === id)); }
    netSend({ t: 'tool', id }); return;
  }
  if (COOP && id === 's_heart') { useHealNow(); return; } // 回復は選んだ瞬間に使う（カーソル不要）
  tool = id; stopPaint(); $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.id === id));
}
function useHealNow() {
  const card = CARD.s_heart, px = P ? P.x + P.w / 2 : 0, py = P ? P.y - 14 : 0;
  if (!P || state !== 'play') return;
  const left = usesLeft('s_heart');
  if (left <= 0) { popup(px, py, '回復はもう使えない', C.bad, 16); return; }
  if (energy < card.cost) { popup(px, py, 'エネルギー不足', C.bad, 16); return; }
  if (P.hp >= P.maxHp) { popup(px, py, 'HPは満タン', C.builder, 16); return; }
  energy -= card.cost; ST.placed++;
  const heal = Math.min(30, P.maxHp - P.hp); P.hp += heal;
  supUses.s_heart = left - 1;
  SFX.pick(); burst(px, P.y + P.h / 2, '#f27eb1', 12, 2.5);
  popup(px, py, `+${Math.round(heal)} HP`, C.grass, 22);
  popup(px, py - 24, `のこり${supUses.s_heart}回`, C.builder, 14);
  updateToolAvailability();
}
// 強すぎるサポートは1ページにつき3回まで
const SUPPORT_LIMIT = { s_freeze: 3, s_bomb: 3, s_heart: 3 };
let supUses = {};
const usesLeft = id => COOP && SUPPORT_LIMIT[id] && !dbg('noLimit') ? (supUses[id] ?? SUPPORT_LIMIT[id]) : Infinity;
function updateToolAvailability() {
  $$('.tool').forEach(b => {
    const id = b.dataset.id, left = usesLeft(id);
    b.classList.toggle('poor', energy < CARD[id].cost || (cardCd[id] || 0) > 0 || left <= 0 || (CARD[id].cat === 'pen' && penCapOn() && penLive >= VS_PEN_MAX));
    const tu = b.querySelector('.tu'); if (tu) tu.textContent = left === Infinity ? '' : `のこり${left}`;
  });
}
