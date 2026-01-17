
// import { logEvent } from "../utils/logger.js";

// export async function auth(req, res, next) {
//   const apiKey = req.headers["x-api-key"];

//   if (!apiKey || apiKey !== process.env.API_KEY) {
//     await logEvent({
//       apiKey,
//       origin: req.headers.origin,
//       to: null,
//       status: "UNAUTHORIZED",
//       responseTime: 0
//     });

//     return res.status(401).json({
//       success: false,
//       error: "Invalid API key"
//     });
//   }

//   req.apiKey = apiKey;
//   next();
// }
import redis from "../redis.js";
import { logEvent } from "../utils/logger.js";

export async function auth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    await logEvent({
      apiKey: null,
      origin: req.headers.origin,
      to: null,
      status: "UNAUTHORIZED",
      responseTime: 0
    });

    return res.status(401).json({
      success: false,
      error: "API key missing"
    });
  }

  // 🔑 CHECK IN REDIS
  const email = await redis.get(`user:${apiKey}`);

  if (!email) {
    await logEvent({
      apiKey,
      origin: req.headers.origin,
      to: null,
      status: "INVALID_KEY",
      responseTime: 0
    });

    return res.status(401).json({
      success: false,
      error: "Invalid API key"
    });
  }

  // attach to request
  req.apiKey = apiKey;
  req.userEmail = email;

  next();
}
