const { prisma } = require("../src/config/prisma");
const { DashboardRepository } = require("../src/modules/dashboard/dashboard.repository");
const { DashboardService } = require("../src/modules/dashboard/dashboard.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const [databaseInfo] = await prisma.$queryRaw`
    SELECT current_database() AS database, current_schema() AS schema
  `;
  const [users, devices, rawReadings, history, summaries] = await Promise.all([
    prisma.usuario.count(),
    prisma.dispositivo.count(),
    prisma.lecturaDispositivo.count(),
    prisma.historialDispositivo.count(),
    prisma.resumenDispositivo.count(),
  ]);

  const dashboardOwner = await prisma.usuario.findFirst({
    where: { dispositivos: { some: {} } },
    select: { id: true, email: true },
  });
  assert(databaseInfo?.database, "No se pudo identificar la base PostgreSQL activa.");

  let dashboardResult = {
    status: "empty",
    message: "La base no contiene dispositivos. Estado valido para una instalacion nueva.",
  };

  if (dashboardOwner) {
    const dashboard = await new DashboardService(new DashboardRepository()).getDashboard({
      range: "30d",
      granularity: "minute",
    }, dashboardOwner.id);
    const invalidBalances = dashboard.chart.filter(
      (point) => point.powerBalanceKw !== null
        && (point.generationPowerKw === null || point.consumptionPowerKw === null),
    );

    assert(dashboard.selection.range === "30d", "El dashboard no respeto el rango solicitado.");
    assert(dashboard.selection.granularity === "minute", "El dashboard no respeto la granularidad solicitada.");
    assert(invalidBalances.length === 0, "Se detectaron balances sin generacion y consumo comparables.");

    dashboardResult = {
      status: "ok",
      user: dashboardOwner.email,
      points: dashboard.chart.length,
      comparablePoints: dashboard.chart.filter((point) => point.balance !== null).length,
      range: dashboard.selection.range,
      granularity: dashboard.selection.granularity,
    };
  }

  console.log(JSON.stringify({
    status: "ok",
    database: databaseInfo.database,
    schema: databaseInfo.schema,
    records: { users, devices, rawReadings, history, summaries },
    dashboard: dashboardResult,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(`[validate:mvp] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
