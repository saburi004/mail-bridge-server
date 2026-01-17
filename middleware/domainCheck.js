export function domainCheck(req, res, next) {
  const origin = req.headers.origin;

  // Allow non-browser clients (Postman, server-to-server)
  if (!origin) {
    return next();
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    .split(",")
    .map(o => o.trim());

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      error: "Origin not allowed"
    });
  }

  next();
}
