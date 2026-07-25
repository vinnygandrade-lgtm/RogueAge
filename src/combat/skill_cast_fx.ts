/**
 * Cast feedback: avatar glow + invalid-cast cancel (silent — no combat SFX).
 */

function skillNeedsCombatTarget(tipo: string | undefined): boolean {
  const t = String(tipo || '');
  return (
    t !== 'cura' &&
    t !== 'cura_mp' &&
    t !== 'buff_spd' &&
    t !== 'buff_def' &&
    t !== 'buff_atk' &&
    t !== 'utilidade' &&
    t !== 'pet'
  );
}

function setCastingVisual(active: boolean): void {
  const circle = document.querySelector('.hud-avatar-circle');
  if (circle) circle.classList.toggle('is-casting', active);
  document.body.classList.toggle('l2-skill-casting', active);
  const game = document.getElementById('screen-game');
  if (game) game.classList.toggle('is-skill-casting', active);
}

/** Called when a skill cast bar starts. */
export function onSkillCastStarted(_skillName: string): void {
  setCastingVisual(true);
  if (typeof window.kickHotbarCdLoop === 'function') window.kickHotbarCdLoop();
  ensureSkillCastWatch();
}

/** Called when cast completes and the effect is about to launch. */
export function onSkillCastReleased(_skillName: string): void {
  setCastingVisual(false);
}

/** Called when cast is cancelled before launch. */
export function onSkillCastCancelled(): void {
  setCastingVisual(false);
}

function inOlympiadArena(): boolean {
  const el = document.getElementById('tela-olympiad-arena');
  return !!(el && el.style.display === 'flex');
}

function inRaidArena(): boolean {
  const el = document.getElementById('tela-raid-arena');
  return !!(el && (el.style.display === 'flex' || el.style.display === 'block'));
}

/**
 * Cancel in-flight cast if the player died, left combat, or lost a required target.
 */
export function maybeCancelInvalidSkillCast(): void {
  const casting =
    typeof window.getSkillGcdCastName === 'function' ? window.getSkillGcdCastName() : null;
  if (!casting || casting === 'Attack') return;

  if (window.playerHP <= 0) {
    window.cancelSkillCast?.();
    return;
  }

  // Left hunting / arenas while casting
  const floresta = document.getElementById('tela-floresta');
  const inForest =
    !!(floresta && (floresta.style.display === 'flex' || floresta.style.display === 'block'));
  if (!inForest && !inOlympiadArena() && !inRaidArena()) {
    window.cancelSkillCast?.();
    return;
  }

  const skill = window.bancoDeSkills?.[casting];
  if (!skill || !skillNeedsCombatTarget(skill.tipo)) return;

  if (inOlympiadArena() || inRaidArena()) return;

  const tIdx =
    typeof window.getForestTargetMobIndex === 'function' ? window.getForestTargetMobIndex() : -1;
  if (tIdx < 0 || !window.monstrosAtivos?.length) {
    window.cancelSkillCast?.();
  }
}

let _castWatchTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCastWatch(delayMs: number): void {
  if (_castWatchTimer != null) clearTimeout(_castWatchTimer);
  _castWatchTimer = setTimeout(() => {
    _castWatchTimer = null;
    try {
      maybeCancelInvalidSkillCast();
    } catch {
      /* ignore */
    }
    const casting =
      typeof window.getSkillGcdCastName === 'function' ? window.getSkillGcdCastName() : null;
    if (casting && casting !== 'Attack') {
      scheduleCastWatch(200);
    }
  }, delayMs);
}

/** Start/refresh invalid-cast watcher only while a cast is in flight. */
export function ensureSkillCastWatch(): void {
  scheduleCastWatch(0);
}

// Keep a slow idle probe so mid-cast state still gets watched if kick was missed.
setInterval(() => {
  try {
    const casting =
      typeof window.getSkillGcdCastName === 'function' ? window.getSkillGcdCastName() : null;
    if (casting && casting !== 'Attack') {
      maybeCancelInvalidSkillCast();
      if (_castWatchTimer == null) scheduleCastWatch(200);
    }
  } catch {
    /* ignore */
  }
}, 1000);

window.onSkillCastStarted = onSkillCastStarted;
window.onSkillCastReleased = onSkillCastReleased;
window.onSkillCastCancelled = onSkillCastCancelled;
window.maybeCancelInvalidSkillCast = maybeCancelInvalidSkillCast;
window.ensureSkillCastWatch = ensureSkillCastWatch;

export {};
