/**
 * Basic Attack wind-up (short cast before the swing).
 * Faster than skill casts; shorter when atkSpeed is lower (faster classes).
 * Does NOT arm the shared skill GCD — skills can interrupt this wind-up.
 * Expedition: lower wind-up floor so uncapped atkSpeed can feel snappy.
 */

import {
  EXPEDITION_MIN_ATTACK_WINDUP_MS,
  isExpeditionRunEffectsActive,
} from './expedition_combat';

/** Floor so Attack never feels instant (world). */
export const MIN_ATTACK_WINDUP_MS = 180;
/** Cap — always under typical skill MIN_CAST_MS (375). */
export const MAX_ATTACK_WINDUP_MS = 350;
/** Portion of swing period used as wind-up before clamps. */
export const ATTACK_WINDUP_ATKSPEED_RATIO = 0.09;

let windupTimer: ReturnType<typeof setTimeout> | null = null;
let windupEndsAt = 0;
let windupTotalMs = 0;

function nowMs(): number {
  return Date.now();
}

function skillCastBlockingAttack(): boolean {
  if (typeof window.isSkillGcdBlocked === 'function') {
    return window.isSkillGcdBlocked();
  }
  return Date.now() < (Number(window.globalCooldownAtivo) || 0);
}

function publishAttackCastUi(active: boolean): void {
  if (active) {
    window.skillCastUi = {
      name: 'Attack',
      endsAt: windupEndsAt,
      totalMs: Math.max(1, windupTotalMs),
    };
  } else if (window.skillCastUi?.name === 'Attack') {
    window.skillCastUi = { name: null, endsAt: 0, totalMs: 0 };
  }
  try {
    window.kickHotbarCdLoop?.();
  } catch {
    /* ignore */
  }
}

export function resolveAttackWindupMs(atkSpeedMs?: number): number {
  const spdRaw =
    atkSpeedMs != null && Number.isFinite(atkSpeedMs)
      ? Number(atkSpeedMs)
      : Number(window.playerStats?.atkSpeed);
  const spd = Number.isFinite(spdRaw) && spdRaw > 0 ? spdRaw : 3800;
  const raw = Math.floor(spd * ATTACK_WINDUP_ATKSPEED_RATIO);
  const minFloor = isExpeditionRunEffectsActive()
    ? EXPEDITION_MIN_ATTACK_WINDUP_MS
    : MIN_ATTACK_WINDUP_MS;
  return Math.max(minFloor, Math.min(MAX_ATTACK_WINDUP_MS, raw));
}

export function isAttackWindupActive(): boolean {
  return windupTimer != null || windupEndsAt > nowMs();
}

export function getAttackWindupRemainingMs(): number {
  if (!isAttackWindupActive()) return 0;
  return Math.max(0, windupEndsAt - nowMs());
}

export function getAttackWindupTotalMs(): number {
  return isAttackWindupActive() ? Math.max(1, windupTotalMs) : 0;
}

function clearAttackCastVisual(): void {
  try {
    document.querySelector('.hud-avatar-circle')?.classList.remove('is-casting');
    document.body.classList.remove('l2-skill-casting');
    document.getElementById('screen-game')?.classList.remove('is-skill-casting');
  } catch {
    /* ignore */
  }
}

/**
 * When wind-up is cancelled / aborted, the auto-attack loop may have been
 * waiting only on the wind-up callback — nudge it so AA does not stall.
 */
function nudgeAutoAttackLoop(): void {
  if (!window.autoAtaqueAtivo) return;
  try {
    setTimeout(() => {
      if (!window.autoAtaqueAtivo) return;
      if (typeof window.resumeAutoAtaqueLoop === 'function') {
        window.resumeAutoAtaqueLoop();
      }
    }, 16);
  } catch {
    /* ignore */
  }
}

/** Cancel in-flight Attack wind-up (skill cast interrupt, death, leave combat). */
export function cancelAttackWindup(opts?: { preserveCastVisual?: boolean; resumeAuto?: boolean }): void {
  const wasActive = windupTimer != null || windupEndsAt > nowMs();
  if (windupTimer != null) {
    clearTimeout(windupTimer);
    windupTimer = null;
  }
  windupEndsAt = 0;
  windupTotalMs = 0;
  publishAttackCastUi(false);
  // Skill cast start passes preserveCastVisual — glow is re-armed by onSkillCastStarted.
  if (!opts?.preserveCastVisual && !skillCastBlockingAttack()) {
    clearAttackCastVisual();
  }
  // Default: resume AA after interrupt (skill cast). pararAutoAtaque passes resumeAuto:false.
  if (wasActive && opts?.resumeAuto !== false) {
    nudgeAutoAttackLoop();
  }
}

/**
 * Start Attack wind-up; onComplete fires the actual swing.
 * Returns false if already winding, skill-casting, or invalid duration.
 */
export function beginAttackWindup(onComplete: () => void): boolean {
  if (typeof onComplete !== 'function') return false;
  if (isAttackWindupActive()) return false;
  if (skillCastBlockingAttack()) return false;
  if (Number(window.playerHP) <= 0) return false;

  const dur = resolveAttackWindupMs();
  windupTotalMs = dur;
  windupEndsAt = nowMs() + dur;
  publishAttackCastUi(true);

  try {
    // Soft casting glow (same as skills) — optional visual continuity.
    document.querySelector('.hud-avatar-circle')?.classList.add('is-casting');
    document.body.classList.add('l2-skill-casting');
    document.getElementById('screen-game')?.classList.add('is-skill-casting');
  } catch {
    /* ignore */
  }

  windupTimer = setTimeout(() => {
    windupTimer = null;
    windupEndsAt = 0;
    windupTotalMs = 0;
    publishAttackCastUi(false);

    clearAttackCastVisual();

    if (Number(window.playerHP) <= 0) {
      nudgeAutoAttackLoop();
      return;
    }
    // Skill cast started in the same window — do not swing; keep AA alive.
    if (skillCastBlockingAttack()) {
      nudgeAutoAttackLoop();
      return;
    }

    try {
      onComplete();
    } catch (err) {
      console.warn('[attack_windup] swing failed:', err);
      nudgeAutoAttackLoop();
    }
  }, dur);

  return true;
}

window.resolveAttackWindupMs = resolveAttackWindupMs;
window.isAttackWindupActive = isAttackWindupActive;
window.getAttackWindupRemainingMs = getAttackWindupRemainingMs;
window.getAttackWindupTotalMs = getAttackWindupTotalMs;
window.beginAttackWindup = beginAttackWindup;
window.cancelAttackWindup = cancelAttackWindup;
window.MIN_ATTACK_WINDUP_MS = MIN_ATTACK_WINDUP_MS;
window.MAX_ATTACK_WINDUP_MS = MAX_ATTACK_WINDUP_MS;

export {};
