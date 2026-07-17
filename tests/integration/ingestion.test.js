const request = require("supertest");
const { AppError } = require("../../src/shared/errors");

const mockIngest = jest.fn();

jest.mock("../../src/modules/ingestion/device-ingestion.service", () => ({
  DeviceIngestionService: jest.fn().mockImplementation(() => ({
    ingest: mockIngest,
  })),
}));

jest.mock("../../src/shared/audit", () => ({
  auditEvent: jest.fn().mockResolvedValue(undefined),
}));

const { app } = require("../../src/app");

describe("POST /api/ingestion/devices/:deviceId/readings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIngest.mockResolvedValue({
      deviceId: "dev-1",
      dataSource: "GENERATION",
      protocol: "HTTP_REST",
      analysis: { outOfRange: false },
      storage: { rawReadingId: "1", stored: true },
      processedReadings: 1,
      readings: [
        {
          dataSource: "GENERATION",
          reading: { power: 200 },
          analysis: {},
          storage: { stored: true },
        },
      ],
    });
  });

  test("retorna 202 con datos validos", async () => {
    const response = await request(app)
      .post("/api/ingestion/devices/dev-1/readings")
      .set("x-device-key", "clave-test")
      .send({ power: 200, dataSource: "GENERATION", timestamp: new Date().toISOString() });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty("processedReadings");
  });

  test("retorna 401 si falta la clave del dispositivo", async () => {
    mockIngest.mockRejectedValueOnce(new AppError("Falta la clave del dispositivo", 401));

    const response = await request(app)
      .post("/api/ingestion/devices/dev-1/readings")
      .send({ power: 200, dataSource: "GENERATION" });

    expect(response.status).toBe(401);
  });
});
