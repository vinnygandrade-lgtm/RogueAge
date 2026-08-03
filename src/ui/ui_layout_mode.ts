/**
 * UI layout mode — portrait (mobile vertical) is the product default.
 * Landscape / PC wide layout is frozen: always resolve to portrait so the
 * tall phone shell stays authoritative. shell-landscape.css is kept in the
 * repo but not activated until a future PC redesign.
 */

import { registerGlobal } from '../runtime/register-global';

export type UiLayoutPreference = 'auto' | 'portrait' | 'landscape';
export type UiLayoutEffective = 'portrait' | 'landscape';

const STORAGE_KEY = 'l2mini_layout';
const ATTR = 'data-l2-layout';

/** Product decision: invest in vertical mobile only for now. */
const FORCE_PORTRAIT = true;

let preference: UiLayoutPreference = 'portrait';
let effective: UiLayoutEffective = 'portrait';
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function normalizePreference(raw: unknown): UiLayoutPreference {
  if (raw === 'portrait' || raw === 'landscape' || raw === 'auto') return raw;
  return 'portrait';
}

function readDevicePreference(): UiLayoutPreference {
  if (FORCE_PORTRAIT) return 'portrait';
  try {
    return normalizePreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'portrait';
  }
}

function writeDevicePreference(mode: UiLayoutPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

function detectAutoLayout(): UiLayoutEffective {
  return 'portrait';
}

function resolveEffective(_pref: UiLayoutPreference): UiLayoutEffective {
  if (FORCE_PORTRAIT) return 'portrait';
  if (_pref === 'portrait' || _pref === 'landscape') return _pref;
  return detectAutoLayout();
}

function applyDom(next: UiLayoutEffective): void {
  const prev = effective;
  effective = next;
  document.documentElement.setAttribute(ATTR, next);
  const shell = document.querySelector('.game-container');
  if (shell) {
    shell.classList.toggle('l2-layout-landscape', next === 'landscape');
    shell.classList.toggle('l2-layout-portrait', next === 'portrait');
  }
  if (prev !== next) {
    try {
      window.dispatchEvent(
        new CustomEvent('l2-layout-change', { detail: { layout: next, previous: prev } }),
      );
    } catch {
      /* ignore */
    }
  }
}

function refresh(): UiLayoutEffective {
  const next = resolveEffective(preference);
  applyDom(next);
  return next;
}

function onViewportChange(): void {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeTimer = null;
    refresh();
  }, 80);
}

function ensureListeners(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
}

function getPreference(): UiLayoutPreference {
  return FORCE_PORTRAIT ? 'portrait' : preference;
}

function getEffective(): UiLayoutEffective {
  return effective;
}

function setPreference(mode: unknown, opts?: { persistSave?: boolean }): UiLayoutPreference {
  if (FORCE_PORTRAIT) {
    preference = 'portrait';
    writeDevicePreference('portrait');
    refresh();
    syncSettingsButtons();
    return preference;
  }
  preference = normalizePreference(mode);
  writeDevicePreference(preference);
  refresh();
  if (opts?.persistSave !== false && typeof window.charName === 'string' && window.charName) {
    try {
      window.salvarJogo?.();
    } catch {
      /* ignore */
    }
  }
  syncSettingsButtons();
  return preference;
}

function applyFromSave(mode: unknown): void {
  if (FORCE_PORTRAIT) {
    preference = 'portrait';
    writeDevicePreference('portrait');
    refresh();
    syncSettingsButtons();
    return;
  }
  if (mode == null || mode === '') return;
  preference = normalizePreference(mode);
  writeDevicePreference(preference);
  refresh();
  syncSettingsButtons();
}

function syncSettingsButtons(): void {
  const root = document.getElementById('janela-game-settings');
  if (!root) return;
  root.querySelectorAll<HTMLElement>('[data-layout-pref]').forEach((btn) => {
    const pref = btn.getAttribute('data-layout-pref');
    btn.classList.toggle('settings-layout-btn--active', pref === getPreference());
  });
  const row = root.querySelector('.settings-layout-row') as HTMLElement | null;
  if (row && FORCE_PORTRAIT) {
    row.hidden = true;
  }
}

function bindSettingsButtons(): void {
  const root = document.getElementById('janela-game-settings');
  if (!root) return;
  root.querySelectorAll<HTMLElement>('[data-layout-pref]').forEach((btn) => {
    if (btn.dataset.boundLayout === '1') return;
    btn.dataset.boundLayout = '1';
    btn.addEventListener('click', () => {
      setPreference(btn.getAttribute('data-layout-pref'));
    });
  });
}

function init(): void {
  preference = readDevicePreference();
  if (FORCE_PORTRAIT) {
    writeDevicePreference('portrait');
  }
  ensureListeners();
  refresh();
  bindSettingsButtons();
  syncSettingsButtons();
}

const LayoutMode = {
  STORAGE_KEY,
  FORCE_PORTRAIT,
  getPreference,
  getEffective,
  setPreference,
  applyFromSave,
  refresh,
  init,
  syncSettingsButtons,
  bindSettingsButtons,
  normalizePreference,
};

registerGlobal('LayoutMode', LayoutMode);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}

export default LayoutMode;
