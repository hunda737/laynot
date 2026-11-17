import path from 'node:path';
import { createApi } from './api.js';
import { createAdmin } from './admin.js';
import { Bot } from './bot.js';
import { ConfigError, loadConfig, serverDir } from './config.js';
import { createContent, startChannelJobs } from './content.js';
import { Db } from './db.js';
import { createNotifier } from './notify.js';
import { startReminders } from './reminders.js';
import { Sender, Telegram } from './telegram.js';

try {
  process.loadEnvFile(path.join(serverDir, '.env'));
} catch {
  // No .env file: the settings may come from the real environment instead.
}

let cfg;
try {
  cfg = loadConfig(process.env);
} catch (e) {
  if (e instanceof ConfigError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}

const tg = new Telegram({ token: cfg.token, base: cfg.apiBase });
try {
  const me = await tg.call('getMe');
  cfg.botUsername = me.username;
} catch (e) {
  console.error(`Could not reach Telegram with that BOT_TOKEN: ${e.message}`);
  process.exit(1);
}

const db = new Db(cfg.dbPath);
const sender = new Sender(tg);
const notifier = createNotifier({ sender, db, cfg });
const content = createContent({ db, cfg });
const admin = createAdmin({ cfg, db, sender, notifier });
const bot = new Bot({ cfg, tg, sender, notifier, db, admin, content });

const api = createApi({ cfg, db });
api.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${cfg.port} is already in use. Stop the other program (for example "npx serve") or set PORT.` : e.message);
  process.exit(1);
});
await new Promise((resolve) => api.listen(cfg.port, resolve));

await bot.setup();
const stopReminders = startReminders({ db, notifier });
const stopChannel = startChannelJobs({ cfg, db, sender, notifier, content });

console.log(`Laynot server is running.
  Bot:      @${cfg.botUsername}
  Mini App: ${cfg.webUrl}  (served from ${cfg.distDir})
  Local:    http://localhost:${cfg.port}
  Admins:   ${cfg.adminIds.size === 0 ? 'none set (send /id to the bot, then put your ID in ADMIN_IDS)' : [...cfg.adminIds].join(', ')}
  Channel:  ${cfg.channelId || 'not set'}`);

const shutdown = () => {
  bot.stop();
  stopReminders();
  stopChannel();
  api.close();
  db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await bot.poll();
