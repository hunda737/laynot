/** FNV-1a hash: turns any string into a 32-bit seed. */
export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG returning numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generator that gives the same sequence for the same key, on every device. */
export function seeded(key: string): () => number {
  return mulberry32(hashString(key));
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickN<T>(items: readonly T[], count: number, rand: () => number): T[] {
  return shuffle(items, rand).slice(0, count);
}

export function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
