import type { Client } from 'discord.js';
import { commandMap } from '../commands/index.js';

export function bindInteractionCreateEvent(client: Client): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content: 'Unknown command.',
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Command /${interaction.commandName} failed:`, error);

      const payload = {
        content: 'Something went wrong while running that command.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => undefined);
      } else {
        await interaction.reply(payload).catch(() => undefined);
      }
    }
  });
}
