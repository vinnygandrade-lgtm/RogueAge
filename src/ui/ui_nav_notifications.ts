/**
 * Notificações do Quick Menu — badge no tab MENU + badges por destino.
 * Fontes: mailbox, rewards GM, missões, conquistas, patentes Olympiad, guerra de clãs (líder).
 */

interface NavMenuNotifState {
  mail: number;
  rewards: number;
  retention: number;
  missions: number;
  achievements: number;
  olympiad: number;
  clanWar: number;
}

const state: NavMenuNotifState = {
  mail: 0,
  rewards: 0,
  retention: 0,
  missions: 0,
  achievements: 0,
  olympiad: 0,
  clanWar: 0,
};

function formatCount(n: number, cap: number): string {
  if (n <= 0) return '';
  return n > cap ? `${cap}+` : String(n);
}

function isClanLeaderNav(): boolean {
  return !!(
    Array.isArray(window.clans)
    && window.playerClanId
    && window.clans.find((c) => c.id === window.playerClanId)?.lider === window.charName
  );
}

function syncExtendedNavCounts(): void {
  state.olympiad = Math.max(0, window.OlympiadEngine?.countClaimableRankRewards?.() ?? 0);
  state.clanWar = isClanLeaderNav() ? 1 : 0;
  if (typeof window.contarPendenciasLevelRewards === 'function') {
    state.achievements = Math.max(0, window.contarPendenciasLevelRewards() || 0);
  }
}

function syncLeaderMenuItemVisibility(): void {
  const cwBtn = document.getElementById('nav-menu-clanwar');
  if (!cwBtn) return;
  cwBtn.hidden = !isClanLeaderNav();
}

function paintNotifPill(
  el: HTMLElement | null,
  count: number,
  cap: number,
  variant: 'mail' | 'missions' | 'achievements' | 'rewards' | 'olympiad' | 'clanwar' | 'tab',
): void {
  if (!el) return;
  if (count <= 0) {
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    el.removeAttribute('aria-label');
    return;
  }

  const isDot = variant === 'clanwar';
  const label = isDot ? '1' : formatCount(count, cap);

  el.hidden = false;
  el.removeAttribute('aria-hidden');
  el.textContent = isDot ? '' : label;

  const key =
    variant === 'mail'
      ? 'navMenu.notifMail'
      : variant === 'missions'
        ? 'navMenu.notifMissions'
        : variant === 'achievements'
          ? 'navMenu.notifAchievements'
          : variant === 'rewards'
            ? 'navMenu.notifRewards'
            : variant === 'olympiad'
              ? 'navMenu.notifOlympiad'
              : variant === 'clanwar'
                ? 'navMenu.notifClanWar'
                : 'navMenu.notifTab';

  const fallback =
    variant === 'mail'
      ? '{count} mailbox'
      : variant === 'missions'
        ? '{count} missions'
        : variant === 'achievements'
          ? '{count} achievements'
          : variant === 'rewards'
            ? '{count} rewards'
            : variant === 'olympiad'
              ? '{count} olympiad rewards'
              : variant === 'clanwar'
                ? 'Clan War available'
                : '{count} pending';

  el.setAttribute(
    'aria-label',
    typeof window.t === 'function'
      ? window.t(key, { count: isDot ? '1' : label })
      : fallback.replace('{count}', isDot ? '1' : label),
  );
}

function refreshNavMenuNotifications(partial?: Partial<NavMenuNotifState>): void {
  if (partial) {
    if (partial.mail !== undefined) state.mail = Math.max(0, partial.mail);
    if (partial.rewards !== undefined) state.rewards = Math.max(0, partial.rewards);
    if (partial.retention !== undefined) state.retention = Math.max(0, partial.retention);
    if (partial.missions !== undefined) state.missions = Math.max(0, partial.missions);
    if (partial.achievements !== undefined) state.achievements = Math.max(0, partial.achievements);
    if (partial.olympiad !== undefined) state.olympiad = Math.max(0, partial.olympiad);
    if (partial.clanWar !== undefined) state.clanWar = Math.max(0, partial.clanWar);
  }

  syncExtendedNavCounts();
  syncLeaderMenuItemVisibility();

  const tabBtn = document.getElementById('btn-tab-menu');
  const mailBtn = document.getElementById('nav-menu-mailbox');
  const retentionBtn = document.getElementById('nav-menu-retention');
  const missBtn = document.getElementById('nav-menu-missions');
  const achBtn = document.getElementById('nav-menu-achievements');
  const olyBtn = document.getElementById('nav-menu-olympiad');
  const cwBtn = document.getElementById('nav-menu-clanwar');
  const tabNotif = document.getElementById('nav-notif-tab');
  const mailNotif = document.getElementById('nav-notif-mail');
  const retentionNotif = document.getElementById('nav-notif-retention');
  const rewardsNotif = document.getElementById('nav-notif-rewards');
  const missNotif = document.getElementById('nav-notif-missions');
  const achNotif = document.getElementById('nav-notif-achievements');
  const olyNotif = document.getElementById('nav-notif-olympiad');
  const cwNotif = document.getElementById('nav-notif-clanwar');

  paintNotifPill(mailNotif, state.mail, 99, 'mail');
  paintNotifPill(retentionNotif, state.retention, 9, 'missions');
  paintNotifPill(rewardsNotif, state.rewards, 9, 'rewards');
  paintNotifPill(missNotif, state.missions, 9, 'missions');
  paintNotifPill(achNotif, state.achievements, 99, 'achievements');
  paintNotifPill(olyNotif, state.olympiad, 9, 'olympiad');
  paintNotifPill(cwNotif, state.clanWar, 1, 'clanwar');

  const tabTotal =
    state.mail + state.rewards + state.retention + state.missions + state.achievements + state.olympiad + state.clanWar;
  paintNotifPill(tabNotif, tabTotal, 99, 'tab');

  if (mailBtn) {
    mailBtn.classList.toggle('nav-menu-item--has-notif', state.mail > 0 || state.rewards > 0);
    mailBtn.classList.toggle('notif-icon-flashing', state.mail > 0);
    mailBtn.classList.toggle('nav-menu-item--has-rewards', state.rewards > 0);
  }
  if (retentionBtn) {
    retentionBtn.classList.toggle('nav-menu-item--has-notif', state.retention > 0);
    retentionBtn.classList.toggle('notif-icon-flashing', state.retention > 0);
  }
  if (missBtn) {
    missBtn.classList.toggle('nav-menu-item--has-notif', state.missions > 0);
    missBtn.classList.toggle('notif-icon-flashing', state.missions > 0);
  }
  if (achBtn) {
    achBtn.classList.toggle('nav-menu-item--has-notif', state.achievements > 0);
    achBtn.classList.toggle('notif-icon-flashing', state.achievements > 0);
  }
  if (olyBtn) {
    olyBtn.classList.toggle('nav-menu-item--has-notif', state.olympiad > 0);
    olyBtn.classList.toggle('nav-menu-item--has-olympiad', state.olympiad > 0);
  }
  if (cwBtn) {
    cwBtn.classList.toggle('nav-menu-item--has-notif', state.clanWar > 0);
  }
  if (tabBtn) {
    tabBtn.classList.toggle('btn-travel--has-notif', tabTotal > 0);
  }
  if (tabNotif) {
    tabNotif.classList.toggle('nav-notif--active', tabTotal > 0);
  }

  syncWorldCardNotifs();
  window.maybeShowNavCoachToasts?.(state.mail + state.rewards, state.missions);
}

function syncWorldCardNotifs(): void {
  const olyCard = document.getElementById('card-olympiad-world');
  const olyPill = document.getElementById('world-notif-olympiad');
  const cwCard = document.getElementById('card-clan-war-world');
  const cwPill = document.getElementById('world-notif-clanwar');

  if (olyPill) {
    if (state.olympiad > 0) {
      const label = state.olympiad > 9 ? '9+' : String(state.olympiad);
      olyPill.hidden = false;
      olyPill.removeAttribute('aria-hidden');
      olyPill.textContent = label;
      olyPill.setAttribute(
        'aria-label',
        typeof window.t === 'function'
          ? window.t('game.world.notifOlympiad', { count: label })
          : `${label} olympiad rewards`,
      );
    } else {
      olyPill.hidden = true;
      olyPill.setAttribute('aria-hidden', 'true');
      olyPill.textContent = '';
      olyPill.removeAttribute('aria-label');
    }
  }
  olyCard?.classList.toggle('adv-card--has-notif', state.olympiad > 0);

  if (cwPill) {
    if (state.clanWar > 0) {
      cwPill.hidden = false;
      cwPill.removeAttribute('aria-hidden');
      cwPill.textContent = '';
      cwPill.setAttribute(
        'aria-label',
        typeof window.t === 'function' ? window.t('game.world.notifClanWar') : 'Clan War available',
      );
    } else {
      cwPill.hidden = true;
      cwPill.setAttribute('aria-hidden', 'true');
      cwPill.removeAttribute('aria-label');
    }
  }
  cwCard?.classList.toggle('adv-card--has-notif', state.clanWar > 0);
}

/** Animação curta quando chega recompensa GM nova (reward_engine). */
function pingNavMailNotif(): void {
  const mailEl = document.getElementById('nav-notif-mail');
  const rewardsEl = document.getElementById('nav-notif-rewards');
  const target = (rewardsEl && !rewardsEl.hidden) ? rewardsEl : mailEl;
  if (!target || target.hidden) return;
  target.classList.remove('nav-notif--ping');
  void target.offsetWidth;
  target.classList.add('nav-notif--ping');
}

window.refreshNavMenuNotifications = refreshNavMenuNotifications;
window.pingNavMailNotif = pingNavMailNotif;

export {};
