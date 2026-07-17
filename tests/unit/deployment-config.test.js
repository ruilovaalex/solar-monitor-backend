describe("configuracion de despliegue", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalHost = process.env.HOST;
  const originalTrustProxy = process.env.TRUST_PROXY;

  afterEach(() => {
    jest.resetModules();
    restoreEnvironmentVariable("NODE_ENV", originalNodeEnv);
    restoreEnvironmentVariable("HOST", originalHost);
    restoreEnvironmentVariable("TRUST_PROXY", originalTrustProxy);
  });

  test("limita Express al loopback y confia solo en el proxy local en produccion", () => {
    process.env.NODE_ENV = "production";
    delete process.env.HOST;
    delete process.env.TRUST_PROXY;
    jest.resetModules();

    const { env } = require("../../src/config/env");
    const { createApp } = require("../../src/app");
    const app = createApp();

    expect(env.host).toBe("127.0.0.1");
    expect(env.trustProxy).toBe("loopback");
    expect(app.get("trust proxy")).toBe("loopback");
  });
});

function restoreEnvironmentVariable(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
