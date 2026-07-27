import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommandDefinition } from './types.js';

export const pingCommand: SlashCommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the RogueAge bot is online.'),
  async execute(interaction) {
    const latency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.reply({
      content: `Pong! Latency: ${latency}ms · API: ${apiLatency}ms`,
      ephemeral: true,
    });
  },
};
