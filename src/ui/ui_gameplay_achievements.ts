/**
 * Gameplay achievements (Journey tab) + chat titles equip UI.
 */

import type { GameplayAchievementsSave } from '../types/game';
import {
  GAMEPLAY_ACH_GRADE_ORDER,
  GAMEPLAY_ACHIEVEMENTS_CATALOG,
  getGameplayAchievementDef,
  getGameplayTitleMeta,
  type GameplayAchievementDef,
  type GameplayAchievementGrade,
  type GameplayAchievementTierDef,
} from '../game/gameplay_achievements_catalog';
import { scrollClaimableIntoView, showMissionReadyToast, sortMissionEntries, paintHubTabNotif } from './ui_mission_toasts';
import type { MissionSortState } from './ui_mission_toasts';

type AchievementsHubTab = 'levels' | 'journey';

let hubTab: AchievementsHubTab = 'levels';
let stats: Record<string, number> = {};
let unlockedTitles: Set<string> = new Set();
let equippedTitleId: string | null = null;

function gaT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function escapeGaHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeGameplayAchievementsSave(raw: GameplayAchievementsSave | null | undefined): GameplayAchievementsSave {
  const statsOut: Record<string, number> = {};
  if (raw?.stats && typeof raw.stats === 'object') {
    Object.keys(raw.stats).forEach((k) => {
      const n = Math.floor(Number(raw.stats![k]));
      if (Number.isFinite(n) && n > 0) statsOut[k] = n;
    });
  }
  const unlocked: string[] = [];
  if (Array.isArray(raw?.unlockedTitles)) {
    raw!.unlockedTitles.forEach((id) => {
      if (typeof id === 'string' && id.trim()) unlocked.push(id.trim());
    });
  }
  let equipped: string | null = null;
  if (typeof raw?.equippedTitleId === 'string' && raw.equippedTitleId.trim()) {
    equipped = raw.equippedTitleId.trim();
    if (!unlocked.includes(equipped)) equipped = null;
  }
  return { stats: statsOut, unlockedTitles: unlocked, equippedTitleId: equipped };
}

function getStatValue(stat: string): number {
  return Math.max(0, Math.floor(Number(stats[stat]) || 0));
}

function syncEliteKillStatFromEndgame(): void {
  const life = Math.floor(Number(window.endgameData?.lifetimeChampionKills) || 0);
  if (life > 0) {
    const cur = getStatValue('elite_champion_kill');
    if (life > cur) stats['elite_champion_kill'] = life;
  }
}

function achievementTitle(achId: string): string {
  const k = 'game.gameplayAchievements.achievements.' + achId + '.title';
  const s = gaT(k);
  return s !== k ? s : achId;
}

function achievementDesc(achId: string): string {
  const k = 'game.gameplayAchievements.achievements.' + achId + '.desc';
  const s = gaT(k);
  return s !== k ? s : '';
}

export function getGameplayTitleText(titleId: string): string {
  const k = 'game.gameplayAchievements.titles.' + titleId;
  const s = gaT(k);
  return s !== k ? s : titleId;
}

export function getGameplayTitleGradeColor(grade: GameplayAchievementGrade): string {
  if (typeof window.getGradeColor === 'function') {
    return window.getGradeColor(grade) || '#a8a29e';
  }
  if (typeof window.getGradeUi === 'function') {
    const info = window.getGradeUi(grade);
    if (info?.color) return info.color;
  }
  return '#a8a29e';
}

export function getEquippedChatTitlePayload(): string {
  if (!equippedTitleId) return '';
  return 'gpa:' + equippedTitleId;
}

export function getEquippedChatTitle(): string {
  if (!equippedTitleId) return '';
  return getGameplayTitleText(equippedTitleId);
}

export function getEquippedChatTitleColor(): string {
  if (!equippedTitleId) return '#c084fc';
  const meta = getGameplayTitleMeta(equippedTitleId);
  return meta ? getGameplayTitleGradeColor(meta.grade) : '#c084fc';
}

/** First unclaimed tier — card color and goal follow this until the title is claimed. */
function getActiveTier(def: GameplayAchievementDef): GameplayAchievementTierDef | null {
  for (let i = 0; i < def.tiers.length; i++) {
    const tier = def.tiers[i];
    if (!unlockedTitles.has(tier.titleId)) return tier;
  }
  return null;
}

function isAchievementMastered(def: GameplayAchievementDef): boolean {
  return getActiveTier(def) == null;
}

function countMasteredAchievements(): number {
  let n = 0;
  GAMEPLAY_ACHIEVEMENTS_CATALOG.forEach((def) => {
    if (isAchievementMastered(def)) n++;
  });
  return n;
}

function gradeLabel(grade: GameplayAchievementGrade): string {
  return grade === 'No-Grade' ? 'NG' : grade;
}

function isTierClaimable(def: GameplayAchievementDef, tier: GameplayAchievementTierDef): boolean {
  if (unlockedTitles.has(tier.titleId)) return false;
  return getStatValue(def.stat) >= tier.threshold;
}

function snapshotClaimableAchievementKeys(): Set<string> {
  const set = new Set<string>();
  GAMEPLAY_ACHIEVEMENTS_CATALOG.forEach((def) => {
    const tier = getActiveTier(def);
    if (tier && isTierClaimable(def, tier)) {
      set.add(`${def.id}|${tier.titleId}`);
    }
  });
  return set;
}

function gameplayAchSortState(def: GameplayAchievementDef): MissionSortState {
  const activeTier = getActiveTier(def);
  const masteredAch = activeTier == null;
  if (masteredAch) return 'done';
  const tier = activeTier || def.tiers[def.tiers.length - 1];
  if (isTierClaimable(def, tier)) return 'claimable';
  return 'progress';
}

function countPendingGameplayClaims(): number {
  let n = 0;
  GAMEPLAY_ACHIEVEMENTS_CATALOG.forEach((def) => {
    const tier = getActiveTier(def);
    if (tier && isTierClaimable(def, tier)) n++;
  });
  return n;
}

function aplicarHudGameplayBadge(): void {
  refreshAchievementsNavBadge();
}

function syncAchievementsHubTabNotifs(): void {
  const levelPending = typeof window.contarPendenciasLevelRewards === 'function'
    ? window.contarPendenciasLevelRewards()
    : 0;
  paintHubTabNotif('ach-tab-levels', levelPending);
  paintHubTabNotif('ach-tab-journey', countPendingGameplayClaims());
}

function refreshAchievementsNavBadge(): void {
  const levelPending = typeof window.contarPendenciasLevelRewards === 'function'
    ? window.contarPendenciasLevelRewards()
    : 0;
  syncAchievementsHubTabNotifs();
  window.refreshNavMenuNotifications?.({
    achievements: levelPending + countPendingGameplayClaims(),
  });
}

export function registrarProgressoConquista(tipoEvento: string, valor = 1): void {
  const key = String(tipoEvento || '').trim();
  if (!key) return;
  const add = Math.max(0, Math.floor(Number(valor) || 0));
  if (add <= 0) return;
  const beforeClaimable = snapshotClaimableAchievementKeys();
  const prev = getStatValue(key);
  stats[key] = prev + add;
  const afterClaimable = snapshotClaimableAchievementKeys();
  afterClaimable.forEach((compoundKey) => {
    if (beforeClaimable.has(compoundKey)) return;
    const achId = compoundKey.split('|')[0];
    const def = getGameplayAchievementDef(achId);
    if (!def) return;
    if (typeof window.showMissionReadyToast === 'function') {
      window.showMissionReadyToast('gameplay_achievement', achievementTitle(def.id), 'achievements');
    }
  });
  aplicarHudGameplayBadge();
  const journeyPanel = document.getElementById('ach-panel-journey');
  if (journeyPanel && journeyPanel.style.display !== 'none') {
    renderizarGameplayAchievements();
  }
}

function reivindicarTierConquista(achId: string, titleId: string): boolean {
  const def = getGameplayAchievementDef(achId);
  if (!def) return false;
  const tier = def.tiers.find((t) => t.titleId === titleId);
  if (!tier || !isTierClaimable(def, tier)) return false;
  unlockedTitles.add(titleId);
  const titleText = getGameplayTitleText(titleId);
  if (typeof window.escreverLog === 'function') {
    window.escreverLog(
      '<span style="color:#fbbf24;">' + gaT('game.gameplayAchievements.logTitleUnlocked', { title: titleText }) + '</span>',
    );
  }
  aplicarHudGameplayBadge();
  renderizarGameplayAchievements();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  return true;
}

function equiparTituloConquista(titleId: string | null): void {
  if (titleId == null || titleId === '') {
    equippedTitleId = null;
  } else if (unlockedTitles.has(titleId)) {
    equippedTitleId = titleId;
  }
  renderizarPlayerTitles();
  if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
}

function getGameplayAchievementsSavePayload(): GameplayAchievementsSave {
  return {
    stats: { ...stats },
    unlockedTitles: Array.from(unlockedTitles),
    equippedTitleId,
  };
}

function aplicarGameplayAchievementsFromSave(raw: GameplayAchievementsSave | null | undefined): void {
  const norm = normalizeGameplayAchievementsSave(raw);
  stats = norm.stats;
  unlockedTitles = new Set(norm.unlockedTitles);
  equippedTitleId = norm.equippedTitleId;
  syncEliteKillStatFromEndgame();
  aplicarHudGameplayBadge();
}

function syncAchievementsHubTabsUi(): void {
  const tabLevels = document.getElementById('ach-tab-levels');
  const tabJourney = document.getElementById('ach-tab-journey');
  const panelLevels = document.getElementById('ach-panel-levels');
  const panelJourney = document.getElementById('ach-panel-journey');
  const hintLevels = document.getElementById('ach-hint-levels');
  const hintJourney = document.getElementById('ach-hint-journey');
  const isLevels = hubTab === 'levels';

  if (tabLevels) {
    tabLevels.classList.toggle('achievements-hub-tab--active', isLevels);
    tabLevels.setAttribute('aria-selected', isLevels ? 'true' : 'false');
  }
  if (tabJourney) {
    tabJourney.classList.toggle('achievements-hub-tab--active', !isLevels);
    tabJourney.setAttribute('aria-selected', !isLevels ? 'true' : 'false');
  }
  if (panelLevels) panelLevels.style.display = isLevels ? 'flex' : 'none';
  if (panelJourney) panelJourney.style.display = isLevels ? 'none' : 'flex';
  if (hintLevels) hintLevels.style.display = isLevels ? 'block' : 'none';
  if (hintJourney) hintJourney.style.display = isLevels ? 'none' : 'block';
}

function setAchievementsHubTab(tab: AchievementsHubTab): void {
  hubTab = tab === 'journey' ? 'journey' : 'levels';
  syncAchievementsHubTabsUi();
  if (hubTab === 'levels' && typeof window.renderizarLevelRewards === 'function') {
    window.renderizarLevelRewards();
  } else if (hubTab === 'journey') {
    renderizarGameplayAchievements();
  }
}

function renderizarGameplayAchievements(): void {
  const list = document.getElementById('gameplay-ach-list');
  const summary = document.getElementById('gameplay-ach-summary');
  if (!list) return;

  let claimable = 0;
  const unlocked = unlockedTitles.size;
  GAMEPLAY_ACHIEVEMENTS_CATALOG.forEach((def) => {
    const tier = getActiveTier(def);
    if (tier && isTierClaimable(def, tier)) claimable++;
  });

  const mastered = countMasteredAchievements();
  const total = GAMEPLAY_ACHIEVEMENTS_CATALOG.length;

  if (summary) {
    summary.textContent = gaT('game.gameplayAchievements.summaryLine', {
      unlocked,
      claimable,
      mastered,
      total,
    });
  }

  list.innerHTML = '';
  const ordered = sortMissionEntries(
    GAMEPLAY_ACHIEVEMENTS_CATALOG.slice(),
    (def) => gameplayAchSortState(def),
    (def) => GAMEPLAY_ACHIEVEMENTS_CATALOG.indexOf(def),
  );

  ordered.forEach((def) => {
    const activeTier = getActiveTier(def);
    const masteredAch = activeTier == null;
    const tier = masteredAch ? def.tiers[def.tiers.length - 1] : activeTier;
    const progress = getStatValue(def.stat);
    const pct = !masteredAch && tier.threshold > 0
      ? Math.min(100, Math.floor((progress / tier.threshold) * 100))
      : 100;
    const claimableTier = !masteredAch && isTierClaimable(def, tier);
    const gradeSlug = tier.grade === 'No-Grade' ? 'ng' : tier.grade.toLowerCase();
    const titleText = getGameplayTitleText(tier.titleId);
    const gradeColor = getGameplayTitleGradeColor(tier.grade);

    let btnHtml = '';
    if (masteredAch) {
      btnHtml = '<button type="button" class="btn-l2 gameplay-ach-card__btn gameplay-ach-card__btn--mastered" disabled>'
        + escapeGaHtml(gaT('game.gameplayAchievements.mastered')) + '</button>';
    } else if (claimableTier) {
      btnHtml = '<button type="button" class="btn-l2 gameplay-ach-card__btn gameplay-ach-card__btn--claim" '
        + 'onclick="reivindicarTierConquista(\'' + escapeGaHtml(def.id).replace(/'/g, "\\'") + '\',\''
        + escapeGaHtml(tier.titleId).replace(/'/g, "\\'") + '\')">'
        + escapeGaHtml(gaT('game.gameplayAchievements.claim')) + '</button>';
    } else {
      btnHtml = '<button type="button" class="btn-l2 gameplay-ach-card__btn" disabled>'
        + escapeGaHtml(gaT('game.gameplayAchievements.inProgress')) + '</button>';
    }

    list.innerHTML += ''
      + '<article class="gameplay-ach-card gameplay-ach-card--grade-' + gradeSlug
      + (claimableTier ? ' gameplay-ach-card--claimable' : '')
      + (masteredAch ? ' gameplay-ach-card--mastered' : '') + '">'
      + '<div class="gameplay-ach-card__head">'
      + '<span class="gameplay-ach-card__icon" aria-hidden="true">' + def.icon + '</span>'
      + '<div class="gameplay-ach-card__info">'
      + '<div class="gameplay-ach-card__title-row">'
      + '<div class="gameplay-ach-card__title">' + escapeGaHtml(achievementTitle(def.id)) + '</div>'
      + '<span class="gameplay-ach-card__grade gameplay-ach-card__grade--' + gradeSlug + '" style="color:'
      + escapeGaHtml(gradeColor) + ';border-color:' + escapeGaHtml(gradeColor) + '">'
      + escapeGaHtml(gradeLabel(tier.grade)) + '</span>'
      + '</div>'
      + '<div class="gameplay-ach-card__desc">' + escapeGaHtml(achievementDesc(def.id)) + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="gameplay-ach-card__reward">'
      + '<span class="gameplay-ach-card__reward-label">' + escapeGaHtml(gaT('game.gameplayAchievements.titleReward')) + '</span>'
      + '<span class="gameplay-ach-card__title-badge" style="color:' + escapeGaHtml(gradeColor) + ';border-color:' + escapeGaHtml(gradeColor) + '">'
      + escapeGaHtml(titleText) + '</span>'
      + '</div>'
      + '<div class="gameplay-ach-card__track">'
      + '<div class="gameplay-ach-card__bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + tier.threshold + '" aria-valuenow="' + progress + '">'
      + '<div class="gameplay-ach-card__bar-fill" style="width:' + pct + '%;"></div>'
      + '</div>'
      + '<div class="gameplay-ach-card__nums">'
      + (masteredAch
        ? escapeGaHtml(gaT('game.gameplayAchievements.masteredProgress', { value: progress.toLocaleString() }))
        : progress.toLocaleString() + '/' + tier.threshold.toLocaleString()
          + ' <span class="gameplay-ach-card__pct">(' + pct + '%)</span>')
      + '</div>'
      + '</div>'
      + '<div class="gameplay-ach-card__actions">' + btnHtml + '</div>'
      + '</article>';
  });

  scrollClaimableIntoView(list, '.gameplay-ach-card--claimable');
}

function renderizarPlayerTitles(): void {
  const equippedEl = document.getElementById('player-titles-equipped');
  const listEl = document.getElementById('player-titles-list');
  if (!equippedEl || !listEl) return;

  const equippedText = equippedTitleId ? getGameplayTitleText(equippedTitleId) : '';
  const equippedColor = equippedTitleId ? getEquippedChatTitleColor() : '#6b7280';
  equippedEl.innerHTML = equippedTitleId
    ? '<div class="player-titles-equipped__label">' + escapeGaHtml(gaT('game.gameplayAchievements.equippedNow')) + '</div>'
      + '<div class="player-titles-equipped__badge" style="color:' + escapeGaHtml(equippedColor) + ';border-color:' + escapeGaHtml(equippedColor) + '">'
      + escapeGaHtml(equippedText) + '</div>'
      + '<button type="button" class="btn-l2 player-titles-unequip" onclick="equiparTituloConquista(null)">'
      + escapeGaHtml(gaT('game.gameplayAchievements.unequip')) + '</button>'
    : '<div class="player-titles-equipped__empty">' + escapeGaHtml(gaT('game.gameplayAchievements.noneEquipped')) + '</div>';

  const ids = Array.from(unlockedTitles);
  ids.sort((a, b) => {
    const ma = getGameplayTitleMeta(a);
    const mb = getGameplayTitleMeta(b);
    const ga = ma ? GAMEPLAY_ACH_GRADE_ORDER.indexOf(ma.grade) : 0;
    const gb = mb ? GAMEPLAY_ACH_GRADE_ORDER.indexOf(mb.grade) : 0;
    if (ga !== gb) return gb - ga;
    return getGameplayTitleText(a).localeCompare(getGameplayTitleText(b));
  });

  if (ids.length <= 0) {
    listEl.innerHTML = '<p class="player-titles-empty">' + escapeGaHtml(gaT('game.gameplayAchievements.noTitlesYet')) + '</p>';
    return;
  }

  listEl.innerHTML = '';
  ids.forEach((titleId) => {
    const meta = getGameplayTitleMeta(titleId);
    const grade = meta?.grade || 'No-Grade';
    const slug = grade === 'No-Grade' ? 'ng' : grade.toLowerCase();
    const color = getGameplayTitleGradeColor(grade);
    const text = getGameplayTitleText(titleId);
    const isEquipped = equippedTitleId === titleId;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'player-titles-row player-titles-row--grade-' + slug + (isEquipped ? ' player-titles-row--equipped' : '');
    row.innerHTML = '<span class="player-titles-row__badge" style="color:' + color + ';border-color:' + color + '">'
      + escapeGaHtml(text) + '</span>'
      + '<span class="player-titles-row__grade">' + escapeGaHtml(grade === 'No-Grade' ? 'NG' : grade) + '</span>';
    row.onclick = function () {
      equiparTituloConquista(titleId);
    };
    listEl.appendChild(row);
  });
}

function abrirPlayerTitles(): void {
  syncEliteKillStatFromEndgame();
  renderizarPlayerTitles();
  window.abrirModal('janela-player-titles', 1550);
}

function fecharPlayerTitles(): void {
  window.fecharModal('janela-player-titles');
}

function onAbrirAchievementsHub(): void {
  syncEliteKillStatFromEndgame();
  syncAchievementsHubTabNotifs();
  setAchievementsHubTab(hubTab);
}

function refreshGameplayAchievementsI18n(): void {
  const hub = document.getElementById('janela-level-rewards');
  if (hub && hub.style.display === 'flex') {
    const journey = document.getElementById('ach-panel-journey');
    if (journey && journey.style.display !== 'none') {
      renderizarGameplayAchievements();
    }
  }
  const titlesModal = document.getElementById('janela-player-titles');
  if (titlesModal && titlesModal.style.display === 'flex') {
    renderizarPlayerTitles();
  }
}

// Bridge mission progress → lifetime stats (ui_daily_missions calls registrarProgressoConquista)

window.getGameplayAchievementsSavePayload = getGameplayAchievementsSavePayload;
window.aplicarGameplayAchievementsFromSave = aplicarGameplayAchievementsFromSave;
window.registrarProgressoConquista = registrarProgressoConquista;
window.setAchievementsHubTab = setAchievementsHubTab;
window.reivindicarTierConquista = reivindicarTierConquista;
window.equiparTituloConquista = equiparTituloConquista;
window.abrirPlayerTitles = abrirPlayerTitles;
window.fecharPlayerTitles = fecharPlayerTitles;
window.getEquippedChatTitle = getEquippedChatTitle;
window.getEquippedChatTitlePayload = getEquippedChatTitlePayload;
window.getEquippedChatTitleColor = getEquippedChatTitleColor;
window.onAbrirAchievementsHub = onAbrirAchievementsHub;
window.contarPendenciasGameplayAchievements = countPendingGameplayClaims;
window.syncAchievementsHubTabNotifs = syncAchievementsHubTabNotifs;
window.refreshAchievementsNavBadge = refreshAchievementsNavBadge;
window.refreshGameplayAchievementsI18n = refreshGameplayAchievementsI18n;

export {};
