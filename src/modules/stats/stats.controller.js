const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class StatsController {
  constructor(service) {
    this.daily = asyncHandler(async (req, res) => {
      res.json(await service.getDaily(req.query));
    });

    this.monthly = asyncHandler(async (req, res) => {
      res.json(await service.getMonthly(req.query));
    });

    this.frontend = asyncHandler(async (req, res) => {
      res.json(await service.getFrontendStatistics(req.query, req.user.id));
    });
  }
}

module.exports = { StatsController };
