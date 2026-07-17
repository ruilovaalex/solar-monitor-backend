const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { env } = require("../../config/env");
const { createFixedWindowRateLimit } = require("../../shared/middlewares/rateLimit");
const { IngestionRepository } = require("./ingestion.repository");
const { IngestionService } = require("./ingestion.service");
const { IngestionController } = require("./ingestion.controller");
const { DeviceIngestionRepository } = require("./device-ingestion.repository");
const { DeviceIngestionService } = require("./device-ingestion.service");
const { DeviceIngestionController } = require("./device-ingestion.controller");
const { requireLegacyApi } = require("../../shared/middlewares/legacyApi");

const router = Router();
const controller = new IngestionController(new IngestionService(new IngestionRepository()));
const deviceController = new DeviceIngestionController(new DeviceIngestionService(new DeviceIngestionRepository()));
const deviceIngestionRateLimit = createFixedWindowRateLimit({
  windowMs: env.deviceIngestionRateLimitWindowMs,
  max: env.deviceIngestionRateLimitMax,
  keyGenerator: (req) => `${req.ip}:${req.params.deviceId || "unknown-device"}`,
  message: "Demasiadas lecturas recibidas desde este dispositivo. Revisa el intervalo de envio.",
});

router.post("/readings", requireLegacyApi, authorize("ingestion:create"), controller.ingest);
router.post("/devices/:deviceId/readings", deviceIngestionRateLimit, deviceController.ingest);

module.exports = { ingestionRoutes: router };
