import { RequestHandler } from 'express';
import { isIP } from 'net';

// Group rotating IPv6 privacy addresses by /64; normalize mapped IPv4 too.
const clientKey = (ip: string): string => {
  if (ip.startsWith('::ffff:') && isIP(ip.slice(7)) === 4) return ip.slice(7);
  if (isIP(ip) !== 6) return ip;
  const [left, right = ''] = ip.split('::');
  const prefix = left ? left.split(':') : [];
  const suffix = right ? right.split(':') : [];
  const parts = ip.includes('::')
    ? [...prefix, ...Array(8 - prefix.length - suffix.length).fill('0'), ...suffix]
    : prefix;
  return parts.slice(0, 4).map((part) => parseInt(part, 16).toString(16)).join(':');
};

// One-process limiter for the initial single EC2 deployment. A bounded store
// fails closed at capacity; restarting the process resets the window.
export const createAuthRateLimit = (limit: number, windowMs = 15 * 60_000): RequestHandler => {
  const clients = new Map<string, { count: number; resetAt: number }>();
  let sweepAt = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now >= sweepAt) {
      for (const [key, entry] of clients) if (entry.resetAt <= now) clients.delete(key);
      sweepAt = now + 60_000;
    }
    const key = clientKey(req.ip || req.socket.remoteAddress || 'unknown');
    let entry = clients.get(key);
    if (!entry || entry.resetAt <= now) {
      if (!entry && clients.size >= 10_000) {
        res.setHeader('Retry-After', '60');
        res.status(429).json({ status: 'error', message: 'Too many authentication requests. Please try again later.' });
        return;
      }
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('RateLimit-Limit', String(limit));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)));
    if (entry.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ status: 'error', message: 'Too many authentication requests. Please try again later.' });
      return;
    }
    next();
  };
};
