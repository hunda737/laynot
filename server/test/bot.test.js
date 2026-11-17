import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCommand } from '../src/bot.js';
import { makeBot, person, privateMessage } from './helpers.js';

test('parseCommand understands commands, bot names and payloads', () => {
  assert.deepEqual(parseCommand('/start'), { name: 'start', args: '' });
  assert.deepEqual(parseCommand('/start@laynot_bot r_4821'), { name: 'start', args: 'r_4821' });
  assert.deepEqual(parseCommand('/BROADCAST am hello\nthere'), { name: 'broadcast', args: 'am hello\nthere' });
  assert.equal(parseCommand('hello'), null);
  assert.equal(parseCommand(undefined), null);
});

test.describe('the Play button', () => {
  for (const text of ['/start', '/play', '/start@laynot_bot x', 'hello there']) {
    test(`"${text}" gets the welcome with a Play button that opens the Mini App`, async () => {
      const { bot, tg } = makeBot();
      await bot.handleUpdate(privateMessage(person(1), text));
      const sent = tg.last('sendMessage');
      assert.match(sent.text, /Welcome to Laynot/);
      assert.equal(sent.chat_id, 1);
      assert.deepEqual(sent.reply_markup.inline_keyboard[0][0].web_app, { url: 'https://laynot.example' });
    });
  }

  test('an Amharic Telegram gets the Amharic welcome', async () => {
    const { bot, tg, db } = makeBot();
    await bot.handleUpdate(privateMessage(person(2, { language_code: 'am' }), '/start'));
    assert.match(tg.last('sendMessage').text, /እንኳን በደህና መጡ/);
    assert.equal(db.getUser(2).lang, 'am');
  });

  test('groups and bots are ignored', async () => {
    const { bot, tg } = makeBot();
    await bot.handleUpdate({ update_id: 2, message: { text: '/start', from: person(3), chat: { id: -5, type: 'group' } } });
    await bot.handleUpdate(privateMessage(person(4, { is_bot: true }), '/start'));
    assert.equal(tg.of('sendMessage').length, 0);
  });

  test('/help sends the help text', async () => {
    const { bot, tg } = makeBot();
    await bot.handleUpdate(privateMessage(person(1), '/help'));
    assert.match(tg.last('sendMessage').text, /daily street-quiz game/);
  });

  test('/id tells anyone their Telegram ID', async () => {
    const { bot, tg } = makeBot();
    await bot.handleUpdate(privateMessage(person(777), '/id'));
    assert.match(tg.last('sendMessage').text, /777/);
  });
});

test('setup sets the menu button, commands and descriptions with the right URL, in both languages', async () => {
  const { bot, tg } = makeBot();
  await bot.setup();
  assert.deepEqual(tg.last('setChatMenuButton').menu_button, { type: 'web_app', text: 'Play', web_app: { url: 'https://laynot.example' } });
  assert.equal(tg.of('deleteWebhook').length, 1);

  const commands = tg.of('setMyCommands');
  assert.equal(commands.length, 2);
  assert.equal(commands[0].params.language_code, undefined);
  assert.equal(commands[1].params.language_code, 'am');
  assert.deepEqual(commands[0].params.commands.map((c) => c.command), ['start', 'play', 'quiz', 'top', 'remind', 'language', 'help']);

  const descriptions = tg.of('setMyDescription');
  assert.equal(descriptions.length, 2);
  for (const d of descriptions) assert.ok(d.params.description.length <= 512);
  for (const d of tg.of('setMyShortDescription')) assert.ok(d.params.short_description.length <= 120);
});

test('setup carries on when one step fails', async () => {
  const { bot, tg } = makeBot();
  tg.fail('setMyCommands', { description: 'nope' });
  const errors = console.error;
  console.error = () => {};
  try {
    await bot.setup();
  } finally {
    console.error = errors;
  }
  assert.equal(tg.of('setMyShortDescription').length, 2);
});

test.describe('/remind and /language buttons', () => {
  const press = (user, data, messageId = 11) => ({
    update_id: 3,
    callback_query: { id: 'cb1', from: user, data, message: { message_id: messageId, chat: { id: user.id, type: 'private' } } },
  });

  test('toggle and hour change are saved and the message is edited in place', async () => {
    const { bot, tg, db } = makeBot();
    const user = person(1);
    await bot.handleUpdate(privateMessage(user, '/remind'));
    assert.match(tg.last('sendMessage').text, /on/);

    await bot.handleUpdate(press(user, 'rm:toggle'));
    assert.equal(db.getUser(1).remind_on, 0);
    assert.match(tg.last('editMessageText').text, /off/);

    await bot.handleUpdate(press(user, 'rm:h:21'));
    assert.equal(db.getUser(1).remind_on, 1);
    assert.equal(db.getUser(1).remind_hour, 21);
    assert.match(tg.last('editMessageText').text, /21:00/);
    assert.equal(tg.of('answerCallbackQuery').length, 2);
  });

  test('a made-up hour is refused', async () => {
    const { bot, db } = makeBot();
    const user = person(1);
    await bot.handleUpdate(privateMessage(user, '/start'));
    await bot.handleUpdate(press(user, 'rm:h:3'));
    assert.equal(db.getUser(1).remind_hour, 19);
  });

  test('/stop turns reminders off', async () => {
    const { bot, db } = makeBot();
    await bot.handleUpdate(privateMessage(person(1), '/stop'));
    assert.equal(db.getUser(1).remind_on, 0);
  });

  test('/language switches the bot to Amharic', async () => {
    const { bot, tg, db } = makeBot();
    const user = person(1);
    await bot.handleUpdate(privateMessage(user, '/language'));
    await bot.handleUpdate(press(user, 'lg:am'));
    assert.equal(db.getUser(1).lang, 'am');
    assert.match(tg.last('editMessageText').text, /አማርኛ/);
    await bot.handleUpdate(privateMessage(user, '/help'));
    assert.match(tg.last('sendMessage').text, /ላይኖት/);
  });
});

test.describe('blocking', () => {
  test('a 403 marks the player blocked', async () => {
    const { bot, tg, db } = makeBot();
    tg.fail('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user', chatId: 5 });
    const errors = console.error;
    console.error = () => {};
    try {
      await bot.handleUpdate(privateMessage(person(5), '/start'));
    } finally {
      console.error = errors;
    }
    assert.equal(db.getUser(5).status, 'blocked');
  });

  test('Telegram telling us about a block and an unblock is followed', async () => {
    const { bot, db } = makeBot();
    await bot.handleUpdate(privateMessage(person(6), '/start'));
    const change = (status) => ({ update_id: 4, my_chat_member: { chat: { id: 6, type: 'private' }, from: person(6), new_chat_member: { status } } });
    await bot.handleUpdate(change('kicked'));
    assert.equal(db.getUser(6).status, 'blocked');
    await bot.handleUpdate(change('member'));
    assert.equal(db.getUser(6).status, 'active');
  });
});

test('/quiz sends a quiz poll with the Play button', async () => {
  const { bot, tg } = makeBot();
  await bot.handleUpdate(privateMessage(person(1), '/quiz'));
  const poll = tg.last('sendPoll');
  assert.equal(poll.type, 'quiz');
  assert.equal(poll.options.length, 4);
  assert.ok(poll.reply_markup.inline_keyboard[0][0].web_app);
});

test('/top says so when nobody has played, and lists real players once they have', async () => {
  const { bot, tg, db } = makeBot();
  await bot.handleUpdate(privateMessage(person(1), '/top'));
  assert.match(tg.last('sendMessage').text, /No scores yet/);

  db.upsertEventUser(person(2, { first_name: 'Abel', last_name: 'Tadesse' }), { tz: 180, lastDay: '2026-11-17', streak: 1, best: 1, today: { day: '2026-11-17', score: 1100, correct: 8 }, name: '' }, Date.now(), 180);
  await bot.handleUpdate(privateMessage(person(1), '/top'));
  const text = tg.last('sendMessage').text;
  assert.match(text, /Abel T\./);
  assert.match(text, /1100/);
});
