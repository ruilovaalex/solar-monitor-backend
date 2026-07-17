const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { SystemRepository } = require("./system.repository");
const { SystemService } = require("./system.service");
const { SystemController } = require("./system.controller");

const router = Router();
const controller = new SystemController(new SystemService(new SystemRepository()));

router.get("/", authorize("systems:read"), controller.getAll);
router.get("/:id", authorize("systems:read"), controller.getById);
router.post("/", authorize("systems:create"), controller.create);
router.put("/:id", authorize("systems:update"), controller.update);
router.delete("/:id", authorize("systems:delete"), controller.delete);

module.exports = { systemRoutes: router };
