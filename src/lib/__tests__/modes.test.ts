import { FLASH_CARDS } from '@/data/flashcards';
import { DIFFICULTIES, QUESTIONS } from '@/data/questions';
import { refillSponsor, SPONSORED_QUESTIONS, sponsoredCategory } from '@/data/sponsors';
import { STREET_EPISODES, streetAverage } from '@/data/street';
import { dailyIds, dailyQuestions } from '../daily';
import { coinsFor, correctCoins, pickByDifficulty, rampedPick } from '../difficulty';
import { flashDeck, FLASH_ROUND_SIZE, knownFirstTry, markCard, missedCards, runFinished, startRun } from '../flash';
import { fiftyFifty, mergeMissed, TOPIC_ROUND_SIZE } from '../economy';
import { seeded } from '../rng';
import { topicRound } from '../topics';

describe('economy', () => {
  it('50/50 hides exactly two wrong answers and never the right one', () => {
    for (let i = 0; i < 50; i++) {
      const hidden = fiftyFifty(seeded(`ff${i}`));
      expect(hidden).toHaveLength(2);
      expect(hidden).not.toContain(0);
    }
  });

  it('keeps the missed list newest-first, unique and capped', () => {
    expect(mergeMissed(['a', 'b'], ['c', 'a'])).toEqual(['c', 'a', 'b']);
    expect(mergeMissed(['a', 'b', 'c'], ['d'], 3)).toEqual(['d', 'a', 'b']);
  });
});

describe('rounds', () => {
  it('builds a topic round with a sponsored question in second place', () => {
    const round = topicRound('football', {}, seeded('x'));
    expect(round).toHaveLength(TOPIC_ROUND_SIZE);
    expect(round[1].sponsorId).toBeDefined();
    expect(round.filter((r) => r.sponsorId)).toHaveLength(1);
    expect(round.filter((r) => !r.sponsorId).every((r) => r.question.category === 'football')).toBe(true);
  });

  it('uses the presenting sponsor for its own question, and the chosen level for the rest', () => {
    const round = topicRound('science', { level: 'hard', sponsorId: 'tsehay' }, seeded('y'));
    expect(round[1].sponsorId).toBe('tsehay');
    expect(round.filter((r) => !r.sponsorId).every((r) => r.question.difficulty === 'hard')).toBe(true);
  });

  it('ramps the daily from easy to hard, 3/4/3, with no repeats', () => {
    for (const day of ['2026-11-14', '2026-11-15', '2027-01-01']) {
      const levels = dailyQuestions(day).map((pq) => pq.question.difficulty);
      expect(levels).toEqual(['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard']);
      expect(dailyIds(day).size).toBe(10);
    }
  });

  it('gives each daily question all four answers in some order', () => {
    for (const pq of dailyQuestions('2026-11-14')) {
      expect([...pq.order].sort()).toEqual([0, 1, 2, 3]);
    }
  });
});

describe('content', () => {
  it('has unique ids across questions, sponsored questions and flash cards', () => {
    const ids = [...QUESTIONS, ...SPONSORED_QUESTIONS, ...FLASH_CARDS].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has at least 4 questions per level in every category', () => {
    const cats = new Set(QUESTIONS.map((q) => q.category));
    for (const cat of cats) {
      for (const level of DIFFICULTIES) {
        expect(QUESTIONS.filter((q) => q.category === cat && q.difficulty === level).length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('has 10 flash cards per level', () => {
    for (const level of DIFFICULTIES) expect(FLASH_CARDS.filter((c) => c.difficulty === level)).toHaveLength(10);
  });

  it('street percentages add up to 100', () => {
    for (const ep of STREET_EPISODES) {
      for (const q of ep.questions) expect(q.streetPicks.reduce((a, b) => a + b, 0)).toBe(100);
      expect(streetAverage(ep)).toBeGreaterThan(0);
    }
  });
});

describe('difficulty', () => {
  const pool = [
    { id: 'e1', difficulty: 'easy' as const },
    { id: 'e2', difficulty: 'easy' as const },
    { id: 'm1', difficulty: 'medium' as const },
    { id: 'h1', difficulty: 'hard' as const },
  ];

  it('fills a short level from the nearest one', () => {
    const picked = pickByDifficulty(pool, 'hard', 3, seeded('a'));
    expect(picked.map((p) => p.id).slice(0, 2)).toEqual(['h1', 'm1']);
    expect(picked).toHaveLength(3);
  });

  it('never picks the same item twice in a ramp', () => {
    const picked = rampedPick(pool, [['easy', 2], ['medium', 2]], seeded('b'));
    expect(new Set(picked.map((p) => p.id)).size).toBe(picked.length);
  });

  it('pays more coins for harder questions', () => {
    expect([coinsFor('easy'), coinsFor('medium'), coinsFor('hard')]).toEqual([8, 10, 15]);
    expect(
      correctCoins([
        { questionId: 'eth-01', mark: 'correct' },
        { questionId: 'eth-08', mark: 'correct' },
        { questionId: 'eth-02', mark: 'wrong' },
      ]),
    ).toBe(8 + 15);
  });
});

describe('flash cards', () => {
  it('deals a round at the chosen level', () => {
    const deck = flashDeck('medium', seeded('c'));
    expect(deck).toHaveLength(FLASH_ROUND_SIZE);
    expect(deck.every((c) => c.difficulty === 'medium')).toBe(true);
  });

  it('sends a missed card to the back until it is known', () => {
    let run = startRun(flashDeck('easy', seeded('d')).slice(0, 3));
    const [a, b, c] = run.queue;
    run = markCard(run, false); // a missed
    expect(run.queue).toEqual([b, c, a]);
    run = markCard(run, true); // b
    run = markCard(run, true); // c
    expect(runFinished(run)).toBe(false);
    run = markCard(run, true); // a, second time
    expect(runFinished(run)).toBe(true);
    expect(knownFirstTry(run)).toBe(2);
    expect(missedCards(run)).toEqual([a]);
  });
});

describe('sponsor formats', () => {
  it('keeps one presenting sponsor for a whole month and rotates monthly', () => {
    expect(sponsoredCategory('2026-11-01')).toEqual(sponsoredCategory('2026-11-30'));
    const months = ['2026-11-15', '2026-12-15', '2027-01-15'].map((d) => sponsoredCategory(d).category);
    expect(new Set(months).size).toBe(3);
  });

  it('has a sponsored question for every presenting sponsor', () => {
    for (const d of ['2026-11-15', '2026-12-15', '2027-01-15']) {
      const { sponsor } = sponsoredCategory(d);
      expect(SPONSORED_QUESTIONS.some((q) => q.sponsorId === sponsor.id)).toBe(true);
    }
    expect(refillSponsor().name).toBeTruthy();
  });
});
