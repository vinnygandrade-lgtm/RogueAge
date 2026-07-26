/**
 * Default Auto-Attack / Auto-Shot preferences (device-local).
 * Applied when a character loads and when a new fight starts.
 */

export type CombatAutoPrefs = {
  autoAttackOnLoad: boolean;
  autoShotOnLoad: boolean;
};

const STORAGE_KEY = 'l2mini_combat_auto_prefs';

const DEFAULT_PREFS: CombatAutoPrefs = {
  autoAttackOnLoad: false,
  autoShotOnLoad: false,
};

let prefs: CombatAutoPrefs = { ...DEFAULT_PREFS };
let loaded = false;

function readStored(): CombatAutoPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<CombatAutoPrefs>;
    return {
      autoAttackOnLoad: parsed.autoAttackOnLoad === true,
      autoShotOnLoad: parsed.autoShotOnLoad === true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function ensureLoaded(): void {
  if (loaded) return;
  prefs = readStored();
  loaded = true;
}

function isOlympiadArenaOpen(): boolean {
  const el = document.getElementById('tela-olympiad-arena');
  return !!(el && el.style.display === 'flex');
}

function refreshHotbar(): void {
  if (typeof window.renderizarBarraAtalhos === 'function') {
    try {
      window.renderizarBarraAtalhos();
    } catch {
      /* ignore */
    }
  }
}

function hasLiveCombatTarget(): boolean {
  if (window.RaidEngine?.ativo) return true;
  return Array.isArray(window.monstrosAtivos) && window.monstrosAtivos.length > 0;
}

export function getCombatAutoPrefs(): CombatAutoPrefs {
  ensureLoaded();
  return { ...prefs };
}

export function isAutoAttackOnLoadEnabled(): boolean {
  ensureLoaded();
  return prefs.autoAttackOnLoad;
}

export function isAutoShotOnLoadEnabled(): boolean {
  ensureLoaded();
  return prefs.autoShotOnLoad;
}

export function setAutoAttackOnLoad(enabled: boolean): void {
  ensureLoaded();
  prefs.autoAttackOnLoad = !!enabled;
  persist();
  applyCombatAutoPrefs({ startAttackLoop: hasLiveCombatTarget() });
}

export function setAutoShotOnLoad(enabled: boolean): void {
  ensureLoaded();
  prefs.autoShotOnLoad = !!enabled;
  persist();
  applyCombatAutoPrefs({ startAttackLoop: false });
}

export function toggleAutoAttackOnLoad(): boolean {
  setAutoAttackOnLoad(!isAutoAttackOnLoadEnabled());
  return isAutoAttackOnLoadEnabled();
}

export function toggleAutoShotOnLoad(): boolean {
  setAutoShotOnLoad(!isAutoShotOnLoadEnabled());
  return isAutoShotOnLoadEnabled();
}

/**
 * Apply saved defaults to runtime flags (hotbar chips).
 * Optionally start the auto-attack loop when already in a fight.
 */
export function applyCombatAutoPrefs(opts?: { startAttackLoop?: boolean }): void {
  ensureLoaded();

  if (isOlympiadArenaOpen()) {
    refreshHotbar();
    return;
  }

  // Fresh apply from prefs (character load / settings change).
  window.autoShotAtivo = !!prefs.autoShotOnLoad;
  window.autoAtaqueAtivo = !!prefs.autoAttackOnLoad;

  refreshHotbar();

  if (opts?.startAttackLoop && prefs.autoAttackOnLoad) {
    tryStartAutoAttackFromPrefs();
  }
}

/** Call when a new forest/raid fight becomes live. */
export function tryStartAutoAttackFromPrefs(): void {
  ensureLoaded();
  if (isOlympiadArenaOpen()) return;
  if ((Number(window.playerHP) || 0) <= 0) return;

  if (prefs.autoShotOnLoad) {
    window.autoShotAtivo = true;
  }

  if (!prefs.autoAttackOnLoad) {
    refreshHotbar();
    return;
  }

  if (!hasLiveCombatTarget()) {
    window.autoAtaqueAtivo = true;
    refreshHotbar();
    return;
  }

  if (typeof window.resumeAutoAtaqueLoop === 'function') {
    window.resumeAutoAtaqueLoop();
  } else {
    window.autoAtaqueAtivo = true;
    refreshHotbar();
  }
}

const CombatAutoPrefsApi = {
  get: getCombatAutoPrefs,
  isAutoAttackOnLoadEnabled,
  isAutoShotOnLoadEnabled,
  setAutoAttackOnLoad,
  setAutoShotOnLoad,
  toggleAutoAttackOnLoad,
  toggleAutoShotOnLoad,
  applyCombatAutoPrefs,
  tryStartAutoAttackFromPrefs,
};

window.CombatAutoPrefs = CombatAutoPrefsApi;

ensureLoaded();

export {};
