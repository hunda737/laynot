import { QUESTIONS, type CategoryId } from '@/data/questions';
import { STREET_EPISODES } from '@/data/street';
import { addDays, type DayKey } from './clock';
import { dailyQuestions } from './daily';
import { correctCoins } from './difficulty';
import type { League } from './league';
import { seeded } from './rng';
import { dailyCoins, scoreAnswer, type AnswerMark } from './scoring';

interface SampleAnswer {
  questionId: string;
  pick: number | null;
  mark: AnswerMark;
  points: number;
}

export interface SampleRecord {
  day: DayKey;
  score: number;
  correct: number;
  total: number;
  answers: SampleAnswer[];
  coins: number;
  streakAfter: number;
}

/**
 * A believable returning player: Daily Challenge on each of the last `days` days
 * (not today, so the demo can still play it), some topic rounds, one street episode.
 */
export function samplePlayer(today: DayKey, days = 6) {
  const rand = seeded(`sample:${today}`);
  const history: Record<DayKey, SampleRecord> = {};
  let coins = 120;

  for (let i = days; i >= 1; i--) {
    const day = addDays(today, -i);
    const streakAfter = days - i + 1;
    const answers: SampleAnswer[] = dailyQuestions(day).map(({ question }) => {
      const roll = rand();
      const mark: AnswerMark = roll < 0.72 ? 'correct' : roll < 0.93 ? 'wrong' : 'timeout';
      const pick = mark === 'correct' ? 0 : mark === 'wrong' ? 1 + Math.floor(rand() * 3) : null;
      return { questionId: question.id, pick, mark, points: scoreAnswer(mark === 'correct', 2500 + rand() * 9000) };
    });
    const correct = answers.filter((a) => a.mark === 'correct').length;
    const earned = dailyCoins(correctCoins(answers), streakAfter);
    coins += earned;
    history[day] = {
      day,
      score: answers.reduce((s, a) => s + a.points, 0),
      correct,
      total: answers.length,
      answers,
      coins: earned,
      streakAfter,
    };
  }

  const topicStats: Partial<Record<CategoryId, { rounds: number; answered: number; correct: number; best: number }>> = {
    ethiopia: { rounds: 4, answered: 20, correct: 15, best: 5 },
    football: { rounds: 3, answered: 15, correct: 9, best: 4 },
    science: { rounds: 1, answered: 5, correct: 3, best: 3 },
  };

  const missed = Object.values(history)
    .flatMap((r) => r.answers.filter((a) => a.mark !== 'correct').map((a) => a.questionId))
    .filter((id, i, all) => all.indexOf(id) === i)
    .slice(0, 8);

  const ep = STREET_EPISODES[STREET_EPISODES.length - 1];

  return {
    profile: { name: 'Hana', phone: '911234567', adult: true, joinedDay: addDays(today, -days) },
    dailyHistory: history,
    streak: { current: days, best: days, lastDay: addDays(today, -1) },
    coins: coins + 210,
    topicStats,
    streetResults: { [ep.id]: { correct: 3, total: ep.questions.length, day: addDays(today, -2) } },
    missed: missed.filter((id) => QUESTIONS.some((q) => q.id === id)),
    leagues: [{ id: 'h4n4', name: 'Office Crew', mine: true, joinedDay: addDays(today, -days), extra: [] }] as League[],
    onboarded: true,
    signupPromptDismissed: true,
  };
}
