import { createHash } from "crypto";

type RateEntry = { count: number; resetAt: number };
const rateEntries = new Map<string, RateEntry>();

function fingerprint(value: string) {
  const salt = process.env.RATE_LIMIT_SALT ?? "local-development-only-salt";
  return createHash("sha256").update(salt + ":" + value).digest("hex");
}

export function getRequestFingerprint(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source = forwarded || headers.get("x-real-ip") || "unknown";
  return fingerprint(source);
}

/** A short-lived in-memory limiter. For multi-region production, use Upstash or Vercel KV. */
export function allowRequest(key: string, maxRequests = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  for (const [entryKey, entry] of rateEntries) if (entry.resetAt <= now) rateEntries.delete(entryKey);
  const existing = rateEntries.get(key);
  if (!existing || existing.resetAt <= now) {
    rateEntries.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= maxRequests) return false;
  existing.count += 1;
  return true;
}
