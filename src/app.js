const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { env } = require("./config/env");
const { attachUser } = require("./shared/middlewares/rbac");
const { errorHandler } = require("./shared/middlewares/errorHandler");
const { logger } = require("./shared/logger");
const { buildRoutes } = require("./routes");

function createApp() {
  const app = express();
  const routes = buildRoutes();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("combined", {
    stream: {
      write: (message) => logger.info("http_request", { raw: message.trim() }),
    },
  }));

  app.use(attachUser);

  app.use("/api", routes);

  app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
  });
  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = { createApp, app };
