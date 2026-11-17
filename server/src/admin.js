import { randomBytes } from 'node:crypto';
import { localParts } from './time.js';

const PENDING_TTL_MS = 10 * 60_000;
const AUDIENCES = ['en', 'am', 'all'];

/** Admin-only tools: /broadcast, /stats, /channel. Admins are the IDs in ADMIN_IDS. */
export function createAdmin({ cfg, db, sender, notifier, now = Date.now, newId = () => randomBytes(4).toString('hex') }) {
  const pending = new Map();
  const running = new Set();

  const isAdmin = (id) => cfg.adminIds.has(id);
  const say = (chatId, text, extra = {}) =>
    sender.send('sendMessage', { chat_id: chatId, text, link_preview_options: { is_disabled: true }, ...extra }).catch((e) => console.error('Admin reply failed:', e.message));

  const rest = (cmd) => (cmd.args ?? '').trim();

  async function onCommand(user, message, cmd) {
    const chatId = message.chat.id;
    switch (cmd?.name) {
      case 'stats': {
        const s = db.stats(now(), localParts(now(), cfg.defaultTz).day);
        await say(
          chatId,
          `📊 Laynot\nPlayers seen: ${s.players}\nCan be messaged: ${s.started}\nActive in 7 days: ${s.active7}\nPlayed today: ${s.playedToday}\nReminders on: ${s.remindersOn}\nBlocked the bot: ${s.blocked}`,
        );
        return true;
      }

      case 'broadcast': {
        let text = rest(cmd);
        let audience = 'all';
        const first = text.split(/\s+/, 1)[0]?.toLowerCase();
        if (AUDIENCES.includes(first)) {
          audience = first;
          text = text.slice(first.length).trim();
        }
        if (!text) {
          await say(chatId, 'Usage: /broadcast [en|am|all] your message\nYou will see a preview and confirm before anything is sent.');
          return true;
        }
        const count = db.audience(audience).length;
        const id = newId();
        pending.set(id, { text, audience, adminId: user.id, at: now() });
        await say(chatId, `Preview (to ${count} player${count === 1 ? '' : 's'}, audience: ${audience}):\n\n${text}`, {
          reply_markup: {
            inline_keyboard: [[
              { text: `Send to ${count}`, callback_data: `bc:send:${id}` },
              { text: 'Cancel', callback_data: `bc:no:${id}` },
            ]],
          },
        });
        return true;
      }

      case 'channel': {
        if (!cfg.channelId) {
          await say(chatId, 'No channel is set. Put CHANNEL_ID in server/.env and add the bot to the channel as an administrator.');
          return true;
        }
        const text = rest(cmd);
        if (!text) {
          await say(chatId, 'Usage: /channel your text');
          return true;
        }
        try {
          await sender.send('sendMessage', { chat_id: cfg.channelId, text, reply_markup: notifier.linkMarkup() });
          await say(chatId, 'Posted to the channel.');
        } catch (e) {
          await say(chatId, `Could not post: ${e.description ?? e.message}`);
        }
        return true;
      }

      default:
        return false;
    }
  }

  /** Handles the Send / Cancel buttons under a broadcast preview. Returns true if it was ours. */
  async function onCallback(callback) {
    const m = /^bc:(send|no):(\w+)$/.exec(callback.data ?? '');
    if (!m) return false;
    const answer = (text) => sender.send('answerCallbackQuery', { callback_query_id: callback.id, text }).catch(() => {});
    if (!isAdmin(callback.from.id)) {
      await answer('Not allowed.');
      return true;
    }
    const [, action, id] = m;
    const job = pending.get(id);
    pending.delete(id); // one tap only: a second tap can't send it twice
    const chatId = callback.message.chat.id;
    const edit = (text) =>
      sender.send('editMessageText', { chat_id: chatId, message_id: callback.message.message_id, text }).catch(() => {});

    if (!job || now() - job.at > PENDING_TTL_MS) {
      await answer('This preview expired. Send /broadcast again.');
      await edit('Preview expired.');
      return true;
    }
    if (action === 'no') {
      await answer('Cancelled.');
      await edit('Cancelled. Nothing was sent.');
      return true;
    }

    await answer('Sending…');
    await edit(`Sending…\n\n${job.text}`);
    const work = runBroadcast(job, chatId).finally(() => running.delete(work));
    running.add(work);
    return true;
  }

  async function runBroadcast(job, chatId) {
    const rowId = db.addBroadcast(now(), job.adminId, job.audience, job.text);
    const counts = { sent: 0, failed: 0, blocked: 0 };
    for (const user of db.audience(job.audience)) {
      // Plain text on purpose: an admin typing "<" must not make Telegram reject the message.
      const result = await notifier.toUser(user, job.text, { html: false });
      counts[result]++;
    }
    db.finishBroadcast(rowId, counts);
    await say(chatId, `Broadcast done: ${counts.sent} sent, ${counts.blocked} had blocked the bot, ${counts.failed} failed.`);
  }

  return { isAdmin, onCommand, onCallback, whenIdle: () => Promise.all([...running]) };
}
