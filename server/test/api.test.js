import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createApi, parseProgress } from '../src/api.js';
import { signInitData } from '../src/auth.js';
import { Db } from '../src/db.js';
import { makeConfig, NOW, TOKEN } from './helpers.js';

const user = { id: 42, first_name: 'Hana', last_name: 'Tesfaye', language_code: 'am' };
const tma = (u = user, authDate = Math.floor(NOW / 1000)) => `tma ${signInitData({ user: JSON.stringify(u), auth_date: String(authDate) }, TOKEN)}`;
const good = () => ({ tz: 180, lastDay: '2026-11-17', streak: 3, best: 5, today: { day: '2026-11-17', score: 1234, correct: 9 }, name: 'Hana T.' });

let dist, db, server, base, clock;

before(async () => {
  dist = mkdtempSync(path.join(tmpdir(), 'laynot-dist-'));
  mkdirSync(path.join(dist, '_expo', 'static', 'js'), { recursive: true });
  writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>Laynot</title>');
  writeFileSync(path.join(dist, 'favicon.ico'), 'icon');
  writeFileSync(path.join(dist, '_expo', 'static', 'js', 'entry-abc.js'), 'console.log(1)');
  writeFileSync(path.join(path.dirname(dist), 'secret.txt'), 'top secret');

  db = new Db(':memory:');
  clock = NOW;
  server = createApi({ cfg: makeConfig({ distDir: dist }), db, now: () => clock });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  rmSync(dist, { recursive: true, force: true });
  rmSync(path.join(path.dirname(dist), 'secret.txt'), { force: true });
});

const post = (body, headers = {}) =>
  fetch(`${base}/api/event`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test.describe('POST /api/event', () => {
  test('a signed report is stored: player, streak and score', async () => {
    const res = await post(good(), { Authorization: tma() });
    assert.equal(res.status, 204);
    const row = db.getUser(42);
    assert.equal(row.display_name, 'Hana T.');
    assert.equal(row.streak, 3);
    assert.equal(row.best_streak, 5);
    assert.equal(row.last_played_day, '2026-11-17');
    assert.equal(row.lang, 'am');
    assert.equal(row.started, 0); // has not opened a chat yet, so no reminders can be sent
    assert.deepEqual(db.scoresForDays(['2026-11-17']).map((r) => r.score), [1234]);
  });

  test('without a valid signature it is refused and nothing is stored', async () => {
    clock += 10_000;
    for (const headers of [{}, { Authorization: 'tma nonsense' }, { Authorization: tma().replace('hash=', 'hash=0') }, { Authorization: tma(user, 1000) }]) {
      const res = await post({ ...good(), streak: 99 }, headers);
      assert.equal(res.status, 401);
    }
    assert.equal(db.getUser(42).streak, 3);
  });

  test('reports come at most once every few seconds per player', async () => {
    clock += 10_000;
    assert.equal((await post(good(), { Authorization: tma() })).status, 204);
    assert.equal((await post(good(), { Authorization: tma() })).status, 429);
    clock += 4000;
    assert.equal((await post(good(), { Authorization: tma() })).status, 204);
  });

  test('a bad body is refused, and the stored score only ever goes up', async () => {
    clock += 10_000;
    assert.equal((await post({ nonsense: true }, { Authorization: tma() })).status, 400);
    clock += 10_000;
    await post({ ...good(), today: { day: '2026-11-17', score: 500, correct: 4 } }, { Authorization: tma() });
    assert.equal(db.scoresForDays(['2026-11-17'])[0].score, 1234);
  });

  test('only POST is allowed', async () => {
    assert.equal((await fetch(`${base}/api/event`)).status, 405);
    assert.equal((await fetch(`${base}/api/other`)).status, 404);
  });
});

test.describe('parseProgress', () => {
  const parse = (body) => parseProgress(body, 180, NOW);

  test('keeps a good report as is', () => {
    assert.deepEqual(parse(good()), good());
  });

  test('refuses impossible numbers', () => {
    assert.equal(parse({ ...good(), streak: -1 }), null);
    assert.equal(parse({ ...good(), streak: 1.5 }), null);
    assert.equal(parse({ ...good(), today: { day: '2026-11-17', score: 99999, correct: 9 } }), null);
    assert.equal(parse({ ...good(), today: { day: '2026-11-17', score: 100, correct: 11 } }), null);
    assert.equal(parse({ ...good(), lastDay: 'yesterday' }), null);
  });

  test('refuses a shifted clock (the demo "skip a day" tool)', () => {
    assert.equal(parse({ ...good(), lastDay: '2026-11-25', today: { day: '2026-11-25', score: 100, correct: 1 } }), null);
    assert.equal(parse({ ...good(), today: { day: '2026-11-05', score: 100, correct: 1 } }), null);
  });

  test('a report with no play yet is fine', () => {
    assert.deepEqual(parse({ tz: 180, lastDay: null, streak: 0, best: 0, today: null, name: '' }), { tz: 180, lastDay: null, streak: 0, best: 0, today: null, name: '' });
  });

  test('uses the default zone when the phone does not say, and trims the name', () => {
    const r = parse({ ...good(), tz: 'x', name: `  ${'N'.repeat(40)}  ` });
    assert.equal(r.tz, 180);
    assert.equal(r.name.length, 24);
  });
});

test.describe('serving the Mini App', () => {
  test('serves index.html at the root and for app routes', async () => {
    for (const p of ['/', '/home', '/duel/join?c=abc', '/live/4821']) {
      const res = await fetch(base + p);
      assert.equal(res.status, 200, p);
      assert.match(res.headers.get('content-type'), /text\/html/);
      assert.match(await res.text(), /<title>Laynot<\/title>/);
    }
  });

  test('serves files with the right type, and caches hashed ones for good', async () => {
    const js = await fetch(`${base}/_expo/static/js/entry-abc.js`);
    assert.match(js.headers.get('content-type'), /javascript/);
    assert.match(js.headers.get('cache-control'), /immutable/);
    assert.equal(await js.text(), 'console.log(1)');
    const ico = await fetch(`${base}/favicon.ico`);
    assert.equal(ico.headers.get('content-type'), 'image/x-icon');
    assert.equal(ico.headers.get('cache-control'), 'no-cache');
  });

  test('a missing file is a 404, not the app', async () => {
    assert.equal((await fetch(`${base}/_expo/static/js/missing.js`)).status, 404);
  });

  test('refuses to read outside the build folder', async () => {
    for (const p of ['/../secret.txt', '/%2e%2e/secret.txt', '/..%2fsecret.txt', '/%2e%2e%2fsecret.txt', '/a%00b']) {
      const res = await fetch(base + p);
      assert.ok([400, 403, 404].includes(res.status) || (await res.text()) !== 'top secret', p);
      assert.notEqual(await res.clone().text(), 'top secret', p);
    }
    // fetch() normalises "/../", so also try the raw request.
    const { default: net } = await import('node:net');
    const body = await new Promise((resolve) => {
      const socket = net.connect(server.address().port, '127.0.0.1', () => socket.write('GET /../secret.txt HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
      let data = '';
      socket.on('data', (d) => (data += d));
      socket.on('close', () => resolve(data));
    });
    assert.doesNotMatch(body, /top secret/);
  });

  test('/healthz answers', async () => {
    assert.equal(await (await fetch(`${base}/healthz`)).text(), 'ok');
  });

  test('says how to build the app when dist is missing', async () => {
    const empty = createApi({ cfg: makeConfig({ distDir: path.join(dist, 'nope') }), db, now: () => clock });
    await new Promise((resolve) => empty.listen(0, '127.0.0.1', resolve));
    const res = await fetch(`http://127.0.0.1:${empty.address().port}/`);
    assert.equal(res.status, 503);
    assert.match(await res.text(), /expo export/);
    empty.close();
  });
});
