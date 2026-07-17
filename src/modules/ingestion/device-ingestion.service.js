const bcrypt = require("bcryptjs");
const { AppError } = require("../../shared/errors");
const { normalizeDeviceReadings } = require("./reading-normalizer");
const { hasSignificantAverageChange, buildStorageDecision } = require("./average-change-policy");

function firstDefined(...values) {
  return values.find((value) => value !== null && value !== undefined);
}

function buildUnifiedSnapshot({ deviceId, payload, protocol, readings }) {
  const generationReading = readings.find((reading) => reading.dataSource === "GENERATION") ?? null;
  const consumptionReading = readings.find((reading) => reading.dataSource === "CONSUMPTION") ?? null;
  const generationPower = generationReading?.power ?? null;
  const consumptionPower = consumptionReading?.power ?? null;

  return {
    dispositivoId: deviceId,
    protocolo: protocol,
    voltaje: firstDefined(
      generationReading?.voltage,
      consumptionReading?.voltage,
      payload?.voltage,
      payload?.voltaje,
      payload?.generation?.voltage,
      payload?.generation?.voltaje,
      payload?.consumption?.voltage,
      payload?.consumption?.voltaje,
      payload?.generacion?.voltaje,
      payload?.consumo?.voltaje,
    ) ?? null,
    corriente: firstDefined(
      generationReading?.current,
      consumptionReading?.current,
      payload?.current,
      payload?.corriente,
      payload?.generation?.current,
      payload?.generation?.corriente,
      payload?.consumption?.current,
      payload?.consumption?.corriente,
      payload?.generacion?.corriente,
      payload?.consumo?.corriente,
    ) ?? null,
    potenciaGeneracion: generationPower,
    potenciaConsumo: consumptionPower,
    energiaGeneracion: generationReading?.energy ?? null,
    energiaConsumo: consumptionReading?.energy ?? null,
    balanceEnergetico:
      generationPower !== null || consumptionPower !== null
        ? Number(generationPower ?? 0) - Number(consumptionPower ?? 0)
        : null,
    payload,
    timestamp: firstDefined(
      generationReading?.timestamp,
      consumptionReading?.timestamp,
      payload?.timestamp ? new Date(payload.timestamp) : null,
    ) ?? new Date(),
  };
}

class DeviceIngestionService {
  constructor(repository) {
    this.repository = repository;
  }

  async ingest({ deviceId, deviceKey, payload, protocol = "UNKNOWN" }) {
    if (!deviceKey) throw new AppError("Falta la clave del dispositivo", 401);

    const device = await this.repository.findDevice(deviceId);
    if (!device || !device.activo) throw new AppError("Dispositivo no encontrado o inactivo", 404);
    if (!(await bcrypt.compare(deviceKey, device.claveIngestaHash))) {
      throw new AppError("Clave de dispositivo invalida", 401);
    }

    const readings = normalizeDeviceReadings(payload);
    if (!readings.length) {
      throw new AppError("La recepcion debe incluir generacion, consumo o ambos", 400);
    }

    const unifiedBase = buildUnifiedSnapshot({ deviceId, payload, protocol, readings });
    const results = await this.repository.transaction(async (repository) => {
      const collectedAverages = {};
      const transactionResults = [];

      for (const [index, reading] of readings.entries()) {
        const result = await this.ingestReading({
          repository,
          device,
          deviceId,
          reading,
          protocol,
          writeUnified: index === readings.length - 1,
          unifiedBase,
          collectedAverages,
        });

        collectedAverages[reading.dataSource] = result.analysis.average;
        transactionResults.push(result);
      }

      return transactionResults;
    });

    const primary = results[0];
    return {
      ...primary,
      readings: results.map((item) => ({
        dataSource: item.dataSource,
        reading: item.reading,
        analysis: item.analysis,
        storage: item.storage,
      })),
      processedReadings: results.length,
    };
  }

  async ingestReading({ repository, device, deviceId, reading, protocol, writeUnified = false, unifiedBase = null, collectedAverages = {} }) {
    if (reading.dataSource && device.fuenteDatos !== "BIDIRECTIONAL" && reading.dataSource !== device.fuenteDatos) {
      throw new AppError("El tipo de dato enviado no coincide con la configuracion del dispositivo", 400, {
        received: reading.dataSource,
        configured: device.fuenteDatos,
      });
    }
    reading.protocol = protocol;
    reading.dataSource = reading.dataSource || (device.fuenteDatos === "BIDIRECTIONAL" ? null : device.fuenteDatos);
    if (!reading.dataSource) {
      throw new AppError("Cada lectura debe indicar si pertenece a generacion o consumo", 400);
    }

    const now = new Date();
    if (reading.timestamp.getTime() > now.getTime() + 5 * 60 * 1000) {
      throw new AppError("El timestamp no puede estar mas de 5 minutos en el futuro", 400);
    }

    const latest = await repository.findLatestReading(deviceId, reading.dataSource);
    if (latest && reading.timestamp <= latest.fechaLectura) {
      throw new AppError("La lectura es anterior o igual a la ultima recibida", 409);
    }

    const config = await repository.getConfig(device.usuarioId);
    const windowStart = new Date(reading.timestamp.getTime() - config.ventanaPromedioMinutos * 60 * 1000);
    const average = await repository.calculateAveragePower(deviceId, reading.dataSource, windowStart, reading.power);
    const upperLimit = average === null ? null : average + Number(config.desviacionSuperiorPuntos);
    const lowerLimit = average === null ? null : average - Number(config.desviacionInferiorPuntos);
    const outOfRange = average !== null && reading.power !== null && (reading.power > upperLimit || reading.power < lowerLimit);
    const lastStored = await repository.findLastStored(deviceId, reading.dataSource);
    const significantAverageChange = hasSignificantAverageChange({
      average,
      previousAverage: lastStored?.promedioReferencia,
      threshold: config.cambioSignificativoPuntos,
    });
    const storageDecision = buildStorageDecision({
      lastStored,
      readingTimestamp: reading.timestamp,
      outOfRange,
      config,
      significantAverageChange,
    });

    const unifiedReading = writeUnified && unifiedBase
      ? {
          ...unifiedBase,
          promedioRefGeneracion: reading.dataSource === "GENERATION"
            ? average
            : (collectedAverages.GENERATION ?? null),
          promedioRefConsumo: reading.dataSource === "CONSUMPTION"
            ? average
            : (collectedAverages.CONSUMPTION ?? null),
        }
      : null;

    const result = await repository.saveReception({
      dispositivoId: deviceId,
      reading,
      average,
      outOfRange,
      shouldStore: storageDecision.shouldStore,
      reason: storageDecision.reason,
      windowStart,
      unifiedReading,
    });

    return {
      deviceId,
      source: result.device.tipo,
      dataSource: reading.dataSource,
      protocol,
      receivedAt: result.latest.fechaLectura,
      reading: {
        voltage: result.latest.voltaje === null ? null : Number(result.latest.voltaje),
        current: result.latest.corriente === null ? null : Number(result.latest.corriente),
        power: result.latest.potencia === null ? null : Number(result.latest.potencia),
        energy: result.latest.energia === null ? null : Number(result.latest.energia),
      },
      analysis: {
        average: average === null ? null : Number(average.toFixed(3)),
        upperLimit: upperLimit === null ? null : Number(upperLimit.toFixed(3)),
        lowerLimit: lowerLimit === null ? null : Number(lowerLimit.toFixed(3)),
        outOfRange,
        significantAverageChange,
      },
      storage: {
        rawReadingId: result.rawReading.id.toString(),
        stored: Boolean(result.history),
        reason: result.history ? storageDecision.reason : "INTERVAL_NOT_REACHED",
        historyId: result.history?.id.toString() ?? null,
        unifiedReadingId: result.unified?.id?.toString() ?? null,
      },
    };
  }
}

module.exports = { DeviceIngestionService };
