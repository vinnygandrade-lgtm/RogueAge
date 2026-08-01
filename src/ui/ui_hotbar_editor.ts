/**
 * Inventory Hotbar tab — tap-to-assign editor (preview, not the live combat bar).
 */
import { L2MINI_HOTBAR_SLOT_COUNT } from '../types/game';

type InvTabId = 'bag' | 'hotbar';
type PickerKind = 'skills' | 'items';

let activeInvTab: InvTabId = 'bag';
let activePicker: PickerKind = 'skills';
let selectedKey: string | null = null;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressFired = false;
let wired = false;

const LONG_PRESS_MS = 450;

function hbT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function hotbarDisplay(key: string): string {
  if (typeof window.hotbarDisplayName === 'function') return window.hotbarDisplayName(key);
  if (typeof window.consumableDisplayName === 'function') {
    const n = window.consumableDisplayName(key);
    if (n) return n;
  }
  return key;
}

function setInventoryTab(tab: InvTabId): void {
  activeInvTab = tab === 'hotbar' ? 'hotbar' : 'bag';

  const root = document.getElementById('tela-inventario');
  const bagPanel = document.getElementById('inv-panel-bag');
  const hbPanel = document.getElementById('inv-panel-hotbar');
  const bagTab = document.getElementById('inv-tab-bag');
  const hbTab = document.getElementById('inv-tab-hotbar');

  if (root) root.classList.toggle('inv-editing-hotbar', activeInvTab === 'hotbar');
  if (bagPanel) bagPanel.hidden = activeInvTab !== 'bag';
  if (hbPanel) hbPanel.hidden = activeInvTab !== 'hotbar';

  if (bagTab) {
    bagTab.classList.toggle('is-active', activeInvTab === 'bag');
    bagTab.setAttribute('aria-selected', activeInvTab === 'bag' ? 'true' : 'false');
  }
  if (hbTab) {
    hbTab.classList.toggle('is-active', activeInvTab === 'hotbar');
    hbTab.setAttribute('aria-selected', activeInvTab === 'hotbar' ? 'true' : 'false');
  }

  if (activeInvTab === 'bag') {
    selectedKey = null;
    if (typeof window.renderizarInventario === 'function') window.renderizarInventario();
  } else {
    renderHotbarEditor();
  }
}

function setPicker(kind: PickerKind): void {
  activePicker = kind === 'items' ? 'items' : 'skills';
  document.querySelectorAll('.hotbar-editor-picker-tab').forEach((el) => {
    const btn = el as HTMLElement;
    const k = btn.getAttribute('data-hb-picker') === 'items' ? 'items' : 'skills';
    btn.classList.toggle('is-active', k === activePicker);
  });
  renderHotbarEditor();
}

function listLearnedSkillKeys(): string[] {
  const keys: string[] = ['Attack'];
  const seen = new Set<string>(keys);
  const learned =
    typeof window.obterSkillsAprendidas === 'function' ? window.obterSkillsAprendidas() : [];
  for (const s of learned) {
    const id = String(s?.idNome || '').trim();
    if (!id || seen.has(id)) continue;
    if (!window.bancoDeSkills?.[id]) continue;
    seen.add(id);
    keys.push(id);
  }
  return keys;
}

function isCurrencyName(nome: string): boolean {
  const kAd = window.L2MINI_CURRENCY_BAG_KEYS?.adena || 'Adena';
  const kAc = window.L2MINI_CURRENCY_BAG_KEYS?.ancient || 'Ancient Coin';
  return nome === kAd || nome === kAc || nome === 'Adena' || nome === 'Ancient Coin';
}

function isHotbarPinItem(nome: string): boolean {
  if (!nome || isCurrencyName(nome)) return false;
  if (nome.includes('Recipe')) return false;
  if (nome.includes('Potion') || nome.includes('Soulshot') || nome.includes('Spiritshot')) return true;
  if (typeof window.catalogoConsumiveis !== 'undefined') {
    const hit = window.catalogoConsumiveis.some((c) => c.id === nome || c.nome === nome);
    if (hit) return true;
  }
  // Scrolls / misc stacks that the bag already allows pinning (non-currency, non-recipe)
  if (typeof window.catalogoMateriais !== 'undefined') {
    const mat = window.catalogoMateriais.some((m) => {
      const row = m as { id?: string; nome?: string; tipo?: string };
      return row.id === nome || row.nome === nome;
    });
    if (mat) return false;
  }
  return true;
}

function listPinItemKeys(): string[] {
  const inv = window.inventario || {};
  const keys = Object.keys(inv)
    .filter((n) => (inv[n] || 0) > 0 && isHotbarPinItem(n))
    .sort((a, b) => hotbarDisplay(a).localeCompare(hotbarDisplay(b)));
  return keys;
}

function iconSrcForKey(key: string): string {
  if (typeof window.resolveHotbarEntryIconSrc === 'function') {
    return window.resolveHotbarEntryIconSrc(key) || 'assets/itens/item_generic.png';
  }
  if (key === 'Attack') return 'assets/skills/hf_attack.png';
  return 'assets/itens/item_generic.png';
}

function clearLongPress(): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

async function confirmClearSlot(index: number, occupiedKey: string): Promise<void> {
  const msg = hbT('game.hotbarEditor.clearConfirm', { name: hotbarDisplay(occupiedKey) });
  let ok = true;
  if (typeof window.l2Confirm === 'function') {
    ok = !!(await window.l2Confirm(msg));
  }
  if (!ok) return;
  if (typeof window.clearHotbarSlot === 'function') window.clearHotbarSlot(index);
  else if (typeof window.assignHotbarSlot === 'function') window.assignHotbarSlot(index, null);
}

function onPreviewSlotTap(index: number): void {
  if (longPressFired) {
    longPressFired = false;
    return;
  }
  const occupied = window.barraAtalhos?.[index] || null;

  if (selectedKey) {
    if (typeof window.assignHotbarSlot === 'function') {
      window.assignHotbarSlot(index, selectedKey);
    }
    selectedKey = null;
    renderHotbarEditor();
    if (typeof window.tocarSom === 'function') window.tocarSom('enchant');
    return;
  }

  if (occupied) {
    void confirmClearSlot(index, occupied);
  }
}

function bindPreviewSlot(el: HTMLElement, index: number): void {
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    longPressFired = false;
    clearLongPress();
    try {
      el.setPointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    longPressTimer = setTimeout(() => {
      longPressFired = true;
      const occupied = window.barraAtalhos?.[index];
      if (occupied) {
        if (occupied.includes('shot')) window.autoShotAtivo = false;
        if (typeof window.clearHotbarSlot === 'function') window.clearHotbarSlot(index);
        else if (typeof window.assignHotbarSlot === 'function') window.assignHotbarSlot(index, null);
        if (typeof window.tocarSom === 'function') window.tocarSom('enchant');
      }
    }, LONG_PRESS_MS);
  });
  el.addEventListener('pointerup', () => {
    clearLongPress();
    onPreviewSlotTap(index);
  });
  el.addEventListener('pointercancel', () => {
    clearLongPress();
  });
}

function renderPreview(): void {
  const root = document.getElementById('hotbar-editor-preview');
  if (!root) return;
  root.innerHTML = '';
  root.setAttribute('aria-label', hbT('game.hotbarEditor.previewAria'));

  for (let i = 0; i < L2MINI_HOTBAR_SLOT_COUNT; i++) {
    const key = window.barraAtalhos?.[i] || null;
    const slot = document.createElement('button');
    slot.type = 'button';
    // Do NOT use combat `.shortcut-slot` here — its !important icon rules fight the editor grid.
    slot.className = 'hotbar-editor-slot' + (key ? ' is-filled' : ' is-empty');
    slot.dataset.slotIndex = String(i);
    const label = String(i + 1);
    slot.setAttribute('aria-label', key ? `${label}: ${hotbarDisplay(key)}` : `${label}: empty`);

    let inner = `<span class="hotbar-editor-slot__key">${label}</span>`;
    if (key) {
      const src = iconSrcForKey(key).replace(/"/g, '&quot;');
      const isSkill = key === 'Attack' || !!window.bancoDeSkills?.[key];
      const imgClass = isSkill
        ? 'hotbar-editor-slot__icon'
        : 'hotbar-editor-slot__icon hotbar-editor-slot__icon--item';
      inner += `<img class="${imgClass}" src="${src}" alt="" draggable="false">`;
      if (!isSkill) {
        let qtd = window.inventario?.[key] || 0;
        if (key === 'MP Potion' && window.inventario?.['Mana Potion']) qtd = window.inventario['Mana Potion'];
        else if (key === 'Mana Potion' && window.inventario?.['MP Potion']) qtd = window.inventario['MP Potion'];
        inner += `<span class="hotbar-editor-slot__count">${qtd}</span>`;
      }
    }
    slot.innerHTML = inner;
    bindPreviewSlot(slot, i);
    root.appendChild(slot);
  }
}

function appendPickerCell(
  grid: HTMLElement,
  key: string,
  imgSrc: string,
  qty?: number,
): void {
  const selected = selectedKey === key;
  const frameHtml =
    typeof window._l2InvIconFrameHtml === 'function'
      ? window._l2InvIconFrameHtml(imgSrc)
      : `<span class="inv-icon-frame"><img class="inv-img" src="${imgSrc.replace(/"/g, '&quot;')}" alt=""></span>`;
  const qtyHtml = qty != null ? `<div class="inv-qtd">${qty}</div>` : '';
  const slotClass = 'inv-slot' + (selected ? ' hotbar-editor-picker-slot--selected' : '');

  if (typeof window._l2AppendInvGridSlot === 'function') {
    window._l2AppendInvGridSlot(grid, slotClass, `${frameHtml}${qtyHtml}`, () => {
      selectedKey = selectedKey === key ? null : key;
      renderHotbarEditor();
      if (typeof window.tocarSom === 'function') window.tocarSom('enchant');
    }, hotbarDisplay(key));
    return;
  }

  const cell = document.createElement('div');
  cell.className = 'inv-grid-cell';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = slotClass;
  btn.title = hotbarDisplay(key);
  btn.innerHTML = `${frameHtml}${qtyHtml}`;
  btn.addEventListener('click', () => {
    selectedKey = selectedKey === key ? null : key;
    renderHotbarEditor();
  });
  cell.appendChild(btn);
  grid.appendChild(cell);
}

function renderPicker(): void {
  const grid = document.getElementById('hotbar-editor-picker');
  if (!grid) return;
  grid.innerHTML = '';

  if (activePicker === 'skills') {
    const keys = listLearnedSkillKeys();
    if (!keys.length) {
      grid.innerHTML = `<div class="hotbar-editor-empty">${hbT('game.hotbarEditor.emptySkills')}</div>`;
      return;
    }
    for (const key of keys) {
      appendPickerCell(grid, key, iconSrcForKey(key));
    }
    return;
  }

  const items = listPinItemKeys();
  if (!items.length) {
    grid.innerHTML = `<div class="hotbar-editor-empty">${hbT('game.hotbarEditor.emptyItems')}</div>`;
    return;
  }
  for (const key of items) {
    appendPickerCell(grid, key, iconSrcForKey(key), window.inventario?.[key] || 0);
  }
}

function renderSelectionHint(): void {
  const hint = document.querySelector('#inv-panel-hotbar .hotbar-editor-hint') as HTMLElement | null;
  if (!hint) return;
  if (selectedKey) {
    hint.textContent = hbT('game.hotbarEditor.selectedHint', { name: hotbarDisplay(selectedKey) });
    hint.classList.add('is-selected');
  } else {
    hint.textContent = hbT('game.hotbarEditor.hint');
    hint.classList.remove('is-selected');
  }
}

function renderHotbarEditor(): void {
  if (activeInvTab !== 'hotbar') return;
  renderSelectionHint();
  renderPreview();
  renderPicker();
}

function wireHotbarEditorOnce(): void {
  if (wired) return;
  const root = document.getElementById('tela-inventario');
  if (!root) return;
  wired = true;

  root.querySelectorAll('.inv-screen-tab').forEach((el) => {
    el.addEventListener('click', () => {
      const tab = (el as HTMLElement).getAttribute('data-inv-tab') === 'hotbar' ? 'hotbar' : 'bag';
      setInventoryTab(tab);
    });
  });

  root.querySelectorAll('.hotbar-editor-picker-tab').forEach((el) => {
    el.addEventListener('click', () => {
      const kind = (el as HTMLElement).getAttribute('data-hb-picker') === 'items' ? 'items' : 'skills';
      setPicker(kind);
    });
  });
}

function onOpenInventoryScreen(): void {
  wireHotbarEditorOnce();
  setInventoryTab('bag');
}

window.setInventoryTab = setInventoryTab;
window.renderHotbarEditor = renderHotbarEditor;
window.onOpenInventoryScreen = onOpenInventoryScreen;

export {};
