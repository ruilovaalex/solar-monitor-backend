const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { RealtimeRepository } = require("./realtime.repository");
const { RealtimeService } = require("./realtime.service");
const { RealtimeController } = require("./realtime.controller");
const { requireLegacyApi } = require("../../shared/middlewares/legacyApi");

const router = Router();
const controller = new RealtimeController(new RealtimeService(new RealtimeRepository()));

router.get("/", requireLegacyApi, authorize("realtime:read"), controller.getAll);
router.get("/devices", authorize("realtime:read"), controller.getDevices);
router.get("/:systemId", requireLegacyApi, authorize("realtime:read"), controller.getBySystemId);

module.exports = { realtimeRoutes: router };
