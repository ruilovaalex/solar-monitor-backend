function createLoginRateLimit({ windowMs, maxAttempts, now = () => Date.now() }) {
  const attemptsByIp = new Map();

  return function loginRateLimit(req, res, next) {
    const currentTime = now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const stored = attemptsByIp.get(key);
    const entry = !stored || stored.resetAt <= currentTime
      ? { count: 0, resetAt: currentTime + windowMs }
      : stored;

    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000));

    if (entry.count >= maxAttempts) {
      res.set("Retry-After", String(retryAfterSeconds));
      res.set("RateLimit-Limit", String(maxAttempts));
      res.set("RateLimit-Remaining", "0");
      return res.status(429).json({
        message: "Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde.",
      });
    }

    entry.count += 1;
    attemptsByIp.set(key, entry);

    res.set("RateLimit-Limit", String(maxAttempts));
    res.set("RateLimit-Remaining", String(Math.max(0, maxAttempts - entry.count)));
    res.set("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        attemptsByIp.delete(key);
      }
    });

    return next();
  };
}

module.exports = { createLoginRateLimit };
