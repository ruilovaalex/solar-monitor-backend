const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { ComparisonsRepository } = require("./comparisons.repository");
const { ComparisonsService } = require("./comparisons.service");
const { ComparisonsController } = require("./comparisons.controller");

const router = Router();
const controller = new ComparisonsController(new ComparisonsService(new ComparisonsRepository()));

router.get("/", authorize("comparisons:read"), controller.get);

module.exports = { comparisonsRoutes: router };
