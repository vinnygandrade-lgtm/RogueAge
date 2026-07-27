/**
 * Default Auto-Shot preference (device-local).
 * Applied when a character loads and when a new fight starts.
 */

export type CombatAutoPrefs = {
  autoShotOnLoad: boolean;
};

const STORAGE_KEY = 'l2mini_combat_auto_prefs';

const DEFAULT_PREFS: CombatAutoPrefs = {
  autoShotOnLoad: false,
};

let prefs: CombatAutoPrefs = { ...DEFAULT_PREFS };
let loaded = false;

function readStored(): CombatAutoPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<CombatAutoPrefs> & { autoAttackOnLoad?: boolean };
    return {
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

export function getCombatAutoPrefs(): CombatAutoPrefs {
  ensureLoaded();
  return { ...prefs };
}

export function isAutoShotOnLoadEnabled(): boolean {
  ensureLoaded();
  return prefs.autoShotOnLoad;
}

export function setAutoShotOnLoad(enabled: boolean): void {
  ensureLoaded();
  prefs.autoShotOnLoad = !!enabled;
  persist();
  applyCombatAutoPrefs();
}

export function toggleAutoShotOnLoad(): boolean {
  setAutoShotOnLoad(!isAutoShotOnLoadEnabled());
  return isAutoShotOnLoadEnabled();
}

/** Apply saved Auto-Shot default to the hotbar chip. */
export function applyCombatAutoPrefs(_opts?: { startAttackLoop?: boolean }): void {
  ensureLoaded();

  if (isOlympiadArenaOpen()) {
    refreshHotbar();
    return;
  }

  window.autoShotAtivo = !!prefs.autoShotOnLoad;
  refreshHotbar();
}

/** Re-arm Auto-Shot when a new forest/raid fight becomes live. */
export function tryStartAutoAttackFromPrefs(): void {
  ensureLoaded();
  if (isOlympiadArenaOpen()) return;
  if (!prefs.autoShotOnLoad) {
    refreshHotbar();
    return;
  }
  window.autoShotAtivo = true;
  refreshHotbar();
}

const CombatAutoPrefsApi = {
  get: getCombatAutoPrefs,
  isAutoShotOnLoadEnabled,
  setAutoShotOnLoad,
  toggleAutoShotOnLoad,
  applyCombatAutoPrefs,
  tryStartAutoAttackFromPrefs,
};

window.CombatAutoPrefs = CombatAutoPrefsApi;

ensureLoaded();

export {};
