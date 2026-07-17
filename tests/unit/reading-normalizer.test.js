const {
  normalizeDeviceReadings,
  normalizeDeviceReading,
} = require("../../src/modules/ingestion/reading-normalizer");

describe("normalizeDeviceReading", () => {
  test("acepta payload con potencia en espanol", () => {
    const result = normalizeDeviceReading({
      potencia: 100,
      dataSource: "GENERATION",
      timestamp: new Date(),
    });

    expect(result.power).toBe(100);
    expect(result.dataSource).toBe("GENERATION");
  });

  test("acepta payload con power en ingles", () => {
    const result = normalizeDeviceReading({
      power: 50,
      dataSource: "CONSUMPTION",
      timestamp: new Date(),
    });

    expect(result.power).toBe(50);
  });

  test("lanza error si no hay potencia ni energia", () => {
    expect(() =>
      normalizeDeviceReading({ dataSource: "GENERATION", timestamp: new Date() }),
    ).toThrow("potencia o energia");
  });

  test("normaliza dataSource en espanol", () => {
    const result = normalizeDeviceReading({
      power: 10,
      fuenteDatos: "generacion",
      timestamp: new Date(),
    });

    expect(result.dataSource).toBe("GENERATION");
  });

  test("normaliza dataSource en ingles", () => {
    const result = normalizeDeviceReading({
      power: 10,
      dataSource: "consumption",
      timestamp: new Date(),
    });

    expect(result.dataSource).toBe("CONSUMPTION");
  });
});

describe("normalizeDeviceReadings", () => {
  test("payload con generation y consumption separados retorna dos lecturas", () => {
    const payload = {
      generation: { power: 200, timestamp: new Date() },
      consumption: { power: 150, timestamp: new Date() },
    };

    const results = normalizeDeviceReadings(payload);

    expect(results).toHaveLength(2);
    expect(results.find((reading) => reading.dataSource === "GENERATION").power).toBe(200);
    expect(results.find((reading) => reading.dataSource === "CONSUMPTION").power).toBe(150);
  });

  test("payload plano con generationPower retorna una lectura de generacion", () => {
    const payload = { generationPower: 300, timestamp: new Date() };
    const results = normalizeDeviceReadings(payload);

    expect(results).toHaveLength(1);
    expect(results[0].dataSource).toBe("GENERATION");
    expect(results[0].power).toBe(300);
  });

  test("payload plano con consumptionPower retorna una lectura de consumo", () => {
    const payload = { consumptionPower: 120, timestamp: new Date() };
    const results = normalizeDeviceReadings(payload);

    expect(results).toHaveLength(1);
    expect(results[0].dataSource).toBe("CONSUMPTION");
  });

  test("payload plano con ambos campos retorna dos lecturas", () => {
    const payload = { generationPower: 300, consumptionPower: 120, timestamp: new Date() };
    const results = normalizeDeviceReadings(payload);

    expect(results).toHaveLength(2);
  });
});
