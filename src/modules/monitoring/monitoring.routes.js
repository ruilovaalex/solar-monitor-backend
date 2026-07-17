const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { MonitoringRepository } = require("./monitoring.repository");
const { MonitoringService } = require("./monitoring.service");
const { MonitoringController } = require("./monitoring.controller");

const router = Router();
const controller = new MonitoringController(new MonitoringService(new MonitoringRepository()));

router.get("/config", authorize("monitoring:read"), controller.get);
router.put("/config", authorize("monitoring:manage"), controller.update);

module.exports = { monitoringRoutes: router };
