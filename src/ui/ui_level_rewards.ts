/**
 * UI — Achievements / Level Rewards
 * 80-level tile board: locked / claimable / claimed. Milestone every 10 (AC).
 */

import type { DailyBossGradeTier, DailyMissionReward, LevelRewardsSave } from '../types/game';
import {
  REWARD_AC_ICON,
  REWARD_ADENA_ICON,
  currencyBagKeyAdena,
  currencyBagKeyAncient,
  htmlRewardIconFrame,
  resolveRewardIconSrc,
  rewardDisplayName,
  rewardPreviewTapAttrsHtml,
} from './ui_reward_icons';
import { scrollClaimableIntoView, showMissionReadyToast } from './ui_mission_toasts';

/** Official progression board size (levels 1–80). */
const LEVEL_REWARDS_MAX = 80;

let claimedLevels = new Set<number>();
let selectedLevel = 1;

function lrT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function escapeHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isMilestoneLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

function playerLevelCap(): number {
  return Math.min(LEVEL_REWARDS_MAX, Math.max(1, Math.floor(Number(window.nivel) || 1)));
}

function gradeForLevel(level: number): DailyBossGradeTier {
  if (level >= 76) return 'S';
  if (level >= 61) return 'A';
  if (level >= 52) return 'B';
  if (level >= 40) return 'C';
  if (level >= 20) return 'D';
  return 'No-Grade';
}

function gradeMod(level: number): number {
  const map: Record<DailyBossGradeTier, number> = {
    'No-Grade': 1.0,
    D: 1.35,
    C: 1.8,
    B: 2.4,
    A: 3.2,
    S: 4.2,
  };
  return map[gradeForLevel(level)] || 1;
}

function shotNameForLevel(level: number): string {
  const g = gradeForLevel(level);
  const label = g === 'No-Grade' ? 'NG' : g;
  const isMage = typeof window.isClasseMagica === 'function' && typeof window.charClass !== 'undefined'
    ? window.isClasseMagica(window.charClass)
    : false;
  return isMage ? `B. Spiritshot (${label})` : `Soulshot (${label})`;
}

function scrollArmorForLevel(level: number): string {
  const g = gradeForLevel(level);
  const label = g === 'No-Grade' ? 'NG' : g;
  return `Enchant Armor (${label})`;
}

function scrollWeaponForLevel(level: number): string {
  const g = gradeForLevel(level);
  const label = g === 'No-Grade' ? 'NG' : g;
  return `Enchant Weapon (${label})`;
}

/** Build reward for reaching `level` (claim when player nivel >= level). */
function montarRecompensaNivel(level: number): DailyMissionReward {
  const mod = gradeMod(level);
  const L = Math.max(1, Math.floor(level));

  if (isMilestoneLevel(L)) {
    const tier = Math.floor(L / 10);
    const ac = Math.max(1, tier);
    const itens: Record<string, number> = {
      [scrollArmorForLevel(L)]: 1,
      [shotNameForLevel(L)]: Math.floor(25 + tier * 15),
      'HP Potion': 8 + tier * 2,
      'Mana Potion': 6 + tier * 2,
    };
    if (tier >= 2) {
      itens[scrollWeaponForLevel(L)] = 1;
    }
    return {
      adenas: Math.floor((12000 + L * 900) * mod),
      ancientCoins: ac,
      itens,
    };
  }

  return {
    adenas: Math.floor((900 + L * 220) * mod),
    ancientCoins: 0,
    itens: {
      [shotNameForLevel(L)]: Math.floor(8 + L * 0.6),
      'HP Potion': 2 + Math.floor(L / 12),
      'Mana Potion': 1 + Math.floor(L / 15),
    },
  };
}

function aplicarRecompensa(recompensa: DailyMissionReward): void {
  if (recompensa.adenas) window.adenas += recompensa.adenas;
  if (recompensa.ancientCoins) window.ancientCoins += recompensa.ancientCoins;
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => {
      const qty = recompensa.itens![nome];
      if (window.InventoryManager && typeof window.InventoryManager.adicionarStack === 'function') {
        window.InventoryManager.adicionarStack(nome, qty);
      } else {
        window.inventario[nome] = (window.inventario[nome] || 0) + qty;
      }
    });
  }
}

function htmlLevelClaimIcon(
  src: string,
  isCoin = false,
  catalogKey?: string,
  previewQty?: number,
): string {
  const classes = ['level-claim-row__icon'];
  let extraAttrs = '';
  if (catalogKey != null && previewQty != null) {
    classes.push('level-claim-row__icon--tap');
    extraAttrs = ' ' + rewardPreviewTapAttrsHtml(catalogKey, previewQty) + ' role="button" tabindex="0"';
  }
  return '<div class="' + classes.join(' ') + '"' + extraAttrs + '>'
    + htmlRewardIconFrame(src, isCoin, 'level-claim-row__frame')
    + '</div>';
}

function htmlRewardRow(
  rowClass: string,
  iconSrc: string,
  isCoin: boolean,
  name: string,
  qtyHtml: string,
  catalogKey: string,
  previewQty: number,
): string {
  return '<li class="level-claim-row ' + rowClass + '">'
    + htmlLevelClaimIcon(iconSrc, isCoin, catalogKey, previewQty)
    + '<div class="level-claim-row__body">'
    + '<span class="level-claim-row__name">' + escapeHtml(name) + '</span>'
    + '<span class="level-claim-row__qty">' + qtyHtml + '</span>'
    + '</div>'
    + '</li>';
}

function htmlRewardRows(recompensa: DailyMissionReward): string {
  const rows: string[] = [];
  if (recompensa.adenas) {
    rows.push(htmlRewardRow(
      'level-claim-row--adena',
      REWARD_ADENA_ICON,
      true,
      lrT('game.achievements.rowAdena'),
      '+' + escapeHtml(String(recompensa.adenas)),
      currencyBagKeyAdena(),
      recompensa.adenas,
    ));
  }
  if (recompensa.ancientCoins) {
    rows.push(htmlRewardRow(
      'level-claim-row--ac',
      REWARD_AC_ICON,
      true,
      lrT('game.achievements.rowAc'),
      '+' + escapeHtml(String(recompensa.ancientCoins)),
      currencyBagKeyAncient(),
      recompensa.ancientCoins,
    ));
  }
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => {
      const qty = recompensa.itens![nome];
      rows.push(htmlRewardRow(
        'level-claim-row--item',
        resolveRewardIconSrc(nome),
        false,
        rewardDisplayName(nome),
        '×' + escapeHtml(String(qty)),
        nome,
        qty,
      ));
    });
  }
  return rows.join('');
}

function tileAriaLabel(level: number, milestone: boolean): string {
  const title = milestone
    ? lrT('game.achievements.milestoneTitle', { level })
    : lrT('game.achievements.levelTitle', { level });
  return title;
}

type TileState = 'locked' | 'claimable' | 'claimed';

function tileState(level: number): TileState {
  const reached = playerLevelCap();
  if (level > reached) return 'locked';
  if (claimedLevels.has(level)) return 'claimed';
  return 'claimable';
}

function getLevelRewardsSavePayload(): LevelRewardsSave {
  return { claimed: Array.from(claimedLevels).sort((a, b) => a - b) };
}

function aplicarLevelRewardsFromSave(raw: LevelRewardsSave | null | undefined): void {
  claimedLevels = new Set<number>();
  if (raw && Array.isArray(raw.claimed)) {
    raw.claimed.forEach((n) => {
      const lv = Math.floor(Number(n));
      if (Number.isFinite(lv) && lv >= 1 && lv <= LEVEL_REWARDS_MAX) claimedLevels.add(lv);
    });
  }
  selectedLevel = playerLevelCap();
  aplicarHudLevelRewardsBadge();
}

function contarPendenciasLevelRewards(): number {
  const reached = playerLevelCap();
  let n = 0;
  for (let L = 1; L <= reached; L++) {
    if (!claimedLevels.has(L)) n++;
  }
  return n;
}

function aplicarHudLevelRewardsBadge(): void {
  if (typeof window.syncAchievementsHubTabNotifs === 'function') {
    window.syncAchievementsHubTabNotifs();
  }
  if (typeof window.refreshAchievementsNavBadge === 'function') {
    window.refreshAchievementsNavBadge();
    return;
  }
  const n = contarPendenciasLevelRewards();
  window.refreshNavMenuNotifications?.({ achievements: n });
}

function onReachedLevel(level: number): void {
  const L = Math.floor(Number(level) || 0);
  if (L < 1 || L > LEVEL_REWARDS_MAX) {
    if (L > LEVEL_REWARDS_MAX) aplicarHudLevelRewardsBadge();
    return;
  }
  selectedLevel = L;
  aplicarHudLevelRewardsBadge();
  if (typeof window.escreverLog === 'function') {
    const msg = lrT('game.achievements.logUnlocked', { level: L });
    window.escreverLog(`<span style="color:#fbbf24; font-weight:bold;">${msg}</span>`);
  }
  const title = isMilestoneLevel(L)
    ? lrT('game.achievements.milestoneTitle', { level: L })
    : lrT('game.achievements.levelTitle', { level: L });
  if (typeof window.showMissionReadyToast === 'function') {
    window.showMissionReadyToast('level_reward', title, 'achievements');
  }
}

function reivindicarRecompensaNivel(level: number): boolean {
  const L = Math.floor(Number(level) || 0);
  const reached = playerLevelCap();
  if (L < 1 || L > reached || L > LEVEL_REWARDS_MAX) return false;
  if (claimedLevels.has(L)) return false;

  const reward = montarRecompensaNivel(L);
  aplicarRecompensa(reward);
  claimedLevels.add(L);
  selectedLevel = L;

  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    const title = isMilestoneLevel(L)
      ? lrT('game.achievements.milestoneTitle', { level: L })
      : lrT('game.achievements.levelTitle', { level: L });
    window.escreverLog(
      '<span style="color:#facc15;">' + lrT('game.achievements.logClaimed', { title }) + '</span>',
    );
  }
  aplicarHudLevelRewardsBadge();
  renderizarLevelRewards();
  if (isLevelRewardClaimModalOpen()) {
    renderLevelRewardClaimModal(L);
  }
  return true;
}

function reivindicarTodasRecompensasNivel(): void {
  const reached = playerLevelCap();
  let claimed = 0;
  for (let L = 1; L <= reached; L++) {
    if (claimedLevels.has(L)) continue;
    const reward = montarRecompensaNivel(L);
    aplicarRecompensa(reward);
    claimedLevels.add(L);
    claimed++;
  }
  if (claimed <= 0) return;
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    window.escreverLog(
      '<span style="color:#facc15; font-weight:bold;">'
      + lrT('game.achievements.logClaimAll', { count: claimed })
      + '</span>',
    );
  }
  aplicarHudLevelRewardsBadge();
  renderizarLevelRewards();
}

function isLevelRewardClaimModalOpen(): boolean {
  const el = document.getElementById('janela-level-reward-claim');
  return !!(el && el.style.display === 'flex');
}

function syncLevelTileSelection(): void {
  const grid = document.getElementById('level-rewards-grid');
  if (!grid) return;
  grid.querySelectorAll('.level-tile').forEach(function (el) {
    const n = Number((el as HTMLElement).getAttribute('data-level') || 0);
    el.classList.toggle('level-tile--selected', n === selectedLevel);
  });
}

function renderLevelRewardClaimModal(level: number): void {
  const root = document.getElementById('level-claim-modal-root');
  const titleEl = document.getElementById('level-claim-modal-title');
  const claimBtn = document.getElementById('btn-level-claim-modal-primary') as HTMLButtonElement | null;
  if (!root) return;

  const L = Math.floor(Number(level) || 0);
  if (L < 1 || L > LEVEL_REWARDS_MAX) return;

  const st = tileState(L);
  const reward = montarRecompensaNivel(L);
  const milestone = isMilestoneLevel(L);
  const title = milestone
    ? lrT('game.achievements.milestoneTitle', { level: L })
    : lrT('game.achievements.levelTitle', { level: L });

  if (titleEl) titleEl.textContent = title;

  let statusText = '';
  if (st === 'locked') {
    statusText = lrT('game.achievements.statusPreview', { level: L });
  } else if (st === 'claimed') {
    statusText = lrT('game.achievements.statusClaimed');
  } else {
    statusText = lrT('game.achievements.statusClaimable');
  }

  root.innerHTML = ''
    + '<div class="level-claim-hero' + (milestone ? ' level-claim-hero--milestone' : '') + '">'
    + '<div class="level-claim-hero__ring"><span class="level-claim-hero__lvl">' + L + '</span></div>'
    + '<div class="level-claim-hero__title">' + escapeHtml(title) + '</div>'
    + (milestone
      ? '<span class="level-reward-card__badge level-claim-hero__badge">'
        + escapeHtml(lrT('game.achievements.milestoneBadge')) + '</span>'
      : '')
    + '</div>'
    + '<p class="level-claim-status level-claim-status--' + st + '">' + escapeHtml(statusText) + '</p>'
    + '<div class="level-claim-rewards">'
    + '<p class="level-claim-rewards__heading">' + escapeHtml(lrT('game.achievements.reward')) + '</p>'
    + '<ul class="level-claim-list">' + htmlRewardRows(reward) + '</ul>'
    + '</div>';

  if (claimBtn) {
    if (st === 'claimable') {
      claimBtn.style.display = '';
      claimBtn.disabled = false;
      claimBtn.textContent = lrT('game.achievements.claim');
    } else {
      claimBtn.style.display = 'none';
      claimBtn.disabled = true;
    }
  }

  const modalRoot = document.getElementById('janela-level-reward-claim');
  if (modalRoot && window.I18n && typeof window.I18n.refreshDom === 'function') {
    try { window.I18n.refreshDom(modalRoot); } catch { /* ignore */ }
  }
}

function abrirLevelRewardClaimModal(level: number): void {
  const L = Math.floor(Number(level) || 0);
  if (L < 1 || L > LEVEL_REWARDS_MAX) return;
  selectedLevel = L;
  syncLevelTileSelection();
  renderLevelRewardClaimModal(L);
  window.abrirModal('janela-level-reward-claim', 1650);
}

function fecharLevelRewardClaimModal(): void {
  window.fecharModal('janela-level-reward-claim');
}

function reivindicarRecompensaNivelFromModal(): void {
  reivindicarRecompensaNivel(selectedLevel);
}

function selecionarNivelAchievement(level: number): void {
  abrirLevelRewardClaimModal(level);
}

function onLevelTileClick(level: number): void {
  abrirLevelRewardClaimModal(level);
}

function renderizarLevelRewards(): void {
  const grid = document.getElementById('level-rewards-grid')
    || document.getElementById('level-rewards-list');
  const summary = document.getElementById('level-rewards-summary');
  const claimAllBtn = document.getElementById('btn-level-rewards-claim-all') as HTMLButtonElement | null;
  if (!grid) return;

  const reached = playerLevelCap();
  const pending = contarPendenciasLevelRewards();
  let claimedCount = 0;
  for (let L = 1; L <= reached; L++) {
    if (claimedLevels.has(L)) claimedCount++;
  }

  if (selectedLevel < 1 || selectedLevel > LEVEL_REWARDS_MAX) {
    selectedLevel = reached;
  }

  if (summary) {
    summary.textContent = lrT('game.achievements.progressLine', {
      claimed: claimedCount,
      total: LEVEL_REWARDS_MAX,
      pending,
      current: reached,
    });
  }
  if (claimAllBtn) {
    claimAllBtn.disabled = pending <= 0;
    claimAllBtn.textContent = lrT('game.achievements.claimAll');
  }

  let html = '';
  for (let L = 1; L <= LEVEL_REWARDS_MAX; L++) {
    const st = tileState(L);
    const milestone = isMilestoneLevel(L);
    const classes = [
      'level-tile',
      'level-tile--' + st,
      milestone ? 'level-tile--milestone' : '',
      L === selectedLevel ? 'level-tile--selected' : '',
    ].filter(Boolean).join(' ');
    const aria = tileAriaLabel(L, milestone);
    html += '<button type="button" class="' + classes + '" data-level="' + L + '"'
      + ' aria-label="' + escapeHtml(aria) + '"'
      + ' title="' + escapeHtml(aria) + '"'
      + ' onclick="onLevelTileClick(' + L + ')">'
      + (milestone ? '<span class="level-tile__gem" aria-hidden="true"></span>' : '')
      + '<span class="level-tile__num">' + L + '</span>'
      + (st === 'claimed' ? '<span class="level-tile__mark" aria-hidden="true">✓</span>' : '')
      + (st === 'claimable' ? '<span class="level-tile__dot" aria-hidden="true"></span>' : '')
      + '</button>';
  }
  grid.innerHTML = html;
  grid.classList.add('level-rewards-grid');
  if (pending > 0) {
    scrollClaimableIntoView(grid, '.level-tile--claimable');
  }
}

function abrirLevelRewards(): void {
  if (!window.charName) return;
  selectedLevel = playerLevelCap();
  if (typeof window.onAbrirAchievementsHub === 'function') window.onAbrirAchievementsHub();
  const root = document.getElementById('janela-level-rewards');
  if (root && window.I18n && typeof window.I18n.refreshDom === 'function') {
    try { window.I18n.refreshDom(root); } catch { /* ignore */ }
  }
  if (typeof window.syncAchievementsHubTabNotifs === 'function') {
    window.syncAchievementsHubTabNotifs();
  }
  window.abrirModal('janela-level-rewards', 1500);
  window.syncNavMenuActiveItem?.();
}

function fecharLevelRewards(): void {
  fecharLevelRewardClaimModal();
  window.fecharModal('janela-level-rewards');
  window.syncNavMenuActiveItem?.();
}

function inicializarLevelRewards(): void {
  aplicarHudLevelRewardsBadge();
}

window.getLevelRewardsSavePayload = getLevelRewardsSavePayload;
window.aplicarLevelRewardsFromSave = aplicarLevelRewardsFromSave;
window.onLevelRewardReached = onReachedLevel;
window.reivindicarRecompensaNivel = reivindicarRecompensaNivel;
window.reivindicarTodasRecompensasNivel = reivindicarTodasRecompensasNivel;
window.onLevelTileClick = onLevelTileClick;
window.selecionarNivelAchievement = selecionarNivelAchievement;
window.abrirLevelRewardClaimModal = abrirLevelRewardClaimModal;
window.fecharLevelRewardClaimModal = fecharLevelRewardClaimModal;
window.reivindicarRecompensaNivelFromModal = reivindicarRecompensaNivelFromModal;
window.renderizarLevelRewards = renderizarLevelRewards;
window.abrirLevelRewards = abrirLevelRewards;
window.fecharLevelRewards = fecharLevelRewards;
window.contarPendenciasLevelRewards = contarPendenciasLevelRewards;
window.inicializarLevelRewards = inicializarLevelRewards;
window.aplicarHudLevelRewardsBadge = aplicarHudLevelRewardsBadge;
window.contarPendenciasLevelRewards = contarPendenciasLevelRewards;

export {};
