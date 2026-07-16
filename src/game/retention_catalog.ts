/**
 * Retention hub — reward tables, journey steps, weapon choices (novice day 7).
 */
import type { DailyMissionReward, RetentionWeaponChoice } from '../types/game';

export const RETENTION_NEWBIE_DAYS = 7;
export const RETENTION_MONTHLY_DAYS = 28;
export const RETENTION_JOURNEY_STEP_COUNT = 10;

/** Day-7 weapon pick: four D-grade styles at +4 enchant. */
export const RETENTION_DAY7_WEAPONS: RetentionWeaponChoice[] = [
  { id: 'wpn_d_heavy_sword', styleKey: 'sword' },
  { id: 'wpn_d_stiletto', styleKey: 'dagger' },
  { id: 'wpn_d_hunters_bow', styleKey: 'bow' },
  { id: 'wpn_d_wizard_staff', styleKey: 'staff' },
];

export const RETENTION_DAY7_ENCHANT = 4;

export interface RetentionJourneyStepDef {
  step: number;
  event: string;
  target: number;
  titleKey: string;
  descKey: string;
  hintKey: string;
  reward: DailyMissionReward;
}

export const RETENTION_JOURNEY_STEP_DEFS: RetentionJourneyStepDef[] = [
  {
    step: 1,
    event: 'matar_monstros',
    target: 5,
    titleKey: 'game.retention.journey.s1.title',
    descKey: 'game.retention.journey.s1.desc',
    hintKey: 'game.retention.journey.s1.hint',
    reward: { adenas: 1200, itens: { 'HP Potion': 10, 'Mana Potion': 5 } },
  },
  {
    step: 2,
    event: 'matar_champions',
    target: 1,
    titleKey: 'game.retention.journey.s2.title',
    descKey: 'game.retention.journey.s2.desc',
    hintKey: 'game.retention.journey.s2.hint',
    reward: { adenas: 2500, itens: { 'Enchant Weapon (NG)': 2 } },
  },
  {
    step: 3,
    event: 'tentar_enchant',
    target: 1,
    titleKey: 'game.retention.journey.s3.title',
    descKey: 'game.retention.journey.s3.desc',
    hintKey: 'game.retention.journey.s3.hint',
    reward: {
      adenas: 1500,
      itens: {
        'Blessed Enchant Weapon (NG)': 3,
        'Blessed Enchant Armor (NG)': 2,
      },
    },
  },
  {
    step: 4,
    event: 'expedition_complete',
    target: 1,
    titleKey: 'game.retention.journey.s4.title',
    descKey: 'game.retention.journey.s4.desc',
    hintKey: 'game.retention.journey.s4.hint',
    reward: { adenas: 4000, ancientCoins: 1, itens: { 'HP Potion': 15 } },
  },
  {
    step: 5,
    event: 'derrotar_daily_boss',
    target: 1,
    titleKey: 'game.retention.journey.s5.title',
    descKey: 'game.retention.journey.s5.desc',
    hintKey: 'game.retention.journey.s5.hint',
    reward: { adenas: 5000, itens: { 'Enchant Armor (D)': 1, 'Mana Potion': 10 } },
  },
  {
    step: 6,
    event: 'matar_olympiad',
    target: 1,
    titleKey: 'game.retention.journey.s6.title',
    descKey: 'game.retention.journey.s6.desc',
    hintKey: 'game.retention.journey.s6.hint',
    reward: { adenas: 3500, itens: { 'Soulshot (D)': 50 } },
  },
  {
    step: 7,
    event: 'abrir_market',
    target: 1,
    titleKey: 'game.retention.journey.s7.title',
    descKey: 'game.retention.journey.s7.desc',
    hintKey: 'game.retention.journey.s7.hint',
    reward: { adenas: 2000, itens: { 'HP Potion': 8 } },
  },
  {
    step: 8,
    event: 'entrar_clan',
    target: 1,
    titleKey: 'game.retention.journey.s8.title',
    descKey: 'game.retention.journey.s8.desc',
    hintKey: 'game.retention.journey.s8.hint',
    reward: { adenas: 6000, ancientCoins: 2 },
  },
  {
    step: 9,
    event: 'craft_item',
    target: 1,
    titleKey: 'game.retention.journey.s9.title',
    descKey: 'game.retention.journey.s9.desc',
    hintKey: 'game.retention.journey.s9.hint',
    reward: { adenas: 4500, itens: { 'Enchant Weapon (D)': 1 } },
  },
  {
    step: 10,
    event: 'reach_level',
    target: 10,
    titleKey: 'game.retention.journey.s10.title',
    descKey: 'game.retention.journey.s10.desc',
    hintKey: 'game.retention.journey.s10.hint',
    reward: { adenas: 10000, ancientCoins: 3, itens: { 'Blessed Enchant Weapon (D)': 1 } },
  },
];

/** Maps mission events → journey step completion checks. */
export const RETENTION_EVENT_ALIASES: Record<string, string> = {
  matar_pack: 'matar_monstros',
  vencer_olympiad: 'matar_olympiad',
};

export function retentionNewbieReward(day: number): DailyMissionReward | null {
  switch (day) {
    case 1:
      return { adenas: 1500, itens: { 'HP Potion': 15, 'Mana Potion': 8 } };
    case 2:
      return {
        adenas: 2000,
        itens: {
          'Blessed Enchant Weapon (NG)': 3,
          'Blessed Enchant Armor (NG)': 2,
        },
      };
    case 3:
      return { adenas: 3500, itens: { 'Soulshot (NG)': 100, 'HP Potion': 10 } };
    case 4:
      return { adenas: 4000, ancientCoins: 1, itens: { 'Enchant Weapon (NG)': 2 } };
    case 5:
      return { adenas: 5000, itens: { 'Enchant Armor (D)': 2, 'Mana Potion': 12 } };
    case 6:
      return { adenas: 7500, ancientCoins: 2, itens: { 'Enchant Weapon (D)': 1 } };
    case 7:
      return { adenas: 10000, ancientCoins: 3 };
    default:
      return null;
  }
}

export function retentionMonthlyReward(day: number): DailyMissionReward {
  const d = Math.max(1, Math.min(RETENTION_MONTHLY_DAYS, Math.floor(day)));
  if (d % 7 === 0) {
    const tier = d / 7;
    return {
      adenas: Math.floor(8000 + tier * 6000),
      ancientCoins: tier >= 3 ? 2 : 1,
      itens: {
        [`Blessed Enchant Weapon (${tier >= 3 ? 'C' : tier >= 2 ? 'D' : 'NG'})`]: 1,
        [`Blessed Enchant Armor (${tier >= 3 ? 'C' : tier >= 2 ? 'D' : 'NG'})`]: 1,
        'HP Potion': 10 + tier * 4,
      },
    };
  }
  if (d % 5 === 0) {
    return {
      adenas: Math.floor(3500 + d * 120),
      itens: {
        [`Enchant Weapon (${d >= 20 ? 'C' : d >= 12 ? 'D' : 'NG'})`]: 1,
        'Mana Potion': 8,
      },
    };
  }
  return {
    adenas: Math.floor(1200 + d * 180),
    itens: {
      'HP Potion': 3 + Math.floor(d / 6),
      [`Soulshot (${d >= 18 ? 'C' : d >= 10 ? 'D' : 'NG'})`]: 20 + d * 2,
    },
  };
}
