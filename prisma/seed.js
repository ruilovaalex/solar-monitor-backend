const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const seedDemoUsers = process.env.SEED_DEMO_USERS === "true";
const seedDemoDevices = process.env.SEED_DEMO_DEVICES === "true";
const seedDemoReadings = process.env.SEED_DEMO_READINGS === "true";

const systems = [
  { id: "sys-home", nombreSistema: "Residencial Norte", ubicacion: "Quito, EC", potenciaInstalada: 6.4 },
  { id: "sys-lab", nombreSistema: "Laboratorio Solar", ubicacion: "Guayaquil, EC", potenciaInstalada: 4.8 },
  { id: "sys-office", nombreSistema: "Oficina Central", ubicacion: "Cuenca, EC", potenciaInstalada: 9.2 },
];

const permissions = [
  ["perm_users_read", "users:read", "Consultar usuarios", "users"],
  ["perm_users_create", "users:create", "Crear usuarios", "users"],
  ["perm_users_update", "users:update", "Editar usuarios", "users"],
  ["perm_users_delete", "users:delete", "Eliminar usuarios", "users"],
  ["perm_systems_read", "systems:read", "Consultar sistemas fotovoltaicos", "systems"],
  ["perm_systems_create", "systems:create", "Crear sistemas fotovoltaicos", "systems"],
  ["perm_systems_update", "systems:update", "Editar sistemas fotovoltaicos", "systems"],
  ["perm_systems_delete", "systems:delete", "Eliminar sistemas fotovoltaicos", "systems"],
  ["perm_dashboard_read", "dashboard:read", "Consultar dashboard", "dashboard"],
  ["perm_history_read", "history:read", "Consultar historial", "history"],
  ["perm_stats_read", "stats:read", "Consultar estadisticas", "stats"],
  ["perm_comparisons_read", "comparisons:read", "Consultar comparaciones", "comparisons"],
  ["perm_settings_manage", "settings:manage", "Gestionar configuraciones", "settings"],
  ["perm_realtime_read", "realtime:read", "Consultar tiempo real", "realtime"],
  ["perm_ingestion_create", "ingestion:create", "Registrar lecturas simuladas o IoT", "ingestion"],
  ["perm_devices_read", "devices:read", "Consultar dispositivos", "devices"],
  ["perm_devices_create", "devices:create", "Registrar dispositivos IoT", "devices"],
  ["perm_monitoring_read", "monitoring:read", "Consultar configuracion de monitoreo", "monitoring"],
  ["perm_monitoring_manage", "monitoring:manage", "Modificar configuracion de monitoreo", "monitoring"],
];

const adminPermissions = new Set([
  "users:read",
  "users:create",
  "users:delete",
]);

const operatorPermissions = new Set([
  "systems:read",
  "dashboard:read",
  "history:read",
  "stats:read",
  "comparisons:read",
  "realtime:read",
  "devices:read",
  "devices:create",
  "monitoring:read",
  "monitoring:manage",
  "ingestion:create",
]);

async function syncRolePermissions(roleId, permissionKeys) {
  const permissionsToAssign = await prisma.permiso.findMany({
    where: { clave: { in: Array.from(permissionKeys) } },
    select: { id: true },
  });

  for (const permission of permissionsToAssign) {
    await prisma.rolPermiso.upsert({
      where: {
        rolId_permisoId: {
          rolId: roleId,
          permisoId: permission.id,
        },
      },
      update: {},
      create: {
        rolId: roleId,
        permisoId: permission.id,
      },
    });
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function simulatedReading(system, date) {
  const hour = date.getHours() + date.getMinutes() / 60;
  const daylightFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const capacity = Number(system.potenciaInstalada);
  const power = Number((capacity * daylightFactor * (0.78 + ((date.getMinutes() % 13) / 100))).toFixed(3));
  const generated = Number(((power * 3) / 3600).toFixed(3));
  const consumptionPower = 0.7 + Math.sin((hour / 24) * Math.PI * 2) * 0.25 + (hour > 18 ? 0.7 : 0);
  const consumed = Number(((Math.max(consumptionPower, 0.4) * 3) / 3600).toFixed(3));
  const balance = Number((generated - consumed).toFixed(3));

  return {
    sistemaId: system.id,
    energiaGenerada: generated,
    energiaConsumida: consumed,
    potenciaInstantanea: power,
    balanceEnergetico: balance,
    timestamp: date,
  };
}

async function seedUsers() {
  await prisma.rol.upsert({
    where: { nombre: "ADMIN" },
    update: { descripcion: "Administrador de usuarios", activo: true },
    create: {
      id: "role_admin",
      nombre: "ADMIN",
      descripcion: "Administrador de usuarios",
      activo: true,
    },
  });

  await prisma.rol.upsert({
    where: { nombre: "OPERADOR" },
    update: { descripcion: "Usuario de monitoreo energetico", activo: true },
    create: {
      id: "role_operador",
      nombre: "OPERADOR",
      descripcion: "Usuario de monitoreo energetico",
      activo: true,
    },
  });

  for (const [id, clave, descripcion, modulo] of permissions) {
    await prisma.permiso.upsert({
      where: { clave },
      update: { descripcion, modulo },
      create: { id, clave, descripcion, modulo },
    });
  }

  await syncRolePermissions("role_admin", adminPermissions);
  await syncRolePermissions("role_operador", operatorPermissions);

  if (!seedDemoUsers) {
    return;
  }

  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error("SEED_DEMO_PASSWORD es obligatoria y debe tener al menos 8 caracteres cuando SEED_DEMO_USERS=true.");
  }
  const password = await bcrypt.hash(demoPassword, 10);

  await prisma.usuario.upsert({
    where: { email: "admin@solarmonitor.local" },
    update: { roleId: "role_admin" },
    create: {
      id: "usr_admin",
      nombre: "Administrador Solar",
      email: "admin@solarmonitor.local",
      password,
      roleId: "role_admin",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "operador@solarmonitor.local" },
    update: { roleId: "role_operador" },
    create: {
      id: "usr_operator",
      nombre: "Operador Energia",
      email: "operador@solarmonitor.local",
      password,
      roleId: "role_operador",
    },
  });
}

async function seedDevices() {
  if (!seedDemoDevices) {
    return;
  }

  const owner = await prisma.usuario.findUnique({
    where: { email: "operador@solarmonitor.local" },
  });
  if (!owner) {
    throw new Error("SEED_DEMO_DEVICES requiere crear primero el usuario operador demo");
  }

  const devices = [
    {
      id: "dev-esp32",
      nombre: "Medidor ESP32",
      tipo: "ESP32",
      modelo: "ESP32",
      fuenteDatos: "BIDIRECTIONAL",
      intervaloMuestreoSegundos: 5,
      key: "ESP32-DEMO-KEY",
    },
    {
      id: "dev-raspberry",
      nombre: "Raspberry Pi",
      tipo: "RASPBERRY",
      modelo: "Raspberry Pi",
      fuenteDatos: "BIDIRECTIONAL",
      intervaloMuestreoSegundos: 5,
      key: "RASPBERRY-DEMO-KEY",
    },
  ];

  for (const device of devices) {
    const claveIngestaHash = await bcrypt.hash(device.key, 10);
    await prisma.dispositivo.upsert({
      where: { id: device.id },
      update: {
        usuarioId: owner.id,
        nombre: device.nombre,
        tipo: device.tipo,
        modelo: device.modelo,
        fuenteDatos: device.fuenteDatos,
        intervaloMuestreoSegundos: device.intervaloMuestreoSegundos,
        claveIngestaHash,
        activo: true,
      },
      create: {
        id: device.id,
        usuarioId: owner.id,
        nombre: device.nombre,
        tipo: device.tipo,
        modelo: device.modelo,
        fuenteDatos: device.fuenteDatos,
        intervaloMuestreoSegundos: device.intervaloMuestreoSegundos,
        claveIngestaHash,
      },
    });
  }
}

async function seedMonitoringConfig() {
  const owner = await prisma.usuario.findUnique({
    where: { email: "operador@solarmonitor.local" },
  });
  if (!owner) return;

  await prisma.configuracionMonitoreo.upsert({
    where: { usuarioId: owner.id },
    update: {},
    create: { usuarioId: owner.id },
  });
}

async function seedSystems() {
  if (!seedDemoReadings) {
    return;
  }

  for (const system of systems) {
    await prisma.sistemaFotovoltaico.upsert({
      where: { id: system.id },
      update: system,
      create: system,
    });
  }
}

async function seedReadings() {
  if (!seedDemoReadings) {
    return;
  }

  await prisma.historialLectura.deleteMany();
  await prisma.datosTiempoReal.deleteMany();
  await prisma.resumenDiario.deleteMany();
  await prisma.resumenMensual.deleteMany();

  const now = new Date();
  const days = 35;
  const intervalMinutes = 15;

  for (const system of systems) {
    const readings = [];

    for (let day = days - 1; day >= 0; day -= 1) {
      for (let minute = 0; minute < 24 * 60; minute += intervalMinutes) {
        const timestamp = new Date(startOfDay(now).getTime() - day * 24 * 60 * 60 * 1000 + minute * 60 * 1000);
        readings.push(simulatedReading(system, timestamp));
      }
    }

    await prisma.historialLectura.createMany({ data: readings });

    const latest = readings[readings.length - 1];
    await prisma.datosTiempoReal.create({
      data: {
        sistemaId: latest.sistemaId,
        energiaGenerada: latest.energiaGenerada,
        energiaConsumida: latest.energiaConsumida,
        potenciaInstantanea: latest.potenciaInstantanea,
        balanceEnergetico: latest.balanceEnergetico,
        fechaLectura: latest.timestamp,
      },
    });

    const dailyMap = new Map();
    const monthlyMap = new Map();

    for (const reading of readings) {
      const dayKey = startOfDay(reading.timestamp).toISOString();
      const monthKey = `${reading.timestamp.getFullYear()}-${reading.timestamp.getMonth() + 1}`;

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { generated: 0, consumed: 0, balance: 0, fecha: startOfDay(reading.timestamp) });
      }
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          generated: 0,
          consumed: 0,
          balance: 0,
          mes: reading.timestamp.getMonth() + 1,
          anio: reading.timestamp.getFullYear(),
        });
      }

      const daily = dailyMap.get(dayKey);
      daily.generated += reading.energiaGenerada;
      daily.consumed += reading.energiaConsumida;
      daily.balance += reading.balanceEnergetico;

      const monthly = monthlyMap.get(monthKey);
      monthly.generated += reading.energiaGenerada;
      monthly.consumed += reading.energiaConsumida;
      monthly.balance += reading.balanceEnergetico;
    }

    await prisma.resumenDiario.createMany({
      data: Array.from(dailyMap.values()).map((item) => ({
        sistemaId: system.id,
        fecha: item.fecha,
        energiaGeneradaTotal: Number(item.generated.toFixed(3)),
        energiaConsumidaTotal: Number(item.consumed.toFixed(3)),
        balanceTotal: Number(item.balance.toFixed(3)),
      })),
    });

    await prisma.resumenMensual.createMany({
      data: Array.from(monthlyMap.values()).map((item) => ({
        sistemaId: system.id,
        mes: item.mes,
        anio: item.anio,
        energiaGeneradaTotal: Number(item.generated.toFixed(3)),
        energiaConsumidaTotal: Number(item.consumed.toFixed(3)),
        balanceTotal: Number(item.balance.toFixed(3)),
      })),
    });
  }
}

async function main() {
  await seedUsers();
  await seedMonitoringConfig();
  await seedDevices();
  await seedSystems();
  const existingReadings = await prisma.historialLectura.count();
  if (existingReadings === 0 || process.env.SEED_DEMO_READINGS === "true") {
    await seedReadings();
  }
  console.log("Seed completado: RBAC y configuracion base disponibles.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
