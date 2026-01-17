import redis from "../redis.js";
import { logEvent } from "../utils/logger.js";

const WINDOW_SECONDS = 60;   // 1 minute
const MAX_REQUESTS = 1;      // 5 emails per minute

export async function rateLimit(req, res, next) {
  const apiKey = req.headers["x-api-key"];


  if (!apiKey) {
    return res.status(401).json({ success: false, message: "API key missing" });
  }

  const redisKey = `rate:${apiKey}`;

  const current = await redis.incr(redisKey);

  if (current === 1) {
    // first request → set expiry
    await redis.expire(redisKey, WINDOW_SECONDS);
  }

  if (current > MAX_REQUESTS) {
  await logEvent({
    apiKey,
    origin: req.headers.origin,
    to: null,
    status: "RATE_LIMITED",
    responseTime: 0
  });

  return res.status(429).json({
    success: false,
    error: "Rate limit exceeded"
  });
}

  next();
}
