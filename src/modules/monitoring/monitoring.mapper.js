function mapMonitoringConfig(config) {
  return {
    averageWindowMinutes: config.ventanaPromedioMinutos,
    upperDeviationPoints: Number(config.desviacionSuperiorPuntos),
    lowerDeviationPoints: Number(config.desviacionInferiorPuntos),
    regularStorageMinutes: config.intervaloGuardadoNormalMinutos,
    anomalyStorageSeconds: config.intervaloGuardadoAnomaliaSegundos,
    significantChangePoints: Number(config.cambioSignificativoPuntos ?? 0.25),
    retentionRawReadingsDays: config.retencionLecturasDias,
    retentionHistoryDays: config.retencionHistorialDias,
    retentionSummariesMonths: config.retencionResumenesMeses,
    connectionProtocol: "pending",
    generationFormulaStatus: "pending",
    consumptionFormulaStatus: "pending",
  };
}

module.exports = { mapMonitoringConfig };
