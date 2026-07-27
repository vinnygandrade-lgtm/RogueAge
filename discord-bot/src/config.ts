import './load-env.js';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function parseRoleIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export const config = {
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  guildId: optionalEnv('DISCORD_GUILD_ID'),
  welcomeChannelId: optionalEnv('WELCOME_CHANNEL_ID'),
  staffRoleIds: parseRoleIds(optionalEnv('STAFF_ROLE_IDS')),
  gameUrl: optionalEnv('GAME_URL') ?? 'https://rogueage.vercel.app',
} as const;
