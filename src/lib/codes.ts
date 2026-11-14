import { hashString } from './rng';

/**
 * Share codes carry everything a friend's phone needs, because there is no server.
 * Format: `PREFIX:part.part.part.check`, where `check` is one base-36 character
 * computed from the rest, so a code broken in copy and paste is rejected.
 */
export const DUEL_PREFIX = 'LAYNOT';
export const LEAGUE_PREFIX = 'LAYNOT-L';

export function checkChar(body: string): string {
  return (hashString(body) % 36).toString(36);
}

/** Names may contain spaces, dots and Amharic letters, so they are URL-encoded (dots too). */
export function encodeName(name: string): string {
  return encodeURIComponent(name.trim().slice(0, 24)).replace(/\./g, '%2E');
}

export function decodeName(encoded: string): string | null {
  try {
    const name = decodeURIComponent(encoded).trim();
    return name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

export function makeCode(prefix: string, parts: string[]): string {
  const body = `${prefix}:${parts.join('.')}`;
  return `${body}.${checkChar(body)}`;
}

const escape = (s: string) => s.replace(/[-]/g, '\\-');

/**
 * Find a code of the given kind anywhere in pasted text (a whole WhatsApp
 * message works) and return its parts, or null if there is none or the check fails.
 */
export function findCode(text: string, prefix: string): string[] | null {
  // A plain prefix must not match inside a longer one ("LAYNOT:" vs "LAYNOT-L:").
  const re = new RegExp(`(?:^|[^A-Za-z-])(${escape(prefix)}:[0-9A-Za-z.%_~-]+)`);
  const m = re.exec(text);
  if (!m) return null;
  // Drop sentence punctuation that may follow the code.
  const code = m[1].replace(/[^0-9A-Za-z]+$/, '');
  const cut = code.lastIndexOf('.');
  if (cut < 0) return null;
  const body = code.slice(0, cut);
  if (checkChar(body) !== code.slice(cut + 1)) return null;
  return body.slice(prefix.length + 1).split('.');
}

/**
 * A code that arrives through a link's `?c=` may have been decoded twice on the
 * way (the router decodes query params), turning "%20" back into a space. If no
 * escapes are left, encode it again so the check character matches.
 */
export function normalizeLinkCode(raw: string): string {
  return /%[0-9A-Fa-f]{2}/.test(raw) ? raw : encodeURI(raw);
}

/** A short random id in base 36, e.g. "k7q2". */
export function randomId(rand: () => number = Math.random, length = 4): string {
  let out = '';
  for (let i = 0; i < length; i++) out += Math.floor(rand() * 36).toString(36);
  return out;
}
