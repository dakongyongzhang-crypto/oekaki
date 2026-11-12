'use strict';

/* =====================================================
   デッキ編成画面
   ===================================================== */
let deckFilter = 'all';
const cardEls = {};
function iconCanvas(cv, id, W, H) {
  const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  if (!id) return;
  ctx.scale(cv.width / W, cv.height / H); drawCardIcon(ctx, id, W, H);
}
function buildDeckScreen() {
  const tabs = $('#catTabs');
  [['all', 'すべて', null], ...Object.entries(CATS).map(([k, v]) => [k, v.name, v.color])].forEach(([k, label, col]) => {
    const b = document.createElement('button'); b.className = 'btn' + (k === 'all' ? ' on' : ''); b.dataset.cat = k;
    b.innerHTML = (col ? `<i style="--c:${col}"></i>` : '') + label + `<small style="opacity:.6">${k === 'all' ? CARDS.length : CARDS.filter(c => c.cat === k).length}</small>`;
    b.addEventListener('click', () => { deckFilter = k; $$('#catTabs .btn').forEach(x => x.classList.toggle('on', x.dataset.cat === k)); refreshDeckUI(); });
    tabs.appendChild(b);
  });
  const grid = $('#cardGrid');
  CARDS.forEach(c => {
    const b = document.createElement('button'); b.className = 'card'; b.style.setProperty('--cat', CATS[c.cat].color);
    b.innerHTML = `<span class="stripe"></span><span class="badge"></span><canvas class="ic" width="208" height="128"></canvas><span class="cat">${CATS[c.cat].name}</span><span class="nm"><span>${c.name}</span><span class="cost">${c.costLabel}</span></span><span class="ds">${c.desc}</span>`;
    b.setAttribute('aria-label', `${c.name} コスト${c.costLabel} ${c.desc}`);
    b.addEventListener('click', () => toggleCard(c.id));
    grid.appendChild(b); cardEls[c.id] = b;
    iconCanvas(b.querySelector('canvas'), c.id, 104, 64);
  });
  const slots = $('#deckSlots');
  for (let i = 0; i < DECK_MAX; i++) {
    const s = document.createElement('button'); s.className = 'slot';
    s.innerHTML = `<span class="n">${i + 1}</span><canvas width="96" height="64"></canvas><span class="sn">空き</span>`;
    s.addEventListener('click', () => { if (DECK[i]) { DECK.splice(i, 1); refreshDeckUI(); } });
    slots.appendChild(s);
  }
}
function toggleCard(id) {
  const i = DECK.indexOf(id);
  if (i >= 0) DECK.splice(i, 1);
  else if (DECK.length >= DECK_MAX) { $('#deckHint').textContent = '8枚までです。枠をクリックで外せます'; return; }
  else if (CARD[id].cat === 'trap' && trapCount(DECK) >= TRAP_MAX) { $('#deckHint').textContent = `ワナは${TRAP_MAX}枚までです。ほかのワナを外してから選んでください`; return; }
  else DECK.push(id);
  refreshDeckUI();
}
function refreshDeckUI() {
  CARDS.forEach(c => {
    const el = cardEls[c.id], i = DECK.indexOf(c.id);
    el.classList.toggle('sel', i >= 0); el.classList.toggle('full', DECK.length >= DECK_MAX || (c.cat === 'trap' && trapCount(DECK) >= TRAP_MAX));
    el.querySelector('.badge').textContent = i >= 0 ? i + 1 : '';
    el.hidden = deckFilter !== 'all' && c.cat !== deckFilter;
    el.setAttribute('aria-pressed', String(i >= 0));
  });
  $$('#deckSlots .slot').forEach((s, i) => {
    const id = DECK[i];
    s.classList.toggle('filled', !!id);
    s.querySelector('.sn').textContent = id ? CARD[id].name : '空き';
    iconCanvas(s.querySelector('canvas'), id, 48, 32);
  });
  $('#deckCount').textContent = DECK.length;
  $('#btnDeckGo').disabled = DECK.length === 0;
  $('#deckHint').textContent = DECK.length ? `枠をクリックで外せます（ワナ ${trapCount(DECK)}/${TRAP_MAX}枚）` : `カードを1枚以上選んでください（ワナは${TRAP_MAX}枚まで）`;
}
$('#btnDeckPreset').addEventListener('click', () => { DECK = PRESET.slice(); refreshDeckUI(); });
$('#btnDeckClear').addEventListener('click', () => { DECK = []; refreshDeckUI(); });
$('#btnDeckRandom').addEventListener('click', () => {
  const pens = CARDS.filter(c => c.cat === 'pen').map(c => c.id), rest = CARDS.filter(c => c.cat !== 'pen').map(c => c.id);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = []; for (const id of shuffle(rest)) { if (pick.length >= 6) break; if (CARD[id].cat === 'trap' && trapCount(pick) >= TRAP_MAX) continue; pick.push(id); }
  DECK = [...shuffle(pens).slice(0, 2), ...pick];
  refreshDeckUI();
});
$('#btnDeckGo').addEventListener('click', () => deckGo());
