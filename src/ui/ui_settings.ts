/**
 * UI — game settings (HUD gear + modal)
 * Migrado: js/ui_settings.js
 */

const MODAL_ID = 'janela-game-settings';

function settingsT(key: string, fallback: string, params?: Record<string, string | number>): string {
  if (typeof window.t === 'function') {
    try {
      const v = window.t(key, params);
      if (v && v !== key) return v;
    } catch {
      /* ignore */
    }
  }
  if (params) {
    return fallback.replace(/\{(\w+)\}/g, (_, k: string) =>
      params[k] != null ? String(params[k]) : '{' + k + '}'
    );
  }
  return fallback;
}

function formatVolumePct(vol01: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, vol01)) * 100);
  return settingsT('game.settings.sound.volumePct', '{pct}%', { pct });
}

function paintVolumeSlider(rangeId: string, pctId: string, vol01: number, muted: boolean): void {
  const range = document.getElementById(rangeId) as HTMLInputElement | null;
  const pctEl = document.getElementById(pctId);
  const row = range?.closest('.settings-vol');
  const n = Math.round(Math.max(0, Math.min(1, vol01)) * 100);
  const label = formatVolumePct(n / 100);
  if (range) {
    if (document.activeElement !== range) {
      range.value = String(n);
    }
    const shown = Number(range.value);
    const fillN = Number.isFinite(shown) ? shown : n;
    const bar = range.closest('.settings-vol__bar') as HTMLElement | null;
    if (bar) bar.style.setProperty('--vol-n', String(fillN));
    range.setAttribute('aria-valuenow', String(n));
    range.setAttribute('aria-valuetext', label);
  }
  if (pctEl) pctEl.textContent = label;
  if (row) row.classList.toggle('settings-vol--muted', muted);
}

function syncLangActiveState(): void {
  const loc =
    typeof window.I18n !== 'undefined' && window.I18n.getLocale
      ? window.I18n.getLocale()
      : 'en';
  const en = document.getElementById('settings-lang-en');
  const pt = document.getElementById('settings-lang-pt');
  if (en) en.classList.toggle('settings-lang-btn--active', loc === 'en');
  if (pt) pt.classList.toggle('settings-lang-btn--active', loc === 'pt-BR');
}

function bindLangButtons(): void {
  const en = document.getElementById('settings-lang-en');
  const pt = document.getElementById('settings-lang-pt');
  if (en && !en.dataset.bound) {
    en.dataset.bound = '1';
    en.addEventListener('click', () => {
      window.I18n?.setLocale('en');
    });
  }
  if (pt && !pt.dataset.bound) {
    pt.dataset.bound = '1';
    pt.addEventListener('click', () => {
      window.I18n?.setLocale('pt-BR');
    });
  }
}

function syncLayoutSettings(): void {
  window.LayoutMode?.bindSettingsButtons?.();
  window.LayoutMode?.syncSettingsButtons?.();
}

function paintSettingsSwitch(btn: HTMLElement | null, enabled: boolean): void {
  if (!btn) return;
  btn.classList.toggle('settings-switch--on', enabled);
  btn.classList.toggle('settings-switch--off', !enabled);
  btn.setAttribute('aria-checked', enabled ? 'true' : 'false');
  const state = btn.querySelector('.settings-switch__state');
  if (state) {
    state.setAttribute('data-i18n', enabled ? 'game.settings.sound.on' : 'game.settings.sound.off');
    state.textContent = enabled
      ? settingsT('game.settings.sound.on', 'ON')
      : settingsT('game.settings.sound.off', 'OFF');
  }
}

function syncSoundSettings(): void {
  const musicOn =
    typeof window.AudioPrefs?.isMusicEnabled === 'function'
      ? window.AudioPrefs.isMusicEnabled()
      : true;
  const battleOn =
    typeof window.AudioPrefs?.isBattleSfxEnabled === 'function'
      ? window.AudioPrefs.isBattleSfxEnabled()
      : true;
  paintSettingsSwitch(document.getElementById('settings-toggle-music'), musicOn);
  paintSettingsSwitch(document.getElementById('settings-toggle-battle'), battleOn);
  const musicVol =
    typeof window.AudioPrefs?.getMusicVolume === 'function'
      ? window.AudioPrefs.getMusicVolume()
      : 1;
  const battleVol =
    typeof window.AudioPrefs?.getBattleVolume === 'function'
      ? window.AudioPrefs.getBattleVolume()
      : 1;
  paintVolumeSlider('settings-music-vol', 'settings-music-vol-pct', musicVol, !musicOn);
  paintVolumeSlider('settings-battle-vol', 'settings-battle-vol-pct', battleVol, !battleOn);
}

function syncCombatAutoSettings(): void {
  const as =
    typeof window.CombatAutoPrefs?.isAutoShotOnLoadEnabled === 'function'
      ? window.CombatAutoPrefs.isAutoShotOnLoadEnabled()
      : false;
  paintSettingsSwitch(document.getElementById('settings-toggle-auto-shot'), as);
}

function bindVolumeSlider(
  id: string,
  apply: (vol01: number) => void
): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || el.dataset.bound) return;
  el.dataset.bound = '1';
  const onChange = () => {
    if (typeof window.unlockGameAudio === 'function') window.unlockGameAudio();
    const n = Number(el.value);
    apply(Number.isFinite(n) ? n / 100 : 1);
    syncSoundSettings();
  };
  el.addEventListener('input', onChange);
  el.addEventListener('change', onChange);
}

function bindSoundButtons(): void {
  const musicBtn = document.getElementById('settings-toggle-music');
  const battleBtn = document.getElementById('settings-toggle-battle');
  bindVolumeSlider('settings-music-vol', (v) => {
    window.AudioPrefs?.setMusicVolume?.(v);
  });
  bindVolumeSlider('settings-battle-vol', (v) => {
    window.AudioPrefs?.setBattleVolume?.(v);
  });
  if (musicBtn && !musicBtn.dataset.bound) {
    musicBtn.dataset.bound = '1';
    musicBtn.addEventListener('click', () => {
      if (typeof window.AudioPrefs?.toggleMusicEnabled === 'function') {
        window.AudioPrefs.toggleMusicEnabled();
      }
      if (typeof window.unlockGameAudio === 'function') window.unlockGameAudio();
      syncSoundSettings();
    });
  }
  if (battleBtn && !battleBtn.dataset.bound) {
    battleBtn.dataset.bound = '1';
    battleBtn.addEventListener('click', () => {
      if (typeof window.AudioPrefs?.toggleBattleSfxEnabled === 'function') {
        window.AudioPrefs.toggleBattleSfxEnabled();
      }
      if (typeof window.unlockGameAudio === 'function') window.unlockGameAudio();
      syncSoundSettings();
    });
  }
}

function bindCombatAutoButtons(): void {
  const asBtn = document.getElementById('settings-toggle-auto-shot');
  if (asBtn && !asBtn.dataset.bound) {
    asBtn.dataset.bound = '1';
    asBtn.addEventListener('click', () => {
      if (typeof window.CombatAutoPrefs?.toggleAutoShotOnLoad === 'function') {
        window.CombatAutoPrefs.toggleAutoShotOnLoad();
      }
      if (typeof window.unlockGameAudio === 'function') window.unlockGameAudio();
      syncCombatAutoSettings();
    });
  }
}

function refreshAllSettingsControls(): void {
  syncLangActiveState();
  syncLayoutSettings();
  syncSoundSettings();
  syncCombatAutoSettings();
}

function refreshGameSettingsUi(): void {
  refreshAllSettingsControls();
  if (window.PwaInstall?.refreshUi) {
    try {
      window.PwaInstall.refreshUi();
    } catch {
      /* ignore */
    }
  }
  const root = document.getElementById(MODAL_ID);
  if (!root || root.style.display === 'none') return;
  if (window.I18n?.refreshDom) {
    try {
      window.I18n.refreshDom(root);
    } catch {
      /* ignore */
    }
  }
  // Keep ON/OFF labels correct after i18n refresh of data-i18n nodes.
  syncSoundSettings();
  syncCombatAutoSettings();
}

function abrirGameSettings(): void {
  if (typeof window.abrirModal !== 'function') return;
  bindLangButtons();
  bindSoundButtons();
  bindCombatAutoButtons();
  refreshAllSettingsControls();
  if (window.PwaInstall?.refreshUi) {
    try {
      window.PwaInstall.refreshUi();
    } catch {
      /* ignore */
    }
  }
  const root = document.getElementById(MODAL_ID);
  if (root && window.I18n?.refreshDom) {
    try {
      window.I18n.refreshDom(root);
    } catch {
      /* ignore */
    }
  }
  syncSoundSettings();
  syncCombatAutoSettings();
  window.abrirModal(MODAL_ID);
  window.syncNavMenuActiveItem?.();
}

function fecharGameSettings(): void {
  window.fecharModal?.(MODAL_ID);
  window.syncNavMenuActiveItem?.();
}

function initHudSettings(): void {
  bindLangButtons();
  bindSoundButtons();
  bindCombatAutoButtons();
  refreshAllSettingsControls();
}

window.abrirGameSettings = abrirGameSettings;
window.fecharGameSettings = fecharGameSettings;
window.refreshGameSettingsUi = refreshGameSettingsUi;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHudSettings);
} else {
  initHudSettings();
}

export {};
