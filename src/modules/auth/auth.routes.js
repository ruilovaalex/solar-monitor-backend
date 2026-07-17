const { Router } = require("express");
const { authorize } = require("../../shared/middlewares/rbac");
const { AuthRepository } = require("./auth.repository");
const { AuthService } = require("./auth.service");
const { AuthController } = require("./auth.controller");
const { env } = require("../../config/env");
const { createLoginRateLimit } = require("../../shared/middlewares/loginRateLimit");

const router = Router();
const controller = new AuthController(new AuthService(new AuthRepository()));
const loginRateLimit = createLoginRateLimit({
  windowMs: env.loginRateLimitWindowMs,
  maxAttempts: env.loginRateLimitMax,
});

router.post("/login", loginRateLimit, controller.login);
router.get("/me", authorize(null), controller.me);

module.exports = { authRoutes: router };
