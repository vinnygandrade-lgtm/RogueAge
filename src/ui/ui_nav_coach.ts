/**
 * Dicas leves de onboarding (sem tour guiado).
 * Uma tip por vez, persistida em uiCoachFlags.
 */

import type { UiCoachSave } from '../types/game';

export type BeginnerTipKey =
  | 'hotbar'
  | 'expedition'
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

const TIP_FLAG: Record<BeginnerTipKey, TipFlag> = {
  hotbar: 'hotbarTipSeen',
  expedition: 'expeditionTipSeen',
  consumables: 'consumablesTipSeen',
  menu: 'menuTownSeen',
  mailbox: 'mailboxTipSeen',
  missions: 'missionsTipSeen',
};

const TIP_I18N: Record<BeginnerTipKey, { title: string; body: string }> = {
  hotbar: { title: 'navCoach.hotbarTitle', body: 'navCoach.hotbarBody' },
  expedition: { title: 'navCoach.expeditionTitle', body: 'navCoach.expeditionBody' },
  consumables: { title: 'navCoach.consumablesTitle', body: 'navCoach.consumablesBody' },
  menu: { title: 'navCoach.menuTownTitle', body: 'navCoach.menuTownBody' },
  mailbox: { title: 'navCoach.mailboxTitle', body: 'navCoach.mailboxBody' },
  missions: { title: 'navCoach.missionsTitle', body: 'navCoach.missionsBody' },
};

let activeTip: BeginnerTipKey | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;

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
    .querySelectorAll('.l2-tip-pulse')
    .forEach((n) => n.classList.remove('l2-tip-pulse'));
  document.getElementById('btn-tab-menu')?.classList.remove('nav-menu-town-coach__target-pulse');
}

function pulseForTip(key: BeginnerTipKey): void {
  clearPulses();
  if (key === 'menu' || key === 'mailbox' || key === 'missions') {
    document.getElementById('btn-tab-menu')?.classList.add('nav-menu-town-coach__target-pulse');
    return;
  }
  if (key === 'hotbar') {
    document.getElementById('barra-de-atalhos-dinamica')?.classList.add('l2-tip-pulse');
    return;
  }
  if (key === 'consumables') {
    document.getElementById('consumables-bar')?.classList.add('l2-tip-pulse');
    document.getElementById('consumable-slot-hp')?.classList.add('l2-tip-pulse');
    return;
  }
  if (key === 'expedition') {
    document.getElementById('btn-iniciar-caca')?.classList.add('l2-tip-pulse');
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
  const el = tipEl();
  if (el) {
    el.classList.add('l2-tip--hidden');
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.dataset.tipKey = '';
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
}

function hasSeen(key: BeginnerTipKey): boolean {
  return !!ensureUiCoachFlags()[TIP_FLAG[key]];
}

function markSeen(key: BeginnerTipKey): void {
  ensureUiCoachFlags()[TIP_FLAG[key]] = true;
}

/** Agenda uma tip (só se ainda não vista e nada estiver na tela). */
function scheduleBeginnerTip(key: BeginnerTipKey, delayMs = 500): void {
  if (!characterReady()) return;
  if (hasSeen(key)) return;
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  showTimer = setTimeout(() => {
    showTimer = null;
    if (!characterReady() || hasSeen(key)) return;
    if (isTipVisible()) return;
    showTip(key);
  }, delayMs);
}

function dismissActiveTip(persist = true): void {
  if (activeTip) {
    markSeen(activeTip);
    if (persist) persistFlags();
  }
  hideTipUi();
}

function dismissNavMenuTownCoach(): void {
  if (!activeTip) activeTip = 'menu';
  if (activeTip === 'menu' || !activeTip) {
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

export {};
