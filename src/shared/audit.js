const { prisma } = require("../config/prisma");
const { logger } = require("./logger");

async function auditEvent({ userId = null, action, table, recordId = null, ip = null, detail = undefined }) {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: action,
        tabla: table,
        registroId: recordId,
        ip,
        detalle: detail,
      },
    });
  } catch (error) {
    logger.warn("Audit event could not be persisted", {
      action,
      table,
      recordId,
      errorMessage: error.message,
    });
  }
}

module.exports = { auditEvent };
