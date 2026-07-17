const { DashboardService } = require("../../src/modules/dashboard/dashboard.service");

const timestamp = new Date("2026-07-09T14:22:39.000Z");

function reading(fuenteDatos, potencia) {
  return {
    fuenteDatos,
    potencia,
    fechaLectura: timestamp,
    fueraRango: false,
  };
}

function deviceWith(readings) {
  return {
    id: "device-1",
    ultimoContacto: timestamp,
    intervaloMuestreoSegundos: 5,
    ultimaLecturas: readings,
  };
}

function repositoryResult(overrides = {}) {
  return {
    devices: [deviceWith([reading("GENERATION", 3.21), reading("CONSUMPTION", 1.81)])],
    latestUnified: {
      timestamp,
      potenciaGeneracion: 3.21,
      potenciaConsumo: 1.81,
      balanceEnergetico: 1.4,
    },
    seriesRows: [
      { timestamp, dataSource: "GENERATION", averagePower: 3.21, outOfRange: false },
      { timestamp, dataSource: "CONSUMPTION", averagePower: 1.81, outOfRange: false },
    ],
    ...overrides,
  };
}

describe("DashboardService", () => {
  test("mantiene el contrato al consultar sin query params", async () => {
    const repository = { getDashboardData: jest.fn().mockResolvedValue(repositoryResult()) };
    const result = await new DashboardService(repository).getDashboard({}, "user-1");

    expect(repository.getDashboardData).toHaveBeenCalledWith(expect.objectContaining({
      range: "24h",
      granularity: "hour",
      userId: "user-1",
    }));
    expect(result).toEqual(expect.objectContaining({
      metrics: expect.any(Object),
      health: expect.any(Object),
      chart: expect.any(Array),
    }));
    expect(result.metrics.powerBalance.value).toBe(1.4);
    expect(result.health.comparisonAvailable).toBe(true);
  });

  test("respeta range y granularity y calcula balance dentro del mismo bucket", async () => {
    const repository = { getDashboardData: jest.fn().mockResolvedValue(repositoryResult()) };
    const result = await new DashboardService(repository).getDashboard({
      range: "24h",
      granularity: "minute",
    }, "user-1");

    expect(repository.getDashboardData).toHaveBeenCalledWith(expect.objectContaining({
      range: "24h",
      granularity: "minute",
      userId: "user-1",
    }));
    expect(result.chart).toHaveLength(1);
    expect(result.chart[0]).toEqual(expect.objectContaining({
      generationPowerKw: 3.21,
      consumptionPowerKw: 1.81,
      powerBalanceKw: 1.4,
    }));
  });

  test("devuelve balance null si el bucket solo tiene generacion", async () => {
    const repository = {
      getDashboardData: jest.fn().mockResolvedValue(repositoryResult({
        latestUnified: null,
        devices: [deviceWith([reading("GENERATION", 3.21)])],
        seriesRows: [
          { timestamp, dataSource: "GENERATION", averagePower: 3.21, outOfRange: false },
        ],
      })),
    };

    const result = await new DashboardService(repository).getDashboard({ granularity: "minute" }, "user-1");

    expect(result.chart[0].generationPowerKw).toBe(3.21);
    expect(result.chart[0].consumptionPowerKw).toBeNull();
    expect(result.chart[0].powerBalanceKw).toBeNull();
    expect(result.metrics.powerBalance.value).toBeNull();
  });

  test("devuelve balance null si el bucket solo tiene consumo", async () => {
    const repository = {
      getDashboardData: jest.fn().mockResolvedValue(repositoryResult({
        latestUnified: null,
        devices: [deviceWith([reading("CONSUMPTION", 1.81)])],
        seriesRows: [
          { timestamp, dataSource: "CONSUMPTION", averagePower: 1.81, outOfRange: false },
        ],
      })),
    };

    const result = await new DashboardService(repository).getDashboard({ granularity: "minute" }, "user-1");

    expect(result.chart[0].generationPowerKw).toBeNull();
    expect(result.chart[0].consumptionPowerKw).toBe(1.81);
    expect(result.chart[0].powerBalanceKw).toBeNull();
    expect(result.metrics.powerBalance.value).toBeNull();
  });

  test("rechaza filtros desconocidos", async () => {
    const repository = { getDashboardData: jest.fn() };

    await expect(
      new DashboardService(repository).getDashboard({ range: "year", granularity: "second" }, "user-1"),
    ).rejects.toThrow();
    expect(repository.getDashboardData).not.toHaveBeenCalled();
  });
});
