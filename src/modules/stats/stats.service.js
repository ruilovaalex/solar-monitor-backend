const { parseDate } = require("../../shared/utils/dates");

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function mapDaily(item) {
  const generationKwh = Number(item.energiaGeneradaTotal);
  const consumptionKwh = Number(item.energiaConsumidaTotal);
  const balance = Number(item.balanceTotal);
  return {
    id: item.id.toString(),
    sistemaId: item.sistemaId,
    fecha: item.fecha,
    energiaGeneradaTotal: generationKwh,
    energiaConsumidaTotal: consumptionKwh,
    balanceTotal: balance,
    timestamp: item.fecha,
    generationKwh,
    consumptionKwh,
    gridImportKwh: Math.max(-balance, 0),
    gridExportKwh: Math.max(balance, 0),
    selfConsumptionKwh: Math.min(generationKwh, consumptionKwh),
    powerKw: 0,
  };
}

function mapMonthly(item) {
  return {
    id: item.id.toString(),
    sistemaId: item.sistemaId,
    mes: item.mes,
    anio: item.anio,
    month: months[item.mes - 1],
    generationKwh: Number(item.energiaGeneradaTotal),
    consumptionKwh: Number(item.energiaConsumidaTotal),
    balanceTotal: Number(item.balanceTotal),
  };
}

function pushWeighted(bucket, fuenteDatos, promedioPotencia, muestras) {
  const key = fuenteDatos === "GENERATION" ? "generation" : "consumption";
  bucket[key].sum += Number(promedioPotencia) * Number(muestras);
  bucket[key].samples += Number(muestras);
}

function weightedAverage(slot) {
  return slot.samples ? Number((slot.sum / slot.samples).toFixed(3)) : 0;
}

function buildAggregateRows(rows, getKey, mapTimestamp) {
  const buckets = new Map();

  for (const item of rows) {
    const key = getKey(item);
    const bucket = buckets.get(key) || {
      timestamp: mapTimestamp(item),
      generation: { sum: 0, samples: 0 },
      consumption: { sum: 0, samples: 0 },
      outOfRange: false,
    };
    pushWeighted(bucket, item.fuenteDatos, item.promedioPotencia, item.muestras);
    bucket.outOfRange ||= item.fueraRango;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).map((item) => {
    const generationPowerKw = weightedAverage(item.generation);
    const consumptionPowerKw = weightedAverage(item.consumption);
    return {
      timestamp: item.timestamp,
      generationPowerKw,
      consumptionPowerKw,
      powerBalanceKw: Number((generationPowerKw - consumptionPowerKw).toFixed(3)),
      outOfRange: item.outOfRange,
    };
  });
}

function buildMonthlyPower(rows) {
  return buildAggregateRows(
    rows,
    (item) => item.periodoInicio.toISOString(),
    (item) => `${months[item.periodoInicio.getMonth()]} ${item.periodoInicio.getFullYear()}`,
  ).map((item) => ({
    month: item.timestamp,
    generationPowerKw: item.generationPowerKw,
    consumptionPowerKw: item.consumptionPowerKw,
    powerBalanceKw: item.powerBalanceKw,
  }));
}

function buildFromHistory(history) {
  const monthlyBuckets = new Map();
  const chartBuckets = new Map();

  for (const item of history) {
    if (item.potencia === null || item.potencia === undefined) continue;
    const generationPowerKw = item.fuenteDatos === "GENERATION" ? Number(item.potencia) : 0;
    const consumptionPowerKw = item.fuenteDatos === "CONSUMPTION" ? Number(item.potencia) : 0;
    const monthKey = `${item.timestamp.getFullYear()}-${item.timestamp.getMonth()}`;
    const monthBucket = monthlyBuckets.get(monthKey) || {
      month: `${months[item.timestamp.getMonth()]} ${item.timestamp.getFullYear()}`,
      generation: [],
      consumption: [],
    };
    if (generationPowerKw) monthBucket.generation.push(generationPowerKw);
    if (consumptionPowerKw) monthBucket.consumption.push(consumptionPowerKw);
    monthlyBuckets.set(monthKey, monthBucket);

    const timestamp = new Date(item.timestamp);
    timestamp.setSeconds(0, 0);
    const chartKey = timestamp.toISOString();
    const chartBucket = chartBuckets.get(chartKey) || {
      timestamp,
      generation: [],
      consumption: [],
      outOfRange: false,
    };
    if (generationPowerKw) chartBucket.generation.push(generationPowerKw);
    if (consumptionPowerKw) chartBucket.consumption.push(consumptionPowerKw);
    chartBucket.outOfRange ||= item.fueraRango;
    chartBuckets.set(chartKey, chartBucket);
  }

  const average = (values) => values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
    : 0;
  const chart = Array.from(chartBuckets.values()).map((item) => {
    const generationPowerKw = average(item.generation);
    const consumptionPowerKw = average(item.consumption);
    return {
      timestamp: item.timestamp,
      generationPowerKw,
      consumptionPowerKw,
      powerBalanceKw: Number((generationPowerKw - consumptionPowerKw).toFixed(3)),
      outOfRange: item.outOfRange,
    };
  });

  return {
    chart,
    monthlyPower: Array.from(monthlyBuckets.values()).map((item) => ({
      month: item.month,
      generationPowerKw: average(item.generation),
      consumptionPowerKw: average(item.consumption),
    })),
  };
}

class StatsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getDaily(query) {
    const rows = await this.repository.findDaily({
      sistemaId: query.systemId || query.sistemaId,
      fechaInicio: parseDate(query.fechaInicio || query.startDate, "fechaInicio"),
      fechaFin: parseDate(query.fechaFin || query.endDate, "fechaFin"),
    });
    return rows.map(mapDaily);
  }

  async getMonthly(query) {
    const rows = await this.repository.findMonthly({
      sistemaId: query.systemId || query.sistemaId,
      anio: query.anio ? Number(query.anio) : undefined,
    });
    return rows.map(mapMonthly);
  }

  async getFrontendStatistics(query, userId) {
    const sinceYear = new Date();
    sinceYear.setFullYear(sinceYear.getFullYear() - 1);
    const sinceMonth = new Date();
    sinceMonth.setMonth(sinceMonth.getMonth() - 1);
    const sinceDay = new Date();
    sinceDay.setDate(sinceDay.getDate() - 1);

    const [history, hourlySummaries, dailySummaries, monthlySummaries] = await Promise.all([
      this.repository.findDeviceHistory(userId, sinceYear),
      this.repository.findHourlySummaries(userId, sinceDay),
      this.repository.findDailyDeviceSummaries(userId, sinceYear),
      this.repository.findMonthlyDeviceSummaries(userId, sinceYear.getFullYear()),
    ]);

    const fallback = buildFromHistory(history);
    const chart = hourlySummaries.length
      ? buildAggregateRows(
          hourlySummaries,
          (item) => item.periodoInicio.toISOString(),
          (item) => item.periodoInicio,
        )
      : fallback.chart;
    const dailyPower = buildAggregateRows(
      dailySummaries,
      (item) => item.periodoInicio.toISOString(),
      (item) => item.periodoInicio,
    );
    const monthlyPower = monthlySummaries.length ? buildMonthlyPower(monthlySummaries) : fallback.monthlyPower;

    return {
      range: query.range || "month",
      chart,
      hourlyPower: chart,
      dailyPower,
      monthlyPower,
      totals: {
        generationSamples: monthlySummaries
          .filter((item) => item.fuenteDatos === "GENERATION")
          .reduce((sum, item) => sum + item.muestras, 0) || history.filter((item) => item.fuenteDatos === "GENERATION").length,
        consumptionSamples: monthlySummaries
          .filter((item) => item.fuenteDatos === "CONSUMPTION")
          .reduce((sum, item) => sum + item.muestras, 0) || history.filter((item) => item.fuenteDatos === "CONSUMPTION").length,
        anomalies: monthlySummaries.filter((item) => item.fueraRango).length || history.filter((item) => item.fueraRango).length,
      },
    };
  }
}

module.exports = { StatsService };
