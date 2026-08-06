/**
 * Patch notes before login — once per notes version (localStorage).
 * Reopen anytime from the login footer.
 */
import { registerGlobal } from '../runtime/register-global';

/** Bump when publishing new dated entries (independent of package.json if needed). */
export const L2MINI_PATCH_NOTES_ID = '1.5.11';

/** ISO date of the newest entry — shown in the header. */
export const L2MINI_PATCH_NOTES_DATE = '2026-08-06';

const STORAGE_KEY = 'l2mini_seen_patch_notes';

type PatchNotesEntry = {
  date?: unknown;
  items?: unknown;
};

function t(key: string, vars?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, vars) : key;
}

function overlayEl(): HTMLElement | null {
  return document.getElementById('patch-notes-overlay');
}

function currentLocale(): string {
  try {
    if (typeof window.I18n?.getLocale === 'function') {
      return window.I18n.getLocale() || 'en';
    }
  } catch {
    /* ignore */
  }
  return 'en';
}

/** Format ISO `YYYY-MM-DD` for the active UI locale. */
function formatPatchDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  if (!m) return isoDate;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const locale = currentLocale() === 'pt-BR' ? 'pt-BR' : 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(dt);
  } catch {
    return isoDate;
  }
}

function isLoginScreenActive(): boolean {
  const login = document.getElementById('screen-login');
  if (!login) return false;
  if (login.classList.contains('active-screen')) return true;
  const style = window.getComputedStyle(login);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function hasSeenCurrentNotes(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === L2MINI_PATCH_NOTES_ID;
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, L2MINI_PATCH_NOTES_ID);
  } catch {
    /* private mode / quota */
  }
}

function readEntries(): PatchNotesEntry[] {
  const raw =
    typeof window.I18n?.getArray === 'function'
      ? window.I18n.getArray('patchNotes.entries')
      : [];
  return raw.filter((e): e is PatchNotesEntry => !!e && typeof e === 'object');
}

function renderNotesContent(): void {
  const versionEl = document.getElementById('patch-notes-version');
  if (versionEl) {
    versionEl.textContent = t('patchNotes.versionLabel', {
      version: L2MINI_PATCH_NOTES_ID,
      date: formatPatchDate(L2MINI_PATCH_NOTES_DATE),
    });
  }

  const list = document.getElementById('patch-notes-list');
  if (!list) return;
  list.replaceChildren();

  const entries = readEntries();
  for (const entry of entries) {
    const dateRaw = typeof entry.date === 'string' ? entry.date.trim() : '';
    const items = Array.isArray(entry.items) ? entry.items : [];
    const texts = items.filter((x): x is string => typeof x === 'string' && !!x.trim());
    if (!dateRaw && !texts.length) continue;

    const block = document.createElement('section');
    block.className = 'patch-notes-entry';

    if (dateRaw) {
      const dateEl = document.createElement('h3');
      dateEl.className = 'patch-notes-entry__date';
      // Prefer ISO → locale format; fall back to the string as authored.
      dateEl.textContent = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
        ? formatPatchDate(dateRaw)
        : dateRaw;
      block.appendChild(dateEl);
    }

    if (texts.length) {
      const ul = document.createElement('ul');
      ul.className = 'patch-notes-entry__items';
      for (const text of texts) {
        const li = document.createElement('li');
        li.className = 'patch-notes-list__item';
        li.textContent = text;
        ul.appendChild(li);
      }
      block.appendChild(ul);
    }

    list.appendChild(block);
  }
}

function refreshOverlayI18n(): void {
  const overlay = overlayEl();
  if (!overlay) return;
  if (typeof window.I18n?.refreshDom === 'function') {
    window.I18n.refreshDom(overlay);
  }
  renderNotesContent();
}

function showPatchNotes(opts?: { force?: boolean }): void {
  const force = opts?.force === true;
  const overlay = overlayEl();
  if (!overlay) return;
  if (!force && !isLoginScreenActive()) return;
  if (!force && hasSeenCurrentNotes()) return;
  if (!force && window.AuthEngine?._passwordRecoveryMode === true) return;

  refreshOverlayI18n();
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
  });

  const continueBtn = document.getElementById('patch-notes-continue');
  if (continueBtn instanceof HTMLButtonElement) {
    continueBtn.focus({ preventScroll: true });
  }
}

function hidePatchNotes(markAsSeen: boolean): void {
  const overlay = overlayEl();
  if (!overlay || overlay.hidden) return;

  if (markAsSeen) markSeen();

  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');

  window.setTimeout(() => {
    if (!overlay.classList.contains('is-open')) {
      overlay.hidden = true;
    }
  }, 220);
}

function dismissPatchNotes(): void {
  hidePatchNotes(true);
}

function tryShowAfterBoot(): void {
  window.setTimeout(() => {
    showPatchNotes({ force: false });
  }, 180);
}

function bindPatchNotesUi(): void {
  const continueBtn = document.getElementById('patch-notes-continue');
  if (continueBtn && continueBtn.dataset.bound !== '1') {
    continueBtn.dataset.bound = '1';
    continueBtn.addEventListener('click', () => dismissPatchNotes());
  }

  const reopenBtn = document.getElementById('patch-notes-reopen');
  if (reopenBtn && reopenBtn.dataset.bound !== '1') {
    reopenBtn.dataset.bound = '1';
    reopenBtn.addEventListener('click', () => showPatchNotes({ force: true }));
  }

  const overlay = overlayEl();
  if (overlay && overlay.dataset.bound !== '1') {
    overlay.dataset.bound = '1';
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) dismissPatchNotes();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && overlay.classList.contains('is-open')) {
        dismissPatchNotes();
      }
    });
  }

  for (const id of ['i18n-btn-en', 'i18n-btn-pt']) {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.patchNotesLocaleBound === '1') continue;
    btn.dataset.patchNotesLocaleBound = '1';
    btn.addEventListener('click', () => {
      window.setTimeout(() => {
        if (overlayEl()?.classList.contains('is-open')) refreshOverlayI18n();
      }, 0);
    });
  }
}

const PatchNotes = {
  id: L2MINI_PATCH_NOTES_ID,
  show: () => showPatchNotes({ force: true }),
  tryShowAfterBoot,
  dismiss: dismissPatchNotes,
};

registerGlobal('PatchNotes', PatchNotes);
bindPatchNotesUi();

export { PatchNotes };
