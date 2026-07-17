const { createApp } = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/prisma");
const { startSimulator } = require("./modules/ingestion/simulator");

const app = createApp();
const simulator = startSimulator();

const server = app.listen(env.port, () => {
  console.log(`Solar Monitor API escuchando en http://localhost:${env.port}`);
});

async function shutdown() {
  if (simulator) clearInterval(simulator);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
