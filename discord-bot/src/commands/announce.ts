import {
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { config } from '../config.js';
import type { SlashCommandDefinition } from './types.js';

function canAnnounce(interaction: Parameters<SlashCommandDefinition['execute']>[0]): boolean {
  const member = interaction.member;
  if (!member || typeof member === 'string') return false;

  const permissions = member.permissions;
  if (typeof permissions !== 'string' && permissions.has(PermissionFlagsBits.ManageMessages)) {
    return true;
  }

  if (!config.staffRoleIds.length) {
    return false;
  }

  const roleIds = 'roles' in member
    ? member.roles
    : [];

  const normalizedRoleIds = Array.isArray(roleIds)
    ? roleIds
    : roleIds instanceof Set
      ? [...roleIds]
      : [];

  return config.staffRoleIds.some((roleId) => normalizedRoleIds.includes(roleId));
}

export const announceCommand: SlashCommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post a staff announcement in this channel.')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Announcement text')
        .setRequired(true)
        .setMaxLength(1800),
    )
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Optional title')
        .setMaxLength(120),
    ),
  async execute(interaction) {
    if (!canAnnounce(interaction)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message', true);
    const author = interaction.user.displayName ?? interaction.user.username;

    const content = title
      ? `**${title}**\n${message}\n\n— ${author}`
      : `${message}\n\n— ${author}`;

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({
        content: 'Announcements can only be posted in server text channels.',
        ephemeral: true,
      });
      return;
    }

    await channel.send(content);
    await interaction.reply({
      content: 'Announcement posted.',
      ephemeral: true,
    });
  },
};
