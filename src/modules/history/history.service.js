const { getPagination, buildPaginatedResponse } = require("../../shared/utils/pagination");
const { parseDate } = require("../../shared/utils/dates");

function mapHistory(item) {
  return {
    id: item.id.toString(),
    sistemaId: item.sistemaId,
    energiaGenerada: Number(item.energiaGenerada),
    energiaConsumida: Number(item.energiaConsumida),
    potenciaInstantanea: Number(item.potenciaInstantanea),
    balanceEnergetico: Number(item.balanceEnergetico),
    timestamp: item.timestamp,
    generationKwh: Number(item.energiaGenerada),
    consumptionKwh: Number(item.energiaConsumida),
    powerKw: Number(item.potenciaInstantanea),
    gridImportKwh: Number(Math.max(-Number(item.balanceEnergetico), 0).toFixed(3)),
    gridExportKwh: Number(Math.max(Number(item.balanceEnergetico), 0).toFixed(3)),
    selfConsumptionKwh: Number(Math.min(Number(item.energiaGenerada), Number(item.energiaConsumida)).toFixed(3)),
  };
}

function normalizeDataSource(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().toUpperCase();
  if (["GENERATION", "GENERACION", "GENERACIÓN", "GEN"].includes(normalized)) return "GENERATION";
  if (["CONSUMPTION", "CONSUMO", "CONS"].includes(normalized)) return "CONSUMPTION";
  return undefined;
}

function mapDeviceHistory(item) {
  const power = item.potencia === null || item.potencia === undefined ? null : Number(item.potencia);
  const energy = item.energia === null || item.energia === undefined ? null : Number(item.energia);
  return {
    id: item.id.toString(),
    deviceId: item.dispositivoId,
    deviceName: item.dispositivo?.nombre,
    deviceType: item.dispositivo?.tipo,
    dataSource: item.fuenteDatos,
    voltage: item.voltaje === null || item.voltaje === undefined ? null : Number(item.voltaje),
    current: item.corriente === null || item.corriente === undefined ? null : Number(item.corriente),
    power,
    energy,
    average: item.promedioReferencia === null || item.promedioReferencia === undefined ? null : Number(item.promedioReferencia),
    outOfRange: item.fueraRango,
    reason: item.motivoGuardado,
    timestamp: item.timestamp,
    generationPowerKw: item.fuenteDatos === "GENERATION" ? power : 0,
    consumptionPowerKw: item.fuenteDatos === "CONSUMPTION" ? power : 0,
  };
}

class HistoryService {
  constructor(repository) {
    this.repository = repository;
  }

  async getHistory(query, systemId = undefined) {
    const pagination = getPagination(query);
    const [rows, total] = await this.repository.findMany({
      sistemaId: systemId || query.sistemaId || query.systemId,
      fechaInicio: parseDate(query.fechaInicio || query.startDate, "fechaInicio"),
      fechaFin: parseDate(query.fechaFin || query.endDate, "fechaFin"),
      skip: pagination.skip,
      take: pagination.take,
    });

    return buildPaginatedResponse({
      data: rows.map(mapHistory),
      total,
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  async getDeviceHistory(query, userId) {
    const pagination = getPagination(query);
    const [rows, total] = await this.repository.findDeviceHistory({
      userId,
      deviceId: query.deviceId || query.dispositivoId,
      dataSource: normalizeDataSource(query.dataSource || query.fuenteDatos),
      fechaInicio: parseDate(query.fechaInicio || query.startDate, "fechaInicio"),
      fechaFin: parseDate(query.fechaFin || query.endDate, "fechaFin"),
      skip: pagination.skip,
      take: pagination.take,
    });

    return buildPaginatedResponse({
      data: rows.map(mapDeviceHistory),
      total,
      page: pagination.page,
      limit: pagination.limit,
    });
  }
}

module.exports = { HistoryService, mapHistory, mapDeviceHistory };
