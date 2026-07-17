const { z } = require("zod");
const { AppError } = require("../../shared/errors");

const replacePermissionsSchema = z.object({
  permissionIds: z.array(z.string().min(1)).default([]),
});

function mapRole(role) {
  return {
    id: role.id,
    nombre: role.nombre,
    descripcion: role.descripcion,
    activo: role.activo,
    permissions: role.permisos.map((item) => ({
      id: item.permiso.id,
      clave: item.permiso.clave,
      descripcion: item.permiso.descripcion,
      modulo: item.permiso.modulo,
    })),
  };
}

function mapPermission(permission) {
  return {
    id: permission.id,
    clave: permission.clave,
    descripcion: permission.descripcion,
    modulo: permission.modulo,
  };
}

class RbacService {
  constructor(repository) {
    this.repository = repository;
  }

  async getRoles() {
    const roles = await this.repository.findRoles();
    return roles.map(mapRole);
  }

  async getPermissions() {
    const permissions = await this.repository.findPermissions();
    return permissions.map(mapPermission);
  }

  async replaceRolePermissions(roleId, payload) {
    const parsed = replacePermissionsSchema.parse(payload);
    const uniquePermissionIds = Array.from(new Set(parsed.permissionIds));
    if (uniquePermissionIds.length !== parsed.permissionIds.length) {
      throw new AppError("La lista de permisos contiene valores duplicados", 400);
    }

    const roleExists = await this.repository.findRoleById(roleId);
    if (!roleExists) throw new AppError("Rol no encontrado", 404);

    const existingPermissions = await this.repository.countPermissionsByIds(uniquePermissionIds);
    if (existingPermissions !== uniquePermissionIds.length) {
      throw new AppError("Uno o mas permisos no existen", 400);
    }

    const role = await this.repository.replaceRolePermissions(roleId, uniquePermissionIds);
    return mapRole(role);
  }
}

module.exports = { RbacService };
