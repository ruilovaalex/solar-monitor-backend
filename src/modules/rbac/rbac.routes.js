const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { RbacRepository } = require("./rbac.repository");
const { RbacService } = require("./rbac.service");
const { RbacController } = require("./rbac.controller");

const router = Router();
const controller = new RbacController(new RbacService(new RbacRepository()));

router.get("/roles", authorize("settings:manage"), controller.getRoles);
router.get("/permissions", authorize("settings:manage"), controller.getPermissions);
router.put("/roles/:roleId/permissions", authorize("settings:manage"), controller.replaceRolePermissions);

module.exports = { rbacRoutes: router };
