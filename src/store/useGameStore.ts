import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CategoryId } from '@/data/questions';
import type { Language } from '@/i18n';
import { DAY_MS, dayKey, type DayKey } from '@/lib/clock';
import { DAILY_COUNT } from '@/lib/daily';
import { correctCoins, type LevelChoice } from '@/lib/difficulty';
import { FLASH_ROUND_COINS } from '@/lib/flash';
import { newLeagueId, nextJoiner, type League } from '@/lib/league';
import { AD_DAILY_CAP, mergeMissed, STARTING_COINS } from '@/lib/economy';
import { FAST_REFILL_MS, gainLife, loseLife, MAX_LIVES, REFILL_MS, settleLives } from '@/lib/lives';
import { samplePlayer } from '@/lib/sample';
import { countCorrect, dailyCoins, type AnswerMark } from '@/lib/scoring';
import { applyDailyPlay, EMPTY_STREAK, type Streak } from '@/lib/streak';

export type ThemePref = 'system' | 'light' | 'dark';

export interface Profile {
  name: string;
  /** Nine digits after +251. */
  phone: string;
  adult: boolean;
  joinedDay: DayKey;
}

/** One answered question. `pick` is the index into the question's choices, or null on timeout. */
export interface AnswerLog {
  questionId: string;
  pick: number | null;
  mark: AnswerMark;
  points: number;
}

export interface DailyRecord {
  day: DayKey;
  score: number;
  correct: number;
  total: number;
  answers: AnswerLog[];
  coins: number;
  streakAfter: number;
}

interface DailyProgress {
  day: DayKey;
  answers: AnswerLog[];
}

export interface TopicStat {
  rounds: number;
  answered: number;
  correct: number;
  /** Best number of correct answers in one round. */
  best: number;
}

export interface FlashStats {
  rounds: number;
  seen: number;
  known: number;
}

interface PersistedState {
  language: Language;
  themePref: ThemePref;
  onboarded: boolean;
  profile: Profile | null;
  signupPromptDismissed: boolean;
  dailyHistory: Record<DayKey, DailyRecord>;
  dailyProgress: DailyProgress | null;
  streak: Streak;
  coins: number;
  lives: number;
  livesAnchor: number;
  ads: { day: DayKey; count: number };
  topicStats: Partial<Record<CategoryId, TopicStat>>;
  /** First result per Beat the Street episode. Replays do not overwrite it or earn coins. */
  streetResults: Record<string, { correct: number; total: number; day: DayKey }>;
  /** Ids of questions answered wrong, newest first. */
  missed: string[];
  /** Last difficulty picked for Topic Play and Flash Cards. */
  topicLevel: LevelChoice;
  /** Day the sponsored free life was last claimed. */
  sponsoredRefillDay: DayKey;
  /** Private leagues on this phone, besides the built-in Friends league. */
  leagues: League[];
  /** Flash Cards: rounds finished, cards seen and cards marked "Got it" on the first try. */
  flashStats: FlashStats;
  /** Demo only: whole days added to the real clock. */
  dayOffset: number;
  /** Demo only: refill a life every minute instead of every 30. */
  fastRefill: boolean;
}

interface Actions {
  setLanguage: (language: Language) => void;
  setThemePref: (pref: ThemePref) => void;
  setTopicLevel: (level: LevelChoice) => void;
  markOnboarded: () => void;
  recordDailyAnswer: (day: DayKey, answer: AnswerLog) => void;
  finishDaily: (day: DayKey, fillMissingWith?: string[]) => DailyRecord | null;
  signUp: (profile: Omit<Profile, 'joinedDay'>) => void;
  dismissSignupPrompt: () => void;
  loseLife: () => void;
  gainLife: () => void;
  /** Count a finished rewarded ad. Returns false when today's cap is reached. */
  consumeAd: () => boolean;
  spendCoins: (amount: number) => boolean;
  addCoins: (amount: number) => void;
  finishTopicRound: (category: CategoryId, answers: AnswerLog[], coins: number) => void;
  /** Returns the coins earned (zero on a replay). */
  finishStreet: (episodeId: string, answers: AnswerLog[]) => number;
  resolveMissed: (questionId: string) => void;
  /** Record a Flash Cards round. Only a round played to the end pays the flat reward. */
  finishFlashRound: (seen: number, knownFirstTry: number, completed: boolean) => number;
  /** The once-a-day sponsored life. Returns false if today's is already used. */
  claimSponsoredRefill: () => boolean;
  createLeague: (name: string) => League;
  /** Join from an invite. Returns the league, and whether it was already on this phone. */
  joinLeague: (invite: { id: string; name: string }) => { league: League; already: boolean };
  leaveLeague: (id: string) => void;
  /** Demo: the next demo player joins a league. Returns their name. */
  demoLeagueJoin: (id: string) => string | null;
  demoEmptyLives: () => void;
  demoResetAds: () => void;
  /** Replace progress with a returning player who has a 6-day streak. Keeps language and theme. */
  demoLoadSample: () => void;
  demoSetFastRefill: (on: boolean) => void;
  demoShiftDays: (days: number) => void;
  demoResetClock: () => void;
  resetAll: () => void;
}

export type GameState = PersistedState & Actions;

const initialState = (): PersistedState => ({
  language: 'en',
  themePref: 'system',
  onboarded: false,
  profile: null,
  signupPromptDismissed: false,
  dailyHistory: {},
  dailyProgress: null,
  streak: EMPTY_STREAK,
  coins: STARTING_COINS,
  lives: MAX_LIVES,
  livesAnchor: 0,
  ads: { day: '', count: 0 },
  topicStats: {},
  streetResults: {},
  missed: [],
  topicLevel: 'mixed',
  leagues: [],
  sponsoredRefillDay: '',
  flashStats: { rounds: 0, seen: 0, known: 0 },
  dayOffset: 0,
  fastRefill: false,
});

export const refillMsOf = (s: Pick<PersistedState, 'fastRefill'>) => (s.fastRefill ? FAST_REFILL_MS : REFILL_MS);

const wrongIds = (answers: AnswerLog[]) => answers.filter((a) => a.mark !== 'correct').map((a) => a.questionId);

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setLanguage: (language) => set({ language }),
      setThemePref: (themePref) => set({ themePref }),
      setTopicLevel: (topicLevel) => set({ topicLevel }),
      markOnboarded: () => set({ onboarded: true }),

      recordDailyAnswer: (day, answer) => {
        const { dailyProgress, dailyHistory } = get();
        if (dailyHistory[day]) return;
        const answers = dailyProgress?.day === day ? dailyProgress.answers : [];
        if (answers.some((a) => a.questionId === answer.questionId)) return;
        set({ dailyProgress: { day, answers: [...answers, answer] }, onboarded: true });
      },

      /**
       * Close today's attempt. Questions in `fillMissingWith` that were never answered
       * are recorded as timeouts, which is what happens when a player leaves early.
       */
      finishDaily: (day, fillMissingWith = []) => {
        const { dailyProgress, dailyHistory, streak, coins, missed } = get();
        if (dailyHistory[day]) return dailyHistory[day];
        const answers = dailyProgress?.day === day ? [...dailyProgress.answers] : [];
        for (const id of fillMissingWith) {
          if (!answers.some((a) => a.questionId === id)) {
            answers.push({ questionId: id, pick: null, mark: 'timeout', points: 0 });
          }
        }
        if (answers.length === 0) {
          set({ dailyProgress: null });
          return null;
        }
        const nextStreak = applyDailyPlay(streak, day);
        const correct = countCorrect(answers.map((a) => a.mark));
        const earned = dailyCoins(correctCoins(answers), nextStreak.current);
        const record: DailyRecord = {
          day,
          score: answers.reduce((sum, a) => sum + a.points, 0),
          correct,
          total: Math.max(DAILY_COUNT, answers.length),
          answers,
          coins: earned,
          streakAfter: nextStreak.current,
        };
        set({
          dailyHistory: { ...dailyHistory, [day]: record },
          dailyProgress: null,
          streak: nextStreak,
          coins: coins + earned,
          missed: mergeMissed(missed, wrongIds(answers)),
          onboarded: true,
        });
        return record;
      },

      loseLife: () => {
        const s = get();
        const next = loseLife({ lives: s.lives, anchor: s.livesAnchor }, nowTs(), refillMsOf(s));
        set({ lives: next.lives, livesAnchor: next.anchor });
      },
      gainLife: () => {
        const s = get();
        const next = gainLife({ lives: s.lives, anchor: s.livesAnchor }, nowTs(), refillMsOf(s));
        set({ lives: next.lives, livesAnchor: next.anchor });
      },

      consumeAd: () => {
        const today = todayKey();
        const { ads } = get();
        const count = ads.day === today ? ads.count : 0;
        if (count >= AD_DAILY_CAP) return false;
        set({ ads: { day: today, count: count + 1 } });
        return true;
      },

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },
      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

      finishTopicRound: (category, answers, coins) => {
        const { topicStats, missed } = get();
        const prev = topicStats[category] ?? { rounds: 0, answered: 0, correct: 0, best: 0 };
        const correct = answers.filter((a) => a.mark === 'correct').length;
        set((s) => ({
          topicStats: {
            ...topicStats,
            [category]: {
              rounds: prev.rounds + 1,
              answered: prev.answered + answers.length,
              correct: prev.correct + correct,
              best: Math.max(prev.best, correct),
            },
          },
          coins: s.coins + coins,
          missed: mergeMissed(missed, wrongIds(answers)),
        }));
      },

      finishStreet: (episodeId, answers) => {
        const { streetResults, missed, coins } = get();
        const correct = answers.filter((a) => a.mark === 'correct').length;
        const firstTime = !streetResults[episodeId];
        const earned = firstTime ? correctCoins(answers) : 0;
        set({
          streetResults: firstTime
            ? { ...streetResults, [episodeId]: { correct, total: answers.length, day: todayKey() } }
            : streetResults,
          coins: coins + earned,
          missed: mergeMissed(missed, wrongIds(answers)),
        });
        return earned;
      },

      resolveMissed: (questionId) => set((s) => ({ missed: s.missed.filter((id) => id !== questionId) })),

      finishFlashRound: (seen, knownFirstTry, completed) => {
        const earned = completed ? FLASH_ROUND_COINS : 0;
        set((s) => ({
          flashStats: {
            rounds: s.flashStats.rounds + 1,
            seen: s.flashStats.seen + seen,
            known: s.flashStats.known + knownFirstTry,
          },
          coins: s.coins + earned,
        }));
        return earned;
      },

      claimSponsoredRefill: () => {
        const today = todayKey();
        if (get().sponsoredRefillDay === today) return false;
        get().gainLife();
        set({ sponsoredRefillDay: today });
        return true;
      },

      createLeague: (name) => {
        const league: League = { id: newLeagueId(), name: name.trim(), mine: true, joinedDay: todayKey(), extra: [] };
        set((s) => ({ leagues: [...s.leagues, league] }));
        return league;
      },
      joinLeague: (invite) => {
        const existing = get().leagues.find((l) => l.id === invite.id);
        if (existing) return { league: existing, already: true };
        const league: League = { ...invite, mine: false, joinedDay: todayKey(), extra: [] };
        set((s) => ({ leagues: [...s.leagues, league] }));
        return { league, already: false };
      },
      leaveLeague: (id) => set((s) => ({ leagues: s.leagues.filter((l) => l.id !== id) })),
      demoLeagueJoin: (id) => {
        const league = get().leagues.find((l) => l.id === id);
        if (!league) return null;
        const bot = nextJoiner(id, league.extra);
        if (!bot) return null;
        set((s) => ({ leagues: s.leagues.map((l) => (l.id === id ? { ...l, extra: [...l.extra, bot.id] } : l)) }));
        return bot.name;
      },

      demoEmptyLives: () => set({ lives: 0, livesAnchor: nowTs() }),
      demoResetAds: () => set({ ads: { day: '', count: 0 } }),
      demoLoadSample: () => {
        const { language, themePref, dayOffset, fastRefill } = get();
        set({ ...initialState(), language, themePref, dayOffset, fastRefill, ...samplePlayer(todayKey()) });
      },
      demoSetFastRefill: (on) => {
        // Settle at the old speed, then restart the countdown at the new one.
        const s = get();
        const now = nowTs();
        const v = settleLives({ lives: s.lives, anchor: s.livesAnchor }, now, refillMsOf(s));
        set({ fastRefill: on, lives: v.lives, livesAnchor: now });
      },

      signUp: (profile) =>
        set({ profile: { ...profile, joinedDay: dayKey(nowTs()) }, signupPromptDismissed: true }),
      dismissSignupPrompt: () => set({ signupPromptDismissed: true }),

      demoShiftDays: (days) => set((s) => ({ dayOffset: s.dayOffset + days })),
      demoResetClock: () => set({ dayOffset: 0 }),

      resetAll: () => {
        const { language, themePref } = get();
        set({ ...initialState(), language, themePref });
      },
    }),
    {
      name: 'laynot-game',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // New keys get their defaults from the shallow merge. Version 2 changed the
      // question pool, so a half-played daily from before would no longer match.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PersistedState>;
        if (version < 2) return { ...state, dailyProgress: null };
        return state;
      },
    },
  ),
);

/** The current time, moved forward by the demo day offset. */
export function nowTs(): number {
  return Date.now() + useGame.getState().dayOffset * DAY_MS;
}

export function todayKey(): DayKey {
  return dayKey(nowTs());
}
