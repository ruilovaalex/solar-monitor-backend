const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { auditEvent } = require("../../shared/audit");

class MonitoringController {
  constructor(service) {
    this.get = asyncHandler(async (req, res) => {
      res.json(await service.get(req.user.id));
    });

    this.update = asyncHandler(async (req, res) => {
      const config = await service.update(req.body, req.user.id);
      await auditEvent({
        userId: req.user?.id,
        action: "CONFIG_CHANGE",
        table: "ConfiguracionMonitoreo",
        recordId: req.user.id,
        ip: req.ip,
        detail: req.body,
      });
      res.json(config);
    });
  }
}

module.exports = { MonitoringController };
