import { QUESTIONS, type CategoryId } from '@/data/questions';
import { SPONSORED_QUESTIONS, type SponsoredQuestion } from '@/data/sponsors';
import type { PlayableQuestion } from './daily';
import { TOPIC_ROUND_SIZE } from './economy';
import { pickN, shuffle } from './rng';

export interface TopicQuestion extends PlayableQuestion {
  sponsorId?: string;
}

/**
 * A Topic Play round: four questions from the category plus one sponsored
 * question in second place, where attention is still high.
 */
export function topicRound(category: CategoryId, rand: () => number = Math.random): TopicQuestion[] {
  const pool = QUESTIONS.filter((q) => q.category === category);
  const picked: TopicQuestion[] = pickN(pool, TOPIC_ROUND_SIZE - 1, rand).map((question) => ({
    question,
    order: shuffle([0, 1, 2, 3], rand),
  }));
  const sponsored: SponsoredQuestion = SPONSORED_QUESTIONS[Math.floor(rand() * SPONSORED_QUESTIONS.length)];
  picked.splice(1, 0, { question: sponsored, order: shuffle([0, 1, 2, 3], rand), sponsorId: sponsored.sponsorId });
  return picked;
}
