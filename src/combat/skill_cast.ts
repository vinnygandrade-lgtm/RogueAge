/**
 * Skill cast duration: base castMs (catalog / tipo default) shortened by player castSpeed %.
 * Separate from personal skill CD and from Attack atkSpeed.
 */

import type { SkillCatalogEntry } from '../types/game';

/** Floor so cast never becomes machine-gun instant. */
export const MIN_CAST_MS = 375;

/** Cap on cast-time reduction from castSpeed (%). */
export const MAX_CAST_SPEED_PCT = 40;

/** Fallback when tipo is unknown (legacy fixed GCD feel). */
export const DEFAULT_CAST_MS = 1500;

/**
 * Default castMs by skill `tipo` when catalog omits `castMs`.
 * Light / medium / heavy / utility buckets — easy to rebalance in one place.
 */
export const CAST_MS_BY_TIPO: Record<string, number> = {
  basico: 0,
  ataque: 800,
  debuff: 700,
  utilidade: 550,
  ataque_area: 1400,
  ataque_cura: 1400,
  ataque_dreno: 1400,
  cura: 1400,
  cura_mp: 1400,
  buff_atk: 1600,
  buff_def: 1600,
  buff_spd: 1200,
  ataque_ultimate: 2400,
  pet: 2400,
};

export function getSkillBaseCastMs(
  skill: SkillCatalogEntry | null | undefined,
): number {
  if (!skill) return DEFAULT_CAST_MS;
  const override = Number(skill.castMs);
  if (Number.isFinite(override) && override >= 0) {
    return Math.floor(override);
  }
  const tipo = String(skill.tipo || '');
  if (Object.prototype.hasOwnProperty.call(CAST_MS_BY_TIPO, tipo)) {
    return CAST_MS_BY_TIPO[tipo];
  }
  return DEFAULT_CAST_MS;
}

/** Current player castSpeed % (0–MAX), from playerStats after calc. */
export function getPlayerCastSpeedPct(): number {
  const raw = Number(window.playerStats?.castSpeed);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(MAX_CAST_SPEED_PCT, Math.max(0, Math.floor(raw)));
}

/**
 * Final cast lock duration for a skill.
 * castFinal = clamp(castBase * (1 - castSpeed/100), MIN_CAST, castBase)
 * Attack / basico with 0 base → 0 (no skill cast lock).
 */
export function resolveSkillCastMs(
  skill: SkillCatalogEntry | null | undefined,
  castSpeedPct?: number,
): number {
  const castBase = getSkillBaseCastMs(skill);
  if (castBase <= 0) return 0;

  const pct =
    castSpeedPct != null && Number.isFinite(castSpeedPct)
      ? Math.min(MAX_CAST_SPEED_PCT, Math.max(0, Number(castSpeedPct)))
      : getPlayerCastSpeedPct();

  const reduced = Math.floor(castBase * (1 - pct / 100));
  return Math.max(MIN_CAST_MS, Math.min(castBase, reduced));
}

window.resolveSkillCastMs = resolveSkillCastMs;
window.getSkillBaseCastMs = getSkillBaseCastMs;
window.MIN_CAST_MS = MIN_CAST_MS;
window.MAX_CAST_SPEED_PCT = MAX_CAST_SPEED_PCT;

export {};
