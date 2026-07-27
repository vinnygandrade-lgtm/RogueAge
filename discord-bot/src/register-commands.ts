import './load-env.js';
import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';

const { config } = await import('./config.js');

const body = commands.map((command) => command.data.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

async function registerCommands(): Promise<void> {
  if (!/^\d+$/.test(config.clientId)) {
    throw new Error(
      'DISCORD_CLIENT_ID invalid. Open discord-bot/.env and paste Application ID from Developer Portal.',
    );
  }

  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body,
    });
    console.log(`Registered ${body.length} guild commands for guild ${config.guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`Registered ${body.length} global commands.`);
}

registerCommands().catch((error) => {
  console.error('Failed to register commands:', error);
  process.exit(1);
});
