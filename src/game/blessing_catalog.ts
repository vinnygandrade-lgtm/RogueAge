/**
 * Grand Master Blessing Build — modular long buffs (choose 3).
 * Names/ids are RogueAge-original; values tuned so 3 ≈ former Fighter/Mage packs.
 *
 * Icons: drop 256×256 PNG at assets/blessings/<id>.png — see assets/blessings/README.md.
 */

export const BLESSING_SLOT_COUNT = 3;
export const BLESSING_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
export const BLESSING_ICON_DIR = 'assets/blessings';

export type BlessingId =
  | 'might'
  | 'empower'
  | 'shield'
  | 'magic_barrier'
  | 'focus'
  | 'haste'
  | 'acumen'
  | 'guidance'
  | 'vitality'
  | 'clarity';

/** UI grouping for a clearer pick list. */
export type BlessingGroup = 'offense' | 'defense' | 'tempo' | 'sustain';

export interface BlessingEffects {
  pAtkMult?: number;
  mAtkMult?: number;
  pDefMult?: number;
  mDefMult?: number;
  maxHpMult?: number;
  maxMpMult?: number;
  /** Additive Crit % investment (soft-capped later). */
  critAdd?: number;
  /** Additive Casting Speed % investment. */
  castAdd?: number;
  /** Additive Evasion % investment. */
  dodgeAdd?: number;
  /** Multiplies attack interval ms (< 1 = faster). */
  atkSpeedMult?: number;
}

export interface BlessingDef {
  id: BlessingId;
  group: BlessingGroup;
  /** i18n: game.blessingBuild.catalog.<id>.name */
  nameKey: string;
  /** i18n: game.blessingBuild.catalog.<id>.desc */
  descKey: string;
  color: string;
  /** Glyph fallback until assets/blessings/<id>.png exists. */
  glyph: string;
  effects: BlessingEffects;
}

export const BLESSING_GROUP_ORDER: BlessingGroup[] = [
  'offense',
  'defense',
  'tempo',
  'sustain',
];

/** Tunable in one place. */
export const BLESSING_CATALOG: BlessingDef[] = [
  {
    id: 'might',
    group: 'offense',
    nameKey: 'game.blessingBuild.catalog.might.name',
    descKey: 'game.blessingBuild.catalog.might.desc',
    color: '#f87171',
    glyph: '⚔',
    effects: { pAtkMult: 1.12 },
  },
  {
    id: 'empower',
    group: 'offense',
    nameKey: 'game.blessingBuild.catalog.empower.name',
    descKey: 'game.blessingBuild.catalog.empower.desc',
    color: '#60a5fa',
    glyph: '✦',
    effects: { mAtkMult: 1.15 },
  },
  {
    id: 'focus',
    group: 'offense',
    nameKey: 'game.blessingBuild.catalog.focus.name',
    descKey: 'game.blessingBuild.catalog.focus.desc',
    color: '#fb7185',
    glyph: '◎',
    effects: { critAdd: 6 },
  },
  {
    id: 'shield',
    group: 'defense',
    nameKey: 'game.blessingBuild.catalog.shield.name',
    descKey: 'game.blessingBuild.catalog.shield.desc',
    color: '#fbbf24',
    glyph: '🛡',
    effects: { pDefMult: 1.12 },
  },
  {
    id: 'magic_barrier',
    group: 'defense',
    nameKey: 'game.blessingBuild.catalog.magic_barrier.name',
    descKey: 'game.blessingBuild.catalog.magic_barrier.desc',
    color: '#c084fc',
    glyph: '◇',
    effects: { mDefMult: 1.12 },
  },
  {
    id: 'guidance',
    group: 'defense',
    nameKey: 'game.blessingBuild.catalog.guidance.name',
    descKey: 'game.blessingBuild.catalog.guidance.desc',
    color: '#6ee7b7',
    glyph: '↻',
    effects: { dodgeAdd: 4 },
  },
  {
    id: 'haste',
    group: 'tempo',
    nameKey: 'game.blessingBuild.catalog.haste.name',
    descKey: 'game.blessingBuild.catalog.haste.desc',
    color: '#34d399',
    glyph: '»',
    effects: { atkSpeedMult: 0.88 },
  },
  {
    id: 'acumen',
    group: 'tempo',
    nameKey: 'game.blessingBuild.catalog.acumen.name',
    descKey: 'game.blessingBuild.catalog.acumen.desc',
    color: '#a78bfa',
    glyph: '☿',
    effects: { castAdd: 8 },
  },
  {
    id: 'vitality',
    group: 'sustain',
    nameKey: 'game.blessingBuild.catalog.vitality.name',
    descKey: 'game.blessingBuild.catalog.vitality.desc',
    color: '#4ade80',
    glyph: '♥',
    effects: { maxHpMult: 1.1 },
  },
  {
    id: 'clarity',
    group: 'sustain',
    nameKey: 'game.blessingBuild.catalog.clarity.name',
    descKey: 'game.blessingBuild.catalog.clarity.desc',
    color: '#38bdf8',
    glyph: '◆',
    effects: { maxMpMult: 1.12 },
  },
];

const BY_ID: Record<string, BlessingDef> = Object.fromEntries(
  BLESSING_CATALOG.map((b) => [b.id, b]),
);

export function getBlessingDef(id: string): BlessingDef | null {
  return BY_ID[id] || null;
}

export function isBlessingId(id: unknown): id is BlessingId {
  return typeof id === 'string' && !!BY_ID[id];
}

/** Canonical art path — drop PNG here when ready (256×256). */
export function getBlessingIconSrc(id: string): string {
  return `${BLESSING_ICON_DIR}/${id}.png`;
}

export function blessingsByGroup(group: BlessingGroup): BlessingDef[] {
  return BLESSING_CATALOG.filter((b) => b.group === group);
}

export interface ComposedBlessingEffects {
  pAtkMult: number;
  mAtkMult: number;
  pDefMult: number;
  mDefMult: number;
  maxHpMult: number;
  maxMpMult: number;
  critAdd: number;
  castAdd: number;
  dodgeAdd: number;
  atkSpeedMult: number;
  ids: BlessingId[];
}

export function composeBlessingEffects(ids: string[]): ComposedBlessingEffects {
  const out: ComposedBlessingEffects = {
    pAtkMult: 1,
    mAtkMult: 1,
    pDefMult: 1,
    mDefMult: 1,
    maxHpMult: 1,
    maxMpMult: 1,
    critAdd: 0,
    castAdd: 0,
    dodgeAdd: 0,
    atkSpeedMult: 1,
    ids: [],
  };
  const seen = new Set<string>();
  for (const raw of ids) {
    if (!isBlessingId(raw) || seen.has(raw)) continue;
    seen.add(raw);
    const def = getBlessingDef(raw);
    if (!def) continue;
    out.ids.push(raw);
    const e = def.effects;
    if (e.pAtkMult) out.pAtkMult *= e.pAtkMult;
    if (e.mAtkMult) out.mAtkMult *= e.mAtkMult;
    if (e.pDefMult) out.pDefMult *= e.pDefMult;
    if (e.mDefMult) out.mDefMult *= e.mDefMult;
    if (e.maxHpMult) out.maxHpMult *= e.maxHpMult;
    if (e.maxMpMult) out.maxMpMult *= e.maxMpMult;
    if (e.critAdd) out.critAdd += e.critAdd;
    if (e.castAdd) out.castAdd += e.castAdd;
    if (e.dodgeAdd) out.dodgeAdd += e.dodgeAdd;
    if (e.atkSpeedMult) out.atkSpeedMult *= e.atkSpeedMult;
  }
  return out;
}

window.BLESSING_CATALOG = BLESSING_CATALOG;
window.BLESSING_SLOT_COUNT = BLESSING_SLOT_COUNT;
window.BLESSING_DURATION_MS = BLESSING_DURATION_MS;
window.BLESSING_ICON_DIR = BLESSING_ICON_DIR;
window.getBlessingDef = getBlessingDef;
window.getBlessingIconSrc = getBlessingIconSrc;
window.composeBlessingEffects = composeBlessingEffects;

export {};
