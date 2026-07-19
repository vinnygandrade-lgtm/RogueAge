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

export function retentionMonthlyReward(
  day: number,
  level = 1,
  isMage = false,
): DailyMissionReward {
  const d = Math.max(1, Math.min(RETENTION_MONTHLY_DAYS, Math.floor(day)));
  const lv = Math.max(1, Math.floor(level));
  const band = retentionGradeBandForLevel(lv);
  const levelMult = 1 + Math.sqrt(lv) * 0.12 + Math.floor(lv / 25) * 0.15;
  const shotName = isMage ? `B. Spiritshot (${band})` : `Soulshot (${band})`;

  if (d % 7 === 0) {
    const tier = d / 7;
    const scrollBand = tier >= 3 ? band : tier >= 2 ? (band === 'NG' ? 'D' : band) : 'NG';
    return {
      adenas: Math.floor((8000 + tier * 6000) * levelMult),
      ancientCoins: Math.min(6, tier >= 3 ? 2 + Math.floor(lv / 40) : 1 + Math.floor(lv / 55)),
      itens: {
        [`Blessed Enchant Weapon (${scrollBand})`]: tier >= 4 && lv >= 52 ? 2 : 1,
        [`Blessed Enchant Armor (${scrollBand})`]: 1,
        'HP Potion': 10 + tier * 4 + Math.floor(lv / 15),
        [shotName]: 60 + tier * 40 + lv * 2,
      },
    };
  }
  if (d % 5 === 0) {
    const scrollBand = d >= 20 ? band : d >= 12 ? (band === 'NG' ? 'D' : band) : 'NG';
    const itens: Record<string, number> = {
      [`Enchant Weapon (${scrollBand})`]: 1,
      'Mana Potion': 8 + Math.floor(lv / 12),
      [shotName]: 30 + d * 2,
    };
    if (lv >= 30) itens[`Enchant Armor (${scrollBand})`] = 1;
    return {
      adenas: Math.floor((3500 + d * 120) * levelMult),
      ancientCoins: lv >= 40 && d >= 15 ? 1 : undefined,
      itens,
    };
  }
  const itens: Record<string, number> = {
    'HP Potion': 3 + Math.floor(d / 6) + Math.floor(lv / 20),
    [shotName]: 20 + d * 2 + Math.floor(lv / 5),
  };
  if (d % 3 === 0 && lv >= 20) {
    itens[`Enchant Weapon (${band === 'NG' ? 'D' : band})`] = 1;
  }
  return {
    adenas: Math.floor((1200 + d * 180) * levelMult),
    itens,
  };
}

export type RetentionGradeBand = 'NG' | 'D' | 'C' | 'B' | 'A' | 'S';

export type RetentionComebackTier = 'short' | 'mid' | 'long';

export function retentionGradeBandForLevel(level: number): RetentionGradeBand {
  const lv = Math.max(1, Math.floor(level));
  if (lv >= 76) return 'S';
  if (lv >= 61) return 'A';
  if (lv >= 52) return 'B';
  if (lv >= 40) return 'C';
  if (lv >= 20) return 'D';
  return 'NG';
}

export function retentionComebackTierKey(hoursAway: number): RetentionComebackTier {
  const h = Math.max(0, hoursAway);
  if (h >= 24) return 'long';
  if (h >= 12) return 'mid';
  return 'short';
}

/** Welcome-back chest — scales with absence tier, player level, and grade band. */
export function computeComebackReward(
  hoursAway: number,
  level: number,
  isMage = false,
): DailyMissionReward {
  const hours = Math.min(48, Math.max(4, hoursAway));
  const lv = Math.max(1, Math.floor(level));
  const band = retentionGradeBandForLevel(lv);
  const tier = retentionComebackTierKey(hours);
  const tierMult = tier === 'long' ? 2.4 : tier === 'mid' ? 1.55 : 1;
  const levelMult = 1 + Math.sqrt(lv) * 0.38 + Math.floor(lv / 18) * 0.22;
  const shotName = isMage ? `B. Spiritshot (${band})` : `Soulshot (${band})`;

  const adenaCap = 120000 + lv * 8500;
  const adenas = Math.min(
    adenaCap,
    Math.floor((1800 + hours * 720) * levelMult * tierMult),
  );

  let ancientCoins = 0;
  if (tier === 'long') ancientCoins = 1 + Math.floor(lv / 12) + (lv >= 52 ? 2 : 0);
  else if (tier === 'mid') ancientCoins = lv >= 20 ? 1 + Math.floor(lv / 35) : 0;
  else if (lv >= 40) ancientCoins = 1;

  const itens: Record<string, number> = {
    'HP Potion': Math.min(50, 8 + Math.floor(hours / 2) + Math.floor(lv / 8)),
    'Mana Potion': Math.min(40, 6 + Math.floor(hours / 2.5) + Math.floor(lv / 10)),
    [shotName]: Math.min(600, 35 + Math.floor(hours * 10) + lv * 4),
  };

  const scrollBand = band;
  if (tier === 'short') {
    if (lv >= 15) itens[`Enchant Weapon (${scrollBand === 'NG' ? 'D' : scrollBand})`] = 1;
  } else if (tier === 'mid') {
    itens[`Enchant Weapon (${scrollBand})`] = 1;
    if (lv >= 25) itens[`Enchant Armor (${scrollBand})`] = 1;
    if (lv >= 45) itens[`Blessed Enchant Armor (${scrollBand})`] = 1;
  } else {
    itens[`Blessed Enchant Weapon (${scrollBand})`] = lv >= 61 ? 2 : 1;
    itens[`Blessed Enchant Armor (${scrollBand})`] = 1;
    if (lv >= 40) itens['Life Stone'] = Math.min(4, 1 + Math.floor(lv / 28));
    if (lv >= 52 && tier === 'long') itens.Steel = Math.min(80, 20 + Math.floor(lv / 4));
  }

  // Weekend variety: extra consumables on Sat/Sun.
  const dow = new Date().getDay();
  if (dow === 0 || dow === 6) {
    itens['HP Potion'] = (itens['HP Potion'] || 0) + 5;
    itens[shotName] = (itens[shotName] || 0) + 25;
  }

  Object.keys(itens).forEach((key) => {
    if (!itens[key] || itens[key] <= 0) delete itens[key];
  });

  return {
    adenas,
    ancientCoins: ancientCoins > 0 ? ancientCoins : undefined,
    itens,
  };
}
