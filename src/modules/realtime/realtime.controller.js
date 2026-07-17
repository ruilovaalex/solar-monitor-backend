const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class RealtimeController {
  constructor(service) {
    this.getAll = asyncHandler(async (req, res) => {
      res.json(await service.getAll());
    });

    this.getBySystemId = asyncHandler(async (req, res) => {
      res.json(await service.getBySystemId(req.params.systemId));
    });

    this.getDevices = asyncHandler(async (req, res) => {
      res.json(await service.getDevices(req.user.id));
    });
  }
}

module.exports = { RealtimeController };
