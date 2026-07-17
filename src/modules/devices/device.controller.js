const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { auditEvent } = require("../../shared/audit");

class DeviceController {
  constructor(service) {
    this.getAll = asyncHandler(async (req, res) => {
      res.json(await service.getAll(req.user.id));
    });

    this.getById = asyncHandler(async (req, res) => {
      res.json(await service.getById(req.params.id, req.user.id));
    });

    this.create = asyncHandler(async (req, res) => {
      const device = await service.create(req.body, req.user.id);
      await auditEvent({
        userId: req.user?.id,
        action: "DEVICE_REGISTER",
        table: "Dispositivos",
        recordId: device.id,
        ip: req.ip,
        detail: {
          type: device.type,
          dataSource: device.dataSource,
        },
      });
      res.status(201).json(device);
    });
  }
}

module.exports = { DeviceController };
