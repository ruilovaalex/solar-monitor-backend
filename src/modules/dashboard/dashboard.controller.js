const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class DashboardController {
  constructor(service) {
    this.get = asyncHandler(async (req, res) => {
      res.json(await service.getDashboard(req.query, req.user.id));
    });
  }
}

module.exports = { DashboardController };
