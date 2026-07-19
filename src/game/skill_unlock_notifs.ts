/**
 * "New skill" badges: Profile tab → Spellbook button → skill row.
 * Cleared when the player inspects an unlocked skill in the spellbook.
 */

const unseenSkillIds = new Set<string>();

function tn(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function formatCount(n: number, cap = 9): string {
  if (n <= 0) return '';
  return n > cap ? `${cap}+` : String(n);
}

function paintStaticPill(
  el: HTMLElement | null,
  count: number,
  ariaKey: string,
): void {
  if (!el) return;
  if (count <= 0) {
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    el.removeAttribute('aria-label');
    el.classList.remove('nav-notif--active');
    return;
  }

  const label = formatCount(count);
  el.hidden = false;
  el.removeAttribute('aria-hidden');
  el.textContent = label;
  el.setAttribute('aria-label', tn(ariaKey, { count: label }));
  el.classList.add('nav-notif--active');
}

export function getUnseenSkillUnlockIds(): string[] {
  return Array.from(unseenSkillIds);
}

export function countUnseenSkillUnlocks(): number {
  return unseenSkillIds.size;
}

export function hasUnseenSkillUnlock(skillId: string): boolean {
  return unseenSkillIds.has(skillId);
}

export function markSkillsUnseen(skillIds: string[]): void {
  let added = false;
  skillIds.forEach((id) => {
    if (!id || id === 'Attack') return;
    if (!unseenSkillIds.has(id)) {
      unseenSkillIds.add(id);
      added = true;
    }
  });
  if (!added) return;
  syncSkillUnlockNotifUi();
  if (typeof window.salvarJogo === 'function') {
    window.salvarJogo({ silent: true });
  }
}

export function markSkillUnlockSeen(skillId: string): void {
  if (!skillId || !unseenSkillIds.has(skillId)) return;
  unseenSkillIds.delete(skillId);
  syncSkillUnlockNotifUi();
  if (typeof window.salvarJogo === 'function') {
    window.salvarJogo({ silent: true });
  }
}

export function applyUnseenSkillUnlocksFromSave(raw: unknown): void {
  unseenSkillIds.clear();
  if (Array.isArray(raw)) {
    raw.forEach((id) => {
      if (typeof id === 'string' && id.trim() && id !== 'Attack') {
        unseenSkillIds.add(id.trim());
      }
    });
  }
  // Drop ids the character can no longer use (class change / wipe).
  if (typeof window.obterSkillsAprendidas === 'function') {
    const learned = new Set(window.obterSkillsAprendidas().map((s) => s.idNome));
    Array.from(unseenSkillIds).forEach((id) => {
      if (!learned.has(id)) unseenSkillIds.delete(id);
    });
  }
  syncSkillUnlockNotifUi();
}

export function getUnseenSkillUnlocksSavePayload(): string[] {
  return Array.from(unseenSkillIds);
}

export function clearUnseenSkillUnlocks(): void {
  if (unseenSkillIds.size <= 0) {
    syncSkillUnlockNotifUi();
    return;
  }
  unseenSkillIds.clear();
  syncSkillUnlockNotifUi();
}

/** Refresh Profile tab, Spellbook button, and open spellbook row badges. */
export function syncSkillUnlockNotifUi(): void {
  const count = unseenSkillIds.size;

  const profileBtn = document.getElementById('btn-tab-perfil');
  const spellbookBtn = document.getElementById('btn-profile-spellbook');

  paintStaticPill(
    document.getElementById('nav-notif-profile-skills'),
    count,
    'game.spellbook.notifProfileAria',
  );
  paintStaticPill(
    document.getElementById('nav-notif-spellbook'),
    count,
    'game.spellbook.notifSpellbookAria',
  );

  if (profileBtn) {
    profileBtn.classList.toggle('btn-travel--has-notif', count > 0);
  }
  if (spellbookBtn) {
    spellbookBtn.classList.toggle('btn-profile-spellbook--has-notif', count > 0);
  }

  document.querySelectorAll('.spellbook-row[data-skill-name]').forEach((rowEl) => {
    const row = rowEl as HTMLElement;
    const id = row.dataset.skillName || '';
    const isNew = !!(id && unseenSkillIds.has(id) && row.dataset.locked !== '1');
    row.classList.toggle('spellbook-row--new', isNew);

    let badge = row.querySelector('.spellbook-row__new') as HTMLElement | null;
    if (isNew) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'spellbook-row__new';
        row.appendChild(badge);
      }
      badge.textContent = tn('game.spellbook.newBadge');
      badge.hidden = false;
    } else if (badge) {
      badge.hidden = true;
      badge.textContent = '';
    }
  });
}

window.markSkillsUnseen = markSkillsUnseen;
window.markSkillUnlockSeen = markSkillUnlockSeen;
window.hasUnseenSkillUnlock = hasUnseenSkillUnlock;
window.syncSkillUnlockNotifUi = syncSkillUnlockNotifUi;
window.countUnseenSkillUnlocks = countUnseenSkillUnlocks;
window.getUnseenSkillUnlocksSavePayload = getUnseenSkillUnlocksSavePayload;
window.applyUnseenSkillUnlocksFromSave = applyUnseenSkillUnlocksFromSave;
window.clearUnseenSkillUnlocks = clearUnseenSkillUnlocks;

export {};
