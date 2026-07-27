import { COMMUNITY_LINKS, isDiscordInviteConfigured } from '../config/community_links.js';

function applyLoginDiscordLink(): void {
  const link = document.getElementById('login-discord-link');
  if (!(link instanceof HTMLAnchorElement)) return;

  if (!isDiscordInviteConfigured()) {
    link.hidden = true;
    return;
  }

  link.href = COMMUNITY_LINKS.discordInviteUrl.trim();
  link.hidden = false;

  if (link.dataset.bound === '1') return;
  link.dataset.bound = '1';

  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.open(link.href, '_blank', 'noopener,noreferrer');
  });
}

function initLoginDiscordLink(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLoginDiscordLink, { once: true });
    return;
  }
  applyLoginDiscordLink();
}

initLoginDiscordLink();
