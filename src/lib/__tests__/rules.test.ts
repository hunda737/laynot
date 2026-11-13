import { addDays, daysBetween, weekDays } from '../clock';
import { gainLife, loseLife, MAX_LIVES, settleLives } from '../lives';
import { pickN, seeded } from '../rng';
import { dailyCoins, scoreAnswer, shareGrid } from '../scoring';
import { applyDailyPlay, EMPTY_STREAK, effectiveStreak } from '../streak';

describe('clock', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(daysBetween('2026-11-28', '2026-12-02')).toBe(4);
  });

  it('builds a Monday-to-Sunday week', () => {
    const week = weekDays('2026-11-14'); // a Saturday
    expect(week[0]).toBe('2026-11-09');
    expect(week[6]).toBe('2026-11-15');
  });
});

describe('rng', () => {
  it('gives the same pick for the same key', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(pickN(items, 10, seeded('2026-11-14'))).toEqual(pickN(items, 10, seeded('2026-11-14')));
    expect(pickN(items, 10, seeded('2026-11-14'))).not.toEqual(pickN(items, 10, seeded('2026-11-15')));
  });
});

describe('scoring', () => {
  it('caps the speed bonus at 50', () => {
    expect(scoreAnswer(true, 0)).toBe(150);
    expect(scoreAnswer(true, 15_000)).toBe(100);
    expect(scoreAnswer(true, -50)).toBe(150);
    expect(scoreAnswer(false, 0)).toBe(0);
  });

  it('builds a spoiler-free grid', () => {
    expect(shareGrid(['correct', 'wrong', 'timeout', 'correct', 'correct', 'correct'])).toBe('🟩🟥⬜🟩🟩\n🟩');
  });

  it('caps the streak coin bonus', () => {
    expect(dailyCoins(7, 2)).toBe(80);
    expect(dailyCoins(10, 30)).toBe(150);
  });
});

describe('streak', () => {
  it('grows on consecutive days and resets after a gap', () => {
    let s = applyDailyPlay(EMPTY_STREAK, '2026-11-10');
    s = applyDailyPlay(s, '2026-11-11');
    expect(s.current).toBe(2);
    expect(applyDailyPlay(s, '2026-11-11')).toBe(s);
    s = applyDailyPlay(s, '2026-11-13');
    expect(s).toEqual({ current: 1, best: 2, lastDay: '2026-11-13' });
  });

  it('shows the streak until a full day is missed', () => {
    const s = { current: 4, best: 4, lastDay: '2026-11-12' };
    expect(effectiveStreak(s, '2026-11-13')).toBe(4);
    expect(effectiveStreak(s, '2026-11-14')).toBe(0);
  });
});

describe('lives', () => {
  const R = 1000;

  it('starts a countdown when losing from full', () => {
    const s = loseLife({ lives: MAX_LIVES, anchor: 0 }, 5000, R);
    expect(s).toEqual({ lives: 4, anchor: 5000 });
    expect(settleLives(s, 5999, R).lives).toBe(4);
    expect(settleLives(s, 6000, R)).toMatchObject({ lives: 5, nextAt: null });
  });

  it('refills while closed and keeps partial progress', () => {
    const v = settleLives({ lives: 1, anchor: 0 }, 2500, R);
    expect(v).toEqual({ lives: 3, anchor: 2000, nextAt: 3000 });
  });

  it('never goes below zero or above max', () => {
    expect(loseLife({ lives: 0, anchor: 0 }, 10, R).lives).toBe(0);
    expect(gainLife({ lives: 5, anchor: 0 }, 10, R).lives).toBe(5);
  });
});
