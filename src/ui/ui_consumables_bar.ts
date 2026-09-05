/**
 * Fixed consumables rail above the skill hotbar.
 * Slots are fixed: HP Potion · Mana Potion · active Soulshot/Spiritshot (AUTO toggle).
 * Lives inside `#hotbar-combat-bundle` so expedition/raid/oly docks keep it with the hotbar.
 */

function consT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function manaStackQty(): number {
  const inv = window.inventario || {};
  return Math.max(0, Math.floor(Number(inv['Mana Potion']) || 0) + Math.floor(Number(inv['MP Potion']) || 0));
}

function resolveShotKey(): string {
  const isMage =
    typeof window.isClasseMagica === 'function' && window.isClasseMagica(window.charClass);
  if (typeof window.resolveActiveShotKey === 'function') {
    return window.resolveActiveShotKey(!!isMage);
  }
  return isMage ? 'B. Spiritshot (NG)' : 'Soulshot (NG)';
}

function shotIcon(key: string): string {
  if (typeof window.shotIconPathForKey === 'function') return window.shotIconPathForKey(key);
  return key.includes('Spiritshot')
    ? 'assets/itens/spiritshot_ng.png'
    : 'assets/itens/soulshot_ng.png';
}

function potionCdLeftMs(...names: string[]): number {
  const agora = Date.now();
  const cds = window.cooldownsAtivos || {};
  let left = 0;
  for (let i = 0; i < names.length; i++) {
    left = Math.max(left, Math.max(0, (Number(cds[names[i]]) || 0) - agora));
  }
  return left;
}

function potionCdPct(...names: string[]): number {
  const left = potionCdLeftMs(...names);
  if (left <= 0) return 0;
  return Math.min(100, (left / 15000) * 100);
}

function buildPotionSlotHtml(opts: {
  id: string;
  stackKey: string;
  img: string;
  qty: number;
  label: string;
  onClick: string;
  cdName: string;
  cdNames?: string[];
}): string {
  const cdNames = opts.cdNames && opts.cdNames.length ? opts.cdNames : [opts.cdName];
  const pct = potionCdPct(...cdNames);
  const left = potionCdLeftMs(...cdNames);
  const empty = opts.qty <= 0 ? ' is-empty' : '';
  const title = `${opts.label} ×${opts.qty}`;
  const timer = left > 0 ? (left / 1000).toFixed(1) : '';
  return `
    <button type="button" id="${opts.id}" class="consumable-slot${empty}" title="${title.replace(/"/g, '&quot;')}"
      aria-label="${title.replace(/"/g, '&quot;')}"
      onclick="event.preventDefault(); ${opts.onClick}">
      <div class="cd-overlay" data-cd="${opts.cdName}"${cdNames.length > 1 ? ` data-cd-alt="${cdNames.filter((n) => n !== opts.cdName).join(',')}"` : ''} style="height:${pct}%;"></div>
      <div class="cd-timer-text"${left > 0 ? '' : ' style="display:none;"'}>${timer}</div>
      <img class="shortcut-slot__icon shortcut-slot__icon--item" src="${opts.img}" alt="" draggable="false">
      <span class="shortcut-count">${opts.qty}</span>
      <span class="consumable-slot__tag">${opts.label}</span>
    </button>
  `;
}

function renderizarBarraConsumiveis(): void {
  const bar = document.getElementById('consumables-bar');
  if (!bar) return;

  const arenaOly = document.getElementById('tela-olympiad-arena');
  const estaNaOlympiad = !!(arenaOly && arenaOly.style.display === 'flex');

  const hpQty = Math.max(0, Math.floor(Number(window.inventario?.['HP Potion']) || 0));
  const mpQty = manaStackQty();
  const shotKey = resolveShotKey();
  const shotQty = Math.max(0, Math.floor(Number(window.inventario?.[shotKey]) || 0));
  const shotOn = !!window.autoShotAtivo && !estaNaOlympiad;
  const shotLabel = shotKey.includes('Spiritshot')
    ? consT('game.consumablesBar.tagSpirit')
    : consT('game.consumablesBar.tagSoul');

  const hpHtml = buildPotionSlotHtml({
    id: 'consumable-slot-hp',
    stackKey: 'HP Potion',
    img: 'assets/itens/pot_hp.png',
    qty: hpQty,
    label: consT('game.consumablesBar.tagHp'),
    onClick: "if (typeof window.usarPocao === 'function') window.usarPocao();",
    cdName: 'HP Potion',
  });

  const mpHtml = buildPotionSlotHtml({
    id: 'consumable-slot-mp',
    stackKey: 'Mana Potion',
    img: 'assets/itens/pot_mp.png',
    qty: mpQty,
    label: consT('game.consumablesBar.tagMp'),
    onClick: "if (typeof window.usarPocaoMP === 'function') window.usarPocaoMP('Mana Potion');",
    cdName: 'Mana Potion',
    cdNames: ['Mana Potion', 'MP Potion'],
  });

  const shotDisabled = estaNaOlympiad ? ' is-disabled' : '';
  const shotEmpty = shotQty <= 0 ? ' is-empty' : '';
  const shotActive = shotOn ? ' auto-shot-active' : '';
  const autoTitle = shotOn
    ? consT('game.smartbar.autoShotChipTitleOn')
    : consT('game.smartbar.autoShotChipTitleOff');
  const autoLabel = consT('game.smartbar.autoAttackChip');

  const shotHtml = `
    <div class="shortcut-slot-stack shortcut-slot-stack--shot consumable-slot-stack--shot">
      <button type="button"
        class="hotbar-auto-atk-btn${shotOn ? ' is-on is-on-shot' : ''}"
        title="${autoTitle.replace(/"/g, '&quot;')}"
        aria-pressed="${shotOn ? 'true' : 'false'}"
        aria-label="${autoTitle.replace(/"/g, '&quot;')}"
        ${estaNaOlympiad ? 'disabled' : ''}
        onclick="event.stopPropagation(); event.preventDefault(); if (typeof window.toggleAutoShot === 'function') window.toggleAutoShot();">
        ${autoLabel}
      </button>
      <button type="button" id="consumable-slot-shot" class="consumable-slot${shotEmpty}${shotDisabled}${shotActive}"
        title="${shotKey} ×${shotQty}"
        aria-label="${shotKey}"
        onclick="event.preventDefault(); if (typeof window.toggleAutoShot === 'function') window.toggleAutoShot();">
        <img class="shortcut-slot__icon shortcut-slot__icon--item" src="${shotIcon(shotKey)}" alt="" draggable="false">
        <span class="shortcut-count">${shotQty}</span>
        <span class="consumable-slot__tag">${shotLabel}</span>
      </button>
    </div>
  `;

  bar.innerHTML = hpHtml + mpHtml + shotHtml;

  const skillBar = document.getElementById('barra-de-atalhos-dinamica');
  const skillVisible = !!(
    skillBar
    && skillBar.style.display !== 'none'
    && window.getComputedStyle(skillBar).display !== 'none'
  );
  bar.hidden = !skillVisible;
  if (typeof window.kickHotbarCdLoop === 'function') window.kickHotbarCdLoop();
}

window.renderizarBarraConsumiveis = renderizarBarraConsumiveis;

export {};
