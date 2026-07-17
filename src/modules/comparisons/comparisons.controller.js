const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class ComparisonsController {
  constructor(service) {
    this.get = asyncHandler(async (req, res) => {
      res.json(await service.getComparisons());
    });
  }
}

module.exports = { ComparisonsController };
