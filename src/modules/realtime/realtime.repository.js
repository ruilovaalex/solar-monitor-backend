const { prisma } = require("../../config/prisma");

class RealtimeRepository {
  findAll() {
    return prisma.datosTiempoReal.findMany({
      include: { sistema: true },
      orderBy: { fechaLectura: "desc" },
    });
  }

  findBySystemId(sistemaId) {
    return prisma.datosTiempoReal.findUnique({
      where: { sistemaId },
      include: { sistema: true },
    });
  }

  findDeviceRealtime(userId) {
    return prisma.ultimaLecturaDispositivo.findMany({
      where: { dispositivo: { usuarioId: userId } },
      include: {
        dispositivo: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            estado: true,
            ultimoContacto: true,
            intervaloMuestreoSegundos: true,
          },
        },
      },
      orderBy: { fechaLectura: "desc" },
    });
  }
}

module.exports = { RealtimeRepository };
