const { z } = require("zod");

const readingSchema = z.object({
  sistemaId: z.string().min(1),
  energiaGenerada: z.coerce.number().nonnegative(),
  energiaConsumida: z.coerce.number().nonnegative(),
  potenciaInstantanea: z.coerce.number().nonnegative(),
  balanceEnergetico: z.coerce.number(),
  timestamp: z.coerce.date().optional(),
});

class IngestionService {
  constructor(repository) {
    this.repository = repository;
  }

  async ingest(payload) {
    const parsed = readingSchema.parse(payload);
    return this.repository.ingestReading(parsed);
  }

  generateSimulatedReading(system, date = new Date()) {
    const hour = date.getHours() + date.getMinutes() / 60;
    const daylightFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const capacityKw = Number(system.potenciaInstalada || system.capacityKw || 1);
    const powerKw = Number((capacityKw * daylightFactor * (0.75 + Math.random() * 0.2)).toFixed(3));
    const generated = Number(((powerKw * 3) / 3600).toFixed(3));
    const consumed = Number(((0.6 + Math.random() * 1.8) * 3 / 3600).toFixed(3));
    const balance = Number((generated - consumed).toFixed(3));

    return {
      sistemaId: system.id,
      energiaGenerada: generated,
      energiaConsumida: consumed,
      potenciaInstantanea: powerKw,
      balanceEnergetico: balance,
      timestamp: date,
    };
  }
}

module.exports = { IngestionService };
