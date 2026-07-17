const { z } = require("zod");
const { AppError } = require("../../shared/errors");
const { mapSystem } = require("./system.mapper");

const systemSchema = z.object({
  nombreSistema: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  ubicacion: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  potenciaInstalada: z.coerce.number().positive().optional(),
  capacityKw: z.coerce.number().positive().optional(),
});

class SystemService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll() {
    const systems = await this.repository.findAll();
    return systems.map(mapSystem);
  }

  async getById(id) {
    const system = await this.repository.findById(id);
    if (!system) throw new AppError("Sistema fotovoltaico no encontrado", 404);
    return mapSystem(system);
  }

  async create(payload) {
    const parsed = systemSchema.parse(payload);
    const data = {
      nombreSistema: parsed.nombreSistema || parsed.name,
      ubicacion: parsed.ubicacion || parsed.location,
      potenciaInstalada: parsed.potenciaInstalada || parsed.capacityKw,
    };
    if (!data.nombreSistema || !data.ubicacion || !data.potenciaInstalada) {
      throw new AppError("nombreSistema, ubicacion y potenciaInstalada son obligatorios", 400);
    }
    return mapSystem(await this.repository.create(data));
  }

  async update(id, payload) {
    const parsed = systemSchema.parse(payload);
    const data = {};
    if (parsed.nombreSistema || parsed.name) data.nombreSistema = parsed.nombreSistema || parsed.name;
    if (parsed.ubicacion || parsed.location) data.ubicacion = parsed.ubicacion || parsed.location;
    if (parsed.potenciaInstalada || parsed.capacityKw) data.potenciaInstalada = parsed.potenciaInstalada || parsed.capacityKw;
    return mapSystem(await this.repository.update(id, data));
  }

  async delete(id) {
    await this.repository.delete(id);
    return { id };
  }
}

module.exports = { SystemService };
