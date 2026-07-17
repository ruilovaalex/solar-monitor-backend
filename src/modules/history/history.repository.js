const { prisma } = require("../../config/prisma");

class HistoryRepository {
  findMany({ sistemaId, fechaInicio, fechaFin, skip, take }) {
    const where = {
      ...(sistemaId ? { sistemaId } : {}),
      timestamp: {
        ...(fechaInicio ? { gte: fechaInicio } : {}),
        ...(fechaFin ? { lte: fechaFin } : {}),
      },
    };

    if (!fechaInicio && !fechaFin) delete where.timestamp;

    return prisma.$transaction([
      prisma.historialLectura.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take,
      }),
      prisma.historialLectura.count({ where }),
    ]);
  }

  findDeviceHistory({ userId, deviceId, dataSource, fechaInicio, fechaFin, skip, take }) {
    const where = {
      dispositivo: { usuarioId: userId },
      ...(deviceId ? { dispositivoId: deviceId } : {}),
      ...(dataSource ? { fuenteDatos: dataSource } : {}),
      timestamp: {
        ...(fechaInicio ? { gte: fechaInicio } : {}),
        ...(fechaFin ? { lte: fechaFin } : {}),
      },
    };

    if (!fechaInicio && !fechaFin) delete where.timestamp;

    return prisma.$transaction([
      prisma.historialDispositivo.findMany({
        where,
        include: {
          dispositivo: {
            select: { id: true, nombre: true, tipo: true },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take,
      }),
      prisma.historialDispositivo.count({ where }),
    ]);
  }
}

module.exports = { HistoryRepository };
