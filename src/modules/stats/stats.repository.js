const { prisma } = require("../../config/prisma");

class StatsRepository {
  findDeviceHistory(userId, since) {
    return prisma.historialDispositivo.findMany({
      where: { dispositivo: { usuarioId: userId }, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
    });
  }

  findHourlySummaries(userId, since) {
    return prisma.resumenDispositivo.findMany({
      where: {
        dispositivo: { usuarioId: userId },
        granularidad: "HOUR",
        periodoInicio: { gte: since },
      },
      orderBy: { periodoInicio: "asc" },
    });
  }

  findDailyDeviceSummaries(userId, since) {
    return prisma.resumenDispositivo.findMany({
      where: {
        dispositivo: { usuarioId: userId },
        granularidad: "DAY",
        periodoInicio: { gte: since },
      },
      orderBy: { periodoInicio: "asc" },
    });
  }

  findMonthlyDeviceSummaries(userId, sinceYear) {
    return prisma.resumenDispositivo.findMany({
      where: {
        dispositivo: { usuarioId: userId },
        granularidad: "MONTH",
        periodoInicio: { gte: new Date(sinceYear, 0, 1) },
      },
      orderBy: { periodoInicio: "asc" },
    });
  }

  findDaily({ sistemaId, fechaInicio, fechaFin }) {
    return prisma.resumenDiario.findMany({
      where: {
        ...(sistemaId ? { sistemaId } : {}),
        fecha: {
          ...(fechaInicio ? { gte: fechaInicio } : {}),
          ...(fechaFin ? { lte: fechaFin } : {}),
        },
      },
      orderBy: { fecha: "asc" },
      take: 370,
    });
  }

  findMonthly({ sistemaId, anio }) {
    return prisma.resumenMensual.findMany({
      where: {
        ...(sistemaId ? { sistemaId } : {}),
        ...(anio ? { anio } : {}),
      },
      orderBy: [{ anio: "asc" }, { mes: "asc" }],
      take: 120,
    });
  }
}

module.exports = { StatsRepository };
