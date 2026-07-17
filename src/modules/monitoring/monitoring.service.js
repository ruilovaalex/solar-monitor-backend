const { z } = require("zod");
const { mapMonitoringConfig } = require("./monitoring.mapper");

const configSchema = z.object({
  averageWindowMinutes: z.coerce.number().int().min(1).max(1440),
  upperDeviationPoints: z.coerce.number().positive(),
  lowerDeviationPoints: z.coerce.number().positive(),
  regularStorageMinutes: z.coerce.number().int().min(1).max(1440),
  anomalyStorageSeconds: z.coerce.number().int().min(1).max(3600),
  significantChangePoints: z.coerce.number().positive().max(1000).optional(),
  retentionRawReadingsDays: z.coerce.number().int().min(1).max(3650).optional(),
  retentionHistoryDays: z.coerce.number().int().min(1).max(3650).optional(),
  retentionSummariesMonths: z.coerce.number().int().min(1).max(240).optional(),
});

class MonitoringService {
  constructor(repository) {
    this.repository = repository;
  }

  async get(userId) {
    return mapMonitoringConfig(await this.repository.get(userId));
  }

  async update(payload, userId) {
    const parsed = configSchema.parse(payload);
    const config = await this.repository.update(userId, {
      ventanaPromedioMinutos: parsed.averageWindowMinutes,
      desviacionSuperiorPuntos: parsed.upperDeviationPoints,
      desviacionInferiorPuntos: parsed.lowerDeviationPoints,
      intervaloGuardadoNormalMinutos: parsed.regularStorageMinutes,
      intervaloGuardadoAnomaliaSegundos: parsed.anomalyStorageSeconds,
      ...(parsed.significantChangePoints !== undefined
        ? { cambioSignificativoPuntos: parsed.significantChangePoints }
        : {}),
      ...(parsed.retentionRawReadingsDays !== undefined
        ? { retencionLecturasDias: parsed.retentionRawReadingsDays }
        : {}),
      ...(parsed.retentionHistoryDays !== undefined
        ? { retencionHistorialDias: parsed.retentionHistoryDays }
        : {}),
      ...(parsed.retentionSummariesMonths !== undefined
        ? { retencionResumenesMeses: parsed.retentionSummariesMonths }
        : {}),
    });
    return mapMonitoringConfig(config);
  }
}

module.exports = { MonitoringService };
