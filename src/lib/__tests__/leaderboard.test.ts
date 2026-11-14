import { BOTS } from '@/data/players';
import { weeklySponsor } from '@/data/prizes';
import {
  bestOf,
  botDayScore,
  buildBoard,
  lastWeekWinners,
  MIN_DAYS_FOR_PRIZE,
  prizeEligibility,
} from '../leaderboard';
import { checkChar, DUEL_PREFIX, findCode, LEAGUE_PREFIX, makeCode, normalizeLinkCode } from '../codes';
import { decodeLeague, encodeLeague, FRIENDS_LEAGUE_ID, leagueMembers, nextJoiner } from '../league';

const you = (scores: Record<string, number> = {}) => ({ name: 'Hana', city: 'Adama', scores });

describe('leaderboard', () => {
  it('generates the same bot score for the same day', () => {
    const bot = BOTS[0];
    expect(botDayScore(bot, '2026-11-10', '2026-11-14', 12)).toBe(botDayScore(bot, '2026-11-10', '2026-11-14', 12));
  });

  it('never shows a bot score for the future, and fills the day board as the hours pass', () => {
    for (const bot of BOTS) expect(botDayScore(bot, '2026-11-15', '2026-11-14', 23)).toBeNull();
    const playedBy = (hour: number) => BOTS.filter((b) => botDayScore(b, '2026-11-14', '2026-11-14', hour) !== null).length;
    expect(playedBy(3)).toBeLessThan(playedBy(12));
    expect(playedBy(12)).toBeLessThanOrEqual(playedBy(23));
    expect(playedBy(23)).toBeGreaterThan(20);
  });

  it('sums the best 5 days', () => {
    expect(bestOf([100, 900, 300, 500, 700, 200, 800])).toBe(900 + 800 + 700 + 500 + 300);
  });

  it('ranks you among the players and shares ranks on ties', () => {
    const board = buildBoard({ members: BOTS, period: 'today', today: '2026-11-14', hour: 23, you: you({ '2026-11-14': 1500 }) });
    expect(board[0].isYou).toBe(true);
    expect(board[0].rank).toBe(1);
    for (let i = 1; i < board.length; i++) {
      expect(board[i].score).toBeLessThanOrEqual(board[i - 1].score);
      if (board[i].score === board[i - 1].score) expect(board[i].rank).toBe(board[i - 1].rank);
    }
  });

  it('leaves you off the board until you play', () => {
    const board = buildBoard({ members: BOTS, period: 'week', today: '2026-11-14', hour: 23, you: you() });
    expect(board.some((e) => e.isYou)).toBe(false);
  });

  it('shows only league members on a league board', () => {
    const members = leagueMembers(FRIENDS_LEAGUE_ID);
    const board = buildBoard({ members, period: 'week', today: '2026-11-14', hour: 23, you: you({ '2026-11-14': 900 }) });
    const ids = new Set(members.map((b) => b.id));
    expect(board.filter((e) => !e.isYou).every((e) => ids.has(e.id))).toBe(true);
    expect(board.some((e) => e.isYou)).toBe(true);
  });

  it('returns last week top 3', () => {
    const winners = lastWeekWinners('2026-11-14', you());
    expect(winners).toHaveLength(3);
    expect(winners[0].score).toBeGreaterThanOrEqual(winners[2].score);
  });
});

describe('sample player', () => {
  it('has a 6-day streak ending yesterday and qualifies for prizes', () => {
    const { samplePlayer } = jest.requireActual('../sample') as typeof import('../sample');
    const s = samplePlayer('2026-11-14');
    expect(Object.keys(s.dailyHistory)).toHaveLength(6);
    expect(s.dailyHistory['2026-11-14']).toBeUndefined();
    expect(s.streak).toEqual({ current: 6, best: 6, lastDay: '2026-11-13' });
    const scores = Object.fromEntries(Object.values(s.dailyHistory).map((r) => [r.day, r.score]));
    expect(prizeEligibility(s.profile, scores, '2026-11-14').eligible).toBe(true);
  });
});

describe('prizes', () => {
  it('requires sign-up, 18+ and enough days played this week', () => {
    const scores = { '2026-11-10': 500, '2026-11-11': 600 };
    expect(prizeEligibility(null, scores, '2026-11-14').eligible).toBe(false);
    expect(prizeEligibility({ adult: true }, scores, '2026-11-14')).toMatchObject({ enoughDays: false, eligible: false });
    const enough = { ...scores, '2026-11-12': 700 };
    expect(Object.keys(enough)).toHaveLength(MIN_DAYS_FOR_PRIZE);
    expect(prizeEligibility({ adult: true }, enough, '2026-11-14').eligible).toBe(true);
    expect(prizeEligibility({ adult: false }, enough, '2026-11-14').eligible).toBe(false);
  });

  it('rotates the sponsor weekly', () => {
    expect(weeklySponsor('2026-11-10').id).toBe(weeklySponsor('2026-11-15').id);
    expect(weeklySponsor('2026-11-10').id).not.toBe(weeklySponsor('2026-11-17').id);
  });
});

describe('share codes', () => {
  it('round-trips a league invite, including spaces, dots and Amharic', () => {
    for (const name of ['Office Crew', 'A.B. team', 'የቢሮ ጓደኞች']) {
      const code = encodeLeague({ id: 'm3x9', name });
      expect(decodeLeague(code)).toEqual({ id: 'm3x9', name });
    }
  });

  it('finds a code inside a pasted message, even with a full stop after it', () => {
    const code = encodeLeague({ id: 'm3x9', name: 'Office Crew' });
    const message = `Join my Laynot league! Open exp://x/--/league/join?c=zzz
or enter this code: ${code}.`;
    expect(decodeLeague(message)).toEqual({ id: 'm3x9', name: 'Office Crew' });
  });

  it('rejects a code that was changed or cut short', () => {
    const code = encodeLeague({ id: 'm3x9', name: 'Office Crew' });
    expect(decodeLeague(code.replace('m3x9', 'm3x8'))).toBeNull();
    expect(decodeLeague(code.slice(0, -1))).toBeNull();
    expect(decodeLeague('hello')).toBeNull();
  });

  it('repairs a link code that the router decoded twice', () => {
    for (const name of ['Coffee Club', 'የቢሮ ጓደኞች']) {
      const code = encodeLeague({ id: 'm3x9', name });
      const twiceDecoded = decodeURIComponent(code);
      expect(decodeLeague(normalizeLinkCode(twiceDecoded))).toEqual({ id: 'm3x9', name });
      expect(normalizeLinkCode(code)).toBe(code);
    }
  });

  it('keeps duel and league codes apart', () => {
    const league = encodeLeague({ id: 'm3x9', name: 'X' });
    expect(findCode(league, DUEL_PREFIX)).toBeNull();
    const duel = makeCode(DUEL_PREFIX, ['1', 'abcd']);
    expect(findCode(duel, LEAGUE_PREFIX)).toBeNull();
    expect(findCode(duel, DUEL_PREFIX)).toEqual(['1', 'abcd']);
    expect(checkChar('x')).toMatch(/^[0-9a-z]$/);
  });
});

describe('private leagues', () => {
  it('gives the same 4-10 demo members for the same id on any phone', () => {
    const a = leagueMembers('m3x9').map((b) => b.id);
    expect(leagueMembers('m3x9').map((b) => b.id)).toEqual(a);
    expect(a.length).toBeGreaterThanOrEqual(4);
    expect(a.length).toBeLessThanOrEqual(10);
  });

  it('adds demo joiners without duplicates', () => {
    const first = nextJoiner('m3x9', [])!;
    const members = leagueMembers('m3x9', [first.id]);
    expect(members.filter((b) => b.id === first.id)).toHaveLength(1);
    expect(nextJoiner('m3x9', [first.id])!.id).not.toBe(first.id);
  });
});
