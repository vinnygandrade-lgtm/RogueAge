import type { Client } from 'discord.js';

export function bindReadyEvent(client: Client): void {
  client.once('ready', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
  });
}
