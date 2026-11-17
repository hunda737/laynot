import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signInitData, verifyInitData } from '../src/auth.js';
import { NOW, TOKEN } from './helpers.js';

const user = { id: 42, first_name: 'Hana', last_name: 'Tesfaye', language_code: 'en' };
const fields = (extra = {}) => ({ user: JSON.stringify(user), auth_date: String(Math.floor(NOW / 1000)), query_id: 'AAH', ...extra });

test('accepts correctly signed data and returns the user', () => {
  const data = signInitData(fields(), TOKEN);
  assert.deepEqual(verifyInitData(data, TOKEN, NOW), user);
});

test('accepts data that carries the newer "signature" field', () => {
  const data = signInitData(fields({ signature: 'abc_DEF-123' }), TOKEN);
  assert.deepEqual(verifyInitData(data, TOKEN, NOW), user);
});

test('rejects data signed with a different token', () => {
  const data = signInitData(fields(), '999:OTHER_TOKEN_abcdefghijklmnopqrstuvwxyz');
  assert.equal(verifyInitData(data, TOKEN, NOW), null);
});

test('rejects tampered data', () => {
  const data = signInitData(fields(), TOKEN);
  const forged = data.replace(encodeURIComponent('"id":42'), encodeURIComponent('"id":43'));
  assert.notEqual(forged, data);
  assert.equal(verifyInitData(forged, TOKEN, NOW), null);
});

test('rejects data older than a day, and data from the far future', () => {
  const old = signInitData(fields({ auth_date: String(Math.floor(NOW / 1000) - 25 * 3600) }), TOKEN);
  assert.equal(verifyInitData(old, TOKEN, NOW), null);
  const day = signInitData(fields({ auth_date: String(Math.floor(NOW / 1000) - 23 * 3600) }), TOKEN);
  assert.deepEqual(verifyInitData(day, TOKEN, NOW), user);
  const future = signInitData(fields({ auth_date: String(Math.floor(NOW / 1000) + 3600) }), TOKEN);
  assert.equal(verifyInitData(future, TOKEN, NOW), null);
});

test('rejects junk', () => {
  for (const junk of [undefined, null, '', 'hash=abc', 'user=1', `hash=${'0'.repeat(64)}`, 'x'.repeat(5000)]) {
    assert.equal(verifyInitData(junk, TOKEN, NOW), null);
  }
});
