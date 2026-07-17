const { createLoginRateLimit } = require("../../src/shared/middlewares/loginRateLimit");

function createResponse(statusCode = 401) {
  const listeners = {};
  return {
    statusCode,
    headers: {},
    body: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    on(event, listener) {
      listeners[event] = listener;
      return this;
    },
    finish() {
      listeners.finish?.();
    },
  };
}

describe("createLoginRateLimit", () => {
  test("bloquea intentos que superan el maximo y devuelve Retry-After", () => {
    let currentTime = 1_000;
    const middleware = createLoginRateLimit({
      windowMs: 60_000,
      maxAttempts: 2,
      now: () => currentTime,
    });
    const req = { ip: "127.0.0.1" };

    middleware(req, createResponse(), jest.fn());
    middleware(req, createResponse(), jest.fn());
    const blockedResponse = createResponse();
    const blockedNext = jest.fn();
    middleware(req, blockedResponse, blockedNext);

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.headers["Retry-After"]).toBe("60");
    expect(blockedNext).not.toHaveBeenCalled();

    currentTime += 60_001;
    const renewedNext = jest.fn();
    middleware(req, createResponse(), renewedNext);
    expect(renewedNext).toHaveBeenCalledTimes(1);
  });

  test("limpia los intentos despues de un login exitoso", () => {
    const middleware = createLoginRateLimit({ windowMs: 60_000, maxAttempts: 1 });
    const req = { ip: "127.0.0.2" };
    const successfulResponse = createResponse(200);

    middleware(req, successfulResponse, jest.fn());
    successfulResponse.finish();

    const nextAttempt = jest.fn();
    middleware(req, createResponse(), nextAttempt);
    expect(nextAttempt).toHaveBeenCalledTimes(1);
  });
});
