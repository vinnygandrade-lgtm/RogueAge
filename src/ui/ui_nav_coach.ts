/**
 * Dicas leves de onboarding (sem tour guiado). Uma tip por vez.
 *
 * Dois tipos de tip:
 *  - **goal** (world / zone / trail / expedition): aponta o próximo passo até o primeiro combate.
 *    Fechar só silencia na sessão; a tip volta na próxima visita ao ecrã até o marco
 *    (`window.onboardingData.done`) ser atingido. Nunca persiste "seen".
 *  - **flag** (hotbar / consumables / menu / mailbox / missions): uma vez só, persistida em `uiCoachFlags`.
 *
 * Marcos e gatilhos vivem em `src/systems/tutorial_engine.ts` — ver `docs/onboarding-flow.md`.
 */

import type { OnboardingMilestone, UiCoachSave } from '../types/game';

export type BeginnerTipKey =
  | 'world'
  | 'zone'
  | 'trail'
  | 'expedition'
  | 'path'
  | 'hotbar'
  | 'consumables'
  | 'menu'
  | 'mailbox'
  | 'missions';

type TipFlag =
  | 'hotbarTipSeen'
  | 'expeditionTipSeen'
  | 'consumablesTipSeen'
  | 'menuTownSeen'
  | 'mailboxTipSeen'
  | 'missionsTipSeen';

type TipRule =
  | { kind: 'flag'; flag: TipFlag; screen?: string }
  | { kind: 'goal'; milestone: OnboardingMilestone; screen: string };

const TIP_RULE: Record<BeginnerTipKey, TipRule> = {
  world: { kind: 'goal', milestone: 'forest', screen: 'perfil' },
  zone: { kind: 'goal', milestone: 'forest', screen: 'world' },
  trail: { kind: 'goal', milestone: 'forest', screen: 'expedition' },
  expedition: { kind: 'goal', milestone: 'mob_spawn', screen: 'floresta' },
  path: { kind: 'goal', milestone: 'mob_spawn', screen: 'floresta' },
  // Combat-bound flag tips: hide when leaving the forest (not marked seen → return on next spawn/hit).
  hotbar: { kind: 'flag', flag: 'hotbarTipSeen', screen: 'floresta' },
  consumables: { kind: 'flag', flag: 'consumablesTipSeen', screen: 'floresta' },
  menu: { kind: 'flag', flag: 'menuTownSeen' },
  mailbox: { kind: 'flag', flag: 'mailboxTipSeen' },
  missions: { kind: 'flag', flag: 'missionsTipSeen' },
};

const TIP_I18N: Record<BeginnerTipKey, { title: string; body: string }> = {
  world: { title: 'navCoach.worldTitle', body: 'navCoach.worldBody' },
  zone: { title: 'navCoach.zoneTitle', body: 'navCoach.zoneBody' },
  trail: { title: 'navCoach.trailTitle', body: 'navCoach.trailBody' },
  expedition: { title: 'navCoach.expeditionTitle', body: 'navCoach.expeditionBody' },
  path: { title: 'navCoach.pathTitle', body: 'navCoach.pathBody' },
  hotbar: { title: 'navCoach.hotbarTitle', body: 'navCoach.hotbarBody' },
  consumables: { title: 'navCoach.consumablesTitle', body: 'navCoach.consumablesBody' },
  menu: { title: 'navCoach.menuTownTitle', body: 'navCoach.menuTownBody' },
  mailbox: { title: 'navCoach.mailboxTitle', body: 'navCoach.mailboxBody' },
  missions: { title: 'navCoach.missionsTitle', body: 'navCoach.missionsBody' },
};

let activeTip: BeginnerTipKey | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
/** Goal tips closed by the player this session — do not nag again until the screen is re-entered. */
const snoozedGoalTips = new Set<BeginnerTipKey>();

function tt(key: string): string {
  return typeof window.t === 'function' ? window.t(key) : key;
}

function defaultUiCoachFlags(): UiCoachSave {
  return {
    menuTownSeen: false,
    mailboxTipSeen: false,
    missionsTipSeen: false,
    hotbarTipSeen: false,
    expeditionTipSeen: false,
        consumablesTipSeen: false,
        plazaNpcTipSeen: false,
  };
}

function ensureUiCoachFlags(): UiCoachSave {
  if (!window.uiCoachFlags || typeof window.uiCoachFlags !== 'object') {
    window.uiCoachFlags = defaultUiCoachFlags();
  }
  const f = window.uiCoachFlags;
  if (typeof f.menuTownSeen !== 'boolean') f.menuTownSeen = false;
  if (typeof f.mailboxTipSeen !== 'boolean') f.mailboxTipSeen = false;
  if (typeof f.missionsTipSeen !== 'boolean') f.missionsTipSeen = false;
  if (typeof f.hotbarTipSeen !== 'boolean') f.hotbarTipSeen = false;
  if (typeof f.expeditionTipSeen !== 'boolean') f.expeditionTipSeen = false;
  if (typeof f.consumablesTipSeen !== 'boolean') f.consumablesTipSeen = false;
  if (typeof f.plazaNpcTipSeen !== 'boolean') f.plazaNpcTipSeen = false;
  return f;
}

function persistFlags(): void {
  try {
    if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
  } catch {
    /* ignore */
  }
}

function characterReady(): boolean {
  return !!window.charName;
}

function tipEl(): HTMLElement | null {
  return document.getElementById('l2-tip-toast');
}

function isTipVisible(): boolean {
  const el = tipEl();
  return !!el && !el.classList.contains('l2-tip--hidden') && !el.hidden;
}

function clearPulses(): void {
  document
    .querySelectorAll('.l2-tip-pulse, .l2-tip-pulse--spot')
    .forEach((n) => n.classList.remove('l2-tip-pulse', 'l2-tip-pulse--spot'));
  document.getElementById('btn-tab-menu')?.classList.remove('nav-menu-town-coach__target-pulse');
  document.getElementById('btn-tab-world')?.classList.remove('nav-menu-town-coach__target-pulse');
}

/** Element the tip points at (pulsed + used to keep the toast from covering it). */
function tipTargetEl(key: BeginnerTipKey): HTMLElement | null {
  switch (key) {
    case 'menu':
    case 'mailbox':
    case 'missions':
      return document.getElementById('btn-tab-menu');
    case 'world':
      return document.getElementById('btn-tab-world');
    case 'zone':
      return document.querySelector<HTMLElement>('.world-map-actor--forest');
    case 'trail':
      return document.querySelector<HTMLElement>('.exp-map-actor--ng');
    case 'hotbar':
      return document.getElementById('barra-de-atalhos-dinamica');
    case 'consumables':
      return document.getElementById('consumables-bar');
    case 'expedition':
      return document.getElementById('btn-iniciar-caca');
    case 'path':
      return document.querySelector<HTMLElement>('.expedition-path-card--combat')
        || document.querySelector<HTMLElement>('.expedition-path-card');
    default:
      return null;
  }
}

function pulseForTip(key: BeginnerTipKey): void {
  clearPulses();
  const target = tipTargetEl(key);
  if (!target) return;
  if (key === 'menu' || key === 'mailbox' || key === 'missions' || key === 'world') {
    target.classList.add('nav-menu-town-coach__target-pulse');
    return;
  }
  if (key === 'zone' || key === 'trail') {
    target.classList.add('l2-tip-pulse--spot');
    return;
  }
  target.classList.add('l2-tip-pulse');
  if (key === 'consumables') {
    document.getElementById('consumable-slot-hp')?.classList.add('l2-tip-pulse');
  }
}

/**
 * The toast docks at the bottom; if that would cover the element it points at (Begin button,
 * combat bars…), lift it so it sits just above the target. Dock tabs are excluded — the toast
 * already clears them via CSS.
 */
function positionTipAwayFromTarget(el: HTMLElement, key: BeginnerTipKey): void {
  el.style.bottom = '';
  if (key === 'world' || key === 'menu' || key === 'mailbox' || key === 'missions') return;
  const target = tipTargetEl(key);
  if (!target) return;
  try {
    const tr = target.getBoundingClientRect();
    if (tr.width <= 0 || tr.height <= 0) return;
    const cr = el.getBoundingClientRect();
    const overlaps = cr.top < tr.bottom && cr.bottom > tr.top;
    if (!overlaps) return;
    const bottomPx = Math.max(0, window.innerHeight - tr.top + 10);
    // Never push the toast off the top of the viewport.
    if (bottomPx + cr.height > window.innerHeight - 8) return;
    el.style.bottom = `${Math.round(bottomPx)}px`;
  } catch {
    /* ignore */
  }
}

function hideLegacyCoaches(): void {
  ['nav-menu-town-coach', 'nav-coach-toast', 'tutorial-coach-panel'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('nav-menu-town-coach--hidden', 'tutorial-coach--hidden', 'l2-tip--hidden');
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
  });
}

function hideTipUi(): void {
  // Also drop any tip still queued — e.g. a hit scheduled "potions" right before the death screen.
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  const el = tipEl();
  if (el) {
    el.classList.add('l2-tip--hidden');
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.dataset.tipKey = '';
    el.style.bottom = '';
  }
  clearPulses();
  activeTip = null;
}

function showTip(key: BeginnerTipKey): void {
  const el = tipEl();
  const titleEl = document.getElementById('l2-tip-title');
  const bodyEl = document.getElementById('l2-tip-body');
  const badgeEl = document.getElementById('l2-tip-badge');
  const okBtn = document.getElementById('l2-tip-ok');
  if (!el || !titleEl || !bodyEl) return;

  hideLegacyCoaches();

  const keys = TIP_I18N[key];
  titleEl.textContent = tt(keys.title);
  bodyEl.textContent = tt(keys.body);
  if (badgeEl) badgeEl.textContent = tt('navCoach.badge');
  if (okBtn) okBtn.textContent = tt('navCoach.gotIt');

  el.dataset.tipKey = key;
  el.classList.remove('l2-tip--hidden');
  el.hidden = false;
  el.setAttribute('aria-hidden', 'false');
  activeTip = key;
  pulseForTip(key);

  try {
    if (window.I18n?.refreshDom) window.I18n.refreshDom(el);
  } catch {
    /* ignore */
  }
  // Layout settles after display change — measure on the next frame.
  requestAnimationFrame(() => {
    if (activeTip === key) positionTipAwayFromTarget(el, key);
  });
}

function milestoneDone(m: OnboardingMilestone): boolean {
  const ob = window.onboardingData;
  return !!(ob && ob.done && typeof ob.done === 'object' && ob.done[m]);
}

/** Tip already resolved: flag tips → seen; goal tips → milestone reached. */
function hasSeen(key: BeginnerTipKey): boolean {
  const rule = TIP_RULE[key];
  if (rule.kind === 'flag') return !!ensureUiCoachFlags()[rule.flag];
  return milestoneDone(rule.milestone);
}

/** Only flag tips persist "seen"; goal tips are resolved by milestones, never by closing. */
function markSeen(key: BeginnerTipKey): boolean {
  const rule = TIP_RULE[key];
  if (rule.kind !== 'flag') return false;
  ensureUiCoachFlags()[rule.flag] = true;
  return true;
}

/** Agenda uma tip (só se ainda não resolvida, não silenciada e nada estiver na tela). */
function scheduleBeginnerTip(key: BeginnerTipKey, delayMs = 500): void {
  if (!characterReady()) return;
  if (hasSeen(key)) return;
  if (snoozedGoalTips.has(key)) return;
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  showTimer = setTimeout(() => {
    showTimer = null;
    if (!characterReady() || hasSeen(key) || snoozedGoalTips.has(key)) return;
    if (isTipVisible()) return;
    showTip(key);
  }, delayMs);
}

function dismissActiveTip(persist = true): void {
  if (activeTip) {
    const persisted = markSeen(activeTip);
    if (!persisted) snoozedGoalTips.add(activeTip);
    if (persisted && persist) persistFlags();
  }
  hideTipUi();
}

/**
 * Player navigated: goal tips are bound to one screen — hide (without marking) when leaving it,
 * and lift the session snooze so the tip can come back on the next visit.
 */
function hideBeginnerTipForNav(lugar: string): void {
  (Object.keys(TIP_RULE) as BeginnerTipKey[]).forEach((k) => {
    const rule = TIP_RULE[k];
    if (rule.kind === 'goal' && rule.screen !== lugar) snoozedGoalTips.delete(k);
  });
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (!activeTip) return;
  const rule = TIP_RULE[activeTip];
  if (rule.screen && rule.screen !== lugar) hideTipUi();
}

/** Milestone reached: any goal tip pointing at it is done — hide it if on screen. */
function hideBeginnerTipForMilestone(milestone: OnboardingMilestone): void {
  if (!activeTip) return;
  const rule = TIP_RULE[activeTip];
  if (rule.kind === 'goal' && rule.milestone === milestone) hideTipUi();
}

function dismissNavMenuTownCoach(): void {
  if (!activeTip || activeTip === 'menu') {
    markSeen('menu');
    persistFlags();
  }
  hideTipUi();
}

function dismissNavCoachToast(): void {
  dismissActiveTip(true);
}

function maybeShowMenuTownCoach(): void {
  if (!characterReady() || hasSeen('menu')) return;
  setTimeout(() => {
    if (!characterReady() || hasSeen('menu')) return;
    const tela = document.getElementById('tela-cidade');
    if (!tela || tela.style.display === 'none') return;
    if (isTipVisible()) return;
    showTip('menu');
  }, 450);
}

function maybeShowNavCoachToasts(mailUnread: number, missionsPending: number): void {
  if (!characterReady() || isTipVisible()) return;
  const flags = ensureUiCoachFlags();
  if (!flags.mailboxTipSeen && mailUnread > 0) {
    scheduleBeginnerTip('mailbox', 300);
    return;
  }
  if (!flags.missionsTipSeen && missionsPending > 0) {
    scheduleBeginnerTip('missions', 300);
  }
}

function wireTipButtons(): void {
  const ok = document.getElementById('l2-tip-ok');
  const close = document.getElementById('l2-tip-close');
  const onDismiss = () => dismissActiveTip(true);
  if (ok) ok.onclick = onDismiss;
  if (close) close.onclick = onDismiss;
}

wireTipButtons();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireTipButtons);
}

window.uiCoachFlags = window.uiCoachFlags || defaultUiCoachFlags();
window.maybeShowMenuTownCoach = maybeShowMenuTownCoach;
window.dismissNavMenuTownCoach = dismissNavMenuTownCoach;
window.maybeShowNavCoachToasts = maybeShowNavCoachToasts;
window.dismissNavCoachToast = dismissNavCoachToast;
window.scheduleBeginnerTip = scheduleBeginnerTip;
window.dismissBeginnerTip = () => dismissActiveTip(true);
window.hideBeginnerTip = hideTipUi;
window.hideBeginnerTipForNav = hideBeginnerTipForNav;
window.hideBeginnerTipForMilestone = hideBeginnerTipForMilestone;

export {};
