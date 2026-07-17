const { prisma } = require("../../config/prisma");

const roleInclude = {
  permisos: {
    include: {
      permiso: true,
    },
  },
};

class RbacRepository {
  findRoles() {
    return prisma.rol.findMany({
      include: roleInclude,
      orderBy: { nombre: "asc" },
    });
  }

  findPermissions() {
    return prisma.permiso.findMany({
      orderBy: [{ modulo: "asc" }, { clave: "asc" }],
    });
  }

  findRoleById(roleId) {
    return prisma.rol.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
  }

  countPermissionsByIds(permissionIds) {
    return prisma.permiso.count({
      where: { id: { in: permissionIds } },
    });
  }

  replaceRolePermissions(roleId, permissionIds) {
    return prisma.$transaction(async (tx) => {
      await tx.rolPermiso.deleteMany({ where: { rolId: roleId } });
      if (permissionIds.length) {
        await tx.rolPermiso.createMany({
          data: permissionIds.map((permissionId) => ({ rolId: roleId, permisoId: permissionId })),
          skipDuplicates: true,
        });
      }

      return tx.rol.findUnique({
        where: { id: roleId },
        include: roleInclude,
      });
    });
  }
}

module.exports = { RbacRepository };
