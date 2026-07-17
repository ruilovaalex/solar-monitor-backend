const { prisma } = require("../../config/prisma");
const { env } = require("../../config/env");
const { IngestionRepository } = require("./ingestion.repository");
const { IngestionService } = require("./ingestion.service");

function startSimulator() {
  if (!env.simulationEnabled) return null;

  const service = new IngestionService(new IngestionRepository());

  return setInterval(async () => {
    try {
      const systems = await prisma.sistemaFotovoltaico.findMany();
      await Promise.all(
        systems.map((system) => service.ingest(service.generateSimulatedReading(system)))
      );
    } catch (error) {
      console.error("Error ejecutando simulador", error);
    }
  }, env.simulationIntervalMs);
}

module.exports = { startSimulator };
