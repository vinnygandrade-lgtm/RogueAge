/**
 * Chat title badges — store stable payloads (gpa:/asc:), resolve text per locale at display.
 */

import { getGameplayTitleMeta } from '../game/gameplay_achievements_catalog';

export const CHAT_BADGE_GPA_PREFIX = 'gpa:';
export const CHAT_BADGE_ASC_PREFIX = 'asc:';

const ASCENSION_TIER_I18N: Record<string, string> = {
  paragon: 'game.endgame.titleParagon',
  warlord: 'game.endgame.titleWarlord',
  veteran: 'game.endgame.titleVeteran',
  ascendant: 'game.endgame.titleAscendant',
};

const ASCENSION_BADGE_COLOR = '#c084fc';

function tLocal(key: string): string {
  if (typeof window.t !== 'function') return key;
  const s = window.t(key);
  return s !== key ? s : key;
}

function gameplayTitleText(titleId: string): string {
  const k = 'game.gameplayAchievements.titles.' + titleId;
  const s = tLocal(k);
  return s !== k ? s : titleId;
}

function gameplayTitleColor(titleId: string): string {
  const meta = getGameplayTitleMeta(titleId);
  if (!meta) return ASCENSION_BADGE_COLOR;
  if (typeof window.getGradeColor === 'function') {
    return window.getGradeColor(meta.grade) || ASCENSION_BADGE_COLOR;
  }
  return ASCENSION_BADGE_COLOR;
}

export function renownToAscensionPayload(renown: number): string {
  const r = Math.max(0, Math.floor(Number(renown) || 0));
  if (r >= 200) return CHAT_BADGE_ASC_PREFIX + 'paragon';
  if (r >= 100) return CHAT_BADGE_ASC_PREFIX + 'warlord';
  if (r >= 40) return CHAT_BADGE_ASC_PREFIX + 'veteran';
  return CHAT_BADGE_ASC_PREFIX + 'ascendant';
}

/** Payload to persist in chat history / cloud `ascension_title` (not localized text). */
export function buildChatTitlePayload(): string {
  if (typeof window.getEquippedChatTitlePayload === 'function') {
    const gpa = window.getEquippedChatTitlePayload().trim();
    if (gpa) return gpa;
  }
  const renown = Math.floor(Number(window.endgameData?.renown) || 0);
  return renownToAscensionPayload(renown);
}

export interface ChatTitleBadgeResolved {
  text: string;
  color: string;
}

/** Resolve stored payload or legacy plain text for the active UI locale. */
export function resolveChatTitleBadge(stored: string | null | undefined): ChatTitleBadgeResolved | null {
  const raw = String(stored == null ? '' : stored).trim();
  if (!raw) return null;

  if (raw.startsWith(CHAT_BADGE_GPA_PREFIX)) {
    const titleId = raw.slice(CHAT_BADGE_GPA_PREFIX.length).trim();
    if (!titleId || !getGameplayTitleMeta(titleId)) return null;
    return { text: gameplayTitleText(titleId), color: gameplayTitleColor(titleId) };
  }

  if (raw.startsWith(CHAT_BADGE_ASC_PREFIX)) {
    const tier = raw.slice(CHAT_BADGE_ASC_PREFIX.length).trim().toLowerCase();
    const i18nKey = ASCENSION_TIER_I18N[tier];
    if (!i18nKey) return { text: raw, color: ASCENSION_BADGE_COLOR };
    return { text: tLocal(i18nKey), color: ASCENSION_BADGE_COLOR };
  }

  if (getGameplayTitleMeta(raw)) {
    return { text: gameplayTitleText(raw), color: gameplayTitleColor(raw) };
  }

  return { text: raw, color: ASCENSION_BADGE_COLOR };
}

export {};
