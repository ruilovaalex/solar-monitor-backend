const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class HistoryController {
  constructor(service) {
    this.getAll = asyncHandler(async (req, res) => {
      res.json(await service.getHistory(req.query));
    });

    this.getBySystemId = asyncHandler(async (req, res) => {
      res.json(await service.getHistory(req.query, req.params.systemId));
    });

    this.getDeviceHistory = asyncHandler(async (req, res) => {
      res.json(await service.getDeviceHistory(req.query, req.user.id));
    });
  }
}

module.exports = { HistoryController };
