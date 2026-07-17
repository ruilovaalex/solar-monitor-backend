const bcrypt = require("bcryptjs");
const { DeviceIngestionService } = require("../../src/modules/ingestion/device-ingestion.service");

function makeRepoMock(overrides = {}) {
  const deviceKey = "clave-test-123";
  const hashedKey = bcrypt.hashSync(deviceKey, 10);

  const repository = {
    _deviceKey: deviceKey,
    findDevice: jest.fn().mockResolvedValue({
      id: "dev-1",
      usuarioId: "user-1",
      activo: true,
      tipo: "ESP32",
      fuenteDatos: "BIDIRECTIONAL",
      claveIngestaHash: hashedKey,
    }),
    getConfig: jest.fn().mockResolvedValue({
      ventanaPromedioMinutos: 15,
      desviacionSuperiorPuntos: 4,
      desviacionInferiorPuntos: 4,
      intervaloGuardadoNormalMinutos: 15,
      intervaloGuardadoAnomaliaSegundos: 10,
      cambioSignificativoPuntos: 0.25,
    }),
    calculateAveragePower: jest.fn().mockResolvedValue(100),
    findLatestReading: jest.fn().mockResolvedValue(null),
    findLastStored: jest.fn().mockResolvedValue(null),
    saveReception: jest.fn().mockResolvedValue({
      device: { tipo: "ESP32" },
      latest: {
        fechaLectura: new Date(),
        voltaje: null,
        corriente: null,
        potencia: 200,
        energia: null,
      },
      rawReading: { id: BigInt(1) },
      history: { id: BigInt(1) },
      unified: { id: BigInt(1) },
    }),
  };

  repository.transaction = jest.fn(async (work) => work(repository));
  return Object.assign(repository, overrides);
}

describe("DeviceIngestionService.ingest", () => {
  test("procesa lectura de generacion correctamente", async () => {
    const repo = makeRepoMock();
    const service = new DeviceIngestionService(repo);

    const result = await service.ingest({
      deviceId: "dev-1",
      deviceKey: repo._deviceKey,
      payload: { power: 200, dataSource: "GENERATION", timestamp: new Date() },
      protocol: "HTTP_REST",
    });

    expect(result.processedReadings).toBe(1);
    expect(result.readings[0].dataSource).toBe("GENERATION");
    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.saveReception).toHaveBeenCalledTimes(1);
    expect(repo.getConfig).toHaveBeenCalledWith("user-1");
  });

  test("procesa payload bidireccional con generation y consumption", async () => {
    const repo = makeRepoMock();
    const service = new DeviceIngestionService(repo);

    const result = await service.ingest({
      deviceId: "dev-1",
      deviceKey: repo._deviceKey,
      payload: {
        generation: { power: 300, timestamp: new Date() },
        consumption: { power: 180, timestamp: new Date() },
      },
      protocol: "HTTP_REST",
    });

    expect(result.processedReadings).toBe(2);
    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.saveReception).toHaveBeenCalledTimes(2);
  });

  test("propaga el fallo de la segunda lectura dentro de la misma transaccion", async () => {
    const repo = makeRepoMock();
    repo.saveReception
      .mockResolvedValueOnce({
        device: { tipo: "ESP32" },
        latest: {
          fechaLectura: new Date(),
          voltaje: null,
          corriente: null,
          potencia: 300,
          energia: null,
        },
        rawReading: { id: BigInt(1) },
        history: null,
        unified: null,
      })
      .mockRejectedValueOnce(new Error("Fallo de escritura en consumo"));
    const service = new DeviceIngestionService(repo);

    await expect(
      service.ingest({
        deviceId: "dev-1",
        deviceKey: repo._deviceKey,
        payload: {
          generation: { power: 300, timestamp: new Date() },
          consumption: { power: 180, timestamp: new Date() },
        },
        protocol: "HTTP_REST",
      }),
    ).rejects.toThrow("Fallo de escritura en consumo");

    expect(repo.transaction).toHaveBeenCalledTimes(1);
    expect(repo.saveReception).toHaveBeenCalledTimes(2);
  });

  test("lanza 401 si la clave del dispositivo es incorrecta", async () => {
    const repo = makeRepoMock();
    const service = new DeviceIngestionService(repo);

    await expect(
      service.ingest({
        deviceId: "dev-1",
        deviceKey: "clave-incorrecta",
        payload: { power: 100, dataSource: "GENERATION", timestamp: new Date() },
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test("lanza 404 si el dispositivo no existe", async () => {
    const repo = makeRepoMock({ findDevice: jest.fn().mockResolvedValue(null) });
    const service = new DeviceIngestionService(repo);

    await expect(
      service.ingest({
        deviceId: "no-existe",
        deviceKey: "cualquiera",
        payload: { power: 100, dataSource: "GENERATION", timestamp: new Date() },
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("lanza 400 si el payload no tiene potencia ni energia", async () => {
    const repo = makeRepoMock();
    const service = new DeviceIngestionService(repo);

    await expect(
      service.ingest({
        deviceId: "dev-1",
        deviceKey: repo._deviceKey,
        payload: { dataSource: "GENERATION", timestamp: new Date() },
      }),
    ).rejects.toThrow();
  });

  test("lanza 400 si el payload esta completamente vacio", async () => {
    const repo = makeRepoMock();
    const service = new DeviceIngestionService(repo);

    await expect(
      service.ingest({
        deviceId: "dev-1",
        deviceKey: repo._deviceKey,
        payload: {},
      }),
    ).rejects.toThrow();
  });
});
