/**
 * Onboarding leve — sem tour guiado.
 * Marca o tutorial antigo como concluído e dispara tips contextuais via ui_nav_coach.
 */
import type { TutorialProgress } from '../types/game';

const TUTORIAL_V = 3;
const DONE_STEP = 99;

window.tutorialFirstAttackDone = false;

function doneProgress(): TutorialProgress {
  return {
    v: TUTORIAL_V,
    active: false,
    step: DONE_STEP,
    completed: true,
    skipped: false,
  };
}

function getProg(): TutorialProgress {
  if (!window.tutorialProgress || typeof window.tutorialProgress !== 'object') {
    window.tutorialProgress = doneProgress();
  }
  return window.tutorialProgress;
}

/** Qualquer tour antigo ativo vira “já concluído” — tips leves assumem o onboarding. */
function retireGuidedTour(): void {
  const p = getProg();
  if (p.active && !p.completed && !p.skipped) {
    console.log('🎓 [Tutorial] Retiring guided tour → contextual tips.');
  }
  window.tutorialProgress = {
    v: TUTORIAL_V,
    active: false,
    step: DONE_STEP,
    completed: true,
    skipped: !!p.skipped,
  };
  hideLegacyTourUi();
}

function hideLegacyTourUi(): void {
  try {
    const panel = document.getElementById('tutorial-coach-panel');
    if (panel) {
      panel.classList.add('tutorial-coach--hidden', 'l2-tip--hidden');
      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.tutorial-highlight, .tutorial-lock, .l2-tip-pulse').forEach((el) => {
      el.classList.remove('tutorial-highlight', 'tutorial-lock', 'l2-tip-pulse');
    });
  } catch {
    /* ignore */
  }
}

function persistSilent(): void {
  try {
    if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
  } catch {
    /* ignore */
  }
}

function isRunning(): boolean {
  // Guided tour permanently off.
  return false;
}

function scheduleTip(key: 'hotbar' | 'expedition' | 'consumables' | 'menu', delay = 500): void {
  try {
    if (typeof window.scheduleBeginnerTip === 'function') {
      window.scheduleBeginnerTip(key, delay);
    }
  } catch {
    /* ignore */
  }
}

window.TutorialEngine = {
  bootstrapNewCharacter: function () {
    window.tutorialFirstAttackDone = false;
    window.tutorialProgress = doneProgress();
    if (!window.uiCoachFlags || typeof window.uiCoachFlags !== 'object') {
      window.uiCoachFlags = {
        menuTownSeen: false,
        mailboxTipSeen: false,
        missionsTipSeen: false,
        hotbarTipSeen: false,
        expeditionTipSeen: false,
        consumablesTipSeen: false,
        plazaNpcTipSeen: false,
      };
    }
  },

  afterCharacterLoad: function () {
    retireGuidedTour();
    persistSilent();
    // Tip 1: barra / spellbook — logo ao entrar no mundo
    scheduleTip('hotbar', 700);
  },

  onNav: function (lugar: string) {
    if (lugar === 'floresta') {
      scheduleTip('expedition', 450);
      return;
    }
    if (lugar === 'cidade') {
      try {
        window.maybeShowMenuTownCoach?.();
        window.maybeShowPlazaNpcCoach?.();
      } catch {
        /* ignore */
      }
    }
  },

  notifySpellbookOpened: function () {
    /* no-op — tips are non-blocking */
  },

  notifySkillAssignedFromSpellbook: function () {
    /* no-op */
  },

  notifyHuntSearch: function () {
    /* no-op */
  },

  notifyExpeditionNodeConfirmed: function () {
    /* tip consumables after combat starts via notifyFirstAttack */
  },

  notifyFirstAttack: function () {
    if (window.tutorialFirstAttackDone) return;
    window.tutorialFirstAttackDone = true;
    scheduleTip('consumables', 900);
  },

  notifyMenuOpened: function () {
    try {
      window.dismissNavMenuTownCoach?.();
    } catch {
      /* ignore */
    }
  },

  skipTutorial: function () {
    retireGuidedTour();
    persistSilent();
  },

  render: function () {
    hideLegacyTourUi();
  },

  isRunning: isRunning,
};

export {};
