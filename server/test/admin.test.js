import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeBot, NOW, person, privateMessage } from './helpers.js';

const ADMIN = person(900, { first_name: 'Boss' });
const press = (user, data) => ({
  update_id: 9,
  callback_query: { id: 'cb', from: user, data, message: { message_id: 50, chat: { id: user.id, type: 'private' } } },
});

/** Three players who can be messaged: two English, one Amharic. The admin counts too once they write, so audiences are one bigger. */
function withPlayers(ctx) {
  ctx.db.upsertChatUser(person(1), ctx.now ?? Date.now(), 180);
  ctx.db.upsertChatUser(person(2), Date.now(), 180);
  ctx.db.upsertChatUser(person(3, { language_code: 'am' }), Date.now(), 180);
  return ctx;
}
const sentTo = (tg, chatId) => tg.of('sendMessage').filter((c) => c.params.chat_id === chatId);

test('non-admins cannot use admin commands', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(person(1), '/broadcast hello'));
  await ctx.bot.handleUpdate(privateMessage(person(1), '/stats'));
  assert.ok(sentTo(ctx.tg, 1).every((c) => /Welcome to Laynot/.test(c.params.text)));
});

test('/broadcast shows a preview and sends nothing until confirmed', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast Big news <today>'));
  const preview = ctx.tg.last('sendMessage');
  assert.equal(preview.chat_id, 900);
  assert.match(preview.text, /to 4 players/); // the three players and the admin
  assert.match(preview.text, /Big news <today>/);
  assert.deepEqual(preview.reply_markup.inline_keyboard[0].map((b) => b.callback_data), ['bc:send:abc123', 'bc:no:abc123']);
  assert.equal(sentTo(ctx.tg, 1).length, 0);
});

test('confirming sends to every player once, as plain text with a Play button', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast Big news <today>'));
  await ctx.bot.handleUpdate(press(ADMIN, 'bc:send:abc123'));
  await ctx.admin.whenIdle();

  for (const id of [1, 2, 3, 900]) {
    const [message] = sentTo(ctx.tg, id).filter((c) => c.params.text === 'Big news <today>');
    assert.ok(message, `player ${id} got it`);
    assert.equal(message.params.parse_mode, undefined);
    assert.ok(message.params.reply_markup.inline_keyboard[0][0].web_app);
  }
  assert.match(ctx.tg.last('sendMessage').text, /4 sent/);

  // A second tap on the same button must not send it again.
  const before = ctx.tg.of('sendMessage').length;
  await ctx.bot.handleUpdate(press(ADMIN, 'bc:send:abc123'));
  await ctx.admin.whenIdle();
  assert.equal(ctx.tg.of('sendMessage').length, before);
});

test('Cancel sends nothing', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast hi'));
  await ctx.bot.handleUpdate(press(ADMIN, 'bc:no:abc123'));
  await ctx.admin.whenIdle();
  assert.equal(sentTo(ctx.tg, 1).filter((c) => c.params.text === 'hi').length, 0);
  assert.match(ctx.tg.last('editMessageText').text, /Cancelled/);
});

test('the audience filter reaches only that language', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast am ሰላም'));
  assert.match(ctx.tg.last('sendMessage').text, /to 1 player,/);
  await ctx.bot.handleUpdate(press(ADMIN, 'bc:send:abc123'));
  await ctx.admin.whenIdle();
  assert.equal(sentTo(ctx.tg, 3).filter((c) => c.params.text === 'ሰላም').length, 1);
  assert.equal(sentTo(ctx.tg, 1).filter((c) => c.params.text === 'ሰላም').length, 0);
});

test('a player who blocked the bot is counted, marked, and does not stop the rest', async () => {
  const ctx = withPlayers(makeBot());
  ctx.tg.fail('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user', chatId: 2 });
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast hi all'));
  await ctx.bot.handleUpdate(press(ADMIN, 'bc:send:abc123'));
  await ctx.admin.whenIdle();
  assert.equal(ctx.db.getUser(2).status, 'blocked');
  assert.match(ctx.tg.last('sendMessage').text, /3 sent, 1 had blocked/);
});

test('only an admin can press the confirm button', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast hi'));
  await ctx.bot.handleUpdate(press(person(1), 'bc:send:abc123'));
  await ctx.admin.whenIdle();
  assert.equal(sentTo(ctx.tg, 2).filter((c) => c.params.text === 'hi').length, 0);
});

test('a preview expires after ten minutes', async () => {
  const ctx = withPlayers(makeBot());
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/broadcast hi'));
  ctx.setNow(NOW + 11 * 60_000);
  await ctx.bot.handleUpdate(press(ADMIN, 'bc:send:abc123'));
  await ctx.admin.whenIdle();
  assert.equal(sentTo(ctx.tg, 1).filter((c) => c.params.text === 'hi').length, 0);
});

test('/stats reports the numbers', async () => {
  const ctx = withPlayers(makeBot());
  ctx.db.setStatus(3, 'blocked');
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/stats'));
  const text = ctx.tg.last('sendMessage').text;
  assert.match(text, /Players seen: 4/); // three plus the admin who just wrote
  assert.match(text, /Blocked the bot: 1/);
});

test('/channel posts text to the channel, and says so when none is set', async () => {
  const none = makeBot();
  await none.bot.handleUpdate(privateMessage(ADMIN, '/channel hello'));
  assert.match(none.tg.last('sendMessage').text, /No channel is set/);

  const ctx = makeBot({ channelId: '@laynot_news' });
  await ctx.bot.handleUpdate(privateMessage(ADMIN, '/channel hello world'));
  const post = ctx.tg.of('sendMessage').find((c) => c.params.chat_id === '@laynot_news');
  assert.equal(post.params.text, 'hello world');
  assert.equal(post.params.reply_markup.inline_keyboard[0][0].url, 'https://t.me/laynot_bot/myapp');
});
