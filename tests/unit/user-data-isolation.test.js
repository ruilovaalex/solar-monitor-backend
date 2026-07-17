const { DeviceService } = require("../../src/modules/devices/device.service");
const { MonitoringService } = require("../../src/modules/monitoring/monitoring.service");

function monitoringConfig() {
  return {
    ventanaPromedioMinutos: 15,
    desviacionSuperiorPuntos: 4,
    desviacionInferiorPuntos: 4,
    intervaloGuardadoNormalMinutos: 15,
    intervaloGuardadoAnomaliaSegundos: 10,
    cambioSignificativoPuntos: 0.25,
    retencionLecturasDias: 90,
    retencionHistorialDias: 730,
    retencionResumenesMeses: 60,
  };
}

describe("aislamiento de datos por usuario", () => {
  test("consulta dispositivos usando el propietario autenticado", async () => {
    const repository = { findAll: jest.fn().mockResolvedValue([]) };

    await new DeviceService(repository).getAll("user-alex");

    expect(repository.findAll).toHaveBeenCalledWith("user-alex");
  });

  test("crea y consulta configuracion de monitoreo por usuario", async () => {
    const repository = {
      get: jest.fn().mockResolvedValue(monitoringConfig()),
    };

    const result = await new MonitoringService(repository).get("user-prueba");

    expect(repository.get).toHaveBeenCalledWith("user-prueba");
    expect(result.averageWindowMinutes).toBe(15);
  });
});
