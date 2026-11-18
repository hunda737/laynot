import { blitzRun, HAND_STATEMENTS } from '@/data/games/blitz';
import { GROUP_PUZZLES } from '@/data/games/groups';
import { ALL_NAMES, FOOTBALL_PLAYERS } from '@/data/games/players';
import { AM_ANSWERS, EN_ANSWERS, EN_GUESSES } from '@/data/games/wordle';
import { applyBlitzAnswer, BLITZ_START, DAILY_RUN_SIZE, multiplierFor, type BlitzState } from '../games/blitz';
import { dailyItem, dayScores, gamesDayPoints, GAMES_DAILY_CAP, pruneGames, type GameRecord } from '../games/common';
import { familyOf, FIDEL, isTypeable, splitFidel } from '../games/fidel';
import { checkGroup, groupsPoints, tileId } from '../games/groups';
import { normalizeName, playerGrid, playerPoints, searchNames } from '../games/player';
import { scoreGuess, tiles, wordlePoints } from '../games/wordle';

const TODAY = '2026-11-18';
const rec = (points: number): GameRecord => ({ points, solved: true, grid: '', coins: 0, streakAfter: 1 });

describe('wordle scoring', () => {
  it('marks hits, letters in another place and misses', () => {
    expect(scoreGuess(tiles('crane', 'en'), tiles('react', 'en'), 'en')).toEqual(['present', 'present', 'hit', 'miss', 'present']);
    expect(scoreGuess(tiles('table', 'en'), tiles('table', 'en'), 'en')).toEqual(['hit', 'hit', 'hit', 'hit', 'hit']);
  });

  it('marks a repeated letter only as often as the answer has it, hits first', () => {
    // SPEED has one D and two Es; EERIE has three Es.
    expect(scoreGuess(tiles('eerie', 'en'), tiles('speed', 'en'), 'en')).toEqual(['present', 'present', 'miss', 'miss', 'miss']);
    expect(scoreGuess(tiles('lolly', 'en'), tiles('hello', 'en'), 'en')).toEqual(['miss', 'present', 'hit', 'hit', 'miss']);
  });

  it('gives the Amharic "half" state for the right consonant with the wrong vowel', () => {
    // ቤተሰብ vs ቤተሳብ: ሳ is in the ሰ family.
    expect(scoreGuess(splitFidel('ቤተሳብ'), splitFidel('ቤተሰብ'), 'am')).toEqual(['hit', 'hit', 'half', 'hit']);
    // English never uses it.
    expect(scoreGuess(tiles('table', 'en'), tiles('cable', 'en'), 'en')[0]).toBe('miss');
  });

  it('prefers "present" when the exact character is elsewhere in the word', () => {
    // መንገድ: guess ገመሰሰ has ገ (present), መ (present), and ሰ (miss).
    expect(scoreGuess(splitFidel('ገመሰሰ'), splitFidel('መንገድ'), 'am')).toEqual(['present', 'present', 'miss', 'miss']);
  });

  it('scores 120 for a first-try solve and 20 for a sixth', () => {
    expect(wordlePoints(1)).toBe(120);
    expect(wordlePoints(6)).toBe(20);
    expect(wordlePoints(7)).toBe(20);
  });
});

describe('fidel', () => {
  it('groups vowel forms and wa forms with their consonant', () => {
    expect(familyOf('ሙ')).toBe('መ');
    expect(familyOf('ሟ')).toBe('መ');
    expect(familyOf('ኳ')).toBe('ከ');
    expect(familyOf('ጓ')).toBe('ገ');
    expect(familyOf('A')).toBe('A');
  });

  it('has seven vowel orders in every family', () => {
    for (const f of FIDEL) expect(f.forms.length).toBeGreaterThanOrEqual(7);
  });
});

describe('word lists', () => {
  it('has 5-letter English answers that are all accepted guesses', () => {
    for (const w of EN_ANSWERS) {
      expect(w).toMatch(/^[A-Z]{5}$/);
      expect(EN_GUESSES.has(w)).toBe(true);
    }
    for (const w of EN_GUESSES) expect(w).toMatch(/^[A-Z]{5}$/);
  });

  it('has 4-character Amharic answers that the keyboard can type', () => {
    for (const { word } of AM_ANSWERS) {
      const chars = splitFidel(word);
      expect(chars).toHaveLength(4);
      for (const c of chars) expect([word, c, isTypeable(c)]).toEqual([word, c, true]);
    }
  });

  it('has no duplicate answers', () => {
    expect(new Set(EN_ANSWERS).size).toBe(EN_ANSWERS.length);
    expect(new Set(AM_ANSWERS.map((a) => a.word)).size).toBe(AM_ANSWERS.length);
  });
});

describe('group the four', () => {
  it('has 16 different tiles and four levels in every puzzle', () => {
    for (const p of GROUP_PUZZLES) {
      const en = p.groups.flatMap((g) => g.tiles.map((t) => t.en));
      const am = p.groups.flatMap((g) => g.tiles.map((t) => t.am));
      expect([p.id, new Set(en).size, new Set(am).size]).toEqual([p.id, 16, 16]);
      expect(p.groups.map((g) => g.level).sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it('checks a selection', () => {
    expect(checkGroup([tileId(2, 0), tileId(2, 1), tileId(2, 2), tileId(2, 3)])).toEqual({ kind: 'correct', group: 2 });
    expect(checkGroup([tileId(1, 0), tileId(1, 1), tileId(1, 2), tileId(3, 0)])).toEqual({ kind: 'oneAway' });
    expect(checkGroup([tileId(1, 0), tileId(1, 1), tileId(3, 2), tileId(3, 0)])).toEqual({ kind: 'wrong' });
  });

  it('scores 100 minus 20 a mistake, and nothing for a fail', () => {
    expect(groupsPoints(0, true)).toBe(100);
    expect(groupsPoints(3, true)).toBe(40);
    expect(groupsPoints(2, false)).toBe(0);
  });
});

describe('blitz', () => {
  it('raises the multiplier every 5 in a row, up to 3', () => {
    expect([0, 4, 5, 9, 10, 30].map(multiplierFor)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('scores a run and resets the combo on a wrong answer', () => {
    let s: BlitzState = BLITZ_START;
    for (let i = 0; i < 6; i++) s = applyBlitzAnswer(s, true);
    expect(s.score).toBe(5 * 10 + 20);
    s = applyBlitzAnswer(s, false);
    expect(s).toMatchObject({ combo: 0, bestCombo: 6, right: 6, wrong: 1 });
    expect(applyBlitzAnswer(s, true).score).toBe(80);
  });

  it('gives everyone the same daily run, about half true', () => {
    const a = blitzRun(`blitz:${TODAY}`, DAILY_RUN_SIZE);
    const b = blitzRun(`blitz:${TODAY}`, DAILY_RUN_SIZE);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a).toHaveLength(DAILY_RUN_SIZE);
    expect(new Set(a.map((x) => x.id)).size).toBe(DAILY_RUN_SIZE);
    expect(a.filter((x) => x.answer).length).toBe(DAILY_RUN_SIZE / 2);
  });

  it('has unique hand-written statements', () => {
    expect(new Set(HAND_STATEMENTS.map((x) => x.id)).size).toBe(HAND_STATEMENTS.length);
  });
});

describe('guess the player', () => {
  it('scores 60 at the first step down to 10 at the last', () => {
    expect([0, 1, 5].map(playerPoints)).toEqual([60, 50, 10]);
  });

  it('matches names without accents, spaces or case, in either script', () => {
    expect(normalizeName('Kylian Mbappé')).toBe('kylianmbappe');
    expect(searchNames(ALL_NAMES, 'mbappe').map((n) => n.en)).toEqual(['Kylian Mbappé']);
    expect(searchNames(ALL_NAMES, 'ሳላህ').map((n) => n.en)).toEqual(['Mohamed Salah']);
  });

  it('has five clues and a unique name for every player', () => {
    for (const p of FOOTBALL_PLAYERS) expect(p.clues).toHaveLength(5);
    expect(new Set(ALL_NAMES.map((n) => n.en)).size).toBe(ALL_NAMES.length);
  });

  it('draws the share grid', () => {
    expect(playerGrid(3, true)).toBe('⬛⬛⚽');
    expect(playerGrid(6, false)).toBe('⬛⬛⬛⬛⬛⬛❌');
  });
});

describe('shared games rules', () => {
  it('caps the games points counted on one day', () => {
    expect(gamesDayPoints({ blitz: rec(300), groups: rec(100) })).toBe(GAMES_DAILY_CAP);
    expect(gamesDayPoints({ groups: rec(80) })).toBe(80);
    expect(gamesDayPoints(undefined)).toBe(0);
  });

  it('adds games points to the Daily score, and counts a games-only day', () => {
    expect(dayScores({ [TODAY]: { score: 900 } }, { [TODAY]: { player: rec(40) }, '2026-11-17': { groups: rec(60) } })).toEqual({
      [TODAY]: 940,
      '2026-11-17': 60,
    });
  });

  it('drops results older than the keep window', () => {
    const kept = pruneGames({ '2026-10-01': { groups: rec(1) }, '2026-11-10': { groups: rec(1) } }, TODAY);
    expect(Object.keys(kept)).toEqual(['2026-11-10']);
  });

  it('walks a fixed order one item a day, the same on every phone', () => {
    const items = ['a', 'b', 'c', 'd'];
    const days = ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'].map((d) => dailyItem(items, 'x', d));
    expect(new Set(days).size).toBe(4);
    expect(dailyItem(items, 'x', '2026-11-22')).toBe(days[0]);
  });
});
