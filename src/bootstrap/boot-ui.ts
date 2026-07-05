/** Bloqueia login até todos os scripts legados estarem prontos. */

const BOOT_BODY_CLASS = 'l2-boot-pending';
const BOOT_HIDE_MS = 160;

function overlayEl(): HTMLElement | null {
  return document.getElementById('loading-overlay');
}

function barFillEl(): HTMLElement | null {
  return document.getElementById('loading-bar-fill');
}

function statusEl(): HTMLElement | null {
  return document.getElementById('loading-status');
}

export function setLoginFormEnabled(enabled: boolean): void {
  const root = document.getElementById('screen-login');
  if (!root) return;
  root.querySelectorAll('input, button').forEach((el) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) {
      el.disabled = !enabled;
    }
  });
  root.style.opacity = enabled ? '1' : '0.55';
  root.style.pointerEvents = enabled ? '' : 'none';
}

export function setBootProgress(percent: number, message?: string): void {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  window.__L2MINI_BOOT_PROGRESS = pct;

  const fill = barFillEl();
  if (fill) {
    fill.style.width = `${pct}%`;
    fill.setAttribute('aria-valuenow', String(pct));
  }

  const status = statusEl();
  if (status && message) {
    status.textContent = message;
  } else if (status && typeof window.t === 'function') {
    status.textContent = window.t('loading.progressPct', { pct: String(pct) });
  }

  const overlay = overlayEl();
  if (overlay) {
    overlay.setAttribute('aria-valuenow', String(pct));
  }
}

export function sealStaffModalsOnBoot(): void {
  for (const id of ['janela-gm-panel', 'janela-reward-hub']) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
}

export function showBootLoading(message?: string): void {
  sealStaffModalsOnBoot();

  document.body.classList.add(BOOT_BODY_CLASS);

  const overlay = overlayEl();
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.setAttribute('aria-busy', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('loading-overlay--boot');
  }

  const fill = barFillEl();
  if (fill) {
    fill.classList.remove('loading-bar-fill--indeterminate');
    fill.classList.add('loading-bar-fill--determinate');
    fill.style.width = '0%';
    fill.setAttribute('aria-valuenow', '0');
  }

  if (message) {
    const status = statusEl();
    if (status) status.textContent = message;
  }

  setLoginFormEnabled(false);
}

function hideBootOverlay(fadeMs: number = BOOT_HIDE_MS): void {
  const overlay = overlayEl();
  if (!overlay) return;

  overlay.style.pointerEvents = 'none';
  overlay.style.opacity = '0';
  overlay.setAttribute('aria-busy', 'false');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('loading-overlay--boot');

  window.setTimeout(() => {
    overlay.style.display = 'none';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
  }, fadeMs);
}

export function finishBootLoading(): void {
  window.__L2MINI_BOOT_READY = true;
  window.__L2MINI_BOOT_PROGRESS = 100;

  setBootProgress(
    100,
    typeof window.t === 'function' ? window.t('loading.ready') : 'Ready!',
  );

  document.body.classList.remove(BOOT_BODY_CLASS);
  setLoginFormEnabled(true);
  sealStaffModalsOnBoot();

  // Um único fade curto — não delegar ao AuthEngine (evita 2 timeouts em cascata).
  hideBootOverlay(BOOT_HIDE_MS);
}

/** Usado por AuthEngine após operações de login (não confundir com boot inicial). */
export function hideLoadingOverlay(): void {
  hideBootOverlay(220);
}

/** Re-exibe overlay (auth / pós-boot). */
export function showLoadingOverlay(message?: string): void {
  const overlay = overlayEl();
  if (!overlay) return;

  overlay.classList.remove('loading-overlay--boot');
  const fill = barFillEl();
  if (fill) {
    fill.style.width = '';
    fill.classList.remove('loading-bar-fill--determinate');
    fill.classList.add('loading-bar-fill--indeterminate');
  }

  if (message) {
    const status = statusEl();
    if (status) status.textContent = message;
  }

  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'auto';
  overlay.setAttribute('aria-hidden', 'false');
}
