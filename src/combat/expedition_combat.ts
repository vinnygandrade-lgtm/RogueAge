/**
 * Expedition combat helpers.
 * Casting Speed stays uncapped for skill fantasy; Attack Speed uses a looser soft-floor
 * so late-run AA cannot obsolete skills (depth ~40 machine-gun problem).
 */

export function isExpeditionRunEffectsActive(): boolean {
  const eng = window.ExpeditionEngine as
    | {
        isRunEffectsActive?: () => boolean;
        state?: { active?: boolean; suspended?: boolean };
      }
    | undefined;
  if (!eng) return false;
  if (typeof eng.isRunEffectsActive === 'function') {
    return !!eng.isRunEffectsActive();
  }
  return !!(eng.state?.active && !eng.state?.suspended);
}

/** Soft line — full atk-interval gains above this start to diminish (ms). */
export const EXPEDITION_ATK_SPEED_SOFT_MS = 200;
/** Hard floor — auto-attack never faster than this in expedition (ms). */
export const EXPEDITION_ATK_SPEED_HARD_MS = 120;
/** Curve scale for the soft → hard approach. */
export const EXPEDITION_ATK_SPEED_SOFT_SCALE = 100;

/**
 * Absolute sanity floor (only if soft-floor helper is unavailable).
 * Prefer applyExpeditionAtkSpeedFloor.
 */
export const EXPEDITION_ATK_SPEED_ABS_MIN_MS = EXPEDITION_ATK_SPEED_HARD_MS;

/** Cast lock floor during expedition (world keeps MIN_CAST_MS = 375). */
export const EXPEDITION_MIN_CAST_MS = 80;

/** Attack wind-up floor during expedition (world keeps 180). */
export const EXPEDITION_MIN_ATTACK_WINDUP_MS = 80;

/** Full atkSpeedPct value up to this; past it, soft gains toward HARD. */
export const EXPEDITION_ATK_SPEED_PCT_SOFT = 40;
/** Effective atkSpeedPct asymptote from run cards (Clarim / upgrades). */
export const EXPEDITION_ATK_SPEED_PCT_HARD = 65;
export const EXPEDITION_ATK_SPEED_PCT_SCALE = 22;

function softPercentCap(value: number, soft: number, hard: number, scale: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= soft) return Math.floor(n);
  const over = n - soft;
  const gained = (hard - soft) * (1 - Math.exp(-over / Math.max(1, scale)));
  return Math.min(hard, Math.floor(soft + gained));
}

/**
 * Soften stacked run atkSpeedPct so depth-40 card piles don't linear-delete swing time.
 * +8% Clarim Tempo still feels good early; late stacks taper.
 */
export function softenExpeditionAtkSpeedPct(rawPct: number): number {
  return softPercentCap(
    rawPct,
    EXPEDITION_ATK_SPEED_PCT_SOFT,
    EXPEDITION_ATK_SPEED_PCT_HARD,
    EXPEDITION_ATK_SPEED_PCT_SCALE,
  );
}

/**
 * Soft-floor attack interval in expedition (faster than world 280→160, but not 50ms).
 */
export function applyExpeditionAtkSpeedFloor(valueMs: number): number {
  const soft = EXPEDITION_ATK_SPEED_SOFT_MS;
  const hard = EXPEDITION_ATK_SPEED_HARD_MS;
  const scale = EXPEDITION_ATK_SPEED_SOFT_SCALE;
  const n = Number(valueMs);
  if (!Number.isFinite(n)) return soft;
  if (n >= soft) return Math.floor(n);
  const over = soft - n;
  const gained = (soft - hard) * (1 - Math.exp(-over / scale));
  return Math.max(hard, Math.floor(soft - gained));
}

window.isExpeditionRunEffectsActive = isExpeditionRunEffectsActive;
window.applyExpeditionAtkSpeedFloor = applyExpeditionAtkSpeedFloor;
window.softenExpeditionAtkSpeedPct = softenExpeditionAtkSpeedPct;
window.EXPEDITION_ATK_SPEED_ABS_MIN_MS = EXPEDITION_ATK_SPEED_ABS_MIN_MS;
window.EXPEDITION_ATK_SPEED_HARD_MS = EXPEDITION_ATK_SPEED_HARD_MS;
window.EXPEDITION_MIN_CAST_MS = EXPEDITION_MIN_CAST_MS;

export {};
