import { dailyIds } from '../daily';
import {
  applyDuelCode,
  botById,
  botDuelAnswers,
  botReplyAt,
  decodeDuel,
  DUEL_EXPIRY_MS,
  DUEL_SIZE,
  duelQuestions,
  duelStatus,
  encodeDuel,
  incomingDuels,
  newDuel,
  normalizeAnswers,
  outcome,
  theirAnswers,
  total,
  type Duel,
  type DuelAnswer,
} from '../duel';
import { seeded } from '../rng';

const TODAY = '2026-11-14';
const NOW = new Date('2026-11-14T12:00:00').getTime();

const answers = (pts: (number | 'w' | 't')[]): DuelAnswer[] =>
  pts.map((p) => (p === 'w' ? { mark: 'wrong', points: 0 } : p === 't' ? { mark: 'timeout', points: 0 } : { mark: 'correct', points: p }));

const fresh = (seed = 'a'): Duel =>
  newDuel({ category: 'football', level: 'mixed', opponent: { kind: 'open' }, today: TODAY, now: NOW, rand: seeded(seed) });

describe('duel questions', () => {
  it('picks 5 questions from the topic and never from today’s Daily Challenge', () => {
    const banned = dailyIds(TODAY);
    for (let i = 0; i < 20; i++) {
      const d = fresh(`q${i}`);
      expect(d.questions).toHaveLength(DUEL_SIZE);
      expect(d.questions.some((id) => banned.has(id))).toBe(false);
      expect(duelQuestions(d).every((pq) => pq.question.category === 'football')).toBe(true);
    }
  });

  it('gives both phones the same answer order', () => {
    const d = fresh();
    expect(duelQuestions(d).map((p) => p.order)).toEqual(duelQuestions({ id: d.id, questions: [...d.questions] }).map((p) => p.order));
  });
});

describe('duel codes', () => {
  it('round-trips the match, rounding points the same way on both sides', () => {
    const d = fresh();
    const mine = answers([137, 'w', 100, 't', 150]);
    for (const name of ['Hana', 'ሀና ተ.']) {
      const decoded = decodeDuel(`Can you beat me? ${encodeDuel(d, mine, name)}`)!;
      expect(decoded).toMatchObject({ id: d.id, category: 'football', level: 'mixed', questions: d.questions, name });
      expect(decoded.answers).toEqual(normalizeAnswers(mine).map(({ mark, points }) => ({ mark, points })));
      expect(total(decoded.answers)).toBe(total(normalizeAnswers(mine)));
    }
  });

  it('rejects a broken code', () => {
    const code = encodeDuel(fresh(), answers([120, 120, 120, 120, 120]), 'Hana');
    expect(decodeDuel(code.slice(0, -2))).toBeNull();
    expect(decodeDuel(code.replace('LAYNOT:1.', 'LAYNOT:2.'))).toBeNull();
    expect(decodeDuel(code.replace('Hana', 'Hanna'))).toBeNull();
  });
});

describe('codes between two phones', () => {
  it('turns an unknown code into a challenge, and the reply back into a finished duel', () => {
    // Phone A plays and shares.
    const a = { ...fresh(), mine: normalizeAnswers(answers([140, 120, 'w', 110, 'w'])) };
    const challenge = decodeDuel(encodeDuel(a, a.mine, 'Hana'))!;

    // Phone B receives it.
    const b = applyDuelCode([], challenge, NOW);
    expect(b.result).toBe('challenge');
    const bDuel = { ...b.duels[0], mine: normalizeAnswers(answers([150, 'w', 'w', 'w', 'w'])) };
    expect(bDuel.theirs).toEqual(challenge.answers);

    // B replies; A pastes the reply.
    const reply = decodeDuel(encodeDuel(bDuel, bDuel.mine, 'Abel', 'reply'))!;
    expect(reply.kind).toBe('reply');
    const back = applyDuelCode([a], reply, NOW);
    expect(back.result).toBe('reply');
    const done = back.duels[0];
    expect(done.opponent).toEqual({ kind: 'code', name: 'Abel' });
    expect(outcome(done.mine!, done.theirs!)).toBe('win');
  });

  it('accepts a reply even when both players scored exactly the same', () => {
    const a = { ...fresh(), mine: normalizeAnswers(answers([150, 'w', 'w', 'w', 'w'])) };
    const reply = decodeDuel(encodeDuel(a, a.mine, 'Hana', 'reply'))!;
    const back = applyDuelCode([a], reply, NOW);
    expect(back.result).toBe('reply');
    expect(outcome(back.duels[0].mine!, back.duels[0].theirs!)).toBe('draw');
  });

  it('refuses a reply for a duel this phone never started', () => {
    const reply = decodeDuel(encodeDuel(fresh(), answers([120, 120, 120, 120, 120]), 'Abel', 'reply'))!;
    expect(applyDuelCode([], reply, NOW).result).toBe('unknownReply');
  });

  it("spots this phone's own code and a challenge already accepted", () => {
    const a = { ...fresh(), mine: normalizeAnswers(answers([140, 120, 'w', 110, 'w'])) };
    const own = decodeDuel(encodeDuel(a, a.mine, 'Hana'))!;
    expect(applyDuelCode([a], own, NOW).result).toBe('own');
    const accepted = applyDuelCode([], own, NOW).duels;
    expect(applyDuelCode(accepted, own, NOW).result).toBe('already');
  });
});

describe('demo friends', () => {
  it('answer the same way every time, and reply after their turn', () => {
    const d = { ...fresh(), opponent: { kind: 'bot' as const, botId: 'bot-1' }, mine: answers([120, 120, 120, 120, 120]), mineAt: NOW };
    const bot = botById('bot-1')!;
    expect(botDuelAnswers(d, bot)).toEqual(botDuelAnswers(d, bot));
    const at = botReplyAt(d, false);
    expect(at - NOW).toBeGreaterThanOrEqual(3 * 60_000);
    expect(at - NOW).toBeLessThanOrEqual(40 * 60_000);
    expect(botReplyAt(d, true) - NOW).toBeLessThan(60_000);
    expect(theirAnswers(d, at - 1, false)).toBeUndefined();
    expect(theirAnswers(d, at, false)).toHaveLength(DUEL_SIZE);
    expect(duelStatus(d, at - 1, false)).toBe('waiting');
    expect(duelStatus(d, at, false)).toBe('finished');
  });

  it('send 0 to 2 challenges a day, the same on every phone, which expire after 2 days', () => {
    for (const day of ['2026-11-14', '2026-11-15', '2026-11-16']) {
      const list = incomingDuels(day);
      expect(list.length).toBeLessThanOrEqual(2);
      expect(incomingDuels(day)).toEqual(list);
      for (const d of list) {
        expect(d.theirs).toHaveLength(DUEL_SIZE);
        expect(duelStatus(d, d.createdAt + DUEL_EXPIRY_MS, false)).toBe('expired');
      }
    }
  });
});

describe('outcome', () => {
  it('compares totals', () => {
    expect(outcome(answers([150]), answers([149]))).toBe('win');
    expect(outcome(answers(['w']), answers(['t']))).toBe('draw');
    expect(outcome(answers([100]), answers([120]))).toBe('loss');
  });
});
