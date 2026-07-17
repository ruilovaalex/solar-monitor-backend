const { prisma } = require("../../config/prisma");
const { userWithRole } = require("../../shared/middlewares/rbac");

class UserRepository {
  findAll() {
    return prisma.usuario.findMany({ include: userWithRole, orderBy: { createdAt: "desc" } });
  }

  findById(id) {
    return prisma.usuario.findUnique({ where: { id }, include: userWithRole });
  }

  findByEmail(email) {
    return prisma.usuario.findUnique({ where: { email }, include: userWithRole });
  }

  findRoleByName(nombre) {
    return prisma.rol.findUnique({ where: { nombre } });
  }

  create(data) {
    return prisma.usuario.create({ data, include: userWithRole });
  }

  update(id, data) {
    return prisma.usuario.update({ where: { id }, data, include: userWithRole });
  }

  delete(id) {
    return prisma.usuario.delete({ where: { id } });
  }
}

module.exports = { UserRepository };
