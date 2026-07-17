const { env } = require("../../config/env");

function requireLegacyApi(req, res, next) {
  if (!env.legacyApiEnabled) {
    return res.status(404).json({ message: "Ruta no encontrada" });
  }

  return next();
}

module.exports = { requireLegacyApi };
