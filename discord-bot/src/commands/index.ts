import { announceCommand } from './announce.js';
import { gameCommand } from './game.js';
import { helpCommand } from './help.js';
import { pingCommand } from './ping.js';
import type { SlashCommandDefinition } from './types.js';

export const commands: SlashCommandDefinition[] = [
  pingCommand,
  helpCommand,
  gameCommand,
  announceCommand,
];

export const commandMap = new Map(
  commands.map((command) => [command.data.name, command]),
);
