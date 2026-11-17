const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class TelegramError extends Error {
  constructor(method, code, description, retryAfter) {
    super(`${method}: ${description}`);
    this.name = 'TelegramError';
    this.method = method;
    this.code = code;
    this.description = description;
    this.retryAfter = retryAfter;
  }
}

/** A thin client for the Telegram Bot API. */
export class Telegram {
  constructor({ token, base = 'https://api.telegram.org', fetchImpl = fetch, timeoutMs = 45_000 }) {
    this.token = token;
    this.base = base;
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  /** Error text can carry the request address, which contains the token. Never let it out. */
  scrub(text) {
    return String(text).split(this.token).join('<token>');
  }

  async call(method, params = {}) {
    let response;
    try {
      response = await this.fetch(`${this.base}/bot${this.token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      throw new TelegramError(method, 0, this.scrub(e?.cause?.message ?? e?.message ?? 'network error'));
    }
    let reply;
    try {
      reply = await response.json();
    } catch {
      throw new TelegramError(method, response.status, `bad reply (HTTP ${response.status})`);
    }
    if (!reply.ok) {
      throw new TelegramError(method, reply.error_code ?? response.status, this.scrub(reply.description ?? 'unknown error'), reply.parameters?.retry_after);
    }
    return reply.result;
  }
}

/**
 * Sends messages one after another, about 25 a second (Telegram allows about 30),
 * and waits and retries when Telegram says "slow down" (429).
 */
export class Sender {
  #queue = [];
  #running = false;

  constructor(tg, { intervalMs = 40, sleep = defaultSleep, maxTries = 4 } = {}) {
    this.tg = tg;
    this.intervalMs = intervalMs;
    this.sleep = sleep;
    this.maxTries = maxTries;
  }

  send(method, params) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ method, params, resolve, reject, tries: 0 });
      void this.#run();
    });
  }

  async #run() {
    if (this.#running) return;
    this.#running = true;
    try {
      while (this.#queue.length > 0) {
        const job = this.#queue.shift();
        try {
          job.resolve(await this.tg.call(job.method, job.params));
        } catch (e) {
          if (e.code === 429 && ++job.tries < this.maxTries) {
            this.#queue.unshift(job);
            await this.sleep((e.retryAfter ?? 1) * 1000 + 100);
            continue;
          }
          job.reject(e);
        }
        if (this.intervalMs > 0) await this.sleep(this.intervalMs);
      }
    } finally {
      this.#running = false;
    }
  }
}
