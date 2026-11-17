import { COMMANDS, LANGS, t } from './messages.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const HOURS = [17, 19, 21];
const ALLOWED_UPDATES = ['message', 'callback_query', 'my_chat_member'];

/** "/start@laynot_bot hello" becomes { name: 'start', args: 'hello' }. Null if it is not a command. */
export function parseCommand(text) {
  const m = /^\/([A-Za-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/.exec(text ?? '');
  return m ? { name: m[1].toLowerCase(), args: m[2] ?? '' } : null;
}

export class Bot {
  #stopped = false;

  constructor({ cfg, tg, sender, notifier, db, admin, content, now = Date.now }) {
    Object.assign(this, { cfg, tg, sender, notifier, db, admin, content, now });
  }

  /** Make the bot self-explanatory: menu button, commands and descriptions, in both languages. */
  async setup() {
    const attempt = async (method, params) => {
      try {
        await this.tg.call(method, params);
      } catch (e) {
        console.error(`Setup step failed: ${e.message}`);
      }
    };
    await attempt('deleteWebhook', {}); // polling and a webhook can't both be on
    await attempt('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Play', web_app: { url: this.cfg.webUrl } } });
    for (const lang of LANGS) {
      const scope = lang === 'en' ? {} : { language_code: lang }; // no code = the default for everyone else
      await attempt('setMyCommands', { commands: COMMANDS.map((c) => ({ command: c.command, description: c[lang] })), ...scope });
      await attempt('setMyDescription', { description: t(lang, 'description'), ...scope });
      await attempt('setMyShortDescription', { short_description: t(lang, 'shortDescription'), ...scope });
    }
  }

  async handleUpdate(update) {
    try {
      if (update.message) await this.#onMessage(update.message);
      else if (update.callback_query) await this.#onCallback(update.callback_query);
      else if (update.my_chat_member) this.#onMembership(update.my_chat_member);
    } catch (e) {
      console.error(`Update ${update.update_id} failed:`, e);
    }
  }

  async #reply(user, text, options) {
    return this.notifier.toUser(user, text, options);
  }

  async #onMessage(message) {
    if (message.chat?.type !== 'private' || !message.from || message.from.is_bot) return;
    const user = this.db.upsertChatUser(message.from, this.now(), this.cfg.defaultTz);
    const cmd = parseCommand(message.text);

    if (this.admin.isAdmin(user.id) && (await this.admin.onCommand(user, message, cmd))) return;

    switch (cmd?.name) {
      case 'help':
        return void (await this.#reply(user, t(user.lang, 'help')));
      case 'id':
        return void (await this.#reply(user, `Your Telegram ID: <code>${user.id}</code>`, { markup: false }));
      case 'remind':
        return void (await this.#sendRemindMenu(user));
      case 'stop':
        this.db.setRemindOn(user.id, false);
        return void (await this.#reply(user, t(user.lang, 'stopped'), { markup: false }));
      case 'language':
        return void (await this.#sendLanguageMenu(user));
      case 'quiz':
        return void (await this.#sendQuiz(user));
      case 'top':
        return void (await this.#reply(user, this.content.topText(user.lang, this.now())));
      default:
        // /start, /play, and anything else: the welcome with the Play button.
        return void (await this.#reply(user, t(user.lang, 'welcome')));
    }
  }

  async #sendQuiz(user) {
    const poll = this.content.quizPoll(user.lang);
    if (!poll) return void (await this.#reply(user, t(user.lang, 'quizFallback')));
    try {
      await this.sender.send('sendPoll', { chat_id: user.chat_id, ...poll, reply_markup: this.notifier.playMarkup(user.lang) });
    } catch (e) {
      console.error(`Quiz poll failed: ${e.message}`);
      await this.#reply(user, t(user.lang, 'quizFallback'));
    }
  }

  // ----- /remind and /language: one message with buttons, edited in place -----

  #remindView(user) {
    const text = user.remind_on ? t(user.lang, 'remindOn', { hour: user.remind_hour }) : t(user.lang, 'remindOff');
    const hours = HOURS.map((h) => ({ text: `${user.remind_on && user.remind_hour === h ? '✓ ' : ''}${h}:00`, callback_data: `rm:h:${h}` }));
    return {
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: t(user.lang, user.remind_on ? 'turnOff' : 'turnOn'), callback_data: 'rm:toggle' }], hours] },
    };
  }

  async #sendRemindMenu(user) {
    await this.sender.send('sendMessage', { chat_id: user.chat_id, ...this.#remindView(user) }).catch((e) => console.error(e.message));
  }

  #languageView(lang, text) {
    return {
      text,
      reply_markup: { inline_keyboard: [[{ text: 'English', callback_data: 'lg:en' }, { text: 'አማርኛ', callback_data: 'lg:am' }]] },
    };
  }

  async #sendLanguageMenu(user) {
    await this.sender.send('sendMessage', { chat_id: user.chat_id, ...this.#languageView(user.lang, t(user.lang, 'chooseLanguage')) }).catch((e) => console.error(e.message));
  }

  async #onCallback(callback) {
    if (await this.admin.onCallback(callback)) return;
    const chatId = callback.message?.chat?.id;
    const messageId = callback.message?.message_id;
    const user = this.db.getUser(callback.from.id);
    const done = () => this.sender.send('answerCallbackQuery', { callback_query_id: callback.id }).catch(() => {});
    if (!user || !chatId) return void (await done());

    const [kind, a, b] = (callback.data ?? '').split(':');
    let view = null;
    if (kind === 'rm') {
      if (a === 'toggle') this.db.setRemindOn(user.id, !user.remind_on);
      else if (a === 'h' && HOURS.includes(Number(b))) this.db.setRemindHour(user.id, Number(b));
      view = this.#remindView(this.db.getUser(user.id));
    } else if (kind === 'lg' && LANGS.includes(a)) {
      this.db.setLang(user.id, a);
      view = this.#languageView(a, t(a, 'languageSet'));
    }
    if (view) {
      // "message is not modified" is fine: the player tapped what was already chosen.
      await this.sender.send('editMessageText', { chat_id: chatId, message_id: messageId, ...view }).catch(() => {});
    }
    await done();
  }

  /** Telegram tells us when someone blocks or unblocks the bot. */
  #onMembership(change) {
    if (change.chat?.type !== 'private') return;
    const user = this.db.getUser(change.from.id);
    if (!user) return;
    const status = change.new_chat_member?.status;
    if (status === 'kicked' || status === 'left') this.db.setStatus(user.id, 'blocked');
    else if (status === 'member') this.db.upsertChatUser(change.from, this.now(), this.cfg.defaultTz);
  }

  // ----- polling -----

  async poll() {
    let offset = 0;
    while (!this.#stopped) {
      try {
        const updates = await this.tg.call('getUpdates', { offset, timeout: 25, allowed_updates: ALLOWED_UPDATES });
        for (const update of updates) {
          offset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (e) {
        if (e.code === 409) console.error('Another copy of this bot is running (Telegram answered 409). Stop it: only one can poll at a time.');
        else console.error(`getUpdates failed: ${e.message}`);
        await sleep(e.code === 409 ? 10_000 : 3_000);
      }
    }
  }

  stop() {
    this.#stopped = true;
  }
}
