const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

class IngestionController {
  constructor(service) {
    this.ingest = asyncHandler(async (req, res) => {
      const result = await service.ingest(req.body);
      res.status(201).json({
        realtime: {
          id: result.realtime.id,
          sistemaId: result.realtime.sistemaId,
          energiaGenerada: Number(result.realtime.energiaGenerada),
          energiaConsumida: Number(result.realtime.energiaConsumida),
          potenciaInstantanea: Number(result.realtime.potenciaInstantanea),
          balanceEnergetico: Number(result.realtime.balanceEnergetico),
          fechaLectura: result.realtime.fechaLectura,
        },
        history: {
          id: result.history.id.toString(),
          sistemaId: result.history.sistemaId,
          timestamp: result.history.timestamp,
        },
      });
    });
  }
}

module.exports = { IngestionController };
