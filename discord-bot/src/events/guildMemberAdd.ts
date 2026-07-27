import type { Client, GuildMember } from 'discord.js';
import { config } from '../config.js';

function buildWelcomeMessage(member: GuildMember): string {
  const name = member.displayName ?? member.user.username;
  return [
    `Welcome to the server, **${name}**!`,
    'RogueAge is a fantasy MMORPG — farm, craft, clans, and PvP.',
    `Play here: ${config.gameUrl}`,
  ].join('\n');
}

export function bindGuildMemberAddEvent(client: Client): void {
  client.on('guildMemberAdd', async (member) => {
    if (!config.welcomeChannelId) return;

    const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) return;

    await channel.send(buildWelcomeMessage(member)).catch((error) => {
      console.warn('Failed to send welcome message:', error);
    });
  });
}
