/**
 * UI layout mode — portrait (mobile) vs landscape (PC).
 * Preference: auto | portrait | landscape → effective data-l2-layout on <html>.
 */

import { registerGlobal } from '../runtime/register-global';

export type UiLayoutPreference = 'auto' | 'portrait' | 'landscape';
export type UiLayoutEffective = 'portrait' | 'landscape';

const STORAGE_KEY = 'l2mini_layout';
const ATTR = 'data-l2-layout';
const WIDE_MIN_PX = 900;
const WIDE_RATIO = 1.2;

let preference: UiLayoutPreference = 'auto';
let effective: UiLayoutEffective = 'portrait';
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function normalizePreference(raw: unknown): UiLayoutPreference {
  if (raw === 'portrait' || raw === 'landscape' || raw === 'auto') return raw;
  return 'auto';
}

function readDevicePreference(): UiLayoutPreference {
  try {
    return normalizePreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'auto';
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
  const w = window.innerWidth || document.documentElement.clientWidth || 0;
  const h = window.innerHeight || document.documentElement.clientHeight || 1;
  const ratio = w / Math.max(h, 1);
  const landscapeOrientation =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(orientation: landscape)').matches;
  // Desktop mouse/trackpad: wide window → PC layout (don't require orientation)
  const desktopPointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(pointer: coarse)').matches;
  if (w >= WIDE_MIN_PX && (desktopPointer || landscapeOrientation || ratio >= WIDE_RATIO)) {
    return 'landscape';
  }
  return 'portrait';
}

function resolveEffective(pref: UiLayoutPreference): UiLayoutEffective {
  if (pref === 'portrait' || pref === 'landscape') return pref;
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
  return preference;
}

function getEffective(): UiLayoutEffective {
  return effective;
}

function setPreference(mode: unknown, opts?: { persistSave?: boolean }): UiLayoutPreference {
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
    btn.classList.toggle('settings-layout-btn--active', pref === preference);
  });
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
  ensureListeners();
  refresh();
  bindSettingsButtons();
  syncSettingsButtons();
}

const LayoutMode = {
  STORAGE_KEY,
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
