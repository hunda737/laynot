import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildQuizPoll, randomQuizPoll, runChannelJobs, weeklyBoard } from '../src/content.js';
import { QUESTIONS, seeded } from '../src/shared.js';
import { makeBot, person } from './helpers.js';

const question = (overrides = {}) => ({
  id: 'x',
  text: { en: 'Which grain is used for injera?', am: 'ለእንጀራ የሚውለው እህል?' },
  choices: [
    { en: 'Teff', am: 'ጤፍ' },
    { en: 'Wheat', am: 'ስንዴ' },
    { en: 'Maize', am: 'በቆሎ' },
    { en: 'Rice', am: 'ሩዝ' },
  ],
  fact: { en: 'Teff is tiny.', am: 'ጤፍ ትንሽ ነው።' },
  ...overrides,
});

test('quiz poll keeps the right answer where the shuffle put it', () => {
  for (let seed = 0; seed < 25; seed++) {
    const poll = buildQuizPoll(question(), 'en', seeded(`s${seed}`));
    assert.equal(poll.options[poll.correct_option_id], 'Teff');
    assert.deepEqual([...poll.options].sort(), ['Maize', 'Rice', 'Teff', 'Wheat']);
    assert.equal(poll.type, 'quiz');
  }
});

test('quiz poll speaks the chosen language', () => {
  const poll = buildQuizPoll(question(), 'am', seeded('am'));
  assert.equal(poll.question, 'ለእንጀራ የሚውለው እህል?');
  assert.equal(poll.options[poll.correct_option_id], 'ጤፍ');
});

test("quiz poll respects Telegram's limits", () => {
  assert.equal(buildQuizPoll(question({ text: { en: 'x'.repeat(301), am: 'y' } }), 'en'), null);
  assert.equal(buildQuizPoll(question({ choices: [{ en: 'z'.repeat(101), am: 'z' }, ...question().choices.slice(1)] }), 'en'), null);
  const long = buildQuizPoll(question({ fact: { en: 'f'.repeat(500), am: 'f' } }), 'en');
  assert.equal(long.explanation.length, 200);
  assert.ok(long.explanation.endsWith('…'));
});

test('every question in the real bank either fits Telegram or is skipped, and the answer is right', () => {
  let fits = 0;
  for (const q of QUESTIONS) {
    for (const lang of ['en', 'am']) {
      const poll = buildQuizPoll(q, lang, seeded(q.id));
      if (!poll) continue;
      fits++;
      assert.equal(poll.options[poll.correct_option_id], q.choices[0][lang] || q.choices[0].en, q.id);
      assert.ok(poll.question.length <= 300 && poll.explanation.length <= 200 && poll.options.every((o) => o.length <= 100), q.id);
    }
  }
  assert.ok(fits > QUESTIONS.length, `most questions fit (${fits} polls)`);
});

test('a random quiz poll is always available', () => {
  assert.ok(randomQuizPoll('en'));
  assert.ok(randomQuizPoll('am'));
});

test.describe('weekly board', () => {
  const week = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'];
  const rows = (id, name, scores) => scores.map((score, i) => ({ user_id: id, name, day: week[i], score }));

  test('counts the best 5 of 7 days and sorts by it', () => {
    const board = weeklyBoard(
      [...rows(1, 'Abel T.', [100, 200, 300, 400, 500, 600, 700]), ...rows(2, 'Meron A.', [1000, 10])],
      week,
    );
    // Abel's best five are 700+600+500+400+300.
    assert.deepEqual(board.map((e) => [e.name, e.score, e.days]), [['Abel T.', 2500, 7], ['Meron A.', 1010, 2]]);
  });

  test('ignores days outside the week', () => {
    const board = weeklyBoard([{ user_id: 1, name: 'A', day: '2026-11-09', score: 999 }], week);
    assert.deepEqual(board, []);
  });

  test('the prize rule needs at least 3 days', () => {
    const board = weeklyBoard([...rows(1, 'Two days', [900, 900]), ...rows(2, 'Three days', [100, 100, 100])], week, { minDays: 3 });
    assert.deepEqual(board.map((e) => e.name), ['Three days']);
  });

  test('ties sort by name', () => {
    const board = weeklyBoard([...rows(2, 'Zed', [100]), ...rows(1, 'Abe', [100])], week);
    assert.deepEqual(board.map((e) => e.name), ['Abe', 'Zed']);
  });
});

test.describe('channel jobs', () => {
  const utc = (day, hour, minute = 0) => Date.UTC(2026, 10, day, hour, minute);

  test('post the Daily Challenge once a day at 08:00 Ethiopian time', async () => {
    const ctx = makeBot({ channelId: '@laynot_news' });
    const run = (now) => runChannelJobs({ ...ctx, now });

    await run(utc(17, 4, 59)); // 07:59 local: too early
    assert.equal(ctx.tg.of('sendMessage').length, 0);

    await run(utc(17, 5, 0)); // 08:00 local
    const post = ctx.tg.of('sendMessage')[0].params;
    assert.equal(post.chat_id, '@laynot_news');
    assert.match(post.text, /Daily Challenge #17/);
    assert.match(post.text, /ዕለታዊ ፈተና #17/);
    assert.equal(post.reply_markup.inline_keyboard[0][0].url, 'https://t.me/laynot_bot/myapp');
    assert.equal(ctx.tg.of('sendPoll').length, 1);

    await run(utc(17, 5, 1));
    await run(utc(17, 7, 0));
    assert.equal(ctx.tg.of('sendMessage').length, 1);

    await run(utc(18, 5, 0)); // next day
    assert.equal(ctx.tg.of('sendMessage').length, 2);
  });

  test('do nothing without a channel', async () => {
    const ctx = makeBot();
    await runChannelJobs({ ...ctx, now: utc(17, 5) });
    assert.equal(ctx.tg.calls.length, 0);
  });

  test("Monday morning posts last week's winners, who need 3 days", async () => {
    const ctx = makeBot({ channelId: '@laynot_news' });
    const play = (id, name, days) => {
      ctx.db.upsertChatUser(person(id, { first_name: name, last_name: '' }), Date.now(), 180);
      for (const day of days) {
        ctx.db.upsertEventUser(person(id, { first_name: name, last_name: '' }), { tz: 180, lastDay: day, streak: 1, best: 1, today: { day, score: 1000, correct: 8 }, name: '' }, Date.UTC(2026, 10, 1), 180);
      }
    };
    play(1, 'Abel', ['2026-11-09', '2026-11-10', '2026-11-11']);
    play(2, 'Meron', ['2026-11-09', '2026-11-10']); // only two days
    // Monday 2026-11-16 at 09:00 local = 06:00 UTC. The week that just ended is 11-09 to 11-15.
    await runChannelJobs({ ...ctx, now: utc(16, 6, 0) });
    const winners = ctx.tg.of('sendMessage').find((c) => /top players/.test(c.params.text));
    assert.ok(winners);
    assert.match(winners.params.text, /Abel/);
    assert.doesNotMatch(winners.params.text, /Meron/);

    await runChannelJobs({ ...ctx, now: utc(16, 6, 30) });
    assert.equal(ctx.tg.of('sendMessage').filter((c) => /top players/.test(c.params.text)).length, 1);
  });
});
