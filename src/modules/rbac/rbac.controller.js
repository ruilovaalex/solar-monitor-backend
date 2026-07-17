const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { auditEvent } = require("../../shared/audit");
const { clearRbacCache } = require("../../shared/middlewares/rbac");

class RbacController {
  constructor(service) {
    this.getRoles = asyncHandler(async (req, res) => {
      res.json(await service.getRoles());
    });

    this.getPermissions = asyncHandler(async (req, res) => {
      res.json(await service.getPermissions());
    });

    this.replaceRolePermissions = asyncHandler(async (req, res) => {
      const role = await service.replaceRolePermissions(req.params.roleId, req.body);
      clearRbacCache();
      await auditEvent({
        userId: req.user?.id,
        action: "RBAC_CHANGE",
        table: "RolesPermisos",
        recordId: req.params.roleId,
        ip: req.ip,
        detail: {
          role: role.nombre,
          permissionIds: req.body.permissionIds || [],
        },
      });
      res.json(role);
    });
  }
}

module.exports = { RbacController };
