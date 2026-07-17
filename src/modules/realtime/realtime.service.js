const { AppError } = require("../../shared/errors");

function mapRealtime(item) {
  return {
    id: item.id,
    sistemaId: item.sistemaId,
    systemName: item.sistema?.nombreSistema,
    energiaGenerada: Number(item.energiaGenerada),
    energiaConsumida: Number(item.energiaConsumida),
    potenciaInstantanea: Number(item.potenciaInstantanea),
    balanceEnergetico: Number(item.balanceEnergetico),
    fechaLectura: item.fechaLectura,
  };
}

function mapDeviceRealtime(item) {
  return {
    id: item.id,
    deviceId: item.dispositivoId,
    deviceName: item.dispositivo?.nombre,
    deviceType: item.dispositivo?.tipo,
    deviceStatus: item.dispositivo?.estado,
    dataSource: item.fuenteDatos,
    voltage: item.voltaje === null || item.voltaje === undefined ? null : Number(item.voltaje),
    current: item.corriente === null || item.corriente === undefined ? null : Number(item.corriente),
    power: item.potencia === null || item.potencia === undefined ? null : Number(item.potencia),
    energy: item.energia === null || item.energia === undefined ? null : Number(item.energia),
    average: item.promedioReferencia === null || item.promedioReferencia === undefined ? null : Number(item.promedioReferencia),
    outOfRange: item.fueraRango,
    fechaLectura: item.fechaLectura,
  };
}

class RealtimeService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll() {
    const rows = await this.repository.findAll();
    return rows.map(mapRealtime);
  }

  async getBySystemId(systemId) {
    const item = await this.repository.findBySystemId(systemId);
    if (!item) throw new AppError("No existe lectura en tiempo real para este sistema", 404);
    return mapRealtime(item);
  }

  async getDevices(userId) {
    const rows = await this.repository.findDeviceRealtime(userId);
    return rows.map(mapDeviceRealtime);
  }
}

module.exports = { RealtimeService, mapRealtime, mapDeviceRealtime };
