/**
 * Coach leve — dicas pontuais (MENU na cidade, correio, missões).
 */

import type { UiCoachSave } from '../types/game';

type NavCoachToastKey = 'mailbox' | 'missions';

let activeCoachToast: NavCoachToastKey | null = null;

function defaultUiCoachFlags(): UiCoachSave {
    return { menuTownSeen: false, mailboxTipSeen: false, missionsTipSeen: false };
}

function ensureUiCoachFlags(): UiCoachSave {
    if (!window.uiCoachFlags || typeof window.uiCoachFlags !== 'object') {
        window.uiCoachFlags = defaultUiCoachFlags();
    }
    return window.uiCoachFlags;
}

function tutorialAllowsCoach(): boolean {
    if (!window.charName) return false;
    if (window.TutorialEngine?.isRunning?.()) return false;
    const tut = window.tutorialProgress;
    return !!(tut && (tut.completed || tut.skipped));
}

function isTownCoachVisible(): boolean {
    const coach = document.getElementById('nav-menu-town-coach');
    return !!coach && !coach.classList.contains('nav-menu-town-coach--hidden') && !coach.hidden;
}

function isToastCoachVisible(): boolean {
    const coach = document.getElementById('nav-coach-toast');
    return !!coach && !coach.classList.contains('nav-menu-town-coach--hidden') && !coach.hidden;
}

function pulseMenuTab(): void {
    document.getElementById('btn-tab-menu')?.classList.add('nav-menu-town-coach__target-pulse');
}

function clearMenuTabPulse(): void {
    document.getElementById('btn-tab-menu')?.classList.remove('nav-menu-town-coach__target-pulse');
}

function shouldShowMenuTownCoach(): boolean {
    if (!tutorialAllowsCoach()) return false;
    const flags = ensureUiCoachFlags();
    if (flags.menuTownSeen) return false;
    return !!document.getElementById('nav-menu-town-coach');
}

function showMenuTownCoach(): void {
    const coach = document.getElementById('nav-menu-town-coach');
    if (!coach) return;
    hideNavCoachToast();
    coach.classList.remove('nav-menu-town-coach--hidden');
    coach.hidden = false;
    coach.setAttribute('aria-hidden', 'false');
    if (window.I18n?.refreshDom) {
        try { window.I18n.refreshDom(coach); } catch { /* ignore */ }
    }
    pulseMenuTab();
}

function hideMenuTownCoach(): void {
    const coach = document.getElementById('nav-menu-town-coach');
    if (coach) {
        coach.classList.add('nav-menu-town-coach--hidden');
        coach.hidden = true;
        coach.setAttribute('aria-hidden', 'true');
    }
    if (!isToastCoachVisible()) clearMenuTabPulse();
}

function maybeShowMenuTownCoach(): void {
    if (!shouldShowMenuTownCoach()) return;
    window.setTimeout(() => {
        if (!shouldShowMenuTownCoach()) return;
        const tela = document.getElementById('tela-cidade');
        if (!tela || tela.style.display === 'none') return;
        showMenuTownCoach();
    }, 450);
}

function dismissNavMenuTownCoach(): void {
    const flags = ensureUiCoachFlags();
    flags.menuTownSeen = true;
    hideMenuTownCoach();
    try {
        if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
    } catch { /* ignore */ }
}

function showNavCoachToast(key: NavCoachToastKey): void {
    const coach = document.getElementById('nav-coach-toast');
    const titleEl = document.getElementById('nav-coach-toast-title');
    const bodyEl = document.getElementById('nav-coach-toast-body');
    if (!coach || !titleEl || !bodyEl) return;

    hideMenuTownCoach();

    const titleKey = key === 'mailbox' ? 'navCoach.mailboxTitle' : 'navCoach.missionsTitle';
    const bodyKey = key === 'mailbox' ? 'navCoach.mailboxBody' : 'navCoach.missionsBody';
    titleEl.textContent = typeof window.t === 'function' ? window.t(titleKey) : titleKey;
    bodyEl.textContent = typeof window.t === 'function' ? window.t(bodyKey) : bodyKey;

    coach.classList.remove('nav-menu-town-coach--hidden');
    coach.hidden = false;
    coach.setAttribute('aria-hidden', 'false');
    activeCoachToast = key;
    pulseMenuTab();
}

function hideNavCoachToast(): void {
    const coach = document.getElementById('nav-coach-toast');
    if (coach) {
        coach.classList.add('nav-menu-town-coach--hidden');
        coach.hidden = true;
        coach.setAttribute('aria-hidden', 'true');
    }
    activeCoachToast = null;
    if (!isTownCoachVisible()) clearMenuTabPulse();
}

function dismissNavCoachToast(): void {
    const flags = ensureUiCoachFlags();
    if (activeCoachToast === 'mailbox') flags.mailboxTipSeen = true;
    if (activeCoachToast === 'missions') flags.missionsTipSeen = true;
    hideNavCoachToast();
    try {
        if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
    } catch { /* ignore */ }
}

/** Correio / missões — uma dica por sistema, após o tutorial. */
function maybeShowNavCoachToasts(mailUnread: number, missionsPending: number): void {
    if (!tutorialAllowsCoach()) return;
    if (isTownCoachVisible() || isToastCoachVisible()) return;

    const flags = ensureUiCoachFlags();
    const mailTotal = Math.max(0, mailUnread);
    const missionsTotal = Math.max(0, missionsPending);

    if (!flags.mailboxTipSeen && mailTotal > 0) {
        showNavCoachToast('mailbox');
        return;
    }
    if (!flags.missionsTipSeen && missionsTotal > 0) {
        showNavCoachToast('missions');
    }
}

window.uiCoachFlags = window.uiCoachFlags || defaultUiCoachFlags();
window.maybeShowMenuTownCoach = maybeShowMenuTownCoach;
window.dismissNavMenuTownCoach = dismissNavMenuTownCoach;
window.maybeShowNavCoachToasts = maybeShowNavCoachToasts;
window.dismissNavCoachToast = dismissNavCoachToast;

export {};
