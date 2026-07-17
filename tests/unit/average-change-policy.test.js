const {
  hasSignificantAverageChange,
  buildStorageDecision,
} = require("../../src/modules/ingestion/average-change-policy");

describe("hasSignificantAverageChange", () => {
  test("retorna false si no hay promedio anterior", () => {
    expect(
      hasSignificantAverageChange({ average: 100, previousAverage: null, threshold: 0.25 }),
    ).toBe(false);
  });

  test("retorna false si el cambio es menor al umbral", () => {
    expect(
      hasSignificantAverageChange({ average: 100.1, previousAverage: 100, threshold: 0.25 }),
    ).toBe(false);
  });

  test("retorna true si el cambio supera el umbral", () => {
    expect(
      hasSignificantAverageChange({ average: 101, previousAverage: 100, threshold: 0.25 }),
    ).toBe(true);
  });

  test("retorna false si average es null", () => {
    expect(
      hasSignificantAverageChange({ average: null, previousAverage: 100, threshold: 0.25 }),
    ).toBe(false);
  });
});

describe("buildStorageDecision", () => {
  const baseConfig = {
    intervaloGuardadoNormalMinutos: 15,
    intervaloGuardadoAnomaliaSegundos: 10,
  };
  const now = new Date();

  test("debe guardar si no hay lectura previa", () => {
    const decision = buildStorageDecision({
      lastStored: null,
      readingTimestamp: now,
      outOfRange: false,
      config: baseConfig,
      significantAverageChange: false,
    });

    expect(decision.shouldStore).toBe(true);
    expect(decision.reason).toBe("INITIAL");
  });

  test("debe guardar si esta fuera de rango", () => {
    const lastStored = { timestamp: now };
    const decision = buildStorageDecision({
      lastStored,
      readingTimestamp: new Date(now.getTime() + 1000),
      outOfRange: true,
      config: baseConfig,
      significantAverageChange: false,
    });

    expect(decision.shouldStore).toBe(true);
    expect(decision.reason).toBe("OUT_OF_RANGE");
  });

  test("debe guardar si cambio de promedio es significativo", () => {
    const lastStored = { timestamp: now };
    const decision = buildStorageDecision({
      lastStored,
      readingTimestamp: new Date(now.getTime() + 1000),
      outOfRange: false,
      config: baseConfig,
      significantAverageChange: true,
    });

    expect(decision.shouldStore).toBe(true);
    expect(decision.reason).toBe("AVERAGE_CHANGE");
  });

  test("no debe guardar si el intervalo normal no ha pasado", () => {
    const lastStored = { timestamp: now };
    const decision = buildStorageDecision({
      lastStored,
      readingTimestamp: new Date(now.getTime() + 5 * 60 * 1000),
      outOfRange: false,
      config: baseConfig,
      significantAverageChange: false,
    });

    expect(decision.shouldStore).toBe(false);
  });

  test("debe guardar si paso el intervalo normal", () => {
    const lastStored = { timestamp: now };
    const decision = buildStorageDecision({
      lastStored,
      readingTimestamp: new Date(now.getTime() + 16 * 60 * 1000),
      outOfRange: false,
      config: baseConfig,
      significantAverageChange: false,
    });

    expect(decision.shouldStore).toBe(true);
    expect(decision.reason).toBe("REGULAR_INTERVAL");
  });
});
