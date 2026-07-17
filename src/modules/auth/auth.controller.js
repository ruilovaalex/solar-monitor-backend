const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { auditEvent } = require("../../shared/audit");

class AuthController {
  constructor(service) {
    this.login = asyncHandler(async (req, res) => {
      const session = await service.login(req.body);
      await auditEvent({
        userId: session.user.id,
        action: "LOGIN",
        table: "Usuarios",
        recordId: session.user.id,
        ip: req.ip,
      });
      res.json(session);
    });

    this.me = asyncHandler(async (req, res) => {
      res.json(await service.me(req.user.id));
    });
  }
}

module.exports = { AuthController };
