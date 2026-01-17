import redis from "../redis.js";

export async function logEvent({
  apiKey,
  origin,
  to,
  status,
  responseTime
}) {
  const log = {
    time: new Date().toISOString(),
    apiKey: apiKey ? apiKey.slice(0, 6) + "****" : null,
    origin,
    to,
    status,
    responseTime
  };

  // push log to Redis list
  await redis.lPush("mail_logs", JSON.stringify(log));

  // keep only last 1000 logs
  await redis.lTrim("mail_logs", 0, 999);
}
