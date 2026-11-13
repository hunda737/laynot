import { QUESTIONS } from '@/data/questions';
import { STREET_EPISODES, streetAverage } from '@/data/street';
import { dailyQuestions } from '../daily';
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
    const round = topicRound('football', seeded('x'));
    expect(round).toHaveLength(TOPIC_ROUND_SIZE);
    expect(round[1].sponsorId).toBeDefined();
    expect(round.filter((r) => r.sponsorId)).toHaveLength(1);
    expect(round.filter((r) => !r.sponsorId).every((r) => r.question.category === 'football')).toBe(true);
  });

  it('gives each daily question all four answers in some order', () => {
    for (const pq of dailyQuestions('2026-11-14')) {
      expect([...pq.order].sort()).toEqual([0, 1, 2, 3]);
    }
  });
});

describe('content', () => {
  it('has unique question ids and eight questions per category', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const counts: Record<string, number> = {};
    for (const q of QUESTIONS) counts[q.category] = (counts[q.category] ?? 0) + 1;
    expect(Object.values(counts).every((n) => n === 8)).toBe(true);
  });

  it('street percentages add up to 100', () => {
    for (const ep of STREET_EPISODES) {
      for (const q of ep.questions) expect(q.streetPicks.reduce((a, b) => a + b, 0)).toBe(100);
      expect(streetAverage(ep)).toBeGreaterThan(0);
    }
  });
});
