const request = require("supertest");
const { AppError } = require("../../src/shared/errors");

const mockLogin = jest.fn();

jest.mock("../../src/modules/auth/auth.service", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    login: mockLogin,
    me: jest.fn(),
  })),
}));

jest.mock("../../src/shared/audit", () => ({
  auditEvent: jest.fn().mockResolvedValue(undefined),
}));

const { app } = require("../../src/app");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({
      token: "token-demo",
      expiresAt: new Date().toISOString(),
      user: {
        id: "user-1",
        email: "admin@solarmonitor.local",
        role: "admin",
      },
    });
  });

  test("retorna 200 cuando las credenciales son validas", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@solarmonitor.local", password: "Solar123" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.headers).toHaveProperty("ratelimit-limit");
  });

  test("retorna 401 cuando el servicio rechaza las credenciales", async () => {
    mockLogin.mockRejectedValueOnce(new AppError("Credenciales incorrectas", 401));

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@solarmonitor.local", password: "mala-clave" });

    expect(response.status).toBe(401);
  });
});
