import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class ConfigError extends Error {
  constructor(problems) {
    super(`Fix these settings in server/.env:\n - ${problems.join('\n - ')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

function intIn(value, fallback, min, max, name, problems) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    problems.push(`${name} must be a whole number from ${min} to ${max}.`);
    return fallback;
  }
  return n;
}

/** Read and check the settings. Throws one ConfigError that lists everything wrong. */
export function loadConfig(env = process.env) {
  const problems = [];

  const token = (env.BOT_TOKEN ?? '').trim();
  if (!/^\d+:[\w-]{20,}$/.test(token)) {
    problems.push('BOT_TOKEN is missing or not in the form 123456:ABC... (copy it from @BotFather).');
  }

  const webUrl = (env.WEBAPP_URL ?? '').trim().replace(/\/+$/, '');
  try {
    const u = new URL(webUrl);
    if (u.protocol !== 'https:') throw new Error('not https');
  } catch {
    problems.push('WEBAPP_URL must be the full https address of this server, for example https://your-name.ngrok-free.app');
  }

  const adminIds = new Set();
  for (const part of (env.ADMIN_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    if (/^\d+$/.test(part)) adminIds.add(Number(part));
    else problems.push(`ADMIN_IDS has "${part}", which is not a Telegram user ID (numbers only).`);
  }

  const channelId = (env.CHANNEL_ID ?? '').trim();
  if (channelId && !/^(@[A-Za-z]\w{4,}|-?\d+)$/.test(channelId)) {
    problems.push('CHANNEL_ID must look like @channelname or -1001234567890.');
  }

  const shortName = (env.MINIAPP_SHORT_NAME ?? '').trim();
  if (shortName && !/^\w+$/.test(shortName)) problems.push('MINIAPP_SHORT_NAME may only contain letters, digits and underscores.');

  const port = intIn(env.PORT, 3000, 1, 65535, 'PORT', problems);
  const defaultTz = intIn(env.DEFAULT_TZ_OFFSET, 180, -840, 840, 'DEFAULT_TZ_OFFSET', problems);

  if (problems.length > 0) throw new ConfigError(problems);

  return {
    token,
    webUrl,
    shortName,
    adminIds,
    channelId,
    port,
    defaultTz,
    distDir: env.DIST_DIR ? path.resolve(env.DIST_DIR) : path.resolve(serverDir, '..', 'app', 'dist'),
    dbPath: env.DB_PATH ? path.resolve(env.DB_PATH) : path.join(serverDir, 'data', 'laynot.db'),
    apiBase: env.TELEGRAM_API ?? 'https://api.telegram.org',
    /** Filled in at startup from getMe. */
    botUsername: '',
  };
}
