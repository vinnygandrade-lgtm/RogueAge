/**
 * Lifetime gameplay achievements — tiers map to item grades (NG → S).
 * Each tier unlocks a chat title when claimed.
 */

export type GameplayAchievementGrade = 'No-Grade' | 'D' | 'C' | 'B' | 'A' | 'S';

export const GAMEPLAY_ACH_GRADE_ORDER: readonly GameplayAchievementGrade[] = [
  'No-Grade', 'D', 'C', 'B', 'A', 'S',
] as const;

export interface GameplayAchievementTierDef {
  grade: GameplayAchievementGrade;
  threshold: number;
  titleId: string;
}

export interface GameplayAchievementDef {
  id: string;
  stat: string;
  icon: string;
  tiers: GameplayAchievementTierDef[];
}

function tiers(
  id: string,
  stat: string,
  icon: string,
  thresholds: [number, number, number, number, number, number],
): GameplayAchievementDef {
  const grades = GAMEPLAY_ACH_GRADE_ORDER;
  return {
    id,
    stat,
    icon,
    tiers: grades.map((grade, i) => ({
      grade,
      threshold: thresholds[i],
      titleId: `${id}_${grade === 'No-Grade' ? 'ng' : grade.toLowerCase()}`,
    })),
  };
}

/** Authoritative catalog — thresholds tuned for long-term chase; claim each tier to unlock the next. */
export const GAMEPLAY_ACHIEVEMENTS_CATALOG: readonly GameplayAchievementDef[] = [
  tiers('mob_slayer', 'matar_monstros', '⚔️', [200, 2_500, 25_000, 200_000, 1_000_000, 5_000_000]),
  tiers('champion_bane', 'matar_champions', '👑', [10, 75, 350, 1_500, 6_000, 15_000]),
  tiers('adena_magnate', 'ganhar_adena', '💰', [50_000, 500_000, 5_000_000, 50_000_000, 250_000_000, 1_000_000_000]),
  tiers('coin_hoarder', 'coletar_coins', '🪙', [15, 75, 350, 1_500, 5_000, 25_000]),
  tiers('enchant_seeker', 'tentar_enchant', '✨', [25, 150, 750, 3_500, 10_000, 25_000]),
  tiers('forge_hand', 'craft_item', '🔨', [15, 75, 350, 1_500, 5_000, 15_000]),
  tiers('skill_weaver', 'usar_skills', '🌀', [200, 2_500, 25_000, 150_000, 750_000, 3_000_000]),
  tiers('arena_legend', 'vencer_olympiad', '🏛️', [3, 25, 100, 400, 1_000, 2_500]),
  tiers('arena_reaper', 'matar_olympiad', '🗡️', [10, 75, 300, 1_200, 3_000, 7_500]),
  tiers('boss_breaker', 'derrotar_daily_boss', '🐉', [3, 25, 100, 300, 600, 1_200]),
  tiers('battle_alchemist', 'usar_pocoes', '🧪', [100, 1_000, 10_000, 50_000, 250_000, 1_000_000]),
  tiers('mint_scholar', 'tentar_mint', '📜', [5, 25, 100, 500, 1_500, 5_000]),
  tiers('elite_nemesis', 'elite_champion_kill', '💀', [3, 25, 100, 300, 800, 2_000]),
  tiers('pathfinder', 'expedition_complete', '🗺️', [2, 12, 50, 200, 600, 1_500]),
  tiers('enchant_master', 'enchant_success', '💎', [5, 40, 200, 900, 3_500, 10_000]),
  tiers('rune_binder', 'augment_weapon', '🔮', [2, 12, 50, 200, 600, 1_500]),
  tiers('exchange_mogul', 'market_trade', '🏪', [1, 8, 40, 150, 500, 1_200]),
  tiers('war_banner', 'clan_war_win', '🎌', [1, 3, 8, 20, 50, 100]),
  tiers('level_climber', 'subir_nivel', '📈', [5, 25, 100, 300, 750, 1_500]),
  tiers('spoils_hunter', 'spoil_kill', '⛏️', [30, 250, 2_000, 12_000, 60_000, 200_000]),
  tiers('postmaster', 'resgatar_correio', '📬', [3, 20, 100, 400, 1_200, 4_000]),
  tiers('deep_march', 'expedition_journey', '🌲', [15, 100, 500, 2_500, 10_000, 30_000]),
  tiers('mission_ace', 'missao_resgatada', '🎯', [5, 25, 100, 350, 800, 2_000]),
  tiers('duelist_spirit', 'olympiad_duel', '⚔️', [5, 40, 200, 800, 2_000, 5_000]),
  tiers('world_raider', 'derrotar_raid_mundo', '🐲', [1, 5, 20, 60, 150, 350]),
] as const;

const catalogById = new Map<string, GameplayAchievementDef>();
const titleMeta = new Map<string, { achievementId: string; grade: GameplayAchievementGrade }>();

GAMEPLAY_ACHIEVEMENTS_CATALOG.forEach((def) => {
  catalogById.set(def.id, def);
  def.tiers.forEach((tier) => {
    titleMeta.set(tier.titleId, { achievementId: def.id, grade: tier.grade });
  });
});

export function getGameplayAchievementDef(id: string): GameplayAchievementDef | null {
  return catalogById.get(id) || null;
}

export function getGameplayTitleMeta(titleId: string): { achievementId: string; grade: GameplayAchievementGrade } | null {
  return titleMeta.get(titleId) || null;
}

export function getAllGameplayTitleIds(): string[] {
  return Array.from(titleMeta.keys());
}

export {};
