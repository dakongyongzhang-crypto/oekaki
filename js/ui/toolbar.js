'use strict';

/* =====================================================
   ビルダーのツールバー
   ===================================================== */
const toolsEl = $('#tools');
function buildToolbar() {
  toolsEl.innerHTML = '';
  toolsEl.classList.toggle('many', DECK.length > 8); // 9枚以上は横にスクロール
  DECK.forEach((id, i) => {
    const c = CARD[id];
    const b = document.createElement('button');
    b.className = 'tool'; b.dataset.id = id; b.tabIndex = -1;
    b.innerHTML = `<span class="tk">${i + 1}</span><span class="tu"></span><canvas width="104" height="76"></canvas><span class="tx"><span class="tn">${c.name}</span><span class="tc">コスト ${c.costLabel}${c.lv ? ` <b class="tlv">${stars(c.lv)}</b>` : ''}</span></span>`;
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
    if (!INSTANT_SUPPORT.has(id)) { tool = id; $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.id === id)); showSelTool(); }
    netSend({ t: 'tool', id }); return;
  }
  if (COOP && INSTANT_SUPPORT.has(id)) { useHealNow(id); return; } // 回復は選んだ瞬間に使う（カーソル不要）
  tool = id; stopPaint(); $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.id === id)); showSelTool();
}
// カード欄がスクロールするときは、選んだカードが見えるようにする
function showSelTool() {
  const on = toolsEl.querySelector('.tool.on'); if (!on) return;
  for (const sc of [toolsEl, toolsEl.closest('.builder-bar')]) {
    if (!sc || (sc.scrollWidth <= sc.clientWidth + 2 && sc.scrollHeight <= sc.clientHeight + 2)) continue;
    const r = on.getBoundingClientRect(), rb = sc.getBoundingClientRect();
    if (r.left < rb.left) sc.scrollLeft -= rb.left - r.left + 4; else if (r.right > rb.right) sc.scrollLeft += r.right - rb.right + 4;
    if (r.top < rb.top) sc.scrollTop -= rb.top - r.top + 4; else if (r.bottom > rb.bottom) sc.scrollTop += r.bottom - rb.bottom + 4;
  }
}
function useHealNow(id = 's_heart') {
  const card = CARD[id], px = P ? P.x + P.w / 2 : 0, py = P ? P.y - 14 : 0;
  if (!P || state !== 'play') return;
  const left = usesLeft(id);
  if (left <= 0) { popup(px, py, '回復はもう使えない', C.bad, 16); return; }
  if (energy < card.cost) { popup(px, py, 'エネルギー不足', C.bad, 16); return; }
  if (P.hp >= P.maxHp) { popup(px, py, 'HPは満タン', C.builder, 16); return; }
  energy -= card.cost; ST.placed++;
  const heal = Math.min(card.pow || (id === 's_miniheart' ? 12 : 30), P.maxHp - P.hp); P.hp += heal;
  if (left !== Infinity) supUses[id] = left - 1;
  SFX.pick(); burst(px, P.y + P.h / 2, '#f27eb1', 12, 2.5);
  popup(px, py, `+${Math.round(heal)} HP`, C.grass, 22);
  if (left !== Infinity) popup(px, py - 24, `のこり${supUses[id]}回`, C.builder, 14);
  updateToolAvailability();
}
// 強すぎるサポートは1ページにつき3回まで
const SUPPORT_LIMIT = { s_freeze: 3, s_bomb: 3, s_heart: 3, s_timer: 2, s_nojam: 2, s_thunder: 3 };
let supUses = {};
const usesLeft = id => COOP && SUPPORT_LIMIT[id] && !dbg('noLimit') ? (supUses[id] ?? SUPPORT_LIMIT[id]) : Infinity;
function updateToolAvailability() {
  $$('.tool').forEach(b => {
    const id = b.dataset.id, left = usesLeft(id);
    b.classList.toggle('poor', energy < CARD[id].cost || (cardCd[id] || 0) > 0 || left <= 0 || (CARD[id].cat === 'pen' && penCapOn() && penLive + (isBlockCard(id) ? 4 : 1) > VS_PEN_MAX));
    const tu = b.querySelector('.tu'); if (tu) tu.textContent = left === Infinity ? '' : `のこり${left}`;
  });
}
