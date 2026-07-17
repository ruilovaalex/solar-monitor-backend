const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { UserRepository } = require("./user.repository");
const { UserService } = require("./user.service");
const { UserController } = require("./user.controller");

const router = Router();
const controller = new UserController(new UserService(new UserRepository()));

router.get("/", authorize("users:read"), controller.getAll);
router.get("/:id", authorize("users:read"), controller.getById);
router.post("/", authorize("users:create"), controller.create);
router.put("/:id", authorize("users:update"), controller.update);
router.delete("/:id", authorize("users:delete"), controller.delete);

module.exports = { userRoutes: router };
