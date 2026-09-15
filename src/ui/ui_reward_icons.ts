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
  if (nome.startsWith('Soulshot') || nome.startsWith('B. Spiritshot') || nome.includes('Spiritshot')) {
    if (typeof window.shotIconPathForKey === 'function') {
      return window.shotIconPathForKey(nome);
    }
    const token = parseGradeTokenFromItemName(nome);
    return nome.includes('Spiritshot')
      ? 'assets/itens/spiritshot_' + token + '.png'
      : 'assets/itens/soulshot_' + token + '.png';
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
  catalogKey: string,
  previewQty: number,
  opts: MissionRewardIconOpts,
  displayName?: string,
): string {
  const layout = opts.layout || 'stack';
  const nameHtml = opts.showName && displayName
    ? '<span class="mission-reward-icon__name">' + escapeRewardHtml(displayName) + '</span>'
    : '';
  const qtyHtml = '<span class="mission-reward-icon__qty">' + escapeRewardHtml(qtyLabel) + '</span>';
  const body = layout === 'row'
    ? htmlRewardIconFrame(iconSrc, isCoin) + '<span class="mission-reward-icon__meta">' + nameHtml + qtyHtml + '</span>'
    : htmlRewardIconFrame(iconSrc, isCoin) + qtyHtml;
  return '<button type="button" class="mission-reward-icon mission-reward-icon--tap mission-reward-icon--'
    + layout + '" '
    + rewardPreviewTapAttrs(catalogKey, previewQty) + '>'
    + body
    + '</button>';
}

export type MissionRewardIconOpts = {
  layout?: 'stack' | 'badge' | 'row';
  compactQty?: boolean;
  showName?: boolean;
  maxChips?: number;
  hideOverflow?: boolean;
};

export function formatRewardCount(n: number, compact = false): string {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  if (compact && v >= 10000) return String(Math.round(v / 1000)) + 'k';
  if (compact && v >= 1000) {
    const k = v / 1000;
    const t = k >= 10 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, '');
    return t + 'k';
  }
  return String(v);
}

function qtyLabelFor(
  kind: 'currency' | 'item',
  n: number,
  opts: MissionRewardIconOpts,
): string {
  const num = formatRewardCount(n, !!opts.compactQty);
  if (opts.layout === 'badge') return num;
  return kind === 'currency' ? '+' + num : '×' + num;
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

/** Compact horizontal icon row for mission cards / bonus strip / login calendar. */
export function htmlMissionRewardIcons(
  recompensa: DailyMissionReward | null | undefined,
  labels?: { adena?: string; ac?: string },
  opts: MissionRewardIconOpts = {},
): string {
  if (!recompensa) return '';
  const layout = opts.layout || 'stack';
  const chips: string[] = [];
  const adenaLabel = labels?.adena || 'Adena';
  const acLabel = labels?.ac || 'Ancient Coins';
  const kAd = currencyBagKeyAdena();
  const kAc = currencyBagKeyAncient();

  if (recompensa.adenas) {
    chips.push(htmlMissionRewardChip(
      REWARD_ADENA_ICON,
      true,
      qtyLabelFor('currency', recompensa.adenas, opts),
      kAd,
      recompensa.adenas,
      opts,
      adenaLabel,
    ));
  }
  if (recompensa.ancientCoins) {
    chips.push(htmlMissionRewardChip(
      REWARD_AC_ICON,
      true,
      qtyLabelFor('currency', recompensa.ancientCoins, opts),
      kAc,
      recompensa.ancientCoins,
      opts,
      acLabel,
    ));
  }
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => {
      const qty = recompensa.itens![nome];
      const display = rewardDisplayName(nome);
      chips.push(htmlMissionRewardChip(
        resolveRewardIconSrc(nome),
        false,
        qtyLabelFor('item', qty, opts),
        nome,
        qty,
        opts,
        display,
      ));
    });
  }
  if (chips.length <= 0) return '';
  const max = opts.maxChips && opts.maxChips > 0 ? opts.maxChips : chips.length;
  const shown = chips.slice(0, max);
  const extra = chips.length - shown.length;
  if (extra > 0 && !opts.hideOverflow) {
    shown.push(
      '<span class="mission-reward-icon mission-reward-icon--more" aria-hidden="true">+'
      + extra + '</span>',
    );
  }
  return '<div class="mission-reward-icons mission-reward-icons--' + layout + '">' + shown.join('') + '</div>';
}

ensureRewardPreviewDelegation();
registerGlobalFn('abrirPreviewPremioRecompensa', abrirPreviewPremioRecompensa);

export {};

