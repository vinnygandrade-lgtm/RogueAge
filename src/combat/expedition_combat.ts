/**
 * Expedition combat helpers.
 * Speed scaling is balanced via card / Clarim values — no soft-cap on Attack Speed.
 * Only tiny timer floors keep setTimeout / cast bars sane.
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

/** Absolute floor so swing timers never hit 0 ms. */
export const EXPEDITION_ATK_SPEED_ABS_MIN_MS = 50;

/** Cast lock floor during expedition (world keeps MIN_CAST_MS = 375). */
export const EXPEDITION_MIN_CAST_MS = 80;

/** Attack wind-up floor during expedition (world keeps 180). */
export const EXPEDITION_MIN_ATTACK_WINDUP_MS = 40;

window.isExpeditionRunEffectsActive = isExpeditionRunEffectsActive;
window.EXPEDITION_ATK_SPEED_ABS_MIN_MS = EXPEDITION_ATK_SPEED_ABS_MIN_MS;
window.EXPEDITION_MIN_CAST_MS = EXPEDITION_MIN_CAST_MS;

export {};
