import { MINUTE_MS } from './clock';

export const MAX_LIVES = 5;
export const REFILL_MS = 30 * MINUTE_MS;
export const FAST_REFILL_MS = 1 * MINUTE_MS;

/**
 * `anchor` is the moment the current refill countdown started. It only matters
 * while lives are below the maximum.
 */
export interface LivesState {
  lives: number;
  anchor: number;
}

export interface LivesView extends LivesState {
  /** When the next life arrives, or null when full. */
  nextAt: number | null;
}

/** Apply any refills that have happened since the anchor. Works while the app was closed. */
export function settleLives(state: LivesState, now: number, refillMs: number): LivesView {
  if (state.lives >= MAX_LIVES) return { lives: MAX_LIVES, anchor: now, nextAt: null };
  const gained = Math.max(0, Math.floor((now - state.anchor) / refillMs));
  const lives = Math.min(MAX_LIVES, state.lives + gained);
  if (lives >= MAX_LIVES) return { lives, anchor: now, nextAt: null };
  const anchor = state.anchor + gained * refillMs;
  return { lives, anchor, nextAt: anchor + refillMs };
}

export function loseLife(state: LivesState, now: number, refillMs: number): LivesState {
  const settled = settleLives(state, now, refillMs);
  if (settled.lives <= 0) return { lives: 0, anchor: settled.anchor };
  // Losing from full starts a fresh countdown; otherwise the running one continues.
  const anchor = settled.lives >= MAX_LIVES ? now : settled.anchor;
  return { lives: settled.lives - 1, anchor };
}

export function gainLife(state: LivesState, now: number, refillMs: number): LivesState {
  const settled = settleLives(state, now, refillMs);
  const lives = Math.min(MAX_LIVES, settled.lives + 1);
  return { lives, anchor: lives >= MAX_LIVES ? now : settled.anchor };
}
