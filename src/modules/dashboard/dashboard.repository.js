const { Prisma } = require("@prisma/client");
const { prisma } = require("../../config/prisma");

const summaryGranularity = {
  hour: "HOUR",
  day: "DAY",
  month: "MONTH",
};

class DashboardRepository {
  async getDashboardData({ userId, start, end, granularity }) {
    const [devices, latestUnified, seriesRows] = await Promise.all([
      prisma.dispositivo.findMany({
        where: { usuarioId: userId, activo: true },
        include: {
          ultimaLecturas: {
            orderBy: { fechaLectura: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.lecturaUnificada.findFirst({
        where: {
          dispositivo: { usuarioId: userId, activo: true },
          potenciaGeneracion: { not: null },
          potenciaConsumo: { not: null },
        },
        orderBy: { timestamp: "desc" },
      }),
      granularity === "minute"
        ? this.findMinuteSeries(userId, start, end)
        : this.findSummarySeries(userId, start, end, summaryGranularity[granularity]),
    ]);

    return { devices, latestUnified, seriesRows };
  }

  findMinuteSeries(userId, start, end) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT
        date_trunc('minute', reading."timestamp") AS "timestamp",
        reading."fuenteDatos"::text AS "dataSource",
        AVG(reading."potencia"::double precision) AS "averagePower",
        COUNT(reading."potencia")::integer AS "samples"
      FROM "LecturasDispositivos" AS reading
      INNER JOIN "Dispositivos" AS device
        ON device."id" = reading."dispositivoId"
      WHERE
        device."activo" = TRUE
        AND device."usuarioId" = ${userId}
        AND reading."potencia" IS NOT NULL
        AND reading."timestamp" >= ${start}
        AND reading."timestamp" <= ${end}
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC
    `);
  }

  findSummarySeries(userId, start, end, granularity) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT
        summary."periodoInicio" AS "timestamp",
        summary."fuenteDatos"::text AS "dataSource",
        (
          SUM(summary."promedioPotencia"::double precision * summary."muestras"::double precision)
          / NULLIF(SUM(summary."muestras")::double precision, 0)
        ) AS "averagePower",
        SUM(summary."muestras")::integer AS "samples",
        BOOL_OR(summary."fueraRango") AS "outOfRange"
      FROM "ResumenDispositivos" AS summary
      INNER JOIN "Dispositivos" AS device
        ON device."id" = summary."dispositivoId"
      WHERE
        device."activo" = TRUE
        AND device."usuarioId" = ${userId}
        AND summary."granularidad" = ${granularity}::"SummaryGranularity"
        AND summary."periodoInicio" >= ${start}
        AND summary."periodoInicio" <= ${end}
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC
    `);
  }
}

module.exports = { DashboardRepository };
