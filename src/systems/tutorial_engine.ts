/**
 * ONBOARDING — guided tutorial for new characters (v2).
 * Flow: hotbar → profile → spellbook → equip skill → world → hunt →
 * start expedition → path → attack → consumables → menu.
 */
import type { TutorialProgress } from '../types/game';

const TUTORIAL_V = 2;
const DONE_STEP = 11;
/** Steps that keep the skill hotbar forced visible. */
const HOTBAR_FORCE_STEPS = [0, 3, 8, 9];
/** Steps that wait for a player action (hide primary Next). */
const GATED_STEPS = [3, 7, 8];

let _renderScheduled = false;
window.tutorialFirstAttackDone = false;

function tn(key: string, params?: Record<string, string | number>): string {
  try {
    return typeof window.t === 'function' ? window.t(key, params) : key;
  } catch (e) {
    return key;
  }
}

function defaultProgress(): TutorialProgress {
  return { v: TUTORIAL_V, active: false, step: 99, completed: true, skipped: false };
}

function migrateTutorialProgress(p: TutorialProgress): void {
  const v = typeof p.v === 'number' ? p.v : 1;
  if (v >= TUTORIAL_V) return;
  // v1 → v2: merged old steps 0+1 into 0; shifted later steps down by 1.
  if (p.active && !p.completed && !p.skipped) {
    const s = Math.floor(Number(p.step) || 0);
    if (s <= 1) p.step = 0;
    else if (s >= 2 && s <= 10) p.step = s - 1;
    else if (s >= DONE_STEP) p.step = DONE_STEP;
  }
  p.v = TUTORIAL_V;
}

function getProg(): TutorialProgress {
  if (!window.tutorialProgress || typeof window.tutorialProgress !== 'object') {
    window.tutorialProgress = defaultProgress();
  }
  migrateTutorialProgress(window.tutorialProgress);
  return window.tutorialProgress;
}

function isRunning(): boolean {
  const p = getProg();
  return !!(p.active && !p.completed && !p.skipped && p.step >= 0 && p.step < DONE_STEP);
}

function persistSilent(): void {
  try {
    if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
  } catch (e) {
    /* ignore */
  }
}

function resetForcedHotbarIfNeeded(): void {
  if (isRunning() && HOTBAR_FORCE_STEPS.includes(getProg().step)) return;
  const bar = document.getElementById('barra-de-atalhos-dinamica');
  if (!bar) return;
  const lastLoc = localStorage.getItem('l2mini_last_location') || 'cidade';
  const allowed = ['floresta', 'inventario', 'clanwar', 'raid-arena', 'olympiad-arena'];
  bar.style.display = allowed.includes(lastLoc) ? 'grid' : 'none';
  bar.style.zIndex = '';
}

function clearHighlights(): void {
  try {
    document.querySelectorAll('.tutorial-highlight, .tutorial-lock').forEach(function (el) {
      el.classList.remove('tutorial-highlight');
      el.classList.remove('tutorial-lock');
    });
    resetForcedHotbarIfNeeded();
    const consBar = document.getElementById('consumables-bar');
    if (consBar && (!isRunning() || getProg().step !== 9)) {
      consBar.style.zIndex = '';
    }
  } catch (e) {
    /* ignore */
  }
}

function isTravelTabActive(lugar: string): boolean {
  try {
    const btn = document.getElementById('btn-tab-' + lugar);
    return !!(btn && btn.classList.contains('active'));
  } catch (e) {
    return false;
  }
}

function isSpellbookModalOpen(): boolean {
  try {
    const jw = document.getElementById('janela-spellbook');
    if (!jw) return false;
    const d = window.getComputedStyle(jw).display;
    return d !== 'none' && d !== '';
  } catch (e) {
    return false;
  }
}

function isFlorestaScreenVisible(): boolean {
  try {
    const el = document.getElementById('tela-floresta');
    if (!el) return false;
    const d = el.style.display;
    if (d === 'flex' || d === 'block') return true;
    const c = window.getComputedStyle(el).display;
    return c === 'flex' || c === 'block';
  } catch (e2) {
    return false;
  }
}

function forceHotbarVisible(): HTMLElement | null {
  const bar = document.getElementById('barra-de-atalhos-dinamica');
  if (bar) {
    bar.style.setProperty('display', 'grid', 'important');
    bar.style.zIndex = '2001';
  }
  return bar;
}

function hidePanel(): void {
  try {
    const panel = document.getElementById('tutorial-coach-panel');
    if (panel) {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && panel.contains(ae) && typeof ae.blur === 'function') ae.blur();
      panel.classList.add('tutorial-coach--hidden');
      panel.setAttribute('aria-hidden', 'true');
    }
    const arrow = document.getElementById('tutorial-arrow');
    if (arrow) arrow.classList.add('tutorial-arrow--hidden');
  } catch (e) {
    /* ignore */
  }
  clearHighlights();
}

function updateArrow(target: HTMLElement | null): void {
  const arrow = document.getElementById('tutorial-arrow');
  if (!arrow) return;

  if (!target || target.offsetParent === null) {
    arrow.classList.add('tutorial-arrow--hidden');
    return;
  }

  const rect = target.getBoundingClientRect();
  if (rect.top === 0 && rect.left === 0) {
    arrow.classList.add('tutorial-arrow--hidden');
    return;
  }

  let x = rect.left + rect.width / 2 - 20;
  let y = rect.top - 45;

  if (y < 100) {
    y = rect.bottom + 10;
    arrow.classList.add('tutorial-arrow--top');
  } else {
    arrow.classList.remove('tutorial-arrow--top');
  }

  arrow.style.left = x + 'px';
  arrow.style.top = y + 'px';
  arrow.classList.remove('tutorial-arrow--hidden');
}

function updatePanelPosition(target: HTMLElement | null): void {
  const panel = document.getElementById('tutorial-coach-panel');
  if (!panel) return;

  if (!target || target.offsetParent === null) {
    panel.style.left = '50%';
    panel.style.top = '22%';
    panel.style.transform = 'translate(-50%, 0)';
    panel.classList.remove('tutorial-coach--bottom');
    const card = panel.querySelector('.tutorial-coach__card') as HTMLElement | null;
    if (card) card.style.setProperty('--pointer-display', 'none');
    return;
  }

  const card = panel.querySelector('.tutorial-coach__card') as HTMLElement | null;
  if (card) card.style.setProperty('--pointer-display', 'block');

  const rect = target.getBoundingClientRect();
  const panelWidth = panel.offsetWidth || 300;
  const panelHeight = panel.offsetHeight || 180;

  let x = rect.left + rect.width / 2 - panelWidth / 2;
  let y = rect.top - panelHeight - 72;

  if (x < 10) x = 10;
  if (x + panelWidth > window.innerWidth - 10) x = window.innerWidth - panelWidth - 10;

  if (y < 10) {
    y = rect.bottom + 72;
    panel.classList.add('tutorial-coach--bottom');
  } else {
    panel.classList.remove('tutorial-coach--bottom');
  }

  if (y + panelHeight > window.innerHeight - 10) {
    y = rect.top + rect.height / 2 - panelHeight / 2;
    if (rect.left > panelWidth + 20) {
      x = rect.left - panelWidth - 20;
    } else {
      x = rect.right + 20;
    }
    panel.classList.remove('tutorial-coach--bottom');
    if (card) card.style.setProperty('--pointer-display', 'none');
  }

  if (y < 10) y = 10;
  if (y + panelHeight > window.innerHeight - 10) y = window.innerHeight - panelHeight - 10;
  if (x < 10) x = 10;
  if (x + panelWidth > window.innerWidth - 10) x = window.innerWidth - panelWidth - 10;

  panel.style.left = x + 'px';
  panel.style.top = y + 'px';
  panel.style.transform = 'none';
}

function applyHighlights(step: number): void {
  clearHighlights();
  try {
    const navButtons = [
      'btn-tab-perfil',
      'btn-tab-cidade',
      'btn-tab-world',
      'btn-tab-inventario',
      'btn-tab-menu',
    ];
    navButtons.forEach(function (id) {
      const btn = document.getElementById(id);
      if (btn) btn.classList.add('tutorial-lock');
    });

    let target: HTMLElement | null = null;
    let forceScreen: string | null = null;

    if (step === 0) {
      forceScreen = 'inventario';
      target = forceHotbarVisible();
    } else if (step === 1) {
      target = document.getElementById('btn-tab-perfil');
      if (target) target.classList.remove('tutorial-lock');
    } else if (step === 2) {
      forceScreen = 'perfil';
      if (isTravelTabActive('perfil')) {
        target = document.querySelector('.btn-profile-spellbook') as HTMLElement | null;
      } else {
        target = document.getElementById('btn-tab-perfil');
        if (target) target.classList.remove('tutorial-lock');
      }
    } else if (step === 3) {
      forceHotbarVisible();
      const slots = document.querySelectorAll('.shortcut-slot');
      if (slots && slots.length > 1) target = slots[1] as HTMLElement;
    } else if (step === 4) {
      target = document.getElementById('btn-tab-world');
      if (target) target.classList.remove('tutorial-lock');
    } else if (step === 5) {
      forceScreen = 'world';
      if (isTravelTabActive('world')) {
        target = document.querySelector('.adv-card') as HTMLElement | null;
      } else {
        target = document.getElementById('btn-tab-world');
        if (target) target.classList.remove('tutorial-lock');
      }
    } else if (step === 6) {
      forceScreen = 'floresta';
      target = document.getElementById('btn-iniciar-caca');
    } else if (step === 7) {
      forceScreen = 'floresta';
      target = document.querySelector('.expedition-path-card') as HTMLElement | null;
    } else if (step === 8) {
      forceScreen = 'floresta';
      forceHotbarVisible();
      const slots = document.querySelectorAll('.shortcut-slot');
      if (slots && slots.length > 0) target = slots[0] as HTMLElement;
    } else if (step === 9) {
      forceScreen = 'floresta';
      forceHotbarVisible();
      if (typeof window.renderizarBarraConsumiveis === 'function') {
        window.renderizarBarraConsumiveis();
      }
      const consBar = document.getElementById('consumables-bar');
      if (consBar) {
        consBar.hidden = false;
        consBar.style.zIndex = '2002';
      }
      target = document.getElementById('consumable-slot-hp');
    } else if (step === 10) {
      target = document.getElementById('btn-tab-menu');
      if (target) target.classList.remove('tutorial-lock');
    }

    if (
      forceScreen &&
      !isTravelTabActive(forceScreen) &&
      typeof window.irPara === 'function' &&
      step !== 3
    ) {
      window.irPara(forceScreen);
    }

    if (target) {
      target.classList.add('tutorial-highlight');
      if (target.id && navButtons.indexOf(target.id) !== -1) {
        target.classList.remove('tutorial-lock');
      }
      setTimeout(function () {
        if (target && target.offsetParent !== null) {
          updateArrow(target);
          updatePanelPosition(target);
        }
      }, 100);
    } else {
      updateArrow(null);
      updatePanelPosition(null);
    }
  } catch (e) {
    /* ignore */
  }
}

function celebrate(): void {
  try {
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(
        '<span style="color:#34d399;font-weight:bold;">' + tn('game.tutorial.celebrate') + '</span>'
      );
      window.escreverLog(
        '<span style="color:#94a3b8;">' + tn('game.tutorial.menuHintAfter') + '</span>'
      );
    }
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-celebrate-flash';
    document.body.appendChild(overlay);
    setTimeout(function () {
      overlay.remove();
    }, 1600);
  } catch (e) {
    /* ignore */
  }
}

function setStep(n: number): void {
  const p = getProg();
  p.step = Math.max(0, Math.min(DONE_STEP, n));
  if (p.step >= DONE_STEP) {
    p.active = false;
    p.completed = true;
    p.skipped = false;
    persistSilent();
    hidePanel();
    celebrate();
    setTimeout(hidePanel, 100);
    return;
  }
  persistSilent();
  render();
}

function stepContent(step: number): { title: string; body: string } {
  const s = step === undefined || step === null ? 0 : step;
  const c = {
    title: tn('game.tutorial.s' + s + 'Title'),
    body: tn('game.tutorial.s' + s + 'Body'),
  };
  if (s === 3) c.body += ' ' + tn('game.tutorial.hintSlot');
  return c;
}

function primaryActionForStep(step: number): { label: string; fn: () => void } {
  const s = step === undefined || step === null ? 0 : step;
  if (s === 0) {
    return { label: tn('game.tutorial.next'), fn: function () { setStep(1); } };
  }
  if (s === 1) {
    return {
      label: tn('game.tutorial.openProfile'),
      fn: function () {
        if (isTravelTabActive('perfil')) {
          setStep(2);
          return;
        }
        if (typeof window.irPara === 'function') window.irPara('perfil');
      },
    };
  }
  if (s === 2) {
    return {
      label: tn('game.tutorial.openSpellbook'),
      fn: function () {
        if (isSpellbookModalOpen()) {
          if (getProg().step === 2) setStep(3);
          return;
        }
        if (typeof window.abrirSpellbook === 'function') window.abrirSpellbook();
      },
    };
  }
  if (s === 3) {
    return { label: tn('game.tutorial.waitAssign'), fn: function () {} };
  }
  if (s === 4) {
    return {
      label: tn('game.tutorial.openWorld'),
      fn: function () {
        if (isTravelTabActive('world')) {
          setStep(5);
          return;
        }
        if (typeof window.irPara === 'function') window.irPara('world');
      },
    };
  }
  if (s === 5) {
    return {
      label: tn('game.tutorial.openHunt'),
      fn: function () {
        if (isFlorestaScreenVisible()) {
          setStep(6);
          return;
        }
        if (typeof window.irPara === 'function') window.irPara('floresta');
      },
    };
  }
  if (s === 6) {
    return {
      label: tn('game.tutorial.startExpedition'),
      fn: function () {
        const btn = document.getElementById('btn-iniciar-caca') as HTMLButtonElement | null;
        if (btn && !btn.disabled) {
          btn.click();
          return;
        }
        try {
          if (typeof window.escreverLog === 'function') {
            window.escreverLog(
              '<span style="color:#facc15;">' + tn('game.tutorial.tapSearchRemind') + '</span>'
            );
          }
        } catch (e) {
          /* ignore */
        }
      },
    };
  }
  if (s === 7) {
    return { label: tn('game.tutorial.waitPath'), fn: function () {} };
  }
  if (s === 8) {
    return { label: tn('game.tutorial.waitAttack'), fn: function () {} };
  }
  if (s === 9) {
    return { label: tn('game.tutorial.next'), fn: function () { setStep(10); } };
  }
  if (s === 10) {
    return {
      label: tn('game.tutorial.openMenu'),
      fn: function () {
        if (typeof window.abrirNavMenu === 'function') {
          window.abrirNavMenu();
        }
        setTimeout(function () {
          if (getProg().step === 10) setStep(DONE_STEP);
        }, 200);
      },
    };
  }
  return { label: tn('game.tutorial.done'), fn: function () { setStep(DONE_STEP); } };
}

function render(): void {
  try {
    if (!isRunning()) {
      hidePanel();
      return;
    }
    const step = getProg().step;
    const panel = document.getElementById('tutorial-coach-panel');
    if (!panel) return;

    const content = stepContent(step);
    const titleEl = document.getElementById('tutorial-coach-title');
    const bodyEl = document.getElementById('tutorial-coach-body');
    const nextBtn = document.getElementById('tutorial-coach-next');
    const backBtn = document.getElementById('tutorial-coach-back');
    const skipBtn = document.getElementById('tutorial-coach-skip');
    const progressFill = document.getElementById('tutorial-coach-progress-bar');

    if (titleEl) titleEl.textContent = content.title || tn('game.tutorial.badge');
    if (bodyEl) bodyEl.textContent = content.body;

    if (progressFill) {
      const pct = Math.round((step / DONE_STEP) * 100);
      progressFill.style.width = Math.max(6, pct) + '%';
    }

    const prim = primaryActionForStep(step);
    const gated = GATED_STEPS.includes(step);
    if (nextBtn) {
      nextBtn.textContent = prim.label;
      nextBtn.onclick = function () {
        try {
          prim.fn();
        } catch (e) {
          console.warn('[Tutorial]', e);
        }
      };
      nextBtn.style.display = gated ? 'none' : 'inline-flex';
    }

    if (backBtn) {
      backBtn.style.display = step > 0 && !gated ? 'inline-flex' : 'none';
      backBtn.textContent = tn('game.tutorial.back');
      backBtn.onclick = function () {
        setStep(step - 1);
      };
    }
    if (skipBtn) {
      skipBtn.style.display = 'inline-flex';
      skipBtn.textContent = tn('game.tutorial.skip');
      skipBtn.onclick = function () {
        try {
          if (typeof window.l2Confirm === 'function') {
            window
              .l2Confirm(tn('game.tutorial.skipConfirmBody'), tn('game.tutorial.skipConfirmTitle'))
              .then(function (ok) {
                if (ok) skipTutorial();
              });
          } else {
            skipTutorial();
          }
        } catch (e) {
          skipTutorial();
        }
      };
    }

    panel.classList.remove('tutorial-coach--hidden');
    panel.setAttribute('aria-hidden', 'false');
    void panel.offsetWidth;
    applyHighlights(step);

    try {
      if (typeof window.I18n !== 'undefined' && window.I18n.refreshDom) {
        window.I18n.refreshDom(panel);
      }
    } catch (eI) {
      /* ignore */
    }
  } catch (e) {
    console.warn('[Tutorial] render', e);
  }
}

function scheduleRender(): void {
  if (_renderScheduled) return;
  _renderScheduled = true;
  setTimeout(function () {
    _renderScheduled = false;
    render();
  }, 450);
}

window.addEventListener('resize', function () {
  if (isRunning()) render();
});
window.addEventListener(
  'scroll',
  function () {
    if (isRunning()) render();
  },
  true
);

function skipTutorial(): void {
  console.log('⏭️ [Tutorial] Player skipped the tour.');
  const p = getProg();
  p.active = false;
  p.completed = true;
  p.skipped = true;
  p.step = DONE_STEP;
  p.v = TUTORIAL_V;
  persistSilent();
  hidePanel();
  clearHighlights();
  if (typeof window.irPara === 'function') {
    window.irPara('perfil');
  }
}

function ensureAttackOnlyHotbarEarly(): void {
  // Before equip-skill step: Attack only so slot 2 is free for the lesson.
  if (getProg().step >= 3 || !Array.isArray(window.barraAtalhos)) return;
  let dirty = false;
  for (let bi = 1; bi < window.barraAtalhos.length; bi++) {
    if (window.barraAtalhos[bi] != null) {
      window.barraAtalhos[bi] = null;
      dirty = true;
    }
  }
  if (window.barraAtalhos[0] !== 'Attack') {
    window.barraAtalhos[0] = 'Attack';
    dirty = true;
  }
  if (dirty) {
    console.log('🎓 [Tutorial] Reset hotbar to Attack-only for onboarding.');
    if (typeof window.renderizarBarraAtalhos === 'function') window.renderizarBarraAtalhos();
  }
}

window.TutorialEngine = {
  bootstrapNewCharacter: function () {
    window.tutorialFirstAttackDone = false;
    window.tutorialProgress = {
      v: TUTORIAL_V,
      active: true,
      step: 0,
      completed: false,
      skipped: false,
    };
  },

  afterCharacterLoad: function () {
    const p = getProg();
    if (p.active && !p.completed && p.step >= DONE_STEP) {
      p.active = false;
      p.completed = true;
      persistSilent();
      hidePanel();
      clearHighlights();
      return;
    }
    if (!isRunning()) {
      hidePanel();
      return;
    }
    ensureAttackOnlyHotbarEarly();
    try {
      render();
    } catch (e0) {
      /* ignore */
    }
    scheduleRender();
  },

  onNav: function (lugar: string) {
    if (!isRunning()) return;
    const s = getProg().step;
    try {
      if (lugar === 'perfil' && s === 1) {
        setStep(2);
        return;
      }
      if (lugar === 'world' && s === 4) {
        setStep(5);
        return;
      }
      if (lugar === 'floresta' && s === 4) {
        setStep(5);
        return;
      }
      if (lugar === 'floresta' && s === 5) {
        setStep(6);
        return;
      }
    } catch (e) {
      /* ignore */
    }
  },

  notifySpellbookOpened: function () {
    if (!isRunning()) return;
    if (getProg().step === 2) setStep(3);
  },

  notifySkillAssignedFromSpellbook: function () {
    if (!isRunning()) return;
    if (getProg().step === 3) setStep(4);
  },

  notifyHuntSearch: function () {
    if (!isRunning()) return;
    if (getProg().step === 6) setStep(7);
  },

  notifyExpeditionNodeConfirmed: function () {
    if (!isRunning()) return;
    if (getProg().step === 7) setStep(8);
  },

  notifyFirstAttack: function () {
    if (!isRunning()) return;
    if (getProg().step === 8) {
      window.tutorialFirstAttackDone = true;
      setTimeout(function () {
        setStep(9);
      }, 1200);
    }
  },

  notifyMenuOpened: function () {
    if (!isRunning()) return;
    if (getProg().step === 10) setStep(DONE_STEP);
  },

  skipTutorial: skipTutorial,
  render: render,
  isRunning: isRunning,
};

export {};
