import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,               -- Telegram user id; a private chat has the same id
  chat_id INTEGER,
  first_name TEXT, last_name TEXT, username TEXT,
  display_name TEXT,                    -- "Abel T."
  lang TEXT NOT NULL DEFAULT 'en',      -- language of the bot's messages: en or am
  tz_offset INTEGER NOT NULL DEFAULT 180,  -- minutes east of UTC
  started INTEGER NOT NULL DEFAULT 0,   -- has opened a chat with the bot, so can be messaged
  status TEXT NOT NULL DEFAULT 'active',   -- active or blocked
  remind_on INTEGER NOT NULL DEFAULT 1,
  remind_hour INTEGER NOT NULL DEFAULT 19,
  joined_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  last_played_day TEXT,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_reminder_day TEXT,
  nudges INTEGER NOT NULL DEFAULT 0     -- comeback messages sent since the last play
);
CREATE TABLE IF NOT EXISTS scores (
  user_id INTEGER NOT NULL, day TEXT NOT NULL, score INTEGER NOT NULL, correct INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, admin_id INTEGER NOT NULL,
  audience TEXT NOT NULL, text TEXT NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0, blocked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

/** A name in the style of the demo players: "Abel T.". */
export function displayName(from) {
  const first = (from.first_name ?? '').trim();
  const initial = (from.last_name ?? '').trim().charAt(0);
  return (initial ? `${first} ${initial}.` : first).slice(0, 24) || 'Player';
}

const nul = (v) => (v === undefined ? null : v);

export class Db {
  constructor(file = ':memory:') {
    if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
    this.sql = new DatabaseSync(file);
    if (file !== ':memory:') this.sql.exec('PRAGMA journal_mode = WAL');
    this.sql.exec(SCHEMA);
  }

  close() {
    this.sql.close();
  }

  #tx(work) {
    this.sql.exec('BEGIN');
    try {
      const result = work();
      this.sql.exec('COMMIT');
      return result;
    } catch (e) {
      this.sql.exec('ROLLBACK');
      throw e;
    }
  }

  getUser(id) {
    return this.sql.prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
  }

  /** Someone wrote to the bot, so they can be messaged. */
  upsertChatUser(from, now, defaultTz) {
    const existing = this.getUser(from.id);
    if (!existing) {
      this.sql
        .prepare(
          `INSERT INTO users (id, chat_id, first_name, last_name, username, display_name, lang, tz_offset, started, joined_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .run(from.id, from.id, nul(from.first_name), nul(from.last_name), nul(from.username), displayName(from), from.language_code === 'am' ? 'am' : 'en', defaultTz, now, now);
    } else {
      this.sql
        .prepare(`UPDATE users SET chat_id = ?, first_name = ?, last_name = ?, username = ?, started = 1, status = 'active', last_seen_at = ? WHERE id = ?`)
        .run(from.id, nul(from.first_name), nul(from.last_name), nul(from.username), now, from.id);
    }
    return this.getUser(from.id);
  }

  /** The Mini App reported progress for a verified Telegram user. */
  upsertEventUser(from, snap, now, defaultTz) {
    return this.#tx(() => {
      const existing = this.getUser(from.id);
      const name = snap.name || displayName(from);
      if (!existing) {
        this.sql
          .prepare(
            `INSERT INTO users (id, chat_id, first_name, last_name, username, display_name, lang, tz_offset, started, joined_at, last_seen_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          )
          .run(from.id, from.id, nul(from.first_name), nul(from.last_name), nul(from.username), name, from.language_code === 'am' ? 'am' : 'en', snap.tz ?? defaultTz, now, now);
      }
      const before = existing ?? this.getUser(from.id);
      const played = snap.lastDay && snap.lastDay !== before.last_played_day;
      this.sql
        .prepare(
          `UPDATE users SET display_name = ?, tz_offset = ?, last_seen_at = ?,
             streak = ?, best_streak = MAX(best_streak, ?), last_played_day = COALESCE(?, last_played_day),
             nudges = CASE WHEN ? THEN 0 ELSE nudges END
           WHERE id = ?`,
        )
        .run(name, snap.tz ?? before.tz_offset, now, snap.streak, snap.best, nul(snap.lastDay), played ? 1 : 0, from.id);
      if (snap.today) {
        this.sql
          .prepare(
            `INSERT INTO scores (user_id, day, score, correct) VALUES (?, ?, ?, ?)
             ON CONFLICT (user_id, day) DO UPDATE SET score = MAX(score, excluded.score), correct = MAX(correct, excluded.correct)`,
          )
          .run(from.id, snap.today.day, snap.today.score, snap.today.correct);
      }
      return this.getUser(from.id);
    });
  }

  setLang(id, lang) {
    this.sql.prepare('UPDATE users SET lang = ? WHERE id = ?').run(lang, id);
  }
  setRemindOn(id, on) {
    this.sql.prepare('UPDATE users SET remind_on = ? WHERE id = ?').run(on ? 1 : 0, id);
  }
  setRemindHour(id, hour) {
    this.sql.prepare('UPDATE users SET remind_hour = ?, remind_on = 1 WHERE id = ?').run(hour, id);
  }
  setStatus(id, status) {
    this.sql.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
  }
  markReminded(id, day, nudges) {
    this.sql.prepare('UPDATE users SET last_reminder_day = ?, nudges = ? WHERE id = ?').run(day, nudges, id);
  }

  /** Players who can be messaged and have reminders on. */
  reminderCandidates() {
    return this.sql.prepare(`SELECT * FROM users WHERE started = 1 AND status = 'active' AND remind_on = 1`).all();
  }

  /** Players a broadcast reaches. `lang` is 'en', 'am' or 'all'. */
  audience(lang = 'all') {
    return lang === 'all'
      ? this.sql.prepare(`SELECT * FROM users WHERE started = 1 AND status = 'active'`).all()
      : this.sql.prepare(`SELECT * FROM users WHERE started = 1 AND status = 'active' AND lang = ?`).all(lang);
  }

  scoresForDays(days) {
    if (days.length === 0) return [];
    const marks = days.map(() => '?').join(',');
    return this.sql
      .prepare(`SELECT s.user_id, s.day, s.score, u.display_name AS name FROM scores s JOIN users u ON u.id = s.user_id WHERE s.day IN (${marks})`)
      .all(...days);
  }

  stats(now, today) {
    const one = (sql, ...args) => this.sql.prepare(sql).get(...args).n;
    return {
      players: one('SELECT COUNT(*) AS n FROM users'),
      started: one('SELECT COUNT(*) AS n FROM users WHERE started = 1'),
      active7: one('SELECT COUNT(*) AS n FROM users WHERE last_seen_at > ?', now - 7 * 86_400_000),
      playedToday: one('SELECT COUNT(*) AS n FROM scores WHERE day = ?', today),
      remindersOn: one(`SELECT COUNT(*) AS n FROM users WHERE started = 1 AND status = 'active' AND remind_on = 1`),
      blocked: one(`SELECT COUNT(*) AS n FROM users WHERE status = 'blocked'`),
    };
  }

  meta(key) {
    return this.sql.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null;
  }
  setMeta(key, value) {
    this.sql.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, String(value));
  }

  addBroadcast(now, adminId, audience, text) {
    return Number(this.sql.prepare('INSERT INTO broadcasts (created_at, admin_id, audience, text) VALUES (?, ?, ?, ?)').run(now, adminId, audience, text).lastInsertRowid);
  }
  finishBroadcast(id, { sent, failed, blocked }) {
    this.sql.prepare('UPDATE broadcasts SET sent = ?, failed = ?, blocked = ? WHERE id = ?').run(sent, failed, blocked, id);
  }
}
