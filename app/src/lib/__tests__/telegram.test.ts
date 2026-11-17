import { chunkKeys, formatMeta, joinChunks, metaKey, otherSlot, parseMeta, splitChunks, CHUNK_SIZE, type ChunkMeta } from '../chunks';
import { decodeDuel, encodeDuel, newDuel, type DuelAnswer } from '../duel';
import { decodeLeague, encodeLeague } from '../league';
import { seeded } from '../rng';
import { decodeStartParam, encodeStartParam, START_PARAM_MAX } from '../startParam';

const TODAY = '2026-11-14';
const NOW = new Date('2026-11-14T12:00:00').getTime();
const ALLOWED = /^[A-Za-z0-9_-]+$/;

const answers: DuelAnswer[] = [
  { mark: 'correct', points: 140 },
  { mark: 'wrong', points: 0 },
  { mark: 'timeout', points: 0 },
  { mark: 'correct', points: 101 },
  { mark: 'correct', points: 150 },
];

function duelCode(name: string): string {
  const duel = newDuel({ category: 'football', level: 'hard', opponent: { kind: 'open' }, today: TODAY, now: NOW, rand: seeded('tg') });
  return encodeDuel(duel, answers, name);
}

describe('Telegram start param', () => {
  it.each(['Hana', 'Abel T.', 'ሐና ተስፋዬ', '50% Ruth', 'a.b~c-d_e'])('round-trips a duel code from %s', (name) => {
    const code = duelCode(name);
    const param = encodeStartParam({ kind: 'duel', code });
    expect(param).toMatch(ALLOWED);
    expect(decodeStartParam(param)).toEqual({ kind: 'duel', code });
    expect(decodeDuel(decodeStartParam(param)!.code)?.name).toBe(name);
  });

  it('round-trips a league code with an Amharic name', () => {
    const code = encodeLeague({ id: 'm3x9', name: 'የቢሮ ጓደኞች' });
    const param = encodeStartParam({ kind: 'league', code });
    expect(param).toMatch(ALLOWED);
    expect(decodeLeague(decodeStartParam(param)!.code)).toEqual({ id: 'm3x9', name: 'የቢሮ ጓደኞች' });
  });

  it('fits the longest possible name (24 Amharic letters) in 512 characters', () => {
    const param = encodeStartParam({ kind: 'duel', code: duelCode('ሀ'.repeat(24)) });
    expect(param.length).toBeLessThanOrEqual(START_PARAM_MAX);
  });

  it('passes a live room code as it is', () => {
    expect(encodeStartParam({ kind: 'room', code: '4821' })).toBe('r_4821');
    expect(decodeStartParam('r_4821')).toEqual({ kind: 'room', code: '4821' });
  });

  it('ignores plain launches and broken links', () => {
    expect(decodeStartParam(undefined)).toBeNull();
    expect(decodeStartParam('')).toBeNull();
    expect(decodeStartParam('x_abc')).toBeNull();
    expect(decodeStartParam('r_12')).toBeNull();
    expect(decodeStartParam('d_')).toBeNull();
    // 0xFF 0xFF is not valid UTF-8.
    expect(decodeStartParam('d___8')).toBeNull();
  });
});

describe('CloudStorage chunks', () => {
  it('splits and joins a value larger than one storage value', () => {
    const value = JSON.stringify({ history: Array.from({ length: 400 }, (_, i) => ({ day: i, name: 'ሐና', score: i * 7 })) });
    expect(value.length).toBeGreaterThan(3 * CHUNK_SIZE);
    const pieces = splitChunks(value);
    expect(pieces.every((p) => p.length <= 4096)).toBe(true);

    const meta: ChunkMeta = { slot: 'b', count: pieces.length, savedAt: NOW };
    const store: Record<string, string> = { [metaKey('g')]: formatMeta(meta) };
    chunkKeys('g', meta).forEach((key, i) => (store[key] = pieces[i]));

    const read = parseMeta(store[metaKey('g')]);
    expect(read).toEqual(meta);
    expect(joinChunks('g', read!, (key) => store[key])).toBe(value);
  });

  it('treats a missing piece as no save', () => {
    const meta: ChunkMeta = { slot: 'a', count: 2, savedAt: NOW };
    // Telegram returns "" for a key that was never written.
    expect(joinChunks('g', meta, (key) => (key === 'g.a.0' ? '{"a":' : ''))).toBeNull();
  });

  it('alternates slots and rejects bad meta', () => {
    expect(otherSlot(undefined)).toBe('a');
    expect(otherSlot('a')).toBe('b');
    expect(otherSlot('b')).toBe('a');
    expect(parseMeta('')).toBeNull();
    expect(parseMeta('c:1:5')).toBeNull();
    expect(parseMeta('a:0:5')).toBeNull();
  });
});
