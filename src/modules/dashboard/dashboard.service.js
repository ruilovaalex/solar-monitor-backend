const { z } = require("zod");

const MAX_CHART_POINTS = 5000;

const dashboardQuerySchema = z.object({
  range: z.enum(["today", "24h", "7d", "30d"]).default("24h"),
  granularity: z.enum(["minute", "hour", "day", "month"]).default("hour"),
});

function metric(id, label, value, unit, status = "neutral") {
  return {
    id,
    label,
    value: value === null || value === undefined ? null : Number(Number(value).toFixed(3)),
    unit,
    status,
  };
}

function isDeviceOnline(device, now = new Date()) {
  if (!device.ultimoContacto) return false;
  const toleranceMs = Math.max(device.intervaloMuestreoSegundos * 3, 30) * 1000;
  return now.getTime() - device.ultimoContacto.getTime() <= toleranceMs;
}

function latestReadingFor(devices, dataSource) {
  return devices
    .flatMap((device) => device.ultimaLecturas || [])
    .filter((reading) => reading.fuenteDatos === dataSource)
    .sort((left, right) => right.fechaLectura.getTime() - left.fechaLectura.getTime())[0] || null;
}

function getRangeBounds(range, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);

  if (range === "today") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (range === "24h") {
    start.setUTCHours(start.getUTCHours() - 24);
  } else if (range === "7d") {
    start.setUTCDate(start.getUTCDate() - 7);
  } else {
    start.setUTCDate(start.getUTCDate() - 30);
  }

  return { start, end };
}

function serializeSeries(rows) {
  const buckets = new Map();

  for (const row of rows || []) {
    const timestamp = new Date(row.timestamp);
    const power = row.averagePower === null || row.averagePower === undefined
      ? null
      : Number(row.averagePower);
    if (Number.isNaN(timestamp.getTime()) || power === null || !Number.isFinite(power)) continue;

    const key = timestamp.toISOString();
    const bucket = buckets.get(key) || {
      timestamp: key,
      generationPowerKw: null,
      consumptionPowerKw: null,
      powerBalanceKw: null,
      outOfRange: false,
    };

    if (row.dataSource === "GENERATION") bucket.generationPowerKw = Number(power.toFixed(3));
    if (row.dataSource === "CONSUMPTION") bucket.consumptionPowerKw = Number(power.toFixed(3));
    bucket.outOfRange ||= Boolean(row.outOfRange);
    buckets.set(key, bucket);
  }

  const chart = Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      powerBalanceKw:
        bucket.generationPowerKw !== null && bucket.consumptionPowerKw !== null
          ? Number((bucket.generationPowerKw - bucket.consumptionPowerKw).toFixed(3))
          : null,
    }))
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

  return {
    chart: chart.slice(-MAX_CHART_POINTS),
    truncated: chart.length > MAX_CHART_POINTS,
  };
}

function latestTimestamp(...readings) {
  return readings
    .map((reading) => reading?.fechaLectura)
    .filter((timestamp) => timestamp instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;
}

function isCurrentUnifiedSnapshot(snapshot, latestTimestampValue) {
  if (!snapshot || !latestTimestampValue) return false;
  return Math.abs(snapshot.timestamp.getTime() - latestTimestampValue.getTime()) <= 1000;
}

class DashboardService {
  constructor(repository) {
    this.repository = repository;
  }

  async getDashboard(query = {}, userId) {
    const filters = dashboardQuerySchema.parse(query);
    const bounds = getRangeBounds(filters.range);
    const { devices, latestUnified, seriesRows } = await this.repository.getDashboardData({
      userId,
      ...filters,
      ...bounds,
    });

    const generationReading = latestReadingFor(devices, "GENERATION");
    const consumptionReading = latestReadingFor(devices, "CONSUMPTION");
    const latestSourceTimestamp = latestTimestamp(generationReading, consumptionReading);
    const useUnifiedSnapshot = isCurrentUnifiedSnapshot(latestUnified, latestSourceTimestamp);

    const generationPower = useUnifiedSnapshot
      ? Number(latestUnified.potenciaGeneracion)
      : generationReading?.potencia === null || generationReading?.potencia === undefined
        ? 0
        : Number(generationReading.potencia);
    const consumptionPower = useUnifiedSnapshot
      ? Number(latestUnified.potenciaConsumo)
      : consumptionReading?.potencia === null || consumptionReading?.potencia === undefined
        ? 0
        : Number(consumptionReading.potencia);
    const powerBalance = useUnifiedSnapshot
      ? Number(latestUnified.balanceEnergetico ?? generationPower - consumptionPower)
      : null;

    const onlineDevices = devices.filter((device) => isDeviceOnline(device));
    const hasGeneration = Boolean(generationReading);
    const hasConsumption = Boolean(consumptionReading);
    const lastSync = devices
      .map((device) => device.ultimoContacto)
      .filter((timestamp) => timestamp instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime())[0] || null;
    const anomalies = devices.filter((device) =>
      (device.ultimaLecturas || []).some((reading) => reading.fueraRango),
    ).length;
    const series = serializeSeries(seriesRows);

    return {
      metrics: {
        generationPower: metric("generationPower", "Potencia de generacion", generationPower, "kW", generationPower > 0 ? "positive" : "neutral"),
        consumptionPower: metric("consumptionPower", "Potencia de consumo", consumptionPower, "kW", consumptionPower > 0 ? "positive" : "neutral"),
        powerBalance: metric(
          "powerBalance",
          "Balance de potencia",
          powerBalance,
          "kW",
          powerBalance === null ? "neutral" : powerBalance >= 0 ? "positive" : "warning",
        ),
        connectedDevices: metric(
          "connectedDevices",
          "Dispositivos conectados",
          onlineDevices.length,
          `de ${devices.length}`,
          devices.length > 0 && onlineDevices.length === devices.length ? "positive" : "warning",
        ),
      },
      health: {
        status: !devices.length ? "empty" : onlineDevices.length === devices.length ? "optimal" : onlineDevices.length ? "attention" : "offline",
        lastSync,
        alerts: anomalies,
        onlineDevices: onlineDevices.length,
        totalDevices: devices.length,
        hasGeneration,
        hasConsumption,
        comparisonAvailable: powerBalance !== null,
      },
      metricsTimestamp: useUnifiedSnapshot ? latestUnified.timestamp : latestSourceTimestamp,
      selection: {
        range: filters.range,
        granularity: filters.granularity,
        start: bounds.start,
        end: bounds.end,
        truncated: series.truncated,
      },
      chart: series.chart,
    };
  }
}

module.exports = {
  DashboardService,
  dashboardQuerySchema,
  getRangeBounds,
  isDeviceOnline,
  serializeSeries,
};
