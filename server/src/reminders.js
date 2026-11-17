import { t } from './messages.js';
import { dailyNumber, daysBetween } from './shared.js';
import { localParts } from './time.js';

/** A reminder goes out in the hour a player chose and the two after it; later than that, today is skipped. */
export const REMIND_WINDOW_HOURS = 3;

/**
 * Which reminder, if any, this player should get right now:
 *   streak     played yesterday and has a streak of 2 or more: "ends at midnight"
 *   nudge      the usual daily reminder (1 or 2 days since the last play)
 *   comeback3  one message after 3 days away
 *   comeback7  one message after a week, then silence until they play again
 * At most one reminder a day, and none to someone who already played today.
 */
export function reminderKind(user, now) {
  if (!user.started || user.status !== 'active' || !user.remind_on) return null;
  const local = localParts(now, user.tz_offset);
  if (user.last_reminder_day === local.day) return null;
  if (user.last_played_day === local.day) return null;
  if (local.hour < user.remind_hour || local.hour >= user.remind_hour + REMIND_WINDOW_HOURS) return null;

  const since = user.last_played_day ?? localParts(user.joined_at, user.tz_offset).day;
  const gap = daysBetween(since, local.day);
  if (gap < 0) return null;

  if (user.streak >= 2 && user.last_played_day && gap === 1) return 'streak';
  if (gap >= 7) return user.nudges < 2 ? 'comeback7' : null;
  if (gap >= 3) return user.nudges < 1 ? 'comeback3' : null;
  return 'nudge';
}

const NUDGE_LEVEL = { comeback3: 1, comeback7: 2 };

export function dueReminders(users, now) {
  const due = [];
  for (const user of users) {
    const kind = reminderKind(user, now);
    if (kind) due.push({ user, kind });
  }
  return due;
}

/** Send every reminder that is due. Returns how many were sent. */
export async function runReminders({ db, notifier, now }) {
  let sent = 0;
  for (const { user, kind } of dueReminders(db.reminderCandidates(), now)) {
    const local = localParts(now, user.tz_offset);
    // Mark first: if sending fails or the server restarts, this player is not messaged twice.
    db.markReminded(user.id, local.day, Math.max(user.nudges, NUDGE_LEVEL[kind] ?? 0));
    const text = t(user.lang, kind, { n: dailyNumber(local.day), streak: user.streak });
    if ((await notifier.toUser(user, text)) === 'sent') sent++;
  }
  return sent;
}

/** Check once a minute. Returns a function that stops it. */
export function startReminders({ db, notifier, now = Date.now, intervalMs = 60_000 }) {
  const tick = () => runReminders({ db, notifier, now: now() }).catch((e) => console.error('Reminders failed:', e.message));
  const timer = setInterval(tick, intervalMs);
  void tick();
  return () => clearInterval(timer);
}
