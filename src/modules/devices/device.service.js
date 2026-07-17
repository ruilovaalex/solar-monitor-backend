const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { AppError } = require("../../shared/errors");
const { mapDevice } = require("./device.mapper");

const createDeviceSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(["ESP32", "RASPBERRY", "OTHER", "esp32", "raspberry", "other"]),
  model: z.string().min(1).max(80).optional(),
  dataSource: z.string().trim().optional(),
  sampleIntervalSeconds: z.coerce.number().int().min(1).max(3600).default(5),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function normalizeDeviceType(type) {
  const normalized = type.toUpperCase();
  if (normalized === "RASPBERRY") return "RASPBERRY";
  if (normalized === "OTHER") return "OTHER";
  return "ESP32";
}

function normalizeDataSource(dataSource) {
  if (!dataSource) return "BIDIRECTIONAL";

  const normalized = dataSource.toUpperCase();
  if (normalized === "GENERATION") return "GENERATION";
  if (normalized === "CONSUMPTION") return "CONSUMPTION";
  if (normalized === "BIDIRECTIONAL") return "BIDIRECTIONAL";
  return "BIDIRECTIONAL";
}

function buildConnectionGuide(device, ingestionKey) {
  return {
    key: ingestionKey,
    header: "x-device-key",
    endpoint: `/api/ingestion/devices/${device.id}/readings`,
    method: "POST",
    contentType: "application/json",
    examplePayload: {
      timestamp: new Date().toISOString(),
      generation: {
        power: 1.25,
        voltage: 120,
        current: 10.4,
      },
      consumption: {
        power: 0.82,
        voltage: 120,
        current: 6.8,
      },
    },
    note: "Guarda esta clave ahora. El dispositivo puede enviar generacion, consumo o ambos segun su configuracion y el payload que envie.",
  };
}

class DeviceService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(userId) {
    const devices = await this.repository.findAll(userId);
    return devices.map(mapDevice);
  }

  async getById(id, userId) {
    const device = await this.repository.findById(id, userId);
    if (!device || !device.activo) throw new AppError("Dispositivo no encontrado", 404);
    return mapDevice(device);
  }

  async create(payload, userId) {
    const parsed = createDeviceSchema.parse(payload);
    const type = normalizeDeviceType(parsed.type);
    const dataSource = normalizeDataSource(parsed.dataSource);
    const ingestionKey = `solar_${crypto.randomBytes(18).toString("base64url")}`;
    const device = await this.repository.create({
      usuarioId: userId,
      nombre: parsed.name,
      tipo: type,
      modelo: parsed.model || type,
      fuenteDatos: dataSource,
      intervaloMuestreoSegundos: parsed.sampleIntervalSeconds,
      claveIngestaHash: await bcrypt.hash(ingestionKey, 10),
      metadata: parsed.metadata,
      activo: true,
    });

    return {
      ...mapDevice(device),
      ingestion: buildConnectionGuide(device, ingestionKey),
    };
  }
}

module.exports = { DeviceService };
