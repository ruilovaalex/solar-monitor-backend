const { AppError } = require("../errors");

function createFixedWindowRateLimit({ windowMs, max, keyGenerator, message }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      return next(new AppError(message || "Demasiadas solicitudes", 429));
    }

    return next();
  };
}

module.exports = { createFixedWindowRateLimit };
