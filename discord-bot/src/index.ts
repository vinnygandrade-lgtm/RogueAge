import './load-env.js';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config.js';
import { bindGuildMemberAddEvent } from './events/guildMemberAdd.js';
import { bindInteractionCreateEvent } from './events/interactionCreate.js';
import { bindReadyEvent } from './events/ready.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

bindReadyEvent(client);
bindInteractionCreateEvent(client);
bindGuildMemberAddEvent(client);

client.login(config.token).catch((error) => {
  console.error('Failed to log in:', error);
  process.exit(1);
});
