/**
 * Onboarding leve — sem tour guiado, dirigido por **estado** (marcos), não por ecrã.
 *
 * O tour passo-a-passo antigo foi aposentado (qualquer save fica `completed`). Em vez disso:
 *  - `window.onboardingData.done[<marco>]` regista quando o jogador atingiu cada passo da primeira sessão;
 *  - tips **goal** (world → zone → trail → expedition → path) apontam sempre o próximo passo até o primeiro
 *    combate; depois **upgrade → extract** (recolher ou continuar) e **skillGo → skill** (equipar a 1ª skill).
 *    Voltam a aparecer até o marco ser atingido (ver `ui_nav_coach.ts`);
 *  - tips **flag** (hotbar, consumables, menu, …) disparam quando o elemento está visível e são uma vez só;
 *  - cada marco é espelhado na nuvem (RPC `log_onboarding_milestone`, fire-and-forget) para medir o funil.
 *
 * Fluxo completo e gatilhos: `docs/onboarding-flow.md`.
 */
import type { OnboardingMilestone, OnboardingSave, TutorialProgress } from '../types/game';

const TUTORIAL_V = 3;
const DONE_STEP = 99;

/** Marcos que fecham o "primeiro combate" — quando todos existem, o onboarding está completo. */
const CORE_MILESTONES: OnboardingMilestone[] = ['world', 'forest', 'mob_spawn', 'first_attack', 'first_kill'];

/** Every milestone the funnel knows (keep in sync with `OnboardingMilestone`). */
const ALL_MILESTONES: OnboardingMilestone[] = [
  'world', 'forest', 'mob_spawn', 'first_attack', 'first_hit', 'first_kill', 'level_up',
  'upgrade_picked', 'first_extract', 'skill_equipped',
];

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
    document.querySelectorAll('.tutorial-highlight, .tutorial-lock').forEach((el) => {
      el.classList.remove('tutorial-highlight', 'tutorial-lock');
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

// ─── Onboarding state ────────────────────────────────────────────────────────

export function freshOnboarding(): OnboardingSave {
  return { startedAt: Date.now(), done: {} };
}

/** Veteran / legacy save without `onboarding`: everything counts as done (no beginner nagging). */
export function completedOnboarding(): OnboardingSave {
  const done: OnboardingSave['done'] = {};
  ALL_MILESTONES.forEach((m) => { done[m] = 0; });
  return { startedAt: 0, done };
}

/**
 * Veteran marker (`startedAt === 0`, written by `completedOnboarding`): milestones added later
 * (upgrade / extract / skill lessons) are back-filled so old hands never see the new tips.
 */
export function backfillVeteranOnboarding(o: OnboardingSave | null): OnboardingSave | null {
  if (!o || o.startedAt !== 0) return o;
  ALL_MILESTONES.forEach((m) => { if (o.done[m] == null) o.done[m] = 0; });
  return o;
}

/** Normalize anything coming from a save / JSONB into a safe OnboardingSave. */
export function normalizeOnboarding(raw: unknown): OnboardingSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<OnboardingSave>;
  const out: OnboardingSave = {
    startedAt: typeof r.startedAt === 'number' && Number.isFinite(r.startedAt) ? r.startedAt : Date.now(),
    done: {},
  };
  if (r.done && typeof r.done === 'object') {
    Object.keys(r.done).forEach((k) => {
      const v = (r.done as Record<string, unknown>)[k];
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        out.done[k as OnboardingMilestone] = v;
      }
    });
  }
  return out;
}

function ob(): OnboardingSave {
  if (!window.onboardingData || typeof window.onboardingData !== 'object' || !window.onboardingData.done) {
    window.onboardingData = freshOnboarding();
  }
  return window.onboardingData;
}

function isDone(m: OnboardingMilestone): boolean {
  return ob().done[m] != null;
}

function isOnboardingComplete(): boolean {
  return CORE_MILESTONES.every(isDone);
}

function currentScreen(): string {
  try {
    const map: Array<[string, string]> = [
      ['tela-perfil', 'perfil'],
      ['tela-world', 'world'],
      ['tela-expedition', 'expedition'],
      ['tela-floresta', 'floresta'],
      ['tela-cidade', 'cidade'],
      ['tela-inventario', 'inventario'],
      ['tela-social', 'social'],
    ];
    for (const [id, lugar] of map) {
      const el = document.getElementById(id);
      if (el && el.style.display !== 'none' && el.style.display !== '') return lugar;
    }
  } catch {
    /* ignore */
  }
  return '';
}

function logMilestoneToCloud(m: OnboardingMilestone, elapsedMs: number): void {
  try {
    const api = window.SupabaseAPI;
    if (!api || typeof api.logOnboardingMilestone !== 'function') return;
    if (typeof api.getUser === 'function' && !api.getUser()) return;
    const name = String(window.charName || '').trim();
    if (!name) return;
    void api.logOnboardingMilestone(name, m, Number(window.nivel) || 1, elapsedMs).catch(() => { /* fire-and-forget */ });
  } catch {
    /* ignore */
  }
}

/** Mark a milestone once: persist, mirror to cloud, and retire the goal tip pointing at it. */
function mark(m: OnboardingMilestone): boolean {
  const o = ob();
  if (o.done[m] != null) return false;
  const now = Date.now();
  o.done[m] = now;
  try {
    window.hideBeginnerTipForMilestone?.(m);
  } catch {
    /* ignore */
  }
  persistSilent();
  logMilestoneToCloud(m, o.startedAt > 0 ? Math.max(0, now - o.startedAt) : 0);
  return true;
}

type TipKey =
  | 'world' | 'zone' | 'trail' | 'expedition' | 'path'
  | 'upgrade' | 'extract' | 'skillGo' | 'skill'
  | 'hotbar' | 'consumables' | 'menu';

function scheduleTip(key: TipKey, delay = 500): void {
  try {
    if (typeof window.scheduleBeginnerTip === 'function') {
      window.scheduleBeginnerTip(key, delay);
    }
  } catch {
    /* ignore */
  }
}

function expeditionRunActive(): boolean {
  try {
    return !!window.ExpeditionEngine?.state?.active;
  } catch {
    return false;
  }
}

/** Forest hub: "Begin" nudge while no run is active; otherwise the path cards are on screen. */
function coachForestHub(delay: number): void {
  if (isDone('mob_spawn')) return;
  scheduleTip(expeditionRunActive() ? 'path' : 'expedition', delay);
}

/** Next-step tip for the screen the player is on (only while the first fight has not happened). */
function coachForScreen(lugar: string, delay: number): void {
  if (!window.charName) return;
  if (isDone('forest')) {
    // Already knows the way to the hub — only the forest nudges remain until the first pull.
    if (lugar === 'floresta') coachForestHub(delay);
    return;
  }
  if (lugar === 'perfil') scheduleTip('world', delay);
  else if (lugar === 'world') scheduleTip('zone', delay);
  else if (lugar === 'expedition') scheduleTip('trail', delay);
  else if (lugar === 'floresta') coachForestHub(delay);
}

/** After the first kill, the player is back in town/profile: introduce the MENU (mail, missions). */
function maybeCoachMenuAfterFirstKill(lugar: string): void {
  if (!isDone('first_kill')) return;
  if (lugar === 'perfil' || lugar === 'world' || lugar === 'cidade') scheduleTip('menu', 900);
}

/**
 * Skill lesson — the player has fought (and, by design, left or parked the run) but never equipped a
 * skill. Every class owns a level-1 skill, so it is always actionable. Returns true when it claimed
 * the slot (the MENU tip waits for the next visit).
 */
function coachSkillLesson(lugar: string, delay: number): boolean {
  if (!isDone('first_kill') || isDone('skill_equipped')) return false;
  if (lugar === 'perfil') {
    scheduleTip('skill', delay);
    return true;
  }
  if (lugar === 'world' || lugar === 'cidade' || (lugar === 'floresta' && !expeditionRunActive())) {
    scheduleTip('skillGo', delay);
    return true;
  }
  return false;
}

/** Everything after the first fight: skill first, then the MENU introduction. */
function coachPostCombat(lugar: string, delay: number): void {
  if (coachSkillLesson(lugar, delay)) return;
  maybeCoachMenuAfterFirstKill(lugar);
}

window.TutorialEngine = {
  bootstrapNewCharacter: function () {
    window.tutorialFirstAttackDone = false;
    window.tutorialProgress = doneProgress();
    window.onboardingData = freshOnboarding();
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
    ob();
    persistSilent();
    // Character just landed (usually Profile): point at the next step right away.
    const lugar = currentScreen() || 'perfil';
    if (isOnboardingComplete()) {
      coachSkillLesson(lugar, 1200);
      return;
    }
    coachForScreen(lugar, 900);
  },

  onNav: function (lugar: string) {
    try {
      window.hideBeginnerTipForNav?.(lugar);
    } catch {
      /* ignore */
    }

    if (lugar === 'world') mark('world');
    if (lugar === 'floresta') mark('forest');

    if (lugar === 'cidade') {
      try {
        window.maybeShowMenuTownCoach?.();
        window.maybeShowPlazaNpcCoach?.();
      } catch {
        /* ignore */
      }
    }

    if (!isOnboardingComplete()) {
      coachForScreen(lugar, 450);
      return;
    }
    coachPostCombat(lugar, 700);
  },

  notifySpellbookOpened: function () {
    /* no-op — tips are non-blocking */
  },

  notifySkillAssignedFromSpellbook: function () {
    mark('skill_equipped');
  },

  /**
   * Called both when a run starts (Begin pressed → path cards) and after each pull spawns.
   * Only the pre-first-pull call matters here: the hub is gone, so retire that tip and coach the path pick.
   */
  notifyHuntSearch: function () {
    if (isDone('mob_spawn')) return;
    try {
      window.hideBeginnerTip?.();
    } catch {
      /* ignore */
    }
    scheduleTip('path', 700);
  },

  /**
   * Path confirmed → combat is about to start. Counts as "got it" for whatever tip is up
   * (path / extract): a goal tip is only snoozed for the session, so it can still return later.
   */
  notifyExpeditionNodeConfirmed: function () {
    try {
      window.dismissBeginnerTip?.();
    } catch {
      /* ignore */
    }
  },

  /** First win → upgrade cards on screen: explain the pick (run-only buff) and what comes next. */
  notifyUpgradeOffered: function () {
    if (isDone('upgrade_picked')) return;
    try {
      // Whatever combat tip was up (hotbar / potions) has been on screen for a whole fight.
      window.dismissBeginnerTip?.();
    } catch {
      /* ignore */
    }
    scheduleTip('upgrade', 650);
  },

  /** Upgrade taken → journey advanced: now the real lesson — push on, or bank the bag with Collect & exit. */
  notifyUpgradePicked: function () {
    mark('upgrade_picked');
    if (isDone('first_extract')) return;
    if (!expeditionRunActive()) return;
    scheduleTip('extract', 800);
  },

  /** Bag secured for the first time — the extract lesson is done; the skill lesson follows on the next nav. */
  notifyExpeditionExtracted: function () {
    mark('first_extract');
  },

  /** Recap closed while staying in the forest hub (no nav happens) — coach the skill lesson here. */
  notifyVictoryModalClosed: function () {
    if (currentScreen() !== 'floresta') return;
    coachSkillLesson('floresta', 600);
  },

  /** First pull on screen: the combat bar is visible now — explain it here, not on Profile. */
  notifyMobSpawn: function () {
    const first = mark('mob_spawn');
    if (first || !window.uiCoachFlags?.hotbarTipSeen) scheduleTip('hotbar', 900);
  },

  notifyFirstAttack: function () {
    if (window.tutorialFirstAttackDone) return;
    window.tutorialFirstAttackDone = true;
    mark('first_attack');
  },

  /** First damage taken: potions / shots become relevant (not on a killing blow — death screen follows). */
  notifyPlayerHit: function () {
    const first = mark('first_hit');
    if ((Number(window.playerHP) || 0) <= 0) return;
    if (first || !window.uiCoachFlags?.consumablesTipSeen) scheduleTip('consumables', 700);
  },

  notifyMobKilled: function () {
    mark('first_kill');
  },

  notifyLevelUp: function (_level: number) {
    mark('level_up');
  },

  notifyMenuOpened: function () {
    try {
      window.dismissNavMenuTownCoach?.();
    } catch {
      /* ignore */
    }
  },

  /** True until the player reaches the forest hub once — zone modal is skipped on that first trip. */
  isFirstExpedition: function () {
    return !!window.charName && !isDone('forest');
  },

  isMilestoneDone: isDone,
  markMilestone: function (m: OnboardingMilestone) {
    mark(m);
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
