const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function daysAgo(days) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value;
}

function monthsAgo(months) {
  const value = new Date();
  value.setMonth(value.getMonth() - months);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

async function applyUserRetention(config) {
  const deviceOwner = { dispositivo: { usuarioId: config.usuarioId } };
  const rawCutoff = daysAgo(config.retencionLecturasDias);
  const historyCutoff = daysAgo(config.retencionHistorialDias);
  const summaryCutoff = monthsAgo(config.retencionResumenesMeses);

  const [raw, history, samples, summaries] = await prisma.$transaction([
    prisma.lecturaDispositivo.deleteMany({
      where: { ...deviceOwner, timestamp: { lt: rawCutoff } },
    }),
    prisma.historialDispositivo.deleteMany({
      where: { ...deviceOwner, timestamp: { lt: historyCutoff } },
    }),
    prisma.muestraTemporalDispositivo.deleteMany({
      where: { ...deviceOwner, timestamp: { lt: daysAgo(1) } },
    }),
    prisma.resumenDispositivo.deleteMany({
      where: {
        ...deviceOwner,
        granularidad: { in: ["HOUR", "DAY"] },
        periodoInicio: { lt: summaryCutoff },
      },
    }),
  ]);

  return {
    userId: config.usuarioId,
    rawReadingsDeleted: raw.count,
    historyDeleted: history.count,
    temporarySamplesDeleted: samples.count,
    summariesDeleted: summaries.count,
  };
}

async function main() {
  const configurations = await prisma.configuracionMonitoreo.findMany();
  const results = [];

  for (const config of configurations) {
    results.push(await applyUserRetention(config));
  }

  console.log(JSON.stringify({ usersProcessed: results.length, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
