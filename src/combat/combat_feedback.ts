/**
 * Scoped combat impact feedback — flash + optional shake on combat layers only.
 */

import { registerGlobal } from '../runtime/register-global';

export type CombatImpactTone = 'damage' | 'crit' | 'deal';
export type CombatImpactSeverity = 'light' | 'medium' | 'heavy';

const shakeCooldown = new Map<string, number>();
const SHAKE_COOLDOWN_MS = 320;

function prefersReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function appendFlash(root: HTMLElement, tone: CombatImpactTone): void {
  const flash = document.createElement('div');
  flash.className = `combat-hit-flash combat-hit-flash--${tone}`;
  flash.setAttribute('aria-hidden', 'true');
  root.appendChild(flash);
  const cleanup = () => {
    if (flash.parentElement) flash.remove();
  };
  flash.addEventListener('animationend', cleanup, { once: true });
  setTimeout(cleanup, 550);
}

export function severityFromDamageRatio(ratio: number): CombatImpactSeverity {
  if (ratio >= 0.2) return 'heavy';
  if (ratio >= 0.1) return 'medium';
  return 'light';
}

export function triggerCombatImpact(options: {
  rootId: string;
  tone?: CombatImpactTone;
  severity?: CombatImpactSeverity;
  shake?: boolean;
}): void {
  const { rootId, tone = 'damage', severity = 'light', shake = false } = options;
  const root = document.getElementById(rootId);
  if (!root) return;

  appendFlash(root, tone);

  if (!shake || prefersReducedMotion()) return;

  const now = Date.now();
  if (now - (shakeCooldown.get(rootId) || 0) < SHAKE_COOLDOWN_MS) return;
  shakeCooldown.set(rootId, now);

  const cls = severity === 'heavy'
    ? 'combat-shake--heavy'
    : severity === 'medium'
      ? 'combat-shake--medium'
      : 'combat-shake--light';
  root.classList.remove('combat-shake--light', 'combat-shake--medium', 'combat-shake--heavy');
  void root.offsetWidth;
  root.classList.add(cls);
  const onEnd = () => root.classList.remove(cls);
  root.addEventListener('animationend', onEnd, { once: true });
  setTimeout(onEnd, 480);
}

export function pulseCombatCard(cardId: string, tone: 'damage' | 'heal' = 'damage'): void {
  const el = document.getElementById(cardId);
  if (!el) return;
  const cls = tone === 'heal' ? 'combat-card-pulse--heal' : 'combat-card-pulse--damage';
  el.classList.remove('combat-card-pulse--damage', 'combat-card-pulse--heal');
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

const CombatFeedbackApi = {
  triggerCombatImpact,
  pulseCombatCard,
  severityFromDamageRatio,
};

registerGlobal('CombatFeedback', CombatFeedbackApi);

export default CombatFeedbackApi;
