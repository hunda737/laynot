import { progressSnapshot } from '../progress';

const TODAY = '2026-11-17';
const base = { streak: { current: 6, best: 9, lastDay: '2026-11-16' }, dailyHistory: {}, profile: null };

describe('progressSnapshot', () => {
  it('reports the streak that is still alive and no result before playing today', () => {
    expect(progressSnapshot(base, TODAY, 180, 'Hana T.')).toEqual({
      tz: 180,
      lastDay: '2026-11-16',
      streak: 6,
      best: 9,
      today: null,
      name: 'Hana T.',
    });
  });

  it('includes today’s score and correct count once the Daily Challenge is done', () => {
    const state = { ...base, streak: { current: 7, best: 9, lastDay: TODAY }, dailyHistory: { [TODAY]: { score: 1234, correct: 9 } } };
    const snap = progressSnapshot(state, TODAY, 180);
    expect(snap.today).toEqual({ day: TODAY, score: 1234, correct: 9 });
    expect(snap.streak).toBe(7);
  });

  it('reports a lapsed streak as 0 but keeps the best', () => {
    const state = { ...base, streak: { current: 6, best: 9, lastDay: '2026-11-10' } };
    const snap = progressSnapshot(state, TODAY, 180);
    expect(snap.streak).toBe(0);
    expect(snap.best).toBe(9);
  });

  it('prefers the profile name and keeps it to 24 characters', () => {
    const snap = progressSnapshot({ ...base, profile: { name: `  ${'N'.repeat(40)}  ` } }, TODAY, 0, 'Telegram name');
    expect(snap.name).toBe('N'.repeat(24));
    expect(progressSnapshot(base, TODAY, 0).name).toBe('');
  });

  it('sends the phone’s time zone as minutes east of UTC', () => {
    expect(progressSnapshot(base, TODAY, -240).tz).toBe(-240);
  });
});
