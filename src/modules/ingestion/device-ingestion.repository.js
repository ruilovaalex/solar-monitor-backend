const { prisma } = require("../../config/prisma");
const { startOfHour, startOfDay } = require("./time-buckets");

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function upsertPowerSummary(tx, { dispositivoId, fuenteDatos, granularidad, periodoInicio, power, outOfRange }) {
  if (power === null || power === undefined) return null;

  return tx.$executeRaw`
    INSERT INTO "ResumenDispositivos" (
      "dispositivoId",
      "fuenteDatos",
      "granularidad",
      "periodoInicio",
      "promedioPotencia",
      "minimoPotencia",
      "maximoPotencia",
      "muestras",
      "fueraRango",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${dispositivoId},
      ${fuenteDatos}::"DataSourceType",
      ${granularidad}::"SummaryGranularity",
      ${periodoInicio},
      ${Number(power)},
      ${Number(power)},
      ${Number(power)},
      1,
      ${Boolean(outOfRange)},
      NOW(),
      NOW()
    )
    ON CONFLICT ("dispositivoId", "fuenteDatos", "granularidad", "periodoInicio")
    DO UPDATE SET
      "promedioPotencia" = (
        ("ResumenDispositivos"."promedioPotencia" * "ResumenDispositivos"."muestras")
        + EXCLUDED."promedioPotencia"
      ) / ("ResumenDispositivos"."muestras" + 1),
      "minimoPotencia" = LEAST("ResumenDispositivos"."minimoPotencia", EXCLUDED."minimoPotencia"),
      "maximoPotencia" = GREATEST("ResumenDispositivos"."maximoPotencia", EXCLUDED."maximoPotencia"),
      "muestras" = "ResumenDispositivos"."muestras" + 1,
      "fueraRango" = "ResumenDispositivos"."fueraRango" OR EXCLUDED."fueraRango",
      "updatedAt" = NOW()
  `;
}

async function upsertAggregates(tx, { dispositivoId, fuenteDatos, reading, outOfRange }) {
  const power = reading.power === null || reading.power === undefined ? null : Number(reading.power);
  const buckets = [
    { granularidad: "HOUR", periodoInicio: startOfHour(reading.timestamp) },
    { granularidad: "DAY", periodoInicio: startOfDay(reading.timestamp) },
    { granularidad: "MONTH", periodoInicio: startOfMonth(reading.timestamp) },
  ];

  for (const bucket of buckets) {
    await upsertPowerSummary(tx, {
      dispositivoId,
      fuenteDatos,
      granularidad: bucket.granularidad,
      periodoInicio: bucket.periodoInicio,
      power,
      outOfRange,
    });
  }
}

async function saveUnifiedReception(tx, unifiedReading) {
  if (!unifiedReading) return null;

  const hasMeasurement = [
    unifiedReading.potenciaGeneracion,
    unifiedReading.potenciaConsumo,
    unifiedReading.energiaGeneracion,
    unifiedReading.energiaConsumo,
  ].some((value) => value !== null && value !== undefined);

  if (!hasMeasurement) return null;

  return tx.lecturaUnificada.create({
    data: {
      dispositivoId: unifiedReading.dispositivoId,
      protocolo: unifiedReading.protocolo,
      voltaje: unifiedReading.voltaje,
      corriente: unifiedReading.corriente,
      potenciaGeneracion: unifiedReading.potenciaGeneracion,
      potenciaConsumo: unifiedReading.potenciaConsumo,
      energiaGeneracion: unifiedReading.energiaGeneracion,
      energiaConsumo: unifiedReading.energiaConsumo,
      balanceEnergetico: unifiedReading.balanceEnergetico,
      promedioRefGeneracion: unifiedReading.promedioRefGeneracion,
      promedioRefConsumo: unifiedReading.promedioRefConsumo,
      payload: unifiedReading.payload,
      timestamp: unifiedReading.timestamp,
    },
  });
}

class DeviceIngestionRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  transaction(work) {
    return prisma.$transaction(async (tx) => work(new DeviceIngestionRepository(tx)));
  }

  findDevice(id) {
    return this.client.dispositivo.findUnique({ where: { id } });
  }

  getConfig(userId) {
    return this.client.configuracionMonitoreo.upsert({
      where: { usuarioId: userId },
      update: {},
      create: { usuarioId: userId },
    });
  }

  async calculateAveragePower(dispositivoId, fuenteDatos, since, currentPower) {
    if (currentPower === null || currentPower === undefined) return null;

    const summary = await this.client.lecturaDispositivo.aggregate({
      where: {
        dispositivoId,
        fuenteDatos,
        timestamp: { gte: since },
      },
      _avg: { potencia: true },
      _count: { potencia: true },
    });

    const storedCount = summary._count.potencia;
    const totalCount = storedCount + 1;
    const storedAverage = summary._avg.potencia === null ? 0 : Number(summary._avg.potencia);
    return ((storedAverage * storedCount) + Number(currentPower)) / totalCount;
  }

  findRecentSamples(dispositivoId, since) {
    return this.client.muestraTemporalDispositivo.findMany({
      where: {
        dispositivoId,
        timestamp: { gte: since },
      },
      select: {
        potencia: true,
        timestamp: true,
      },
      orderBy: { timestamp: "asc" },
    });
  }

  findLastStored(dispositivoId, fuenteDatos) {
    return this.client.historialDispositivo.findFirst({
      where: { dispositivoId, fuenteDatos },
      orderBy: { timestamp: "desc" },
    });
  }

  findLatestReading(dispositivoId, fuenteDatos) {
    return this.client.ultimaLecturaDispositivo.findUnique({
      where: {
        dispositivoId_fuenteDatos: { dispositivoId, fuenteDatos },
      },
    });
  }

  async saveReception({
    dispositivoId,
    reading,
    average,
    outOfRange,
    shouldStore,
    reason,
    windowStart,
    unifiedReading = null,
  }) {
    const tx = this.client;
    const device = await tx.dispositivo.update({
      where: { id: dispositivoId },
      data: {
        estado: "ONLINE",
        ultimoContacto: reading.timestamp,
      },
    });

    const latest = await tx.ultimaLecturaDispositivo.upsert({
      where: {
        dispositivoId_fuenteDatos: { dispositivoId, fuenteDatos: reading.dataSource },
      },
      update: {
        voltaje: reading.voltage,
        corriente: reading.current,
        potencia: reading.power,
        energia: reading.energy,
        promedioReferencia: average,
        fueraRango: outOfRange,
        payload: reading.payload,
        fechaLectura: reading.timestamp,
      },
      create: {
        dispositivoId,
        fuenteDatos: reading.dataSource,
        voltaje: reading.voltage,
        corriente: reading.current,
        potencia: reading.power,
        energia: reading.energy,
        promedioReferencia: average,
        fueraRango: outOfRange,
        payload: reading.payload,
        fechaLectura: reading.timestamp,
      },
    });

    const rawReading = await tx.lecturaDispositivo.create({
      data: {
        dispositivoId,
        fuenteDatos: reading.dataSource,
        protocolo: reading.protocol,
        voltaje: reading.voltage,
        corriente: reading.current,
        potencia: reading.power,
        energia: reading.energy,
        promedioReferencia: average,
        payload: reading.payload,
        timestamp: reading.timestamp,
      },
    });

    const history = shouldStore
      ? await tx.historialDispositivo.create({
          data: {
            dispositivoId,
            lecturaId: rawReading.id,
            fuenteDatos: reading.dataSource,
            voltaje: reading.voltage,
            corriente: reading.current,
            potencia: reading.power,
            energia: reading.energy,
            promedioReferencia: average,
            fueraRango: outOfRange,
            motivoGuardado: reason,
            payload: reading.payload,
            timestamp: reading.timestamp,
          },
        })
      : null;

    await upsertAggregates(tx, {
      dispositivoId,
      fuenteDatos: reading.dataSource,
      reading,
      outOfRange,
    });

    if (reading.power !== null && reading.power !== undefined) {
      await tx.muestraTemporalDispositivo.create({
        data: {
          dispositivoId,
          potencia: reading.power,
          timestamp: reading.timestamp,
        },
      });
    }

    await tx.muestraTemporalDispositivo.deleteMany({
      where: {
        dispositivoId,
        timestamp: { lt: windowStart },
      },
    });

    const unified = await saveUnifiedReception(tx, unifiedReading);

    return { device, latest, rawReading, history, unified };
  }
}

module.exports = { DeviceIngestionRepository };
