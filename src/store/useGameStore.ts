import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Language } from '@/i18n';
import { DAY_MS, dayKey, type DayKey } from '@/lib/clock';
import { DAILY_COUNT } from '@/lib/daily';
import { MAX_LIVES } from '@/lib/lives';
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
  /** Demo only: whole days added to the real clock. */
  dayOffset: number;
}

interface Actions {
  setLanguage: (language: Language) => void;
  setThemePref: (pref: ThemePref) => void;
  markOnboarded: () => void;
  recordDailyAnswer: (day: DayKey, answer: AnswerLog) => void;
  finishDaily: (day: DayKey, fillMissingWith?: string[]) => DailyRecord | null;
  signUp: (profile: Omit<Profile, 'joinedDay'>) => void;
  dismissSignupPrompt: () => void;
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
  coins: 50,
  lives: MAX_LIVES,
  livesAnchor: 0,
  dayOffset: 0,
});

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setLanguage: (language) => set({ language }),
      setThemePref: (themePref) => set({ themePref }),
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
        const { dailyProgress, dailyHistory, streak, coins } = get();
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
        const earned = dailyCoins(correct, nextStreak.current);
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
          onboarded: true,
        });
        return record;
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
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
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
