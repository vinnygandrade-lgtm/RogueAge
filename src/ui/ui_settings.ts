/**
 * UI — game settings (HUD gear + modal)
 * Migrado: js/ui_settings.js
 */

const MODAL_ID = 'janela-game-settings';

function settingsT(key: string, fallback: string): string {
  if (typeof window.t === 'function') {
    try {
      const v = window.t(key);
      if (v && v !== key) return v;
    } catch {
      /* ignore */
    }
  }
  return fallback;
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

function paintSoundSwitch(btn: HTMLElement | null, enabled: boolean): void {
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
  paintSoundSwitch(document.getElementById('settings-toggle-music'), musicOn);
  paintSoundSwitch(document.getElementById('settings-toggle-battle'), battleOn);
}

function bindSoundButtons(): void {
  const musicBtn = document.getElementById('settings-toggle-music');
  const battleBtn = document.getElementById('settings-toggle-battle');
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

function refreshGameSettingsUi(): void {
  syncLangActiveState();
  syncLayoutSettings();
  syncSoundSettings();
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
}

function abrirGameSettings(): void {
  if (typeof window.abrirModal !== 'function') return;
  bindLangButtons();
  bindSoundButtons();
  syncLangActiveState();
  syncLayoutSettings();
  syncSoundSettings();
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
  syncLangActiveState();
  syncLayoutSettings();
  syncSoundSettings();
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
