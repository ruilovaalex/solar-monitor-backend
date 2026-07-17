const { prisma } = require("../../config/prisma");

class MonitoringRepository {
  get(userId) {
    return prisma.configuracionMonitoreo.upsert({
      where: { usuarioId: userId },
      update: {},
      create: { usuarioId: userId },
    });
  }

  update(userId, data) {
    return prisma.configuracionMonitoreo.upsert({
      where: { usuarioId: userId },
      update: data,
      create: { usuarioId: userId, ...data },
    });
  }
}

module.exports = { MonitoringRepository };
