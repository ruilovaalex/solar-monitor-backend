const { prisma } = require("../../config/prisma");
const { startOfDay, monthParts } = require("../../shared/utils/dates");

class IngestionRepository {
  ingestReading(reading) {
    const timestamp = reading.timestamp || new Date();
    const fecha = startOfDay(timestamp);
    const { mes, anio } = monthParts(timestamp);

    return prisma.$transaction(async (tx) => {
      const realtime = await tx.datosTiempoReal.upsert({
        where: { sistemaId: reading.sistemaId },
        update: {
          energiaGenerada: reading.energiaGenerada,
          energiaConsumida: reading.energiaConsumida,
          potenciaInstantanea: reading.potenciaInstantanea,
          balanceEnergetico: reading.balanceEnergetico,
          fechaLectura: timestamp,
        },
        create: {
          sistemaId: reading.sistemaId,
          energiaGenerada: reading.energiaGenerada,
          energiaConsumida: reading.energiaConsumida,
          potenciaInstantanea: reading.potenciaInstantanea,
          balanceEnergetico: reading.balanceEnergetico,
          fechaLectura: timestamp,
        },
      });

      const history = await tx.historialLectura.create({
        data: {
          sistemaId: reading.sistemaId,
          energiaGenerada: reading.energiaGenerada,
          energiaConsumida: reading.energiaConsumida,
          potenciaInstantanea: reading.potenciaInstantanea,
          balanceEnergetico: reading.balanceEnergetico,
          timestamp,
        },
      });

      await tx.resumenDiario.upsert({
        where: { sistemaId_fecha: { sistemaId: reading.sistemaId, fecha } },
        update: {
          energiaGeneradaTotal: { increment: reading.energiaGenerada },
          energiaConsumidaTotal: { increment: reading.energiaConsumida },
          balanceTotal: { increment: reading.balanceEnergetico },
        },
        create: {
          sistemaId: reading.sistemaId,
          fecha,
          energiaGeneradaTotal: reading.energiaGenerada,
          energiaConsumidaTotal: reading.energiaConsumida,
          balanceTotal: reading.balanceEnergetico,
        },
      });

      await tx.resumenMensual.upsert({
        where: { sistemaId_mes_anio: { sistemaId: reading.sistemaId, mes, anio } },
        update: {
          energiaGeneradaTotal: { increment: reading.energiaGenerada },
          energiaConsumidaTotal: { increment: reading.energiaConsumida },
          balanceTotal: { increment: reading.balanceEnergetico },
        },
        create: {
          sistemaId: reading.sistemaId,
          mes,
          anio,
          energiaGeneradaTotal: reading.energiaGenerada,
          energiaConsumidaTotal: reading.energiaConsumida,
          balanceTotal: reading.balanceEnergetico,
        },
      });

      return { realtime, history };
    });
  }
}

module.exports = { IngestionRepository };
