const { prisma } = require("../../config/prisma");

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

class ComparisonsRepository {
  findSystemsForComparison() {
    const now = new Date();
    return prisma.sistemaFotovoltaico.findMany({
      include: {
        resumenesDiarios: {
          where: { fecha: startOfLocalDay(now) },
          take: 1,
        },
        resumenesMensuales: {
          where: { mes: now.getMonth() + 1, anio: now.getFullYear() },
          take: 1,
        },
      },
      orderBy: { nombreSistema: "asc" },
    });
  }

  findDeviceComparisonData() {
    const sinceDay = startOfLocalDay(new Date());
    const sinceMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    return prisma.resumenDispositivo.findMany({
      where: {
        granularidad: { in: ["DAY", "MONTH"] },
        periodoInicio: { gte: sinceMonth },
      },
      include: {
        dispositivo: {
          select: { id: true, nombre: true, tipo: true },
        },
      },
      orderBy: { periodoInicio: "asc" },
    }).then((rows) => ({
      today: rows.filter((item) => item.granularidad === "DAY" && item.periodoInicio.getTime() === sinceDay.getTime()),
      month: rows.filter((item) => item.granularidad === "MONTH"),
    }));
  }
}

module.exports = { ComparisonsRepository };
