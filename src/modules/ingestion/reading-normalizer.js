const { z } = require("zod");
const { AppError } = require("../../shared/errors");

const readingSchema = z.object({
  voltaje: z.coerce.number().nonnegative().optional(),
  voltage: z.coerce.number().nonnegative().optional(),
  corriente: z.coerce.number().nonnegative().optional(),
  current: z.coerce.number().nonnegative().optional(),
  potencia: z.coerce.number().nonnegative().optional(),
  power: z.coerce.number().nonnegative().optional(),
  energia: z.coerce.number().nonnegative().optional(),
  energy: z.coerce.number().nonnegative().optional(),
  fuenteDatos: z.string().optional(),
  dataSource: z.string().optional(),
  tipoDato: z.string().optional(),
  type: z.string().optional(),
  timestamp: z.coerce.date().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeDataSource(value, { allowBidirectional = false } = {}) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  if (["GENERATION", "GENERACION", "GENERACIÓN", "GEN"].includes(normalized)) return "GENERATION";
  if (["CONSUMPTION", "CONSUMO", "CONS"].includes(normalized)) return "CONSUMPTION";
  if (allowBidirectional && ["BIDIRECTIONAL", "BIDIRECCIONAL", "BOTH", "AMBOS"].includes(normalized)) return "BIDIRECTIONAL";
  throw new AppError("El tipo de dato debe ser generacion o consumo", 400);
}

function normalizeDeviceReading(payload) {
  const parsed = readingSchema.parse(payload);
  const power = parsed.potencia ?? parsed.power;
  const energy = parsed.energia ?? parsed.energy ?? null;
  if (power === undefined && energy === null) {
    throw new AppError("La lectura debe incluir potencia o energia medida", 400);
  }

  return {
    voltage: parsed.voltaje ?? parsed.voltage ?? null,
    current: parsed.corriente ?? parsed.current ?? null,
    power: power ?? null,
    energy,
    dataSource: normalizeDataSource(parsed.fuenteDatos ?? parsed.dataSource ?? parsed.tipoDato ?? parsed.type),
    timestamp: parsed.timestamp ?? new Date(),
    payload: parsed.payload ?? payload,
  };
}

function normalizeNamedReading(sourcePayload, dataSource, basePayload) {
  const payload = {
    ...sourcePayload,
    timestamp: sourcePayload?.timestamp ?? basePayload.timestamp,
    dataSource,
  };
  return normalizeDeviceReading(payload);
}

function buildFlatReading(payload, dataSource) {
  const isGeneration = dataSource === "GENERATION";
  const power = isGeneration
    ? firstDefined(payload.generationPower, payload.generacionPower, payload.potenciaGeneracion, payload.potenciaGenerada)
    : firstDefined(payload.consumptionPower, payload.consumoPower, payload.potenciaConsumo, payload.potenciaConsumida);
  const energy = isGeneration
    ? firstDefined(payload.generationEnergy, payload.energiaGeneracion, payload.energiaGenerada)
    : firstDefined(payload.consumptionEnergy, payload.energiaConsumo, payload.energiaConsumida);

  if (power === undefined && energy === undefined) return null;

  return normalizeDeviceReading({
    timestamp: payload.timestamp,
    power,
    energy,
    voltage: firstDefined(payload.voltage, payload.voltaje),
    current: firstDefined(payload.current, payload.corriente),
    dataSource,
  });
}

function normalizeDeviceReadings(payload) {
  const readings = [];

  const generationPayload = payload.generation ?? payload.generacion;
  const consumptionPayload = payload.consumption ?? payload.consumo;

  if (generationPayload) {
    readings.push(normalizeNamedReading(generationPayload, "GENERATION", payload));
  }
  if (consumptionPayload) {
    readings.push(normalizeNamedReading(consumptionPayload, "CONSUMPTION", payload));
  }

  const flatGeneration = generationPayload ? null : buildFlatReading(payload, "GENERATION");
  const flatConsumption = consumptionPayload ? null : buildFlatReading(payload, "CONSUMPTION");
  if (flatGeneration) readings.push(flatGeneration);
  if (flatConsumption) readings.push(flatConsumption);

  if (readings.length) {
    return readings.map((reading) => ({
      ...reading,
      payload,
    }));
  }

  return [normalizeDeviceReading(payload)];
}

module.exports = { normalizeDeviceReading, normalizeDeviceReadings, readingSchema };
