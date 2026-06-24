/**
 * UI — game settings (HUD gear + modal)
 * Migrado: js/ui_settings.js
 */

const MODAL_ID = 'janela-game-settings';

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

function refreshGameSettingsUi(): void {
  syncLangActiveState();
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
}

function abrirGameSettings(): void {
  if (typeof window.abrirModal !== 'function') return;
  bindLangButtons();
  syncLangActiveState();
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
  window.abrirModal(MODAL_ID);
}

function fecharGameSettings(): void {
  window.fecharModal?.(MODAL_ID);
}

function initHudSettings(): void {
  const btn = document.getElementById('btn-hud-settings');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', abrirGameSettings);
  }
  bindLangButtons();
  syncLangActiveState();
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
