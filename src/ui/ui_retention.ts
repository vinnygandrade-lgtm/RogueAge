/**
 * UI — Retention Hub (novice calendar, monthly calendar, recruit journey).
 */
import type { DailyMissionReward, RetentionHubTab } from '../types/game';
import {
  RETENTION_DAY7_WEAPONS,
  RETENTION_JOURNEY_STEP_COUNT,
  RETENTION_JOURNEY_STEP_DEFS,
  RETENTION_MONTHLY_DAYS,
  RETENTION_NEWBIE_DAYS,
  retentionMonthlyReward,
  retentionNewbieReward,
} from '../game/retention_catalog';
import {
  REWARD_ICON_FALLBACK,
  htmlMissionRewardIcons,
  htmlRewardIconFrame,
  rewardPreviewTapAttrsHtml,
} from './ui_reward_icons';
import { scrollClaimableIntoView, sortMissionEntries, paintHubTabNotif } from './ui_mission_toasts';
import type { MissionSortState } from './ui_mission_toasts';

let hubTab: RetentionHubTab = 'newbie';
let pendingWeaponDay = 0;
let selectedWeaponId = '';

function rt(key: string, params?: Record<string, string | number>): string {
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

function engine() {
  return window.RetentionEngine;
}

function rewardIconLabels(): { adena: string; ac: string } {
  return {
    adena: rt('game.achievements.rowAdena'),
    ac: rt('game.achievements.rowAc'),
  };
}

function htmlRetentionRewardIcons(reward: DailyMissionReward | null | undefined): string {
  return htmlMissionRewardIcons(reward, rewardIconLabels());
}

function htmlRetentionDay7WeaponIcons(): string {
  const chips: string[] = [];
  RETENTION_DAY7_WEAPONS.forEach((w) => {
    const cat = window.catalogoArmas?.find((x) => String(x.id) === w.id);
    const src = cat?.img ? String(cat.img) : REWARD_ICON_FALLBACK;
    chips.push(
      `<button type="button" class="mission-reward-icon mission-reward-icon--tap" ${rewardPreviewTapAttrsHtml(w.id, 1)}>`
      + htmlRewardIconFrame(src, false)
      + '<span class="mission-reward-icon__qty">+4</span>'
      + '</button>',
    );
  });
  if (!chips.length) return '';
  return `<div class="mission-reward-icons retention-tile__weapon-picks">${chips.join('')}</div>`;
}

function htmlRetentionDay7Preview(): string {
  const parts: string[] = [
    `<span class="retention-day7-tag">${escapeHtml(rt('game.retention.newbie.day7Pick'))}</span>`,
  ];
  const coins = htmlRetentionRewardIcons(retentionNewbieReward(7));
  if (coins) parts.push(coins);
  const weapons = htmlRetentionDay7WeaponIcons();
  if (weapons) parts.push(weapons);
  return parts.join('');
}

function htmlRetentionTileReward(
  day: number,
  progressKey: 'newbie' | 'monthly',
  reward: DailyMissionReward | null | undefined,
): string {
  if (progressKey === 'newbie' && day === 7) {
    return htmlRetentionDay7Preview();
  }
  return htmlRetentionRewardIcons(reward);
}

function tileState(
  day: number,
  claimed: number[],
  currentDay: number,
  canClaimFn: (d: number) => boolean,
): 'locked' | 'claimable' | 'claimed' | 'future' | 'missed' {
  if (claimed.indexOf(day) >= 0) return 'claimed';
  if (canClaimFn(day)) return 'claimable';
  if (day > currentDay) return 'future';
  if (day < currentDay) return 'missed';
  return 'locked';
}

function htmlRetentionTileClaimBtn(
  claimable: boolean,
  day: number,
  progressKey: 'newbie' | 'monthly',
): string {
  if (!claimable) return '';
  const fn = progressKey === 'newbie' ? 'onRetentionNewbieDayClick' : 'onRetentionMonthlyDayClick';
  const label = progressKey === 'newbie' && day === 7
    ? rt('game.retention.newbie.claimDay7')
    : rt('game.retention.claim');
  return `<button type="button" class="btn-l2 retention-tile__claim" onclick="event.stopPropagation(); ${fn}(${day})">${escapeHtml(label)}</button>`;
}

function badgeForState(st: ReturnType<typeof tileState>): string {
  if (st === 'claimable') return rt('game.retention.tile.claimable');
  if (st === 'claimed') return rt('game.retention.tile.claimed');
  if (st === 'missed') return rt('game.retention.tile.missed');
  return rt('game.retention.tile.locked');
}

function renderCalendarGrid(
  rootId: string,
  summaryId: string,
  dayCount: number,
  gridClass: string,
  progressKey: 'newbie' | 'monthly',
  rewardFn: (day: number) => DailyMissionReward | null,
  canClaimFn: (day: number) => boolean,
  currentDay: number,
  claimed: number[],
  extraSummary?: Record<string, string | number>,
): void {
  const root = document.getElementById(rootId);
  const summary = document.getElementById(summaryId);
  if (!root) return;

  let pending = 0;
  let html = '';

  for (let d = 1; d <= dayCount; d++) {
    const st = tileState(d, claimed, currentDay, canClaimFn);
    if (st === 'claimable') pending++;
    const milestone = progressKey === 'newbie' ? d === 7 : d % 7 === 0;
    const reward = rewardFn(d);
    const icons = htmlRetentionTileReward(d, progressKey, reward);
    let preview = icons;
    if (!preview) {
      preview = escapeHtml(rt('game.retention.tile.rewardSoon'));
    }
    const claimable = st === 'claimable';
    const inactive = st === 'future' || st === 'claimed' || st === 'missed';

    html += `<div class="retention-tile retention-tile--${st}${milestone ? ' retention-tile--milestone' : ''}${inactive ? ' retention-tile--inactive' : ''}" aria-disabled="${inactive ? 'true' : 'false'}">
      <span class="retention-tile__head">
        <span class="retention-tile__day">${d}</span>
        <span class="retention-tile__badge">${escapeHtml(badgeForState(st))}</span>
      </span>
      <div class="retention-tile__reward">${preview}</div>
      ${htmlRetentionTileClaimBtn(claimable, d, progressKey)}
    </div>`;
  }

  root.className = `retention-grid ${gridClass}`;
  root.innerHTML = html;

  if (summary) {
    const base = progressKey === 'newbie'
      ? {
        current: currentDay,
        total: RETENTION_NEWBIE_DAYS,
        pending,
        claimed: claimed.length,
      }
      : {
        month: extraSummary?.month || '',
        current: currentDay,
        total: RETENTION_MONTHLY_DAYS,
        pending,
        claimed: claimed.length,
      };
    const progressLine = rt(
      progressKey === 'newbie' ? 'game.retention.newbie.progress' : 'game.retention.monthly.progress',
      base,
    );
    const hintLine = rt('game.retention.tile.tapIconsHint');
    summary.textContent = pending > 0 ? `${progressLine} · ${hintLine}` : progressLine;
  }

  scrollClaimableIntoView(root, '.retention-tile--claimable');
}

function renderNewbieCalendar(): void {
  const eng = engine();
  if (!eng) return;
  const save = eng.getSave();
  renderCalendarGrid(
    'retention-newbie-grid',
    'retention-newbie-summary',
    RETENTION_NEWBIE_DAYS,
    'retention-grid--newbie',
    'newbie',
    retentionNewbieReward,
    (d) => eng.canClaimNewbieDay(d),
    eng.getNewbieCurrentDay(),
    save.newbie.claimedDays || [],
  );
}

function renderMonthlyCalendar(): void {
  const eng = engine();
  if (!eng) return;
  const save = eng.getSave();
  const lv = Math.max(1, Math.floor(Number(window.nivel) || 1));
  const isMage = typeof window.isClasseMagica === 'function' && window.isClasseMagica(window.charClass);
  renderCalendarGrid(
    'retention-monthly-grid',
    'retention-monthly-summary',
    RETENTION_MONTHLY_DAYS,
    'retention-grid--monthly',
    'monthly',
    (d) => retentionMonthlyReward(d, lv, isMage),
    (d) => eng.canClaimMonthlyDay(d),
    eng.getMonthlyCurrentDay(),
    save.monthly.claimedDays || [],
    { month: save.monthly.monthKey || '' },
  );
}

function journeyStepState(step: number): 'locked' | 'active' | 'claimable' | 'claimed' {
  const eng = engine();
  if (!eng) return 'locked';
  const save = eng.getSave();
  if (save.journey.claimedSteps.indexOf(step) >= 0) return 'claimed';
  if (save.journey.completedSteps.indexOf(step) >= 0) return 'claimable';
  const priorDone = RETENTION_JOURNEY_STEP_DEFS
    .filter((s) => s.step < step)
    .every((s) => save.journey.completedSteps.indexOf(s.step) >= 0);
  return priorDone ? 'active' : 'locked';
}

function journeyStepSortState(step: number): MissionSortState {
  const st = journeyStepState(step);
  if (st === 'claimed') return 'done';
  if (st === 'claimable') return 'claimable';
  if (st === 'active') return 'progress';
  return 'locked';
}

function renderJourneyList(): void {
  const root = document.getElementById('retention-journey-list');
  const summary = document.getElementById('retention-journey-summary');
  const clanBanner = document.getElementById('retention-clan-banner');
  const eng = engine();
  if (!root || !eng) return;

  let pending = 0;
  let html = '';

  const ordered = sortMissionEntries(
    RETENTION_JOURNEY_STEP_DEFS.slice(),
    (def) => journeyStepSortState(def.step),
    (def) => def.step,
  );

  ordered.forEach((def) => {
    const st = journeyStepState(def.step);
    if (st === 'claimable') pending++;
    const curProg = eng.getJourneyProgress(def.step);

    html += `<div class="retention-journey-card retention-journey-card--${st}">
      <div class="retention-journey-card__head">
        <span class="retention-journey-card__step">${def.step}</span>
        <div>
          <div class="retention-journey-card__title">${escapeHtml(rt(def.titleKey))}</div>
          <div class="retention-journey-card__desc">${escapeHtml(rt(def.descKey))}</div>
        </div>
      </div>
      <div class="retention-journey-card__progress">${escapeHtml(rt('game.retention.journey.progress', { current: curProg, target: def.target }))}</div>
      <div class="retention-journey-card__hint">${escapeHtml(rt(def.hintKey))}</div>
      <div class="retention-journey-card__reward">${htmlRetentionRewardIcons(def.reward)}</div>
      ${st === 'claimable'
        ? `<button type="button" class="btn-l2 retention-journey-claim" onclick="claimRetentionJourneyStep(${def.step})">${escapeHtml(rt('game.retention.claim'))}</button>`
        : ''}
    </div>`;
  });

  root.innerHTML = html;

  if (summary) {
    const save = eng.getSave();
    summary.textContent = rt('game.retention.journey.summary', {
      done: save.journey.claimedSteps.length,
      total: RETENTION_JOURNEY_STEP_COUNT,
      pending,
    });
  }

  if (clanBanner) {
    clanBanner.hidden = !eng.shouldShowClanPrompt();
  }

  scrollClaimableIntoView(root, '.retention-journey-card--claimable');
}

function renderRetentionHub(): void {
  renderComebackBanner();
  if (hubTab === 'newbie') renderNewbieCalendar();
  else if (hubTab === 'monthly') renderMonthlyCalendar();
  else renderJourneyList();
}

function renderComebackBanner(): void {
  const eng = engine();
  let banner = document.getElementById('retention-comeback-banner');
  if (!banner) {
    const host = document.querySelector('#janela-retention-hub .retention-hub-tabs');
    if (!host?.parentElement) return;
    banner = document.createElement('div');
    banner.id = 'retention-comeback-banner';
    banner.className = 'retention-clan-banner retention-comeback-banner';
    host.parentElement.insertBefore(banner, host.nextSibling);
  }
  if (!eng?.hasComebackReady()) {
    banner.hidden = true;
    banner.innerHTML = '';
    return;
  }
  const preview = eng.getComebackPreview?.() ?? null;
  const tier = eng.getComebackTierKey?.() ?? 'short';
  const hours = Math.floor(eng.getComebackHoursAway?.() ?? 0);
  banner.hidden = false;
  banner.innerHTML = `<div class="retention-clan-banner__text">
      <strong>${escapeHtml(rt('game.retention.comeback.bannerTitle'))}</strong>
      <span>${escapeHtml(rt(`game.retention.comeback.tier.${tier}`, { hours }))}</span>
    </div>
    <div class="retention-comeback-banner__reward">${htmlRetentionRewardIcons(preview)}</div>
    <div class="retention-clan-banner__actions">
      <button type="button" class="btn-l2" onclick="claimRetentionComeback()">${escapeHtml(rt('game.retention.comeback.claim'))}</button>
      <button type="button" class="btn-l2 btn-l2--ghost" onclick="abrirRetentionComeback()">${escapeHtml(rt('game.retention.comeback.details'))}</button>
    </div>`;
}

/** Re-render open hub + update menu badge (after claim / load). */
function syncRetentionHubUi(): void {
  const open = document.getElementById('janela-retention-hub');
  if (open && open.style.display === 'flex') renderRetentionHub();
  refreshRetentionHud();
}

function syncRetentionHubTabNotifs(): void {
  const eng = engine();
  if (!eng) return;
  const save = eng.getSave();

  let newbie = 0;
  if (!save.newbie.completed && eng.canClaimNewbieDay(eng.getNewbieCurrentDay())) {
    newbie = 1;
  }

  let monthly = 0;
  if (eng.canClaimMonthlyDay(eng.getMonthlyCurrentDay())) {
    monthly = 1;
  }

  let journey = 0;
  (save.journey.completedSteps || []).forEach((st) => {
    if ((save.journey.claimedSteps || []).indexOf(st) < 0) journey++;
  });

  paintHubTabNotif('retention-tab-newbie', newbie);
  paintHubTabNotif('retention-tab-monthly', monthly);
  paintHubTabNotif('retention-tab-journey', journey);
}

function refreshRetentionHud(): void {
  syncRetentionHubTabNotifs();
  window.refreshNavMenuNotifications?.({ retention: contarPendenciasRetention() });
}

function setRetentionHubTab(tab: RetentionHubTab): void {
  hubTab = tab;
  (['newbie', 'monthly', 'journey'] as RetentionHubTab[]).forEach((t) => {
    const btn = document.getElementById(`retention-tab-${t}`);
    const panel = document.getElementById(`retention-panel-${t}`);
    const hint = document.getElementById(`retention-hint-${t}`);
    const active = t === tab;
    if (btn) {
      btn.classList.toggle('retention-hub-tab--active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    if (panel) panel.style.display = active ? 'flex' : 'none';
    if (hint) hint.style.display = active ? 'block' : 'none';
  });
  renderRetentionHub();
}

function pickRetentionHubTabDefault(): RetentionHubTab {
  const eng = engine();
  if (!eng) return 'newbie';
  const save = eng.getSave();
  let journeyReady = 0;
  (save.journey.completedSteps || []).forEach((st) => {
    if ((save.journey.claimedSteps || []).indexOf(st) < 0) journeyReady++;
  });
  if (journeyReady > 0) return 'journey';
  if (!save.newbie.completed && eng.canClaimNewbieDay(eng.getNewbieCurrentDay())) return 'newbie';
  if (eng.canClaimMonthlyDay(eng.getMonthlyCurrentDay())) return 'monthly';
  return 'newbie';
}

function abrirRetentionHub(tab?: RetentionHubTab): void {
  if (!window.charName) return;
  if (!window.RetentionEngine) {
    window.l2Alert?.(rt('game.retention.errorNotReady'));
    return;
  }
  setRetentionHubTab(tab ?? pickRetentionHubTabDefault());
  refreshRetentionHud();
  window.abrirModal('janela-retention-hub', 1500);
  window.syncNavMenuActiveItem?.();
}

function fecharRetentionHub(): void {
  window.fecharModal('janela-retention-hub');
  window.syncNavMenuActiveItem?.();
}

function onRetentionNewbieDayClick(day: number): void {
  const eng = engine();
  if (!eng || !eng.canClaimNewbieDay(day)) return;
  if (day === 7) {
    pendingWeaponDay = 7;
    selectedWeaponId = '';
    renderWeaponPicker();
    window.abrirModal('janela-retention-weapon-pick', 1550);
    return;
  }
  if (eng.claimNewbieDay(day)) {
    window.escreverLog?.(`<span style="color:#facc15;">${escapeHtml(rt('game.retention.logNewbieClaim', { day }))}</span>`);
    syncRetentionHubUi();
  }
}

function onRetentionMonthlyDayClick(day: number): void {
  const eng = engine();
  if (!eng || !eng.claimMonthlyDay(day)) return;
  window.escreverLog?.(`<span style="color:#facc15;">${escapeHtml(rt('game.retention.logMonthlyClaim', { day }))}</span>`);
  syncRetentionHubUi();
}

function claimRetentionJourneyStep(step: number): void {
  const eng = engine();
  if (!eng || !eng.claimJourneyStep(step)) return;
  window.escreverLog?.(`<span style="color:#34d399;">${escapeHtml(rt('game.retention.logJourneyClaim', { step }))}</span>`);
  syncRetentionHubUi();
}

function renderWeaponPicker(): void {
  const root = document.getElementById('retention-weapon-pick-grid');
  const footerConfirm = document.getElementById('retention-weapon-pick-confirm');
  const eng = engine();
  if (!root || !eng) return;

  let html = '';
  eng.getWeaponChoices().forEach((w) => {
    const cat = window.catalogoArmas?.find((x) => String(x.id) === w.id);
    const img = cat?.img ? escapeHtml(String(cat.img)) : '';
    const name = cat?.nome ? escapeHtml(String(cat.nome)) : escapeHtml(w.id);
    const selected = selectedWeaponId === w.id;
    html += `<button type="button" class="retention-weapon-pick${selected ? ' retention-weapon-pick--selected' : ''}" data-weapon-id="${escapeHtml(w.id)}" onclick="selectRetentionWeaponPick(this.dataset.weaponId)">
      <span class="retention-weapon-pick__thumb" onclick="event.stopPropagation(); previewRetentionWeaponPick('${escapeHtml(w.id)}')">
        <img src="${img}" alt="" class="retention-weapon-pick__img" loading="lazy">
      </span>
      <span class="retention-weapon-pick__name">${name}</span>
      <span class="retention-weapon-pick__enchant">+4</span>
      <span class="retention-weapon-pick__style">${escapeHtml(rt(`game.retention.weaponStyle.${w.styleKey}`))}</span>
    </button>`;
  });
  root.innerHTML = html;
  if (footerConfirm) {
    (footerConfirm as HTMLButtonElement).disabled = !selectedWeaponId;
  }
}

function selectRetentionWeaponPick(weaponId: string): void {
  if (!weaponId) return;
  selectedWeaponId = weaponId;
  renderWeaponPicker();
}

function previewRetentionWeaponPick(weaponId: string): void {
  if (!weaponId || typeof window.abrirAcaoItemGeral !== 'function') return;
  window.abrirAcaoItemGeral(weaponId, { previewQty: 1, previewOnly: true });
}

function confirmRetentionWeaponPick(): void {
  const eng = engine();
  const weaponId = selectedWeaponId;
  if (!eng || pendingWeaponDay !== 7 || !weaponId) return;
  if (eng.claimNewbieDay(7, weaponId)) {
    pendingWeaponDay = 0;
    selectedWeaponId = '';
    window.fecharModal('janela-retention-weapon-pick');
    window.escreverLog?.(`<span style="color:#facc15; font-weight:bold;">${escapeHtml(rt('game.retention.logDay7Weapon'))}</span>`);
    syncRetentionHubUi();
  }
}

function fecharRetentionWeaponPick(): void {
  pendingWeaponDay = 0;
  selectedWeaponId = '';
  window.fecharModal('janela-retention-weapon-pick');
}

function abrirRetentionComeback(): void {
  const body = document.getElementById('retention-comeback-body');
  const eng = engine();
  if (!body || !eng || !eng.hasComebackReady()) return;
  const hours = Math.floor(eng.getComebackHoursAway?.() ?? 0);
  const tier = eng.getComebackTierKey?.() ?? 'short';
  const preview = eng.getComebackPreview?.() ?? null;
  body.innerHTML = `<p>${escapeHtml(rt(`game.retention.comeback.tier.${tier}`, { hours }))}</p>
    <div class="retention-comeback-reward">${htmlRetentionRewardIcons(preview)}</div>`;
  window.abrirModal('janela-retention-comeback', 1480);
}

function claimRetentionComeback(): void {
  const eng = engine();
  if (!eng?.claimComeback()) {
    window.l2Alert?.(rt('game.retention.comeback.claimFailed'));
    return;
  }
  window.fecharModal('janela-retention-comeback');
  syncRetentionHubUi();
  window.escreverLog?.(`<span style="color:#a78bfa;">${escapeHtml(rt('game.retention.logComeback'))}</span>`);
  refreshRetentionHud();
}

function fecharRetentionComeback(): void {
  window.fecharModal('janela-retention-comeback');
}

function retentionGoClanHall(): void {
  fecharRetentionHub();
  window.navMenuGo?.('clans');
}

function dismissRetentionClanPrompt(): void {
  engine()?.dismissClanPrompt();
  renderJourneyList();
}

function contarPendenciasRetention(): number {
  return engine()?.countPending() ?? 0;
}

window.setRetentionHubTab = setRetentionHubTab;
window.abrirRetentionHub = abrirRetentionHub;
window.fecharRetentionHub = fecharRetentionHub;
window.onRetentionNewbieDayClick = onRetentionNewbieDayClick;
window.onRetentionMonthlyDayClick = onRetentionMonthlyDayClick;
window.claimRetentionJourneyStep = claimRetentionJourneyStep;
window.selectRetentionWeaponPick = selectRetentionWeaponPick;
window.previewRetentionWeaponPick = previewRetentionWeaponPick;
window.confirmRetentionWeaponPick = confirmRetentionWeaponPick;
window.fecharRetentionWeaponPick = fecharRetentionWeaponPick;
window.abrirRetentionComeback = abrirRetentionComeback;
window.claimRetentionComeback = claimRetentionComeback;
window.fecharRetentionComeback = fecharRetentionComeback;
window.retentionGoClanHall = retentionGoClanHall;
window.dismissRetentionClanPrompt = dismissRetentionClanPrompt;
window.syncRetentionHubTabNotifs = syncRetentionHubTabNotifs;
window.contarPendenciasRetention = contarPendenciasRetention;
window.refreshRetentionHud = refreshRetentionHud;
window.syncRetentionHubUi = syncRetentionHubUi;

export {};
