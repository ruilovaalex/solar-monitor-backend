const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class SystemController {
  constructor(service) {
    this.getAll = asyncHandler(async (req, res) => {
      res.json(await service.getAll());
    });

    this.getById = asyncHandler(async (req, res) => {
      res.json(await service.getById(req.params.id));
    });

    this.create = asyncHandler(async (req, res) => {
      res.status(201).json(await service.create(req.body));
    });

    this.update = asyncHandler(async (req, res) => {
      res.json(await service.update(req.params.id, req.body));
    });

    this.delete = asyncHandler(async (req, res) => {
      res.json(await service.delete(req.params.id));
    });
  }
}

module.exports = { SystemController };
