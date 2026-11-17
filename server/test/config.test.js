import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConfigError, loadConfig } from '../src/config.js';
import { TOKEN } from './helpers.js';

const env = (extra = {}) => ({ BOT_TOKEN: TOKEN, WEBAPP_URL: 'https://laynot.example/', ...extra });

test('a minimal valid config gets sensible defaults', () => {
  const cfg = loadConfig(env());
  assert.equal(cfg.webUrl, 'https://laynot.example');
  assert.equal(cfg.port, 3000);
  assert.equal(cfg.defaultTz, 180);
  assert.equal(cfg.adminIds.size, 0);
  assert.equal(cfg.channelId, '');
  assert.match(cfg.distDir, /app[\\/]dist$/);
});

test('reads admins, channel and numbers', () => {
  const cfg = loadConfig(env({ ADMIN_IDS: '1, 22 ,333', CHANNEL_ID: '@laynot_news', PORT: '8080', DEFAULT_TZ_OFFSET: '60', MINIAPP_SHORT_NAME: 'myapp' }));
  assert.deepEqual([...cfg.adminIds], [1, 22, 333]);
  assert.equal(cfg.channelId, '@laynot_news');
  assert.equal(cfg.port, 8080);
  assert.equal(cfg.defaultTz, 60);
  assert.equal(cfg.shortName, 'myapp');
});

test('reports every problem at once, in plain words', () => {
  try {
    loadConfig({ BOT_TOKEN: 'oops', WEBAPP_URL: 'http://insecure.example', ADMIN_IDS: 'me', PORT: 'x', CHANNEL_ID: 'news' });
    assert.fail('should have thrown');
  } catch (e) {
    assert.ok(e instanceof ConfigError);
    assert.equal(e.problems.length, 5);
    assert.match(e.message, /BOT_TOKEN/);
    assert.match(e.message, /https/);
    assert.doesNotMatch(e.message, /oops/, 'a wrong token must not be echoed back');
  }
});

test('a non-https address is refused', () => {
  assert.throws(() => loadConfig(env({ WEBAPP_URL: 'http://laynot.example' })), ConfigError);
  assert.throws(() => loadConfig(env({ WEBAPP_URL: 'laynot.example' })), ConfigError);
});
