const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { HistoryRepository } = require("./history.repository");
const { HistoryService } = require("./history.service");
const { HistoryController } = require("./history.controller");
const { requireLegacyApi } = require("../../shared/middlewares/legacyApi");

const router = Router();
const controller = new HistoryController(new HistoryService(new HistoryRepository()));

router.get("/", requireLegacyApi, authorize("history:read"), controller.getAll);
router.get("/devices", authorize("history:read"), controller.getDeviceHistory);
router.get("/:systemId", requireLegacyApi, authorize("history:read"), controller.getBySystemId);

module.exports = { historyRoutes: router };
