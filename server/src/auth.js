import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_AGE_SEC = 24 * 60 * 60;

/**
 * Check the signed launch data the Mini App sends (Telegram's `initData`), so a request
 * can only come from a real Telegram user of this bot. Returns the user, or null.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData, botToken, nowMs = Date.now(), maxAgeSec = MAX_AGE_SEC) {
  if (typeof initData !== 'string' || initData.length === 0 || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(dataCheckString).digest();
  const given = Buffer.from(hash, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const authDate = Number(params.get('auth_date'));
  const ageSec = nowMs / 1000 - authDate;
  if (!Number.isFinite(authDate) || ageSec > maxAgeSec || ageSec < -300) return null;

  try {
    const user = JSON.parse(params.get('user') ?? '');
    return user && Number.isInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}

/** Build signed initData the way Telegram does. Used by the tests. */
export function signInitData(fields, botToken) {
  const params = new URLSearchParams(fields);
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  params.set('hash', createHmac('sha256', secret).update(dataCheckString).digest('hex'));
  return params.toString();
}
