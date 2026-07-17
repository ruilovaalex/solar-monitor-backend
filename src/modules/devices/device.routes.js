const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { DeviceRepository } = require("./device.repository");
const { DeviceService } = require("./device.service");
const { DeviceController } = require("./device.controller");

const router = Router();
const controller = new DeviceController(new DeviceService(new DeviceRepository()));

router.get("/", authorize("devices:read"), controller.getAll);
router.post("/", authorize("devices:create"), controller.create);
router.get("/:id", authorize("devices:read"), controller.getById);

module.exports = { deviceRoutes: router };
