/**
 * Expedition combat helpers — uncapped attack/cast speed while a run is active.
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

/** Absolute floor so timers never hit 0 ms (loop / setTimeout sanity). */
export const EXPEDITION_ATK_SPEED_ABS_MIN_MS = 50;

/** Cast lock floor during expedition (world keeps MIN_CAST_MS = 375). */
export const EXPEDITION_MIN_CAST_MS = 80;

/** Attack wind-up floor during expedition (world keeps 180). */
export const EXPEDITION_MIN_ATTACK_WINDUP_MS = 40;

window.isExpeditionRunEffectsActive = isExpeditionRunEffectsActive;
window.EXPEDITION_ATK_SPEED_ABS_MIN_MS = EXPEDITION_ATK_SPEED_ABS_MIN_MS;
window.EXPEDITION_MIN_CAST_MS = EXPEDITION_MIN_CAST_MS;

export {};
