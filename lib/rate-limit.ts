import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

const CHAT_LIMIT = Number(process.env.AI_RATE_LIMIT_PER_MIN ?? 20);
const WINDOW_MS = 60_000;

function windowStart(): Date {
  const now = Date.now();
  return new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS);
}

/** 返回 true 表示允许，false 表示超限 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit = CHAT_LIMIT
): Promise<{ allowed: boolean; remaining: number }> {
  const start = windowStart();

  const [row] = await db
    .insert(rateLimits)
    .values({ userId, endpoint, windowStart: start, count: 1 })
    .onConflictDoUpdate({
      target: [
        rateLimits.userId,
        rateLimits.endpoint,
        rateLimits.windowStart,
      ],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
