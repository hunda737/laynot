import { both, esc, t } from './messages.js';
import { addDays, bestOf, dailyNumber, MIN_DAYS_FOR_PRIZE, QUESTIONS, seeded, shuffle, weekDays } from './shared.js';
import { localParts } from './time.js';

// Telegram's limits for a quiz poll.
const MAX_QUESTION = 300;
const MAX_OPTION = 100;
const MAX_EXPLANATION = 200;

const clip = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);
const pick = (localized, lang) => localized[lang] || localized.en;

/**
 * A Telegram quiz poll for one of the app's questions, or null if it doesn't fit Telegram's
 * limits. The bank always lists the right answer first, so the choices are shuffled and the
 * poll is told where the right one landed.
 */
export function buildQuizPoll(question, lang, rand = Math.random) {
  const text = pick(question.text, lang);
  if (text.length > MAX_QUESTION) return null;
  const order = shuffle([0, 1, 2, 3], rand);
  const options = order.map((i) => pick(question.choices[i], lang));
  if (options.some((o) => o.length === 0 || o.length > MAX_OPTION)) return null;
  return {
    question: text,
    options,
    type: 'quiz',
    correct_option_id: order.indexOf(0),
    explanation: clip(pick(question.fact, lang), MAX_EXPLANATION),
    is_anonymous: true,
  };
}

/** A random question from the main bank (not the sponsored or street ones) that fits. */
export function randomQuizPoll(lang, rand = Math.random) {
  for (let tries = 0; tries < 30; tries++) {
    const q = QUESTIONS[Math.floor(rand() * QUESTIONS.length)];
    const poll = buildQuizPoll(q, lang, rand);
    if (poll) return poll;
  }
  return null;
}

/**
 * The weekly board from stored scores: best 5 of 7 days, as in the app.
 * `rows` are { user_id, day, score, name }; `days` are the week's days.
 */
export function weeklyBoard(rows, days, { minDays = 1, limit = 10 } = {}) {
  const wanted = new Set(days);
  const byUser = new Map();
  for (const row of rows) {
    if (!wanted.has(row.day)) continue;
    const entry = byUser.get(row.user_id) ?? { id: row.user_id, name: row.name, scores: [] };
    entry.scores.push(row.score);
    byUser.set(row.user_id, entry);
  }
  return [...byUser.values()]
    .filter((e) => e.scores.length >= minDays)
    .map((e) => ({ id: e.id, name: e.name, days: e.scores.length, score: bestOf(e.scores) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

const MEDALS = ['🥇', '🥈', '🥉'];
const rank = (i) => MEDALS[i] ?? `${i + 1}.`;

export function createContent({ db, cfg }) {
  /** Text for /top: this week's real players. */
  function topText(lang, now) {
    const today = localParts(now, cfg.defaultTz).day;
    const board = weeklyBoard(db.scoresForDays(weekDays(today)), weekDays(today));
    if (board.length === 0) return t(lang, 'topEmpty');
    const lines = board.map((e, i) => `${rank(i)} ${esc(e.name)} · ${e.score}`);
    return `${t(lang, 'topHeader')}\n\n${lines.join('\n')}\n\n${t(lang, 'topFooter')}`;
  }

  /** Last week's winners as a channel post, or null when nobody played enough days. */
  function winnersPost(now) {
    const today = localParts(now, cfg.defaultTz).day;
    const lastWeek = weekDays(addDays(weekDays(today)[0], -7));
    const board = weeklyBoard(db.scoresForDays(lastWeek), lastWeek, { minDays: MIN_DAYS_FOR_PRIZE, limit: 3 });
    if (board.length === 0) return null;
    const lines = board.map((e, i) => `${rank(i)} ${esc(e.name)} · ${e.score}`).join('\n');
    return `${both('channelWinners')}\n\n${lines}`;
  }

  return { topText, winnersPost, quizPoll: (lang, rand) => randomQuizPoll(lang, rand) };
}

/**
 * Posts to the channel: the Daily Challenge at 08:00 (Ethiopian time by default) and last
 * week's winners on Monday at 09:00. Each runs once a day; the hours give a restarted
 * server three hours to catch up.
 */
export async function runChannelJobs({ cfg, db, sender, notifier, content, now }) {
  if (!cfg.channelId) return;
  const local = localParts(now, cfg.defaultTz);

  if (local.hour >= 8 && local.hour < 11 && db.meta('channel_daily') !== local.day) {
    db.setMeta('channel_daily', local.day);
    await sender.send('sendMessage', {
      chat_id: cfg.channelId,
      text: both('channelDaily', { n: dailyNumber(local.day) }),
      parse_mode: 'HTML',
      reply_markup: notifier.linkMarkup(),
    });
    const poll = randomQuizPoll('en', seeded(`channel:${local.day}`));
    if (poll) await sender.send('sendPoll', { chat_id: cfg.channelId, ...poll });
  }

  if (local.dow === 1 && local.hour >= 9 && local.hour < 12 && db.meta('channel_winners') !== local.day) {
    db.setMeta('channel_winners', local.day);
    const text = content.winnersPost(now);
    if (text) await sender.send('sendMessage', { chat_id: cfg.channelId, text, parse_mode: 'HTML', reply_markup: notifier.linkMarkup() });
  }
}

export function startChannelJobs(deps, { now = Date.now, intervalMs = 60_000 } = {}) {
  if (!deps.cfg.channelId) return () => {};
  const tick = () => runChannelJobs({ ...deps, now: now() }).catch((e) => console.error('Channel post failed:', e.message));
  const timer = setInterval(tick, intervalMs);
  void tick();
  return () => clearInterval(timer);
}
