/**
 * Public community links shown in the client (login chip, etc.).
 * Discord: Server Settings → Invites → Create Invite → copy link.
 */
export const COMMUNITY_LINKS = {
  discordInviteUrl: 'https://discord.gg/8yNR23GcVX',
} as const;

export function isDiscordInviteConfigured(): boolean {
  const url = COMMUNITY_LINKS.discordInviteUrl.trim();
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
