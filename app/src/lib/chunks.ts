/**
 * Helpers for saving one long string in Telegram CloudStorage, which keeps at most
 * 4096 characters per value. The string is split into pieces, and saves alternate
 * between two slots (a and b). A small meta value names the slot that holds a
 * complete save, and it is written last, so a save cut off half way never
 * replaces the previous good one.
 */
export const CHUNK_SIZE = 4000;

export type Slot = 'a' | 'b';

export interface ChunkMeta {
  slot: Slot;
  count: number;
  /** When the save was made, in ms. Used to pick the newer of cloud and local copies. */
  savedAt: number;
}

export function splitChunks(value: string, size = CHUNK_SIZE): string[] {
  if (value.length === 0) return [''];
  const out: string[] = [];
  for (let i = 0; i < value.length; i += size) out.push(value.slice(i, i + size));
  return out;
}

export const metaKey = (name: string) => `${name}.meta`;
export const chunkKey = (name: string, slot: Slot, i: number) => `${name}.${slot}.${i}`;
export const otherSlot = (slot: Slot | undefined): Slot => (slot === 'a' ? 'b' : 'a');

export function formatMeta(meta: ChunkMeta): string {
  return `${meta.slot}:${meta.count}:${meta.savedAt}`;
}

export function parseMeta(text: string | undefined | null): ChunkMeta | null {
  const m = /^([ab]):(\d+):(\d+)$/.exec(text ?? '');
  if (!m) return null;
  const count = Number(m[2]);
  if (count < 1) return null;
  return { slot: m[1] as Slot, count, savedAt: Number(m[3]) };
}

export function chunkKeys(name: string, meta: Pick<ChunkMeta, 'slot' | 'count'>): string[] {
  return Array.from({ length: meta.count }, (_, i) => chunkKey(name, meta.slot, i));
}

/** Join the pieces of a save, or null if any piece is missing. Missing values read back as "". */
export function joinChunks(name: string, meta: ChunkMeta, read: (key: string) => string | undefined): string | null {
  let out = '';
  for (const key of chunkKeys(name, meta)) {
    const piece = read(key);
    if (!piece) return null;
    out += piece;
  }
  return out;
}
