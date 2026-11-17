/**
 * Telegram Mini App deep links carry one `startapp` value, and Telegram only allows
 * `A-Za-z0-9_-` there, up to 512 characters. Duel and league codes contain `: . % ~`,
 * so they travel as base64url: a kind letter, an underscore, then the encoded code.
 * Live room codes are four digits and go as they are.
 */
export type StartKind = 'duel' | 'league' | 'room';

export interface StartTarget {
  kind: StartKind;
  code: string;
}

export const START_PARAM_MAX = 512;

const LETTER: Record<StartKind, string> = { duel: 'd', league: 'l', room: 'r' };
const KIND: Record<string, StartKind> = { d: 'duel', l: 'league', r: 'room' };

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += B64[(n >> (18 - 6 * c)) & 63];
  }
  return out;
}

function fromBase64Url(text: string): Uint8Array | null {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of text) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

/** UTF-8 bytes of a string, without needing TextEncoder (missing in some JS engines). */
function utf8Bytes(text: string): Uint8Array {
  const escaped = encodeURIComponent(text);
  const bytes: number[] = [];
  for (let i = 0; i < escaped.length; i++) {
    if (escaped[i] === '%') {
      bytes.push(parseInt(escaped.slice(i + 1, i + 3), 16));
      i += 2;
    } else bytes.push(escaped.charCodeAt(i));
  }
  return Uint8Array.from(bytes);
}

/** The string for some UTF-8 bytes, or null if they are not valid UTF-8. */
function utf8Text(bytes: Uint8Array): string | null {
  try {
    return decodeURIComponent(Array.from(bytes, (b) => `%${b.toString(16).padStart(2, '0')}`).join(''));
  } catch {
    return null;
  }
}

export function encodeStartParam({ kind, code }: StartTarget): string {
  if (kind === 'room') return `${LETTER.room}_${code}`;
  return `${LETTER[kind]}_${toBase64Url(utf8Bytes(code))}`;
}

/** The target a launch link points at, or null for a plain launch or a broken link. */
export function decodeStartParam(param: string | undefined | null): StartTarget | null {
  const m = /^([dlr])_([A-Za-z0-9_-]+)$/.exec(param ?? '');
  if (!m) return null;
  const kind = KIND[m[1]];
  if (kind === 'room') return /^\d{4}$/.test(m[2]) ? { kind, code: m[2] } : null;
  const bytes = fromBase64Url(m[2]);
  const code = bytes && utf8Text(bytes);
  return code ? { kind, code } : null;
}
