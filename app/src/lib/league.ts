import { BOTS, type Bot } from '@/data/players';
import type { DayKey } from './clock';
import { decodeName, encodeName, findCode, LEAGUE_PREFIX, makeCode, randomId } from './codes';
import { pickN, seeded } from './rng';

/** A private league on this phone. The built-in Friends league is not stored. */
export interface League {
  id: string;
  name: string;
  /** True when this phone created it. */
  mine: boolean;
  joinedDay: DayKey;
  /** Demo players added later (the "someone joined" demo control). */
  extra: string[];
}

export const FRIENDS_LEAGUE_ID = 'friends';
export const LEAGUE_NAME_MIN = 2;
export const LEAGUE_NAME_MAX = 24;

export function newLeagueId(rand: () => number = Math.random): string {
  return randomId(rand, 4);
}

export function encodeLeague(league: { id: string; name: string }): string {
  return makeCode(LEAGUE_PREFIX, ['1', league.id, encodeName(league.name)]);
}

/** Read a league invite from pasted text. Returns null for anything that is not a valid invite. */
export function decodeLeague(text: string): { id: string; name: string } | null {
  const parts = findCode(text, LEAGUE_PREFIX);
  if (!parts || parts.length !== 3 || parts[0] !== '1') return null;
  const [, id, rawName] = parts;
  if (!/^[0-9a-z]{4}$/.test(id) || id === FRIENDS_LEAGUE_ID) return null;
  const name = decodeName(rawName);
  return name ? { id, name } : null;
}

/**
 * The demo players in a league, chosen from its id, so two phones that join
 * the same invite see the same members. Friends is the six friend bots.
 */
export function leagueMembers(id: string, extra: readonly string[] = []): Bot[] {
  const base = id === FRIENDS_LEAGUE_ID ? BOTS.filter((b) => b.friend) : seededMembers(id);
  const added = BOTS.filter((b) => extra.includes(b.id) && !base.includes(b));
  return [...base, ...added];
}

function seededMembers(id: string): Bot[] {
  const rand = seeded(`league:${id}`);
  const count = 4 + Math.floor(rand() * 7); // 4 to 10
  return pickN(BOTS, count, rand);
}

/** The next demo player to "join" a league from the demo screen: friends first. */
export function nextJoiner(id: string, extra: readonly string[]): Bot | undefined {
  const members = new Set(leagueMembers(id, extra).map((b) => b.id));
  return [...BOTS.filter((b) => b.friend), ...BOTS].find((b) => !members.has(b.id));
}
