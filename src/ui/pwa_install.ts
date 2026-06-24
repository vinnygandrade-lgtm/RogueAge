/**
 * PWA — install prompt + fullscreen bridge
 * Migrado: js/pwa_install.js
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

function t(key: string, params?: Record<string, string | number>): string {
  if (typeof window.t === 'function') {
    try {
      return window.t(key, params);
    } catch {
      /* ignore */
    }
  }
  return key;
}

function isStandalone(): boolean {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if (window.matchMedia?.('(display-mode: fullscreen)').matches) return true;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iOS && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function canRequestFullscreen(): boolean {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  return !!(el && (el.requestFullscreen || el.webkitRequestFullscreen));
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch((err) => {
      console.warn('[PWA] service worker registration failed', err);
    });
  });
}

function markStandaloneClass(): void {
  if (!isStandalone()) return;
  document.documentElement.classList.add('l2-standalone');
}

function getSection(): HTMLElement | null {
  return document.getElementById('settings-pwa-section');
}

function getInstallBtn(): HTMLButtonElement | null {
  return document.getElementById('settings-pwa-install') as HTMLButtonElement | null;
}

function getFullscreenBtn(): HTMLButtonElement | null {
  return document.getElementById('settings-pwa-fullscreen') as HTMLButtonElement | null;
}

function getHintEl(): HTMLElement | null {
  return document.getElementById('settings-pwa-hint');
}

function refreshPwaSettingsUi(): void {
  const section = getSection();
  if (!section) return;

  const standalone = isStandalone();
  const installBtn = getInstallBtn();
  const fullscreenBtn = getFullscreenBtn();
  const hint = getHintEl();

  section.hidden = standalone;

  if (installBtn) {
    installBtn.hidden = standalone || !deferredPrompt;
    installBtn.disabled = !deferredPrompt;
  }

  if (fullscreenBtn) {
    const showFs = !standalone && canRequestFullscreen();
    fullscreenBtn.hidden = !showFs;
  }

  if (hint) {
    const showHint = !standalone && isIosSafari() && !deferredPrompt;
    hint.hidden = !showHint;
    hint.textContent = t('game.settings.pwa.iosHint');
  }

  if (window.I18n?.refreshDom) {
    try {
      window.I18n.refreshDom(section);
    } catch {
      /* ignore */
    }
  }
}

function bindControls(): void {
  const installBtn = getInstallBtn();
  if (installBtn && !installBtn.dataset.bound) {
    installBtn.dataset.bound = '1';
    installBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      void deferredPrompt.prompt();
      void deferredPrompt.userChoice
        .then(() => {
          deferredPrompt = null;
          refreshPwaSettingsUi();
        })
        .catch(() => {
          deferredPrompt = null;
          refreshPwaSettingsUi();
        });
    });
  }

  const fullscreenBtn = getFullscreenBtn();
  if (fullscreenBtn && !fullscreenBtn.dataset.bound) {
    fullscreenBtn.dataset.bound = '1';
    fullscreenBtn.addEventListener('click', () => {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      const req = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
      if (!req) return;
      try {
        const p = req();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          void (p as Promise<void>).catch(() => {
            /* user denied */
          });
        }
      } catch {
        /* ignore */
      }
    });
  }
}

function initEvents(): void {
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    refreshPwaSettingsUi();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    markStandaloneClass();
    refreshPwaSettingsUi();
  });

  if (window.matchMedia) {
    try {
      window.matchMedia('(display-mode: standalone)').addEventListener('change', () => {
        markStandaloneClass();
        refreshPwaSettingsUi();
      });
    } catch {
      /* ignore */
    }
  }
}

registerServiceWorker();
markStandaloneClass();
bindControls();
initEvents();

window.PwaInstall = {
  isStandalone,
  refreshUi: refreshPwaSettingsUi,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshPwaSettingsUi);
} else {
  refreshPwaSettingsUi();
}

export {};
