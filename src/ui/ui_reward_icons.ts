/**
 * Shared reward icon helpers (missions, achievements, bonus previews).
 */

import type { DailyMissionReward } from '../types/game';
import { registerGlobalFn } from '../runtime/register-global';

export const REWARD_ICON_FALLBACK = 'assets/itens/item_generic.png';
export const REWARD_ADENA_ICON = 'assets/itens/adena_coin.png';
export const REWARD_AC_ICON = 'assets/itens/ancient_coin.png';

const REWARD_PREVIEW_ATTR = 'data-reward-preview-key';
const REWARD_PREVIEW_QTY_ATTR = 'data-reward-preview-qty';

let rewardPreviewDelegationBound = false;

export function escapeRewardHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function currencyBagKeyAdena(): string {
  return window.L2MINI_CURRENCY_BAG_KEYS?.adena || 'Adena';
}

export function currencyBagKeyAncient(): string {
  return window.L2MINI_CURRENCY_BAG_KEYS?.ancient || 'Ancient Coin';
}

export function parseGradeTokenFromItemName(nome: string): string {
  const match = nome.match(/\(([^)]+)\)/);
  const raw = match ? match[1].trim() : 'NG';
  const map: Record<string, string> = {
    NG: 'ng',
    'No-Grade': 'ng',
    D: 'd',
    C: 'c',
    B: 'b',
    A: 'a',
    S: 's',
  };
  return map[raw] || 'ng';
}

function isWeakRewardIconSrc(src: string): boolean {
  return !src || src.includes('/npcs/') || src.includes('grocer.png');
}

/** Resolve icon path for a stack/catalog item. */
export function resolveRewardIconSrc(nome: string): string {
  const entry = window.InventoryStackKeys?.findStackCatalogEntry?.(nome);
  let src = entry?.img ? String(entry.img) : '';
  if (!isWeakRewardIconSrc(src)) return src;

  if (nome === 'HP Potion') return 'assets/itens/pot_hp.png';
  if (nome === 'Mana Potion') return 'assets/itens/pot_mp.png';
  if (nome.startsWith('Enchant Armor')) {
    return 'assets/itens/scroll_arm_' + parseGradeTokenFromItemName(nome) + '.png';
  }
  if (nome.startsWith('Enchant Weapon')) {
    return 'assets/itens/scroll_wpn_' + parseGradeTokenFromItemName(nome) + '.png';
  }
  if (nome.startsWith('Soulshot') || nome.startsWith('B. Spiritshot')) {
    return 'assets/itens/soulshot_' + parseGradeTokenFromItemName(nome) + '.png';
  }
  return REWARD_ICON_FALLBACK;
}

export function rewardDisplayName(nome: string): string {
  if (typeof window.consumableDisplayName === 'function') {
    try {
      const label = window.consumableDisplayName(nome);
      if (label) return label;
    } catch { /* ignore */ }
  }
  return nome;
}

export function htmlRewardIconFrame(
  src: string,
  isCoin = false,
  frameClass = 'mission-reward-icon__frame',
): string {
  if (typeof window._l2InvIconFrameHtml === 'function') {
    return '<div class="' + frameClass + '">'
      + window._l2InvIconFrameHtml(src, isCoin ? 'inv-img l2-coin-img' : 'inv-img')
      + '</div>';
  }
  return '<div class="' + frameClass + '">'
    + '<img class="mission-reward-icon__img' + (isCoin ? ' mission-reward-icon__img--coin' : '') + '" src="'
    + escapeRewardHtml(src) + '" alt="" loading="lazy" decoding="async" draggable="false" '
    + 'onerror="this.onerror=null;this.src=\'' + REWARD_ICON_FALLBACK + '\';">'
    + '</div>';
}

function rewardPreviewTapAttrs(catalogKey: string, previewQty: number): string {
  const hint = typeof window.t === 'function'
    ? window.t('game.rewards.tapIconHint')
    : 'Tap icon for item details';
  return REWARD_PREVIEW_ATTR + '="' + escapeRewardHtml(catalogKey) + '" '
    + REWARD_PREVIEW_QTY_ATTR + '="' + escapeRewardHtml(String(previewQty)) + '" '
    + 'title="' + escapeRewardHtml(hint) + '" aria-label="' + escapeRewardHtml(hint) + '"';
}

function htmlMissionRewardChip(
  iconSrc: string,
  isCoin: boolean,
  qtyLabel: string,
  title: string,
  catalogKey: string,
  previewQty: number,
): string {
  return '<button type="button" class="mission-reward-icon mission-reward-icon--tap" '
    + rewardPreviewTapAttrs(catalogKey, previewQty) + '>'
    + htmlRewardIconFrame(iconSrc, isCoin)
    + '<span class="mission-reward-icon__qty">' + escapeRewardHtml(qtyLabel) + '</span>'
    + '</button>';
}

/** Opens the same read-only item modal used by the bag (reward preview). */
export function abrirPreviewPremioRecompensa(catalogKey: string, previewQty?: number): void {
  const key = String(catalogKey || '').trim();
  if (!key || typeof window.abrirAcaoItemGeral !== 'function') return;
  const qty = previewQty != null && Number.isFinite(Number(previewQty))
    ? Math.max(0, Math.floor(Number(previewQty)))
    : undefined;
  window.abrirAcaoItemGeral(key, { previewQty: qty, previewOnly: true });
}

function onRewardPreviewClick(ev: MouseEvent): void {
  const target = ev.target as Element | null;
  if (!target) return;
  const chip = target.closest('[' + REWARD_PREVIEW_ATTR + ']') as HTMLElement | null;
  if (!chip) return;
  ev.preventDefault();
  ev.stopPropagation();
  const key = chip.getAttribute(REWARD_PREVIEW_ATTR) || '';
  const qtyRaw = chip.getAttribute(REWARD_PREVIEW_QTY_ATTR);
  const qty = qtyRaw != null && qtyRaw !== '' ? parseInt(qtyRaw, 10) : undefined;
  abrirPreviewPremioRecompensa(key, Number.isFinite(qty) ? qty : undefined);
}

function ensureRewardPreviewDelegation(): void {
  if (rewardPreviewDelegationBound) return;
  rewardPreviewDelegationBound = true;
  document.addEventListener('click', onRewardPreviewClick);
}

/** Attributes for achievement claim rows (icon tap → item modal). */
export function rewardPreviewTapAttrsHtml(catalogKey: string, previewQty: number): string {
  return rewardPreviewTapAttrs(catalogKey, previewQty);
}

/** Compact horizontal icon row for mission cards / bonus strip. */
export function htmlMissionRewardIcons(
  recompensa: DailyMissionReward | null | undefined,
  labels?: { adena?: string; ac?: string },
): string {
  if (!recompensa) return '';
  const chips: string[] = [];
  const adenaLabel = labels?.adena || 'Adena';
  const acLabel = labels?.ac || 'Ancient Coins';
  const kAd = currencyBagKeyAdena();
  const kAc = currencyBagKeyAncient();

  if (recompensa.adenas) {
    chips.push(htmlMissionRewardChip(
      REWARD_ADENA_ICON,
      true,
      '+' + String(recompensa.adenas),
      adenaLabel + ' +' + recompensa.adenas,
      kAd,
      recompensa.adenas,
    ));
  }
  if (recompensa.ancientCoins) {
    chips.push(htmlMissionRewardChip(
      REWARD_AC_ICON,
      true,
      '+' + String(recompensa.ancientCoins),
      acLabel + ' +' + recompensa.ancientCoins,
      kAc,
      recompensa.ancientCoins,
    ));
  }
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => {
      const qty = recompensa.itens![nome];
      const display = rewardDisplayName(nome);
      chips.push(htmlMissionRewardChip(
        resolveRewardIconSrc(nome),
        false,
        '×' + String(qty),
        display + ' ×' + qty,
        nome,
        qty,
      ));
    });
  }
  if (chips.length <= 0) return '';
  return '<div class="mission-reward-icons">' + chips.join('') + '</div>';
}

ensureRewardPreviewDelegation();
registerGlobalFn('abrirPreviewPremioRecompensa', abrirPreviewPremioRecompensa);

export {};
