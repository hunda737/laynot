import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNotifier } from '../src/notify.js';
import { dueReminders, reminderKind, runReminders } from '../src/reminders.js';
import { Db } from '../src/db.js';
import { Sender } from '../src/telegram.js';
import { FakeTelegram, makeConfig, NOW, player } from './helpers.js';

// NOW is 2026-11-17 19:30 in Ethiopia (UTC+3), which is 16:30 UTC.
const at = (utcHour, minute = 0, day = 17) => Date.UTC(2026, 10, day, utcHour, minute);

test('a player who played yesterday gets the usual nudge at their hour', () => {
  assert.equal(reminderKind(player({ streak: 1 }), NOW), 'nudge');
});

test('already played today: no reminder', () => {
  assert.equal(reminderKind(player({ last_played_day: '2026-11-17' }), NOW), null);
});

test('not before their hour, and not more than three hours after', () => {
  assert.equal(reminderKind(player(), at(15, 59)), null); // 18:59 local
  assert.equal(reminderKind(player(), at(16, 0)), 'nudge'); // 19:00 local
  assert.equal(reminderKind(player(), at(18, 59)), 'nudge'); // 21:59 local
  assert.equal(reminderKind(player(), at(19, 0)), null); // 22:00 local: server was down too long
});

test('time zones: the same moment is a different hour for different players', () => {
  // 16:30 UTC is 19:30 in Ethiopia but 17:30 in Lagos (UTC+1 is 60) and 12:30 in New York (UTC-4 is -240).
  assert.equal(reminderKind(player({ tz_offset: 180 }), NOW), 'nudge');
  assert.equal(reminderKind(player({ tz_offset: 60 }), NOW), null);
  assert.equal(reminderKind(player({ tz_offset: 60, remind_hour: 17 }), NOW), 'nudge');
  assert.equal(reminderKind(player({ tz_offset: -240 }), NOW), null);
});

test('the local day, not the UTC day, decides "today"', () => {
  // 22:30 UTC on the 16th is already 01:30 on the 17th in Ethiopia. Playing "on the 17th" is today,
  // even though the UTC calendar still says the 16th.
  const lateNight = Date.UTC(2026, 10, 16, 22, 30);
  assert.equal(reminderKind(player({ last_played_day: '2026-11-17', remind_hour: 0 }), lateNight), null);
  assert.equal(reminderKind(player({ last_played_day: '2026-11-16', remind_hour: 0 }), lateNight), 'nudge');
});

test('streak alert when they played yesterday and have 2+ days', () => {
  assert.equal(reminderKind(player({ streak: 2 }), NOW), 'streak');
  assert.equal(reminderKind(player({ streak: 6 }), NOW), 'streak');
  assert.equal(reminderKind(player({ streak: 1 }), NOW), 'nudge');
});

test('no streak alert once the streak has already lapsed', () => {
  assert.equal(reminderKind(player({ streak: 6, last_played_day: '2026-11-15' }), NOW), 'nudge'); // 2 days ago
});

test('comeback ladder: one message at 3 days, one at 7, then silence', () => {
  assert.equal(reminderKind(player({ last_played_day: '2026-11-15' }), NOW), 'nudge'); // 2 days
  assert.equal(reminderKind(player({ last_played_day: '2026-11-14', nudges: 0 }), NOW), 'comeback3');
  assert.equal(reminderKind(player({ last_played_day: '2026-11-14', nudges: 1 }), NOW), null);
  assert.equal(reminderKind(player({ last_played_day: '2026-11-11', nudges: 1 }), NOW), null); // 6 days: still the 3-day rung, already used
  assert.equal(reminderKind(player({ last_played_day: '2026-11-10', nudges: 1 }), NOW), 'comeback7'); // 7 days
  assert.equal(reminderKind(player({ last_played_day: '2026-11-10', nudges: 2 }), NOW), null);
  assert.equal(reminderKind(player({ last_played_day: '2026-09-01', nudges: 2 }), NOW), null);
});

test('one reminder a day, and never to players who are off, blocked or not reachable', () => {
  assert.equal(reminderKind(player({ last_reminder_day: '2026-11-17' }), NOW), null);
  assert.equal(reminderKind(player({ remind_on: 0 }), NOW), null);
  assert.equal(reminderKind(player({ status: 'blocked' }), NOW), null);
  assert.equal(reminderKind(player({ started: 0 }), NOW), null);
});

test('a new player who has not played yet is counted from the day they joined', () => {
  const joinedToday = player({ last_played_day: null, joined_at: at(8), streak: 0 });
  assert.equal(reminderKind(joinedToday, NOW), 'nudge');
  const joinedLongAgo = player({ last_played_day: null, joined_at: Date.UTC(2026, 10, 1), streak: 0 });
  assert.equal(reminderKind(joinedLongAgo, NOW), 'comeback7');
});

test('dueReminders keeps only the players who are due', () => {
  const due = dueReminders([player({ id: 1 }), player({ id: 2, last_played_day: '2026-11-17' }), player({ id: 3, remind_on: 0 })], NOW);
  assert.deepEqual(due.map((d) => d.user.id), [1]);
});

test.describe('runReminders', () => {
  function setup() {
    const cfg = makeConfig();
    const tg = new FakeTelegram();
    const db = new Db(':memory:');
    const sender = new Sender(tg, { intervalMs: 0, sleep: async () => {} });
    const notifier = createNotifier({ sender, db, cfg });
    return { tg, db, notifier };
  }
  const join = (db, id, lastDay, streak) =>
    db.upsertEventUser({ id, first_name: 'P' + id }, { tz: 180, lastDay, streak, best: streak, today: null, name: '' }, Date.UTC(2026, 10, 1), 180);

  test('sends once, with the right wording, and not again on the next tick', async () => {
    const { tg, db, notifier } = setup();
    db.upsertChatUser({ id: 1, first_name: 'Hana', language_code: 'en' }, Date.UTC(2026, 10, 1), 180);
    join(db, 1, '2026-11-16', 6);

    assert.equal(await runReminders({ db, notifier, now: NOW }), 1);
    const sent = tg.last('sendMessage');
    assert.match(sent.text, /6-day streak/);
    assert.ok(sent.reply_markup.inline_keyboard[0][0].web_app);

    assert.equal(await runReminders({ db, notifier, now: NOW + 60_000 }), 0);
    assert.equal(tg.of('sendMessage').length, 1);
  });

  test('playing in the app before the reminder time cancels it, with the real check', async () => {
    const { tg, db, notifier } = setup();
    db.upsertChatUser({ id: 1, first_name: 'Hana' }, Date.UTC(2026, 10, 1), 180);
    join(db, 1, '2026-11-17', 7);
    assert.equal(await runReminders({ db, notifier, now: NOW }), 0);
    assert.equal(tg.of('sendMessage').length, 0);
  });

  test('a player who blocked the bot is marked and skipped afterwards', async () => {
    const { tg, db, notifier } = setup();
    db.upsertChatUser({ id: 1, first_name: 'Hana' }, Date.UTC(2026, 10, 1), 180);
    join(db, 1, '2026-11-16', 3);
    tg.fail('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user' });
    assert.equal(await runReminders({ db, notifier, now: NOW }), 0);
    assert.equal(db.getUser(1).status, 'blocked');
    assert.equal(db.reminderCandidates().length, 0);
  });

  test('sending a comeback message moves the ladder up', async () => {
    const { db, notifier } = setup();
    db.upsertChatUser({ id: 1, first_name: 'Hana' }, Date.UTC(2026, 10, 1), 180);
    join(db, 1, '2026-11-14', 1);
    await runReminders({ db, notifier, now: NOW });
    assert.equal(db.getUser(1).nudges, 1);
    // Playing resets it.
    join(db, 1, '2026-11-17', 1);
    assert.equal(db.getUser(1).nudges, 0);
  });
});
