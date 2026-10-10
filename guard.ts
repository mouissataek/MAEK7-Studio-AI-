import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Server-side protection for paid endpoints:
 *  - optional shared access token (ACCESS_TOKEN env)
 *  - per-IP rate limiting (in-memory, fixed window)
 *  - daily cost budget per IP and globally (relative units, see src/utils/cost.ts)
 *
 * State is in-memory: it resets on restart and is per-instance. For multiple
 * instances use a shared store (e.g. Redis).
 */

const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';
export const DAILY_BUDGET_PER_IP = Number(process.env.DAILY_BUDGET_UNITS_PER_IP || 100);
export const DAILY_BUDGET_GLOBAL = Number(process.env.DAILY_BUDGET_UNITS || 500);

export const authRequired = Boolean(ACCESS_TOKEN);

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function requireAccess(req: Request, res: Response, next: NextFunction) {
  if (!ACCESS_TOKEN) return next();
  const token = req.header('x-access-token') || '';
  if (token && safeEqual(token, ACCESS_TOKEN)) return next();
  return res.status(401).json({ error: 'رمز الوصول مطلوب أو غير صحيح.', code: 'UNAUTHORIZED' });
}

const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(name: string, maxPerMinute: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const w = windows.get(key);
    if (!w || w.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    if (w.count >= maxPerMinute) {
      res.setHeader('Retry-After', String(Math.ceil((w.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'عدد الطلبات كبير جداً. حاول بعد قليل.', code: 'RATE_LIMITED' });
    }
    w.count++;
    return next();
  };
}

// Drop expired windows periodically so the map cannot grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
}, 5 * 60_000).unref();

const today = () => new Date().toISOString().slice(0, 10);
let budgetDay = today();
let globalUsed = 0;
const ipUsed = new Map<string, number>();

function rollDay() {
  const d = today();
  if (d !== budgetDay) {
    budgetDay = d;
    globalUsed = 0;
    ipUsed.clear();
  }
}

/** Try to reserve `units`. Returns false when a budget would be exceeded. */
export function reserveBudget(ip: string, units: number): boolean {
  rollDay();
  const used = ipUsed.get(ip) || 0;
  if (used + units > DAILY_BUDGET_PER_IP || globalUsed + units > DAILY_BUDGET_GLOBAL) return false;
  ipUsed.set(ip, used + units);
  globalUsed += units;
  return true;
}

/** Give units back (generation failed before being billed). */
export function refundBudget(ip: string, units: number) {
  rollDay();
  ipUsed.set(ip, Math.max(0, (ipUsed.get(ip) || 0) - units));
  globalUsed = Math.max(0, globalUsed - units);
}

export function budgetStatus(ip: string) {
  rollDay();
  return {
    perIpLimit: DAILY_BUDGET_PER_IP,
    perIpUsed: ipUsed.get(ip) || 0,
    globalLimit: DAILY_BUDGET_GLOBAL,
    globalUsed,
  };
}

export const BUDGET_ERROR = {
  error: 'تم استهلاك الميزانية اليومية المسموحة. جرّب غداً أو اختر دقة/نموذجاً أرخص.',
  code: 'BUDGET_EXCEEDED',
};
