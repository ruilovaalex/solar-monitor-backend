const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { StatsRepository } = require("./stats.repository");
const { StatsService } = require("./stats.service");
const { StatsController } = require("./stats.controller");

const router = Router();
const controller = new StatsController(new StatsService(new StatsRepository()));

router.get("/daily", authorize("stats:read"), controller.daily);
router.get("/monthly", authorize("stats:read"), controller.monthly);

module.exports = { statsRoutes: router, statisticsController: controller };
