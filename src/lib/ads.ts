import { SPONSORS, type Sponsor } from '@/data/sponsors';
import type { DayKey } from './clock';
import { hashString } from './rng';

/** Where a small banner can appear. */
export type AdPlacement = 'home' | 'topic' | 'daily' | 'street' | 'review' | 'result';

/**
 * Which advertiser a banner shows. The same placement shows the same brand all day,
 * so a banner never changes while someone is looking at it. Different placements
 * usually show different brands. `exclude` skips a brand already on the screen.
 */
export function bannerSponsor(placement: AdPlacement, day: DayKey, seed: string | number = '', exclude?: string): Sponsor {
  const pool = SPONSORS.filter((s) => s.id !== exclude);
  const list = pool.length > 0 ? pool : SPONSORS;
  return list[hashString(`${placement}:${day}:${seed}`) % list.length];
}
