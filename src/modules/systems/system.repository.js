const { prisma } = require("../../config/prisma");

function systemInclude() {
  return {
    datoTiempoReal: true,
    resumenesDiarios: { orderBy: { fecha: "desc" }, take: 1 },
    resumenesMensuales: { orderBy: [{ anio: "desc" }, { mes: "desc" }], take: 1 },
  };
}

class SystemRepository {
  findAll() {
    return prisma.sistemaFotovoltaico.findMany({
      include: systemInclude(),
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id) {
    return prisma.sistemaFotovoltaico.findUnique({
      where: { id },
      include: systemInclude(),
    });
  }

  create(data) {
    return prisma.sistemaFotovoltaico.create({ data, include: systemInclude() });
  }

  update(id, data) {
    return prisma.sistemaFotovoltaico.update({ where: { id }, data, include: systemInclude() });
  }

  delete(id) {
    return prisma.sistemaFotovoltaico.delete({ where: { id } });
  }
}

module.exports = { SystemRepository };
