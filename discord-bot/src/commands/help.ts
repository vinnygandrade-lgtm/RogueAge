import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommandDefinition } from './types.js';

export const helpCommand: SlashCommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List available RogueAge bot commands.'),
  async execute(interaction) {
    await interaction.reply({
      content: [
        '**RogueAge Bot — commands**',
        '`/ping` — bot health check',
        '`/game` — play link and quick info',
        '`/announce` — staff announcement (Manage Messages or staff role)',
      ].join('\n'),
      ephemeral: true,
    });
  },
};
