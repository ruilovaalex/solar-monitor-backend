const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { auditEvent } = require("../../shared/audit");
const { invalidateRbacUser } = require("../../shared/middlewares/rbac");

class UserController {
  constructor(service) {
    this.getAll = asyncHandler(async (req, res) => {
      res.json(await service.getAll());
    });

    this.getById = asyncHandler(async (req, res) => {
      res.json(await service.getById(req.params.id));
    });

    this.create = asyncHandler(async (req, res) => {
      const user = await service.create(req.body);
      await auditEvent({
        userId: req.user?.id,
        action: "CREATE",
        table: "Usuarios",
        recordId: user.id,
        ip: req.ip,
        detail: { email: user.email, role: user.role },
      });
      res.status(201).json(user);
    });

    this.update = asyncHandler(async (req, res) => {
      const user = await service.update(req.params.id, req.body);
      invalidateRbacUser(user.id);
      await auditEvent({
        userId: req.user?.id,
        action: "UPDATE",
        table: "Usuarios",
        recordId: user.id,
        ip: req.ip,
        detail: { email: user.email, role: user.role },
      });
      res.json(user);
    });

    this.delete = asyncHandler(async (req, res) => {
      const result = await service.delete(req.params.id);
      invalidateRbacUser(result.id);
      await auditEvent({
        userId: req.user?.id,
        action: "DELETE",
        table: "Usuarios",
        recordId: result.id,
        ip: req.ip,
      });
      res.json(result);
    });
  }
}

module.exports = { UserController };
