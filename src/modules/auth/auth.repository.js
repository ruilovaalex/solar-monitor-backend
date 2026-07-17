const { prisma } = require("../../config/prisma");
const { userWithRole } = require("../../shared/middlewares/rbac");

class AuthRepository {
  findByEmail(email) {
    return prisma.usuario.findFirst({
      where: {
        email: {
          equals: email.trim().toLowerCase(),
          mode: "insensitive",
        },
      },
      include: userWithRole,
    });
  }

  findById(id) {
    return prisma.usuario.findUnique({
      where: { id },
      include: userWithRole,
    });
  }
}

module.exports = { AuthRepository };
