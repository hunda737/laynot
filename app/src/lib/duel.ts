import { BOTS, type Bot } from '@/data/players';
import { CATEGORIES, QUESTIONS, type CategoryId } from '@/data/questions';
import { addDays, DAY_MS, parseDayKey, type DayKey } from './clock';
import { decodeName, DUEL_PREFIX, encodeName, findCode, makeCode, randomId } from './codes';
import { dailyIds, type PlayableQuestion } from './daily';
import { LEVEL_CHOICES, pickByDifficulty, type LevelChoice } from './difficulty';
import { seeded, shuffle } from './rng';
import { MAX_SPEED_BONUS, POINTS_CORRECT, type AnswerMark } from './scoring';

export const DUEL_SIZE = 5;
/** An unanswered challenge disappears after this long. */
export const DUEL_EXPIRY_MS = 2 * DAY_MS;
export const DUEL_COINS = { win: 30, draw: 15, loss: 5 } as const;

export type DuelCategory = CategoryId | 'mixed';
export type Outcome = keyof typeof DUEL_COINS;

export interface DuelAnswer {
  mark: AnswerMark;
  points: number;
  /** Only known for your own answers; a code does not carry the opponent's picks. */
  pick?: number | null;
}

export type Opponent =
  | { kind: 'bot'; botId: string }
  /** A real person, known from a code. */
  | { kind: 'code'; name: string }
  /** "Anyone": a code was shared and no reply has come back yet. */
  | { kind: 'open' };

export interface Duel {
  /** Match id, shared by both phones. Also seeds the answer order. */
  id: string;
  questions: string[];
  category: DuelCategory;
  level: LevelChoice;
  role: 'challenger' | 'challenged';
  opponent: Opponent;
  createdAt: number;
  mine?: DuelAnswer[];
  mineAt?: number;
  theirs?: DuelAnswer[];
  /** Coins already paid for the finished duel. */
  claimed?: boolean;
}

// ---------- Questions ----------

/**
 * Pick 5 questions for a new duel, skipping today's Daily Challenge so a duel
 * can never leak answers that count for prizes.
 */
export function pickDuelQuestions(category: DuelCategory, level: LevelChoice, today: DayKey, rand: () => number): string[] {
  const banned = dailyIds(today);
  const pool = QUESTIONS.filter((q) => (category === 'mixed' || q.category === category) && !banned.has(q.id));
  return pickByDifficulty(pool, level, DUEL_SIZE, rand).map((q) => q.id);
}

/** The questions in play order, with the same answer order on both phones. */
export function duelQuestions(duel: Pick<Duel, 'id' | 'questions'>): PlayableQuestion[] {
  return duel.questions
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .filter((q) => q !== undefined)
    .map((question) => ({ question, order: shuffle([0, 1, 2, 3], seeded(`duel:${duel.id}:${question.id}`)) }));
}

export function newDuel(opts: {
  category: DuelCategory;
  level: LevelChoice;
  opponent: Opponent;
  today: DayKey;
  now: number;
  rand?: () => number;
}): Duel {
  const rand = opts.rand ?? Math.random;
  return {
    id: randomId(rand, 4),
    questions: pickDuelQuestions(opts.category, opts.level, opts.today, rand),
    category: opts.category,
    level: opts.level,
    role: 'challenger',
    opponent: opts.opponent,
    createdAt: opts.now,
  };
}

// ---------- Scores and outcome ----------

export function total(answers: readonly DuelAnswer[] | undefined): number {
  return (answers ?? []).reduce((sum, a) => sum + a.points, 0);
}

export function outcome(mine: readonly DuelAnswer[], theirs: readonly DuelAnswer[]): Outcome {
  const d = total(mine) - total(theirs);
  return d > 0 ? 'win' : d < 0 ? 'loss' : 'draw';
}

// ---------- Codes ----------

const CAT_CODES: DuelCategory[] = ['mixed', ...CATEGORIES.map((c) => c.id)];
const LEVEL_CODES: Record<LevelChoice, string> = { mixed: 'x', easy: 'e', medium: 'm', hard: 'h' };

/**
 * One character per answer: "w" wrong, "t" timeout, or a letter a-z for a correct
 * answer whose speed bonus is twice the letter's position (0-50). Points are rounded
 * to that even bonus, so both phones always show the same score.
 */
function encodeAnswer(a: DuelAnswer): string {
  if (a.mark === 'wrong') return 'w';
  if (a.mark === 'timeout') return 't';
  const bonus = Math.max(0, Math.min(MAX_SPEED_BONUS, a.points - POINTS_CORRECT));
  return String.fromCharCode(97 + Math.min(25, Math.round(bonus / 2)));
}

function decodeAnswer(c: string): DuelAnswer | null {
  if (c === 'w') return { mark: 'wrong', points: 0 };
  if (c === 't') return { mark: 'timeout', points: 0 };
  const i = c.charCodeAt(0) - 97;
  if (i < 0 || i > 25) return null;
  return { mark: 'correct', points: POINTS_CORRECT + 2 * i };
}

/** Round points the way a code does, so your own score matches what your friend sees. */
export function normalizeAnswers(answers: readonly DuelAnswer[]): DuelAnswer[] {
  return answers.map((a) => ({ ...decodeAnswer(encodeAnswer(a))!, pick: a.pick }));
}

export type CodeKind = 'challenge' | 'reply';

/**
 * A challenge (sent by the player who started the duel) or a reply (sent back
 * by the friend). The kind is in the code, so identical scores can't be mistaken
 * for your own code coming back.
 */
export function encodeDuel(
  duel: Pick<Duel, 'id' | 'questions' | 'category' | 'level'>,
  answers: readonly DuelAnswer[],
  name: string,
  kind: CodeKind = 'challenge',
): string {
  const meta = CAT_CODES.indexOf(duel.category).toString(36) + LEVEL_CODES[duel.level] + (kind === 'reply' ? 'r' : 'c');
  const qidx = duel.questions.map((id) => QUESTIONS.findIndex((q) => q.id === id).toString(36).padStart(2, '0')).join('');
  return makeCode(DUEL_PREFIX, ['1', duel.id, meta, qidx, answers.map(encodeAnswer).join(''), encodeName(name)]);
}

export interface DecodedDuel {
  kind: CodeKind;
  id: string;
  category: DuelCategory;
  level: LevelChoice;
  questions: string[];
  answers: DuelAnswer[];
  name: string;
}

export function decodeDuel(text: string): DecodedDuel | null {
  const parts = findCode(text, DUEL_PREFIX);
  if (!parts || parts.length !== 6 || parts[0] !== '1') return null;
  const [, id, meta, qidx, marks, rawName] = parts;
  if (!/^[0-9a-z]{4}$/.test(id) || meta.length !== 3 || !'cr'.includes(meta[2]) || qidx.length !== DUEL_SIZE * 2 || marks.length !== DUEL_SIZE) return null;
  const category = CAT_CODES[parseInt(meta[0], 36)];
  const level = LEVEL_CHOICES.find((l) => LEVEL_CODES[l] === meta[1]);
  if (!category || !level) return null;
  const questions: string[] = [];
  for (let i = 0; i < qidx.length; i += 2) {
    const q = QUESTIONS[parseInt(qidx.slice(i, i + 2), 36)];
    if (!q) return null;
    questions.push(q.id);
  }
  const answers = [...marks].map(decodeAnswer);
  if (answers.some((a) => a === null)) return null;
  const name = decodeName(rawName);
  if (!name) return null;
  return { kind: meta[2] === 'r' ? 'reply' : 'challenge', id, category, level, questions, answers: answers as DuelAnswer[], name };
}

// ---------- Demo friends ----------

export const FRIEND_BOTS: Bot[] = BOTS.filter((b) => b.friend);

export function botById(id: string): Bot | undefined {
  return BOTS.find((b) => b.id === id);
}

const LEVEL_SHIFT = { easy: 0.12, medium: 0, hard: -0.18 } as const;

/** How a demo friend plays a duel: the same every time for the same match. */
export function botDuelAnswers(duel: Pick<Duel, 'id' | 'questions'>, bot: Bot): DuelAnswer[] {
  const rand = seeded(`duelbot:${duel.id}:${bot.id}`);
  return duel.questions.map((qid) => {
    const level = QUESTIONS.find((q) => q.id === qid)?.difficulty ?? 'medium';
    if (rand() < bot.skill + LEVEL_SHIFT[level]) {
      return { mark: 'correct' as const, points: POINTS_CORRECT + 2 * Math.floor(rand() * 23) };
    }
    return { mark: rand() < 0.85 ? ('wrong' as const) : ('timeout' as const), points: 0 };
  });
}

/** When a challenged demo friend plays back: 3-40 minutes after your turn, or under a minute in fast mode. */
export function botReplyAt(duel: Pick<Duel, 'id' | 'mineAt' | 'createdAt'>, fast: boolean): number {
  const rand = seeded(`duelreply:${duel.id}`);
  const base = duel.mineAt ?? duel.createdAt;
  return base + (fast ? 15_000 + rand() * 40_000 : (3 + rand() * 37) * 60_000);
}

/**
 * The opponent's answers if they are known by `now`: stored ones, or a demo
 * friend's once their reply time has passed.
 */
export function theirAnswers(duel: Duel, now: number, fast: boolean): DuelAnswer[] | undefined {
  if (duel.theirs) return duel.theirs;
  if (duel.opponent.kind !== 'bot' || !duel.mine) return undefined;
  if (now < botReplyAt(duel, fast)) return undefined;
  const bot = botById(duel.opponent.botId);
  return bot ? botDuelAnswers(duel, bot) : undefined;
}

/**
 * Challenges from demo friends for a day: 0 to 2, chosen from the date, each
 * arriving at a set hour. They come with the friend's answers already played.
 */
export function incomingDuels(day: DayKey): Duel[] {
  const rand = seeded(`incoming:${day}`);
  const count = Math.floor(rand() * 3);
  const start = parseDayKey(day).getTime();
  const out: Duel[] = [];
  const friends = shuffle(FRIEND_BOTS, rand);
  for (let i = 0; i < count; i++) {
    const bot = friends[i];
    const category = CAT_CODES[Math.floor(rand() * CAT_CODES.length)];
    const duel: Duel = {
      id: randomId(rand, 4),
      questions: pickDuelQuestions(category, 'mixed', day, rand),
      category,
      level: 'mixed',
      role: 'challenged',
      opponent: { kind: 'bot', botId: bot.id },
      createdAt: start + (7 + Math.floor(rand() * 13)) * 3_600_000,
    };
    out.push({ ...duel, theirs: botDuelAnswers(duel, bot) });
  }
  return out;
}

/** Incoming demo challenges that have arrived by `now` and have not expired. */
export function incomingNow(today: DayKey, now: number): Duel[] {
  return [addDays(today, -1), today]
    .flatMap(incomingDuels)
    .filter((d) => d.createdAt <= now && now - d.createdAt < DUEL_EXPIRY_MS);
}

export type DuelStatus = 'yourTurn' | 'waiting' | 'finished' | 'expired';

export function duelStatus(duel: Duel, now: number, fast: boolean): DuelStatus {
  if (!duel.mine) return now - duel.createdAt >= DUEL_EXPIRY_MS && duel.role === 'challenged' ? 'expired' : 'yourTurn';
  return theirAnswers(duel, now, fast) ? 'finished' : 'waiting';
}

export type CodeResult = 'challenge' | 'reply' | 'own' | 'already' | 'unknownReply';

/**
 * What a pasted duel code means for this phone:
 * - a challenge with an unknown match id becomes a new duel to play,
 * - a reply to a duel this phone started fills in the friend's answers,
 * - this phone's own challenge pasted back, a duel already on the phone,
 *   or a reply to a duel this phone never started are refused.
 */
export function applyDuelCode(duels: readonly Duel[], code: DecodedDuel, now: number): { duels: Duel[]; result: CodeResult; id: string } {
  const existing = duels.find((d) => d.id === code.id);
  const same = { duels: [...duels], id: code.id };
  if (code.kind === 'challenge') {
    if (existing) return { ...same, result: existing.role === 'challenger' ? 'own' : 'already' };
    const duel: Duel = {
      id: code.id,
      questions: code.questions,
      category: code.category,
      level: code.level,
      role: 'challenged',
      opponent: { kind: 'code', name: code.name },
      createdAt: now,
      theirs: code.answers,
    };
    return { duels: [duel, ...duels], result: 'challenge', id: code.id };
  }
  if (!existing || existing.role !== 'challenger') return { ...same, result: existing ? 'own' : 'unknownReply' };
  if (existing.theirs) return { ...same, result: 'already' };
  const updated: Duel = { ...existing, theirs: code.answers, opponent: { kind: 'code', name: code.name } };
  return { duels: duels.map((d) => (d.id === code.id ? updated : d)), result: 'reply', id: code.id };
}
