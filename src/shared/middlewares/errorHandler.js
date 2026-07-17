const { Prisma } = require("@prisma/client");
const { ZodError } = require("zod");
const { AppError } = require("../errors");
const { logger } = require("../logger");

function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Datos de entrada invalidos",
      details: error.issues,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un registro con esos datos unicos" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Registro no encontrado" });
    }
  }

  logger.error("Unhandled request error", {
    method: req.method,
    path: req.originalUrl,
    errorName: error.name,
    errorMessage: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
  return res.status(500).json({ message: "Error interno del servidor" });
}

module.exports = { errorHandler };
