import { createAdmin } from '../src/admin.js';
import { Bot } from '../src/bot.js';
import { createContent } from '../src/content.js';
import { Db } from '../src/db.js';
import { createNotifier } from '../src/notify.js';
import { Sender, TelegramError } from '../src/telegram.js';

export const TOKEN = '123456:TEST_TOKEN_abcdefghijklmnopqrstuvwxyz';
export const NOW = Date.UTC(2026, 10, 17, 16, 30); // 2026-11-17 19:30 in Ethiopia (UTC+3)

/** A stand-in for the Telegram API that records every call. */
export class FakeTelegram {
  calls = [];
  rules = [];
  constructor() {
    this.token = TOKEN;
  }
  /** Make matching calls fail. `chatId` limits it to one chat; `times` limits how often. */
  fail(method, { code = 400, description = 'Bad Request', retryAfter, chatId, times = Infinity } = {}) {
    this.rules.push({ method, code, description, retryAfter, chatId, times });
  }
  async call(method, params = {}) {
    this.calls.push({ method, params });
    for (const rule of this.rules) {
      if (rule.method === method && rule.times > 0 && (rule.chatId === undefined || rule.chatId === params.chat_id)) {
        rule.times--;
        throw new TelegramError(method, rule.code, rule.description, rule.retryAfter);
      }
    }
    return true;
  }
  of(method) {
    return this.calls.filter((c) => c.method === method);
  }
  last(method) {
    return this.of(method).at(-1)?.params;
  }
}

export function makeConfig(overrides = {}) {
  return {
    token: TOKEN,
    webUrl: 'https://laynot.example',
    shortName: 'myapp',
    adminIds: new Set([900]),
    channelId: '',
    port: 0,
    defaultTz: 180,
    distDir: '/nonexistent',
    dbPath: ':memory:',
    apiBase: 'https://api.telegram.org',
    botUsername: 'laynot_bot',
    ...overrides,
  };
}

export function makeBot(overrides = {}) {
  const cfg = makeConfig(overrides);
  const tg = new FakeTelegram();
  const db = new Db(':memory:');
  const sender = new Sender(tg, { intervalMs: 0, sleep: async () => {} });
  const notifier = createNotifier({ sender, db, cfg });
  const content = createContent({ db, cfg });
  let now = NOW;
  const clock = () => now;
  const admin = createAdmin({ cfg, db, sender, notifier, now: clock, newId: () => 'abc123' });
  const bot = new Bot({ cfg, tg, sender, notifier, db, admin, content, now: clock });
  return { cfg, tg, db, sender, notifier, content, admin, bot, setNow: (t) => (now = t) };
}

export const privateMessage = (from, text) => ({
  update_id: 1,
  message: { message_id: 10, text, from, chat: { id: from.id, type: 'private' } },
});

export const person = (id, extra = {}) => ({ id, is_bot: false, first_name: 'Hana', last_name: 'Tesfaye', language_code: 'en', ...extra });

/** A player row with sensible defaults, for reminder tests. */
export function player(overrides = {}) {
  return {
    id: 1,
    chat_id: 1,
    started: 1,
    status: 'active',
    lang: 'en',
    tz_offset: 180,
    remind_on: 1,
    remind_hour: 19,
    joined_at: Date.UTC(2026, 10, 1),
    last_played_day: '2026-11-16',
    streak: 1,
    last_reminder_day: null,
    nudges: 0,
    ...overrides,
  };
}
