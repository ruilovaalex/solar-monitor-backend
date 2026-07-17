const request = require("supertest");
const { app } = require("../../src/app");

describe("Alcance de rutas del MVP", () => {
  test("publica health unicamente bajo el prefijo api", async () => {
    const canonical = await request(app).get("/api/health");
    const duplicate = await request(app).get("/health");

    expect(canonical.status).toBe(200);
    expect(canonical.body.status).toBe("ok");
    expect(duplicate.status).toBe(404);
  });

  test("no publica rutas funcionales sin el prefijo api", async () => {
    const response = await request(app).get("/dashboard");
    expect(response.status).toBe(404);
  });

  test.each([
    ["GET", "/api/systems"],
    ["GET", "/api/stats/daily"],
    ["GET", "/api/comparisons"],
    ["GET", "/api/history"],
    ["GET", "/api/realtime"],
    ["POST", "/api/ingestion/readings"],
  ])("mantiene desactivada la ruta legacy %s %s", async (method, path) => {
    const response = await request(app)[method.toLowerCase()](path);
    expect(response.status).toBe(404);
  });

  test.each([
    "/api/history/devices",
    "/api/realtime/devices",
    "/api/statistics",
  ])("mantiene publicada la ruta actual %s", async (path) => {
    const response = await request(app).get(path);
    expect(response.status).toBe(401);
  });

  test("mantiene publicada la ingesta actual por dispositivo", async () => {
    const response = await request(app)
      .post("/api/ingestion/devices/device-test/readings")
      .send({});

    expect(response.status).toBe(401);
  });
});
