import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { verifyInitData } from './auth.js';
import { daysBetween } from './shared.js';
import { localParts } from './time.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_GAP_MS = 3000;
const MAX_BODY = 8 * 1024;

const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
const day = (v) => (typeof v === 'string' && DAY.test(v) ? v : null);

/**
 * Check what the Mini App reported and keep only what we use. Returns null if it is not sane.
 * `serverDay` is today in the player's time zone; days a long way from it mean a shifted clock
 * (the app's demo "skip a day" tool does that) and are refused.
 */
export function parseProgress(body, defaultTz, nowMs) {
  if (!body || typeof body !== 'object') return null;
  const tz = int(body.tz, -840, 840) ?? defaultTz;
  const serverDay = localParts(nowMs, tz).day;
  const near = (d) => Math.abs(daysBetween(serverDay, d)) <= 1;

  const lastDay = body.lastDay === null || body.lastDay === undefined ? null : day(body.lastDay);
  if (body.lastDay != null && lastDay === null) return null;
  if (lastDay && daysBetween(serverDay, lastDay) > 1) return null;

  const streak = int(body.streak, 0, 100_000);
  const best = int(body.best, 0, 100_000);
  if (streak === null || best === null) return null;

  let today = null;
  if (body.today != null) {
    const d = day(body.today.day);
    const score = int(body.today.score, 0, 3000);
    const correct = int(body.today.correct, 0, 10);
    if (!d || score === null || correct === null || !near(d)) return null;
    today = { day: d, score, correct };
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 24) : '';
  return { tz, lastDay, streak, best, today, name };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return null;
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

export function createApi({ cfg, db, now = Date.now }) {
  const lastEventAt = new Map();

  async function handleEvent(req, res) {
    const auth = req.headers.authorization ?? '';
    const user = auth.startsWith('tma ') ? verifyInitData(auth.slice(4), cfg.token, now()) : null;
    if (!user) return send(res, 401, 'Unauthorized');

    const last = lastEventAt.get(user.id) ?? 0;
    if (now() - last < EVENT_GAP_MS) return send(res, 429, 'Too many requests');
    lastEventAt.set(user.id, now());

    const progress = parseProgress(await readJson(req), cfg.defaultTz, now());
    if (!progress) return send(res, 400, 'Bad request');
    db.upsertEventUser(user, progress, now(), cfg.defaultTz);
    res.writeHead(204).end();
  }

  function serveStatic(req, res, pathname) {
    const dist = cfg.distDir;
    const index = path.join(dist, 'index.html');
    if (!existsSync(index)) {
      return send(res, 503, 'The Mini App is not built yet. Run: cd app && npx expo export -p web');
    }
    let relative;
    try {
      relative = decodeURIComponent(pathname);
    } catch {
      return send(res, 400, 'Bad request');
    }
    if (relative.includes('\0')) return send(res, 400, 'Bad request');

    const file = path.resolve(dist, `.${relative}`);
    const outside = path.relative(dist, file);
    if (outside.startsWith('..') || path.isAbsolute(outside)) return send(res, 403, 'Forbidden');

    let target = file;
    if (!(existsSync(file) && statSync(file).isFile())) {
      // Files with an extension are real assets: missing means 404. Anything else is an app route.
      if (path.extname(relative)) return send(res, 404, 'Not found');
      target = index;
    }
    const hashed = relative.startsWith('/_expo/static/');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(target).pipe(res);
  }

  const server = http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url ?? '/', 'http://localhost');
      if (pathname === '/healthz') return send(res, 200, 'ok');
      if (pathname === '/api/event') {
        if (req.method !== 'POST') return send(res, 405, 'Method not allowed', { Allow: 'POST' });
        return await handleEvent(req, res);
      }
      if (pathname.startsWith('/api/')) return send(res, 404, 'Not found');
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
      return serveStatic(req, res, pathname);
    } catch (e) {
      console.error('Request failed:', e);
      if (!res.headersSent) send(res, 500, 'Server error');
      else res.end();
    }
  });

  return server;
}
