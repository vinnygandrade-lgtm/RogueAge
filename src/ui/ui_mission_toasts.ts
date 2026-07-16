/**
 * Mission-ready toasts (source + title + where to claim) and list sort helpers.
 */
import { registerGlobalFn } from '../runtime/register-global';

export type MissionToastSource =
  | 'daily'
  | 'weekly'
  | 'retention_journey'
  | 'retention_login'
  | 'level_reward'
  | 'gameplay_achievement';

export type MissionSortState = 'claimable' | 'progress' | 'locked' | 'done';

const SOURCE_I18N: Record<MissionToastSource, string> = {
  daily: 'game.missions.sources.daily',
  weekly: 'game.missions.sources.weekly',
  retention_journey: 'game.missions.sources.retentionJourney',
  retention_login: 'game.missions.sources.retentionLogin',
  level_reward: 'game.missions.sources.levelReward',
  gameplay_achievement: 'game.missions.sources.gameplayAchievement',
};

const DESTINATION_I18N: Record<'missions' | 'retention' | 'achievements', string> = {
  missions: 'game.missions.destinations.missions',
  retention: 'game.missions.destinations.retention',
  achievements: 'game.missions.destinations.achievements',
};

function mt(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function escapeToastHtml(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function defaultDestination(source: MissionToastSource): 'missions' | 'retention' | 'achievements' {
  if (source === 'retention_journey' || source === 'retention_login') return 'retention';
  if (source === 'level_reward' || source === 'gameplay_achievement') return 'achievements';
  return 'missions';
}

/** Toast with explicit origin + where to open and claim. */
export function showMissionReadyToast(
  source: MissionToastSource,
  title: string,
  destination?: 'missions' | 'retention' | 'achievements',
): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  if (container.children.length >= 3 && container.firstElementChild) {
    container.removeChild(container.firstElementChild);
  }

  const dest = destination || defaultDestination(source);
  const sourceLabel = mt(SOURCE_I18N[source]);
  const destLabel = mt(DESTINATION_I18N[dest]);
  const hint = mt('game.missions.toastHint', { destination: destLabel });
  const safeTitle = escapeToastHtml(title || '');

  const toast = document.createElement('div');
  toast.className = 'toast-msg toast-msg--mission toast-msg--mission-ready';
  toast.innerHTML =
    `<span class="toast-msg__source">${escapeToastHtml(sourceLabel)}</span>`
    + `<span class="toast-msg__title">${safeTitle}</span>`
    + `<span class="toast-msg__hint">${escapeToastHtml(hint)}</span>`;
  container.appendChild(toast);

  window.setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4200);
}

export function missionSortRank(state: MissionSortState): number {
  switch (state) {
    case 'claimable': return 0;
    case 'progress': return 1;
    case 'locked': return 2;
    case 'done': return 3;
    default: return 2;
  }
}

export function sortMissionEntries<T>(
  items: T[],
  stateOf: (item: T) => MissionSortState,
  tieOf: (item: T) => number,
): T[] {
  return items.slice().sort((a, b) => {
    const ra = missionSortRank(stateOf(a));
    const rb = missionSortRank(stateOf(b));
    if (ra !== rb) return ra - rb;
    return tieOf(a) - tieOf(b);
  });
}

export function scrollClaimableIntoView(
  container: HTMLElement | null,
  claimableSelector: string,
): void {
  if (!container) return;
  const el = container.querySelector(claimableSelector) as HTMLElement | null;
  if (!el) return;
  window.requestAnimationFrame(() => {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      el.scrollIntoView(true);
    }
  });
}

/** Badge on hub modal tabs (Daily / Weekly / Novice / Journey / …). */
export function paintHubTabNotif(tabButtonId: string, count: number, cap = 9): void {
  const btn = document.getElementById(tabButtonId);
  if (!btn) return;

  let pill = btn.querySelector('.hub-tab-notif') as HTMLElement | null;
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'hub-tab-notif';
    pill.setAttribute('aria-hidden', 'true');
    btn.appendChild(pill);
  }

  if (count <= 0) {
    pill.hidden = true;
    pill.setAttribute('aria-hidden', 'true');
    pill.textContent = '';
    pill.removeAttribute('aria-label');
    btn.classList.remove('hub-tab--has-notif');
    return;
  }

  const label = count > cap ? `${cap}+` : String(count);
  pill.hidden = false;
  pill.removeAttribute('aria-hidden');
  pill.textContent = label;
  pill.setAttribute(
    'aria-label',
    mt('game.missions.hubTabNotifAria', { count: label }),
  );
  btn.classList.add('hub-tab--has-notif');
}

registerGlobalFn('showMissionReadyToast', showMissionReadyToast);
registerGlobalFn('paintHubTabNotif', paintHubTabNotif);

export {};
