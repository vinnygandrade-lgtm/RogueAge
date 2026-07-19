/**
 * Stat bonuses for equipped Journey chat titles.
 * Each title id maps to a unique bonus derived from achievement theme + grade tier.
 */

import {
  GAMEPLAY_ACH_GRADE_ORDER,
  getGameplayTitleMeta,
  type GameplayAchievementGrade,
} from './gameplay_achievements_catalog';

export type TitleBonusStatKey =
  | 'pAtk'
  | 'mAtk'
  | 'pDef'
  | 'mDef'
  | 'maxHp'
  | 'maxMp'
  | 'critRate'
  | 'atkSpeedMs';

export interface TitleStatBonus {
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  maxHp: number;
  maxMp: number;
  critRate: number;
  /** Positive = faster attack (ms removed from atk speed). */
  atkSpeedMs: number;
}

export interface TitleBonusDisplayLine {
  key: TitleBonusStatKey;
  value: number;
}

const EMPTY_BONUS: TitleStatBonus = {
  pAtk: 0,
  mAtk: 0,
  pDef: 0,
  mDef: 0,
  maxHp: 0,
  maxMp: 0,
  critRate: 0,
  atkSpeedMs: 0,
};

const GRADE_SCALE: Record<GameplayAchievementGrade, number> = {
  'No-Grade': 1,
  D: 1.75,
  C: 2.75,
  B: 4,
  A: 6,
  S: 9.5,
};

/** Base magnitude at NG before grade scaling (primary slot). */
const STAT_PRIMARY_BASE: Record<TitleBonusStatKey, number> = {
  pAtk: 7,
  mAtk: 7,
  pDef: 6,
  mDef: 6,
  maxHp: 70,
  maxMp: 40,
  critRate: 0.9,
  atkSpeedMs: 12,
};

interface AchievementBonusProfile {
  primary: TitleBonusStatKey;
  secondary: TitleBonusStatKey;
  tertiary?: TitleBonusStatKey;
  /** Per-tier stat emphasis tweak (6 entries aligned to grades). */
  tierAccent?: TitleBonusStatKey[];
}

const ACHIEVEMENT_BONUS_PROFILES: Record<string, AchievementBonusProfile> = {
  mob_slayer: { primary: 'pAtk', secondary: 'critRate', tertiary: 'maxHp', tierAccent: ['pAtk', 'critRate', 'pAtk', 'maxHp', 'pAtk', 'critRate'] },
  champion_bane: { primary: 'pAtk', secondary: 'critRate', tertiary: 'pDef', tierAccent: ['pAtk', 'critRate', 'pDef', 'pAtk', 'critRate', 'pDef'] },
  adena_magnate: { primary: 'maxHp', secondary: 'pDef', tertiary: 'pAtk', tierAccent: ['maxHp', 'pDef', 'maxHp', 'pAtk', 'pDef', 'maxHp'] },
  coin_hoarder: { primary: 'mDef', secondary: 'maxMp', tertiary: 'mAtk', tierAccent: ['mDef', 'maxMp', 'mAtk', 'mDef', 'maxMp', 'mDef'] },
  enchant_seeker: { primary: 'mAtk', secondary: 'critRate', tertiary: 'atkSpeedMs', tierAccent: ['mAtk', 'critRate', 'atkSpeedMs', 'mAtk', 'critRate', 'mAtk'] },
  forge_hand: { primary: 'pDef', secondary: 'maxHp', tertiary: 'pAtk', tierAccent: ['pDef', 'maxHp', 'pAtk', 'pDef', 'maxHp', 'pDef'] },
  skill_weaver: { primary: 'mAtk', secondary: 'maxMp', tertiary: 'atkSpeedMs', tierAccent: ['mAtk', 'maxMp', 'atkSpeedMs', 'mAtk', 'maxMp', 'mAtk'] },
  arena_legend: { primary: 'pAtk', secondary: 'pDef', tertiary: 'critRate', tierAccent: ['pAtk', 'pDef', 'critRate', 'pAtk', 'pDef', 'pAtk'] },
  arena_reaper: { primary: 'pAtk', secondary: 'critRate', tertiary: 'atkSpeedMs', tierAccent: ['pAtk', 'critRate', 'atkSpeedMs', 'pAtk', 'critRate', 'pAtk'] },
  boss_breaker: { primary: 'pDef', secondary: 'maxHp', tertiary: 'pAtk', tierAccent: ['pDef', 'maxHp', 'pAtk', 'pDef', 'maxHp', 'pDef'] },
  battle_alchemist: { primary: 'maxHp', secondary: 'maxMp', tertiary: 'mDef', tierAccent: ['maxHp', 'maxMp', 'mDef', 'maxHp', 'maxMp', 'maxHp'] },
  mint_scholar: { primary: 'mAtk', secondary: 'maxMp', tertiary: 'critRate', tierAccent: ['mAtk', 'maxMp', 'critRate', 'mAtk', 'maxMp', 'mAtk'] },
  elite_nemesis: { primary: 'pAtk', secondary: 'mAtk', tertiary: 'critRate', tierAccent: ['pAtk', 'mAtk', 'critRate', 'pAtk', 'mAtk', 'pAtk'] },
  pathfinder: { primary: 'maxHp', secondary: 'atkSpeedMs', tertiary: 'pDef', tierAccent: ['maxHp', 'atkSpeedMs', 'pDef', 'maxHp', 'atkSpeedMs', 'maxHp'] },
  enchant_master: { primary: 'mAtk', secondary: 'critRate', tertiary: 'pAtk', tierAccent: ['mAtk', 'critRate', 'pAtk', 'mAtk', 'critRate', 'mAtk'] },
  rune_binder: { primary: 'mAtk', secondary: 'mDef', tertiary: 'maxMp', tierAccent: ['mAtk', 'mDef', 'maxMp', 'mAtk', 'mDef', 'mAtk'] },
  exchange_mogul: { primary: 'maxHp', secondary: 'pDef', tertiary: 'mDef', tierAccent: ['maxHp', 'pDef', 'mDef', 'maxHp', 'pDef', 'maxHp'] },
  war_banner: { primary: 'pAtk', secondary: 'pDef', tertiary: 'maxHp', tierAccent: ['pAtk', 'pDef', 'maxHp', 'pAtk', 'pDef', 'pAtk'] },
  level_climber: { primary: 'maxHp', secondary: 'maxMp', tertiary: 'pDef', tierAccent: ['maxHp', 'maxMp', 'pDef', 'maxHp', 'maxMp', 'maxHp'] },
  spoils_hunter: { primary: 'critRate', secondary: 'pAtk', tertiary: 'atkSpeedMs', tierAccent: ['critRate', 'pAtk', 'atkSpeedMs', 'critRate', 'pAtk', 'critRate'] },
  postmaster: { primary: 'maxMp', secondary: 'mDef', tertiary: 'maxHp', tierAccent: ['maxMp', 'mDef', 'maxHp', 'maxMp', 'mDef', 'maxMp'] },
  deep_march: { primary: 'maxHp', secondary: 'pDef', tertiary: 'atkSpeedMs', tierAccent: ['maxHp', 'pDef', 'atkSpeedMs', 'maxHp', 'pDef', 'maxHp'] },
  mission_ace: { primary: 'critRate', secondary: 'atkSpeedMs', tertiary: 'pAtk', tierAccent: ['critRate', 'atkSpeedMs', 'pAtk', 'critRate', 'atkSpeedMs', 'critRate'] },
  duelist_spirit: { primary: 'pAtk', secondary: 'atkSpeedMs', tertiary: 'pDef', tierAccent: ['pAtk', 'atkSpeedMs', 'pDef', 'pAtk', 'atkSpeedMs', 'pAtk'] },
  world_raider: { primary: 'pDef', secondary: 'maxHp', tertiary: 'mAtk', tierAccent: ['pDef', 'maxHp', 'mAtk', 'pDef', 'maxHp', 'pDef'] },
};

const DEFAULT_PROFILE: AchievementBonusProfile = {
  primary: 'maxHp',
  secondary: 'pAtk',
  tertiary: 'pDef',
  tierAccent: ['maxHp', 'pAtk', 'pDef', 'maxHp', 'pAtk', 'maxHp'],
};

function roundStat(key: TitleBonusStatKey, value: number): number {
  if (key === 'critRate') return Math.round(value * 10) / 10;
  return Math.max(0, Math.floor(value));
}

function addBonusSlot(
  out: TitleStatBonus,
  key: TitleBonusStatKey,
  amount: number,
): void {
  if (amount <= 0) return;
  const rounded = roundStat(key, amount);
  if (rounded <= 0) return;
  out[key] += rounded;
}

/** Deterministic unique stat bundle for every title id. */
export function getTitleStatBonus(titleId: string): TitleStatBonus {
  const meta = getGameplayTitleMeta(titleId);
  if (!meta) return { ...EMPTY_BONUS };

  const profile = ACHIEVEMENT_BONUS_PROFILES[meta.achievementId] || DEFAULT_PROFILE;
  const tierIdx = Math.max(0, GAMEPLAY_ACH_GRADE_ORDER.indexOf(meta.grade));
  const scale = GRADE_SCALE[meta.grade] || 1;
  const accent = profile.tierAccent?.[tierIdx] || profile.primary;

  const out: TitleStatBonus = { ...EMPTY_BONUS };

  addBonusSlot(out, profile.primary, STAT_PRIMARY_BASE[profile.primary] * scale);
  addBonusSlot(out, profile.secondary, STAT_PRIMARY_BASE[profile.secondary] * scale * 0.42);
  if (tierIdx >= 2 && profile.tertiary) {
    addBonusSlot(out, profile.tertiary, STAT_PRIMARY_BASE[profile.tertiary] * scale * (tierIdx >= 4 ? 0.32 : 0.22));
  }
  if (accent !== profile.primary && accent !== profile.secondary && accent !== profile.tertiary) {
    addBonusSlot(out, accent, STAT_PRIMARY_BASE[accent] * scale * 0.18);
  } else if (accent === profile.primary) {
    addBonusSlot(out, accent, STAT_PRIMARY_BASE[accent] * scale * 0.12);
  }

  // Small id hash so sibling tiers in the same achievement differ slightly.
  let hash = 0;
  for (let i = 0; i < titleId.length; i++) hash = (hash * 31 + titleId.charCodeAt(i)) >>> 0;
  const hashSlot = (['pAtk', 'mAtk', 'pDef', 'mDef', 'maxHp', 'maxMp'] as TitleBonusStatKey[])[hash % 6];
  addBonusSlot(out, hashSlot, (1 + (hash % 5)) * Math.max(1, scale * 0.15));

  return out;
}

export function listTitleBonusLines(bonus: TitleStatBonus): TitleBonusDisplayLine[] {
  const order: TitleBonusStatKey[] = [
    'pAtk', 'mAtk', 'pDef', 'mDef', 'maxHp', 'maxMp', 'critRate', 'atkSpeedMs',
  ];
  const lines: TitleBonusDisplayLine[] = [];
  order.forEach((key) => {
    const value = bonus[key];
    if (value > 0) lines.push({ key, value });
  });
  return lines;
}

export function sumTitleBonusPower(bonus: TitleStatBonus): number {
  return bonus.pAtk + bonus.mAtk + bonus.pDef + bonus.mDef
    + Math.floor(bonus.maxHp / 10) + Math.floor(bonus.maxMp / 8)
    + Math.floor(bonus.critRate * 4) + bonus.atkSpeedMs;
}

export {};
