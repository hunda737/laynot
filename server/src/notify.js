import { t } from './messages.js';

/**
 * Sends messages to players and keeps the player list honest: someone who has blocked
 * the bot (Telegram answers 403) is marked, and skipped from then on.
 */
export function createNotifier({ sender, db, cfg }) {
  /** An inline button that opens the Mini App. Only works in a private chat. */
  const playMarkup = (lang) => ({ inline_keyboard: [[{ text: t(lang, 'playButton'), web_app: { url: cfg.webUrl } }]] });

  /** A link button for places where web_app buttons are not allowed, like channels. */
  const linkMarkup = (lang = 'en') => {
    if (!cfg.botUsername || !cfg.shortName) return undefined;
    return { inline_keyboard: [[{ text: t(lang, 'openButton'), url: `https://t.me/${cfg.botUsername}/${cfg.shortName}` }]] };
  };

  /** Returns 'sent', 'blocked' or 'failed'. Never throws. */
  async function toUser(user, text, { html = true, markup = true } = {}) {
    try {
      await sender.send('sendMessage', {
        chat_id: user.chat_id ?? user.id,
        text,
        ...(html ? { parse_mode: 'HTML' } : {}),
        ...(markup ? { reply_markup: playMarkup(user.lang) } : {}),
        link_preview_options: { is_disabled: true },
      });
      return 'sent';
    } catch (e) {
      if (e.code === 403 || (e.code === 400 && /chat not found/i.test(e.description ?? ''))) {
        db.setStatus(user.id, 'blocked');
        return 'blocked';
      }
      console.error(`Could not message ${user.id}: ${e.message}`);
      return 'failed';
    }
  }

  return { toUser, playMarkup, linkMarkup };
}
