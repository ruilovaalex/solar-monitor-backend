const request = require("supertest");

const mockGetDashboard = jest.fn();

jest.mock("../../src/modules/dashboard/dashboard.service", () => ({
  DashboardService: jest.fn().mockImplementation(() => ({
    getDashboard: mockGetDashboard,
  })),
}));

jest.mock("../../src/shared/middlewares/rbac", () => ({
  attachUser: (req, res, next) => {
    req.user = { id: "user-1", permissions: ["dashboard:read"] };
    next();
  },
  authorize: () => (req, res, next) => next(),
  userWithRole: {},
  invalidateRbacUser: jest.fn(),
  clearRbacCache: jest.fn(),
}));

const { app } = require("../../src/app");

function dashboardResponse() {
  return {
    metrics: {
      generationPower: { id: "generationPower", label: "Generacion", value: 3.21, unit: "kW", status: "positive" },
      consumptionPower: { id: "consumptionPower", label: "Consumo", value: 1.81, unit: "kW", status: "positive" },
      powerBalance: { id: "powerBalance", label: "Balance", value: 1.4, unit: "kW", status: "positive" },
      connectedDevices: { id: "connectedDevices", label: "Dispositivos", value: 1, unit: "de 1", status: "positive" },
    },
    health: { status: "optimal", lastSync: timestamp, alerts: 0, onlineDevices: 1, totalDevices: 1 },
    chart: [],
  };
}

const timestamp = "2026-07-09T14:22:39.000Z";

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDashboard.mockResolvedValue(dashboardResponse());
  });

  test("responde sin query params y conserva el contrato", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      metrics: expect.any(Object),
      health: expect.any(Object),
      chart: expect.any(Array),
    }));
    expect(mockGetDashboard).toHaveBeenCalledWith({}, "user-1");
  });

  test("entrega range y granularity al servicio", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .query({ range: "24h", granularity: "minute" });

    expect(response.status).toBe(200);
    expect(mockGetDashboard).toHaveBeenCalledWith(
      { range: "24h", granularity: "minute" },
      "user-1",
    );
  });
});
