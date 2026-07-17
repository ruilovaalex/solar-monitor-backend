const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { DashboardRepository } = require("./dashboard.repository");
const { DashboardService } = require("./dashboard.service");
const { DashboardController } = require("./dashboard.controller");

const router = Router();
const controller = new DashboardController(new DashboardService(new DashboardRepository()));

router.get("/", authorize("dashboard:read"), controller.get);

module.exports = { dashboardRoutes: router };
