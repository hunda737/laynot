import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Sender, Telegram, TelegramError } from '../src/telegram.js';
import { FakeTelegram, TOKEN } from './helpers.js';

const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('call returns the result of a good reply', async () => {
  const seen = [];
  const tg = new Telegram({ token: TOKEN, fetchImpl: async (url, init) => (seen.push({ url, body: JSON.parse(init.body) }), reply({ ok: true, result: { id: 1 } })) });
  assert.deepEqual(await tg.call('getMe', { a: 1 }), { id: 1 });
  assert.equal(seen[0].url, `https://api.telegram.org/bot${TOKEN}/getMe`);
  assert.deepEqual(seen[0].body, { a: 1 });
});

test('a Telegram error carries its code, description and retry time', async () => {
  const tg = new Telegram({ token: TOKEN, fetchImpl: async () => reply({ ok: false, error_code: 429, description: 'Too Many Requests: retry after 7', parameters: { retry_after: 7 } }, 429) });
  await assert.rejects(tg.call('sendMessage'), (e) => e instanceof TelegramError && e.code === 429 && e.retryAfter === 7);
});

test('the token never appears in an error, even from a network failure', async () => {
  const tg = new Telegram({
    token: TOKEN,
    fetchImpl: async (url) => {
      throw new TypeError('fetch failed', { cause: new Error(`getaddrinfo ENOTFOUND for ${url}`) });
    },
  });
  await assert.rejects(tg.call('getMe'), (e) => {
    assert.ok(!e.message.includes(TOKEN), e.message);
    assert.ok(!String(e.description).includes(TOKEN));
    assert.match(e.message, /<token>/);
    return true;
  });
});

test.describe('Sender', () => {
  test('sends in order and waits between messages', async () => {
    const tg = new FakeTelegram();
    const sleeps = [];
    const sender = new Sender(tg, { intervalMs: 40, sleep: async (ms) => void sleeps.push(ms) });
    await Promise.all([1, 2, 3].map((n) => sender.send('sendMessage', { chat_id: n })));
    assert.deepEqual(tg.of('sendMessage').map((c) => c.params.chat_id), [1, 2, 3]);
    assert.deepEqual(sleeps, [40, 40, 40]);
  });

  test('on 429 it waits as long as Telegram asks and sends again', async () => {
    const tg = new FakeTelegram();
    tg.fail('sendMessage', { code: 429, description: 'Too Many Requests', retryAfter: 3, times: 2 });
    const sleeps = [];
    const sender = new Sender(tg, { intervalMs: 0, sleep: async (ms) => void sleeps.push(ms) });
    await sender.send('sendMessage', { chat_id: 1 });
    assert.equal(tg.of('sendMessage').length, 3);
    assert.deepEqual(sleeps, [3100, 3100]);
  });

  test('it gives up after a few tries, and one failure does not stop the next message', async () => {
    const tg = new FakeTelegram();
    tg.fail('sendMessage', { code: 429, retryAfter: 1, chatId: 1 });
    const sender = new Sender(tg, { intervalMs: 0, sleep: async () => {}, maxTries: 3 });
    const results = await Promise.allSettled([sender.send('sendMessage', { chat_id: 1 }), sender.send('sendMessage', { chat_id: 2 })]);
    assert.equal(results[0].status, 'rejected');
    assert.equal(results[1].status, 'fulfilled');
  });

  test('other errors are passed on at once, without retrying', async () => {
    const tg = new FakeTelegram();
    tg.fail('sendMessage', { code: 403, description: 'blocked' });
    const sender = new Sender(tg, { intervalMs: 0, sleep: async () => {} });
    await assert.rejects(sender.send('sendMessage', { chat_id: 1 }), (e) => e.code === 403);
    assert.equal(tg.of('sendMessage').length, 1);
  });
});
