import { QUESTIONS, type CategoryId } from '@/data/questions';
import { SPONSORED_QUESTIONS, type SponsoredQuestion } from '@/data/sponsors';
import type { PlayableQuestion } from './daily';
import { pickByDifficulty, type LevelChoice } from './difficulty';
import { TOPIC_ROUND_SIZE } from './economy';
import { shuffle } from './rng';

export interface TopicQuestion extends PlayableQuestion {
  sponsorId?: string;
}

export interface TopicRoundOptions {
  level?: LevelChoice;
  /** When the category has a presenting sponsor, its own question is used. */
  sponsorId?: string;
}

/**
 * A Topic Play round: four questions from the category at the chosen level, plus
 * one sponsored question in second place, where attention is still high.
 */
export function topicRound(
  category: CategoryId,
  { level = 'mixed', sponsorId }: TopicRoundOptions = {},
  rand: () => number = Math.random,
): TopicQuestion[] {
  const pool = QUESTIONS.filter((q) => q.category === category);
  const picked: TopicQuestion[] = pickByDifficulty(pool, level, TOPIC_ROUND_SIZE - 1, rand).map((question) => ({
    question,
    order: shuffle([0, 1, 2, 3], rand),
  }));
  const own = sponsorId ? SPONSORED_QUESTIONS.filter((q) => q.sponsorId === sponsorId) : [];
  const choices = own.length > 0 ? own : SPONSORED_QUESTIONS;
  const sponsored: SponsoredQuestion = choices[Math.floor(rand() * choices.length)];
  picked.splice(1, 0, { question: sponsored, order: shuffle([0, 1, 2, 3], rand), sponsorId: sponsored.sponsorId });
  return picked;
}
