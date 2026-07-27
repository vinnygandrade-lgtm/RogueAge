import { SlashCommandBuilder } from 'discord.js';
import { config } from '../config.js';
import type { SlashCommandDefinition } from './types.js';

export const gameCommand: SlashCommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Get the RogueAge play link.'),
  async execute(interaction) {
    await interaction.reply({
      content: [
        '**RogueAge** — fantasy MMORPG inspired by classic siege MMOs.',
        `Play: ${config.gameUrl}`,
        'Install from the browser (PWA) for a better mobile experience.',
      ].join('\n'),
    });
  },
};
