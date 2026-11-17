import { BOTS, type Bot } from '@/data/players';
import { QUESTIONS } from '@/data/questions';
import type { DayKey } from './clock';
import { dailyIds, type PlayableQuestion } from './daily';
import { rampedPick, scaleRamp } from './difficulty';
import { pickN, seeded, shuffle } from './rng';
import { QUESTION_TIME_MS, scoreAnswer } from './scoring';

/**
 * Live Room is simulated: everything (who joins, the questions, when and how each
 * demo player answers) comes from the room code. Real rooms between phones need a server.
 */
export const LIVE_SIZE = 7;
export const LIVE_TIME_MS = QUESTION_TIME_MS;
export const REVEAL_MS = 4000;
export const STANDINGS_MS = 3500;
export const LIVE_COINS_PER_CORRECT = 5;
export const LIVE_WIN_BONUS = 25;

export type RoomMode = 'host' | 'join';

export interface RoomPlayer {
  bot: Bot;
  /** Milliseconds after the lobby opens. */
  joinAtMs: number;
}

export interface LiveRoom {
  code: string;
  mode: RoomMode;
  /** The demo player hosting a room you joined; null when you host. */
  host: Bot | null;
  players: RoomPlayer[];
  /** When a demo host starts the game on its own, after the lobby opens. */
  autoStartMs: number | null;
  questions: PlayableQuestion[];
}

export function newRoomCode(rand: () => number = Math.random): string {
  return String(1000 + Math.floor(rand() * 9000));
}

export function isRoomCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

export function liveRoom(code: string, mode: RoomMode, today: DayKey): LiveRoom {
  const rand = seeded(`live:${code}:${mode}`);
  const count = 3 + Math.floor(rand() * 5); // 3 to 7 demo players
  const bots = pickN(BOTS, count, rand);
  let t = 0;
  const players = bots.map((bot, i) => {
    // A joined room's host is there from the start.
    t += mode === 'join' && i === 0 ? 0 : 700 + Math.floor(rand() * 1800);
    return { bot, joinAtMs: t };
  });
  const banned = dailyIds(today);
  const pool = QUESTIONS.filter((q) => !banned.has(q.id));
  const questions = rampedPick(pool, scaleRamp(LIVE_SIZE), rand).map((question) => ({
    question,
    order: shuffle([0, 1, 2, 3], rand),
  }));
  return {
    code,
    mode,
    host: mode === 'join' ? bots[0] : null,
    players,
    autoStartMs: mode === 'join' ? t + 2500 : null,
    questions,
  };
}

export interface LiveAnswer {
  /** Index into the question's choices (0 is right), or null on timeout. */
  pick: number | null;
  /** Milliseconds after the question appeared. */
  atMs: number;
  points: number;
}

const LEVEL_SHIFT = { easy: 0.12, medium: 0, hard: -0.18 } as const;

/** How a demo player answers a question in this room. Answers come in within 9 seconds. */
export function botLiveAnswer(room: LiveRoom, bot: Bot, index: number): LiveAnswer {
  const rand = seeded(`live:${room.code}:${bot.id}:${index}`);
  const q = room.questions[index].question;
  if (rand() < 0.06) return { pick: null, atMs: LIVE_TIME_MS, points: 0 };
  const right = rand() < bot.skill + LEVEL_SHIFT[q.difficulty];
  // Players who know it answer faster.
  const atMs = Math.round((right ? 1500 : 3000) + rand() * (right ? 5500 : 6000));
  const pick = right ? 0 : 1 + Math.floor(rand() * 3);
  return { pick, atMs, points: scoreAnswer(right, atMs) };
}

/** Players in the game: the ones who had joined when it started. */
export function playersAt(room: LiveRoom, msSinceLobby: number): RoomPlayer[] {
  return room.players.filter((p) => p.joinAtMs <= msSinceLobby);
}

export type LivePhase =
  | { kind: 'question' | 'reveal' | 'standings'; index: number; start: number; end: number }
  | { kind: 'final' };

/**
 * Where the game is at `now`, worked out from the start time and your answers.
 * A question ends when everyone has answered or time runs out; the reveal and
 * standings then show for a few seconds each, or until the player taps Next
 * (`skips` holds the time of each tap, keyed "r0", "s0", ...).
 */
export function livePhase(
  room: LiveRoom,
  players: readonly RoomPlayer[],
  startAt: number,
  yours: readonly (LiveAnswer | undefined)[],
  skips: Readonly<Record<string, number>>,
  now: number,
): LivePhase {
  let t = startAt;
  for (let i = 0; i < room.questions.length; i++) {
    const botsDone = Math.max(0, ...players.map((p) => botLiveAnswer(room, p.bot, i).atMs));
    const mine = yours[i];
    const qEnd = mine ? t + Math.min(LIVE_TIME_MS, Math.max(mine.atMs, botsDone)) : t + LIVE_TIME_MS;
    if (now < qEnd) return { kind: 'question', index: i, start: t, end: qEnd };
    const rEnd = Math.min(qEnd + REVEAL_MS, skips[`r${i}`] ?? Infinity);
    if (now < rEnd) return { kind: 'reveal', index: i, start: qEnd, end: rEnd };
    const sEnd = Math.min(rEnd + STANDINGS_MS, skips[`s${i}`] ?? Infinity);
    if (now < sEnd) return { kind: 'standings', index: i, start: rEnd, end: sEnd };
    t = sEnd;
  }
  return { kind: 'final' };
}

export interface Standing {
  id: string;
  name: string;
  score: number;
  correct: number;
  rank: number;
  /** Rank after the previous question, to show who moved up. */
  prevRank: number;
  isYou: boolean;
}

export const YOU = 'you';

function rankRows(rows: Omit<Standing, 'rank' | 'prevRank'>[]): (Omit<Standing, 'prevRank'>)[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score || (a.isYou ? -1 : b.isYou ? 1 : a.name.localeCompare(b.name)));
  let rank = 0;
  return sorted.map((r, i) => {
    if (i === 0 || r.score !== sorted[i - 1].score) rank = i + 1;
    return { ...r, rank };
  });
}

function scoresAfter(room: LiveRoom, players: readonly RoomPlayer[], yours: readonly (LiveAnswer | undefined)[], youName: string, upTo: number) {
  const rows = players.map((p) => {
    const answers = Array.from({ length: upTo + 1 }, (_, i) => botLiveAnswer(room, p.bot, i));
    return { id: p.bot.id, name: p.bot.name, score: answers.reduce((s, a) => s + a.points, 0), correct: answers.filter((a) => a.pick === 0).length, isYou: false };
  });
  const mine = yours.slice(0, upTo + 1);
  rows.push({ id: YOU, name: youName, score: mine.reduce((s, a) => s + (a?.points ?? 0), 0), correct: mine.filter((a) => a?.pick === 0).length, isYou: true });
  return rankRows(rows);
}

/** Standings after question `upTo` (0-based), with each player's previous rank. */
export function liveStandings(
  room: LiveRoom,
  players: readonly RoomPlayer[],
  yours: readonly (LiveAnswer | undefined)[],
  youName: string,
  upTo: number,
): Standing[] {
  const now = scoresAfter(room, players, yours, youName, upTo);
  const before = upTo > 0 ? scoresAfter(room, players, yours, youName, upTo - 1) : now;
  return now.map((r) => ({ ...r, prevRank: before.find((b) => b.id === r.id)?.rank ?? r.rank }));
}

/** Share of the room (you included) who picked each choice, for the reveal bars. */
export function roomPicks(room: LiveRoom, players: readonly RoomPlayer[], mine: LiveAnswer | undefined, index: number): number[] {
  const counts = [0, 0, 0, 0];
  const picks = [...players.map((p) => botLiveAnswer(room, p.bot, index).pick), mine?.pick ?? null];
  for (const p of picks) if (p !== null) counts[p]++;
  const totalPicks = picks.length;
  return counts.map((c) => Math.round((100 * c) / totalPicks));
}

export function liveCoins(correct: number, rank: number): number {
  return correct * LIVE_COINS_PER_CORRECT + (rank === 1 ? LIVE_WIN_BONUS : 0);
}
