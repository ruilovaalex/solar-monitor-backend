const { prisma } = require("../../config/prisma");

const deviceInclude = {
  ultimaLecturas: {
    orderBy: { fechaLectura: "desc" },
  },
};

class DeviceRepository {
  findAll(userId) {
    return prisma.dispositivo.findMany({
      where: { usuarioId: userId, activo: true },
      include: deviceInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  findById(id, userId) {
    return prisma.dispositivo.findFirst({
      where: { id, usuarioId: userId },
      include: deviceInclude,
    });
  }

  create(data) {
    return prisma.dispositivo.create({
      data,
      include: deviceInclude,
    });
  }
}

module.exports = { DeviceRepository };
