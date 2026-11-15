import { SPONSORS } from '@/data/sponsors';
import { bannerSponsor } from '../ads';
import { weekStrip, type Streak } from '../streak';

// 2026-11-09 is a Monday, 2026-11-15 the Sunday of the same week.
const played = (...days: string[]) => Object.fromEntries(days.map((d) => [d, {}]));

describe('weekStrip', () => {
  it('lists Monday to Sunday and marks today', () => {
    const strip = weekStrip({}, { current: 0, best: 0, lastDay: null }, '2026-11-12');
    expect(strip.map((d) => d.day)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);
    expect(strip.filter((d) => d.isToday).map((d) => d.day)).toEqual(['2026-11-12']);
  });

  it('shows past misses, an unplayed today and the days still to come', () => {
    const strip = weekStrip({}, { current: 0, best: 0, lastDay: null }, '2026-11-11');
    expect(strip.map((d) => d.state)).toEqual(['missed', 'missed', 'today', 'future', 'future', 'future', 'future']);
  });

  it('puts every day of the live streak on the strip', () => {
    const streak: Streak = { current: 3, best: 3, lastDay: '2026-11-12' };
    const strip = weekStrip(played('2026-11-10', '2026-11-11', '2026-11-12'), streak, '2026-11-12');
    expect(strip.map((d) => d.state)).toEqual(['missed', 'streak', 'streak', 'streak', 'future', 'future', 'future']);
  });

  it('keeps the streak lit the day after the last play, with today still open', () => {
    const streak: Streak = { current: 2, best: 2, lastDay: '2026-11-11' };
    const strip = weekStrip(played('2026-11-10', '2026-11-11'), streak, '2026-11-12');
    expect(strip[1].state).toBe('streak');
    expect(strip[2].state).toBe('streak');
    expect(strip[3].state).toBe('today');
  });

  it('shows days from a broken streak as played, not as part of a streak', () => {
    // Played Monday and Tuesday, missed Wednesday, then started again on Thursday.
    const streak: Streak = { current: 1, best: 2, lastDay: '2026-11-12' };
    const strip = weekStrip(played('2026-11-09', '2026-11-10', '2026-11-12'), streak, '2026-11-12');
    expect(strip.slice(0, 4).map((d) => d.state)).toEqual(['played', 'played', 'missed', 'streak']);
  });

  it('drops the streak once a whole day has been missed', () => {
    const streak: Streak = { current: 2, best: 2, lastDay: '2026-11-10' };
    const strip = weekStrip(played('2026-11-09', '2026-11-10'), streak, '2026-11-12');
    expect(strip.slice(0, 4).map((d) => d.state)).toEqual(['played', 'played', 'missed', 'today']);
  });

  it('only counts streak days that fall in this week', () => {
    // A 10-day streak on a Tuesday: just Monday and Tuesday are on this week's strip.
    const streak: Streak = { current: 10, best: 10, lastDay: '2026-11-10' };
    const strip = weekStrip(played('2026-11-09', '2026-11-10'), streak, '2026-11-10');
    expect(strip.filter((d) => d.state === 'streak')).toHaveLength(2);
  });
});

describe('bannerSponsor', () => {
  it('shows the same brand in one placement all day', () => {
    expect(bannerSponsor('home', '2026-11-14')).toBe(bannerSponsor('home', '2026-11-14'));
  });

  it('always picks one of the sponsors', () => {
    for (const placement of ['home', 'topic', 'daily', 'street', 'review', 'result'] as const) {
      expect(SPONSORS).toContain(bannerSponsor(placement, '2026-11-14'));
    }
  });

  it('rotates through every sponsor over time', () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      seen.add(bannerSponsor('home', `2026-11-${String(day).padStart(2, '0')}`).id);
    }
    expect(seen.size).toBe(SPONSORS.length);
  });

  it('never shows a brand that is already on the screen', () => {
    for (const sponsor of SPONSORS) {
      for (let day = 1; day <= 28; day++) {
        const pick = bannerSponsor('topic', `2026-11-${String(day).padStart(2, '0')}`, '', sponsor.id);
        expect(pick.id).not.toBe(sponsor.id);
      }
    }
  });
});
