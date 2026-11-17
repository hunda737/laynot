import { dailyIds } from '../daily';
import {
  botLiveAnswer,
  liveCoins,
  livePhase,
  liveRoom,
  liveStandings,
  LIVE_SIZE,
  LIVE_TIME_MS,
  playersAt,
  REVEAL_MS,
  roomPicks,
  STANDINGS_MS,
  type LiveAnswer,
} from '../live';

const TODAY = '2026-11-14';

describe('live room', () => {
  it('is the same for the same code, with 3-7 players and 7 questions outside today’s daily', () => {
    const a = liveRoom('4821', 'host', TODAY);
    const b = liveRoom('4821', 'host', TODAY);
    expect(a.players.map((p) => p.bot.id)).toEqual(b.players.map((p) => p.bot.id));
    expect(a.players.length).toBeGreaterThanOrEqual(3);
    expect(a.players.length).toBeLessThanOrEqual(7);
    expect(a.questions).toHaveLength(LIVE_SIZE);
    const banned = dailyIds(TODAY);
    expect(a.questions.some((q) => banned.has(q.question.id))).toBe(false);
  });

  it('lets players join over time, and a joined room starts on its own after everyone is in', () => {
    const room = liveRoom('1234', 'join', TODAY);
    expect(room.host).toBe(room.players[0].bot);
    expect(playersAt(room, 0)).toHaveLength(1);
    expect(playersAt(room, room.autoStartMs!)).toHaveLength(room.players.length);
    expect(liveRoom('1234', 'host', TODAY).autoStartMs).toBeNull();
  });

  it('ends a question early once everyone has answered, then shows reveal and standings', () => {
    const room = liveRoom('4821', 'host', TODAY);
    const players = room.players;
    const botsDone = Math.max(...players.map((p) => botLiveAnswer(room, p.bot, 0).atMs));
    const yours: LiveAnswer[] = [{ pick: 0, atMs: 1000, points: 140 }];
    const qEnd = Math.min(LIVE_TIME_MS, Math.max(1000, botsDone));
    expect(livePhase(room, players, 0, yours, {}, qEnd - 1)).toMatchObject({ kind: 'question', index: 0 });
    expect(livePhase(room, players, 0, yours, {}, qEnd)).toMatchObject({ kind: 'reveal', index: 0 });
    expect(livePhase(room, players, 0, yours, {}, qEnd + REVEAL_MS)).toMatchObject({ kind: 'standings', index: 0 });
    // Without your answer the question runs the full time.
    expect(livePhase(room, players, 0, [], {}, qEnd)).toMatchObject({ kind: 'question' });
    // Tapping Next skips ahead.
    expect(livePhase(room, players, 0, yours, { r0: qEnd + 10 }, qEnd + 10)).toMatchObject({ kind: 'standings' });
    expect(livePhase(room, players, 0, yours, {}, qEnd + REVEAL_MS + STANDINGS_MS)).toMatchObject({ kind: 'question', index: 1 });
    expect(livePhase(room, players, 0, [], {}, 10_000_000)).toEqual({ kind: 'final' });
  });

  it('ranks the room, with previous ranks for movement', () => {
    const room = liveRoom('4821', 'host', TODAY);
    const perfect: LiveAnswer[] = room.questions.map(() => ({ pick: 0, atMs: 0, points: 150 }));
    const rows = liveStandings(room, room.players, perfect, 'Hana', LIVE_SIZE - 1);
    expect(rows[0]).toMatchObject({ isYou: true, rank: 1, score: 150 * LIVE_SIZE, correct: LIVE_SIZE });
    for (const r of rows) expect(r.prevRank).toBeGreaterThanOrEqual(1);
  });

  it('shows how the room answered, adding to about 100%', () => {
    const room = liveRoom('4821', 'host', TODAY);
    const pcts = roomPicks(room, room.players, { pick: 0, atMs: 500, points: 148 }, 0);
    const sum = pcts.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThanOrEqual(95);
    expect(sum).toBeLessThanOrEqual(104);
  });

  it('pays 5 per correct answer plus 25 for first place', () => {
    expect(liveCoins(4, 1)).toBe(45);
    expect(liveCoins(4, 2)).toBe(20);
  });
});
