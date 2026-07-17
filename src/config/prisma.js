const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error", "warn"],
});

module.exports = { prisma };
