import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

import { chunkKeys, formatMeta, joinChunks, metaKey, otherSlot, parseMeta, splitChunks, type ChunkMeta } from '@/lib/chunks';
import { tg, type TgCloudStorage } from './telegram';

/**
 * Where the game state is saved.
 *
 * Outside Telegram: AsyncStorage, as before.
 *
 * Inside Telegram: Telegram CloudStorage, so progress follows the player to every
 * device with no server of our own. Each save also goes to localStorage at once, as a
 * fast copy and a fallback, while cloud writes wait a moment so a burst of state
 * changes becomes one upload. On load, the newer of the two copies wins.
 */

const CLOUD_DELAY_MS = 1000;
const CLOUD_TIMEOUT_MS = 4000;

const localAtKey = (name: string) => `${name}.savedAt`;

function cloud(): TgCloudStorage | null {
  const app = tg();
  return app && app.isVersionAtLeast('6.9') ? app.CloudStorage : null;
}

function local(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Wrap a CloudStorage call in a promise that also gives up after a timeout. */
function call<T>(run: (done: (error: string | null, result?: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CloudStorage timeout')), CLOUD_TIMEOUT_MS);
    try {
      run((error, result) => {
        clearTimeout(timer);
        if (error) reject(new Error(error));
        else resolve(result as T);
      });
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

async function readCloud(store: TgCloudStorage, name: string): Promise<{ value: string; meta: ChunkMeta } | null> {
  const meta = parseMeta(await call<string>((done) => store.getItem(metaKey(name), done)));
  if (!meta) return null;
  const values = await call<Record<string, string>>((done) => store.getItems(chunkKeys(name, meta), done));
  const value = joinChunks(name, meta, (key) => values[key]);
  return value !== null && isJson(value) ? { value, meta } : null;
}

/** The slot the cloud save currently lives in; the next save goes to the other one. */
const lastSlot = new Map<string, ChunkMeta['slot']>();

async function writeCloud(store: TgCloudStorage, name: string, value: string, savedAt: number): Promise<void> {
  const slot = otherSlot(lastSlot.get(name));
  const pieces = splitChunks(value);
  const meta: ChunkMeta = { slot, count: pieces.length, savedAt };
  const keys = chunkKeys(name, meta);
  await Promise.all(pieces.map((piece, i) => call<boolean>((done) => store.setItem(keys[i], piece, done))));
  // The meta goes last: until it is written, the previous complete save stays current.
  await call<boolean>((done) => store.setItem(metaKey(name), formatMeta(meta), done));
  lastSlot.set(name, slot);
}

const pending = new Map<string, { value: string; savedAt: number; timer: ReturnType<typeof setTimeout> }>();

function flush(name: string): void {
  const job = pending.get(name);
  const store = cloud();
  if (!job || !store) return;
  clearTimeout(job.timer);
  pending.delete(name);
  writeCloud(store, name, job.value, job.savedAt).catch(() => {
    // Offline or refused. The local copy has it, and the next save tries again.
  });
}

let flushOnHide = false;

function watchHide(): void {
  if (flushOnHide || typeof document === 'undefined') return;
  flushOnHide = true;
  // Telegram may close the app at any moment; send any waiting save when it goes away.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') for (const name of [...pending.keys()]) flush(name);
  });
}

const telegramStorage: StateStorage = {
  async getItem(name) {
    const ls = local();
    const localValue = ls?.getItem(name) ?? null;
    const localAt = Number(ls?.getItem(localAtKey(name)) ?? 0);
    const store = cloud();
    if (!store) return localValue;
    try {
      const saved = await readCloud(store, name);
      if (!saved) return localValue;
      lastSlot.set(name, saved.meta.slot);
      if (localValue !== null && localAt > saved.meta.savedAt) return localValue;
      ls?.setItem(name, saved.value);
      ls?.setItem(localAtKey(name), String(saved.meta.savedAt));
      return saved.value;
    } catch {
      return localValue;
    }
  },

  setItem(name, value) {
    const savedAt = Date.now();
    try {
      local()?.setItem(name, value);
      local()?.setItem(localAtKey(name), String(savedAt));
    } catch {
      // Storage full or blocked; the cloud copy still goes out.
    }
    watchHide();
    const prev = pending.get(name);
    if (prev) clearTimeout(prev.timer);
    pending.set(name, { value, savedAt, timer: setTimeout(() => flush(name), CLOUD_DELAY_MS) });
  },

  async removeItem(name) {
    const prev = pending.get(name);
    if (prev) clearTimeout(prev.timer);
    pending.delete(name);
    local()?.removeItem(name);
    local()?.removeItem(localAtKey(name));
    const store = cloud();
    if (store) await call<boolean>((done) => store.removeItem(metaKey(name), done)).catch(() => {});
  },
};

/** Telegram-aware storage for the game store. Chosen when the store is first read. */
export function gameStorage(): StateStorage {
  return tg() ? telegramStorage : AsyncStorage;
}
