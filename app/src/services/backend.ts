import type { ProgressSnapshot } from '@/lib/progress';
import { tg } from './telegram';

/**
 * Tell the bot's server how the player is doing. Only inside Telegram, where the signed
 * launch data proves who is asking. The server is the same address that serves the app,
 * so the path is relative. Failures are ignored: the game never depends on this.
 */
export async function reportProgress(snapshot: ProgressSnapshot): Promise<void> {
  const app = tg();
  if (!app) return;
  try {
    await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `tma ${app.initData}` },
      body: JSON.stringify(snapshot),
      keepalive: true,
    });
  } catch {
    // Offline or the server is down. The next change tries again.
  }
}
