-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('ESP32', 'RASPBERRY', 'OTHER');

-- CreateEnum
CREATE TYPE "DataSourceType" AS ENUM ('GENERATION', 'CONSUMPTION', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DISABLED');

-- CreateEnum
CREATE TYPE "IngestionProtocol" AS ENUM ('HTTP_REST', 'MQTT', 'WEBSOCKET', 'TCP', 'LORA', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "HistoryReason" AS ENUM ('INITIAL', 'AVERAGE_CHANGE', 'OUT_OF_RANGE', 'REGULAR_INTERVAL', 'MANUAL_IMPORT');

-- CreateEnum
CREATE TYPE "SummaryGranularity" AS ENUM ('HOUR', 'DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'INGEST', 'CONFIG_CHANGE', 'RBAC_CHANGE', 'DEVICE_REGISTER');

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permisos" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolesPermisos" (
    "rolId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolesPermisos_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "SistemasFotovoltaicos" (
    "id" TEXT NOT NULL,
    "nombreSistema" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "potenciaInstalada" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SistemasFotovoltaicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosTiempoReal" (
    "id" TEXT NOT NULL,
    "sistemaId" TEXT NOT NULL,
    "energiaGenerada" DECIMAL(12,3) NOT NULL,
    "energiaConsumida" DECIMAL(12,3) NOT NULL,
    "potenciaInstantanea" DECIMAL(12,3) NOT NULL,
    "balanceEnergetico" DECIMAL(12,3) NOT NULL,
    "fechaLectura" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosTiempoReal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialLecturas" (
    "id" BIGSERIAL NOT NULL,
    "sistemaId" TEXT NOT NULL,
    "energiaGenerada" DECIMAL(12,3) NOT NULL,
    "energiaConsumida" DECIMAL(12,3) NOT NULL,
    "potenciaInstantanea" DECIMAL(12,3) NOT NULL,
    "balanceEnergetico" DECIMAL(12,3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistorialLecturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumenDiario" (
    "id" BIGSERIAL NOT NULL,
    "sistemaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "energiaGeneradaTotal" DECIMAL(14,3) NOT NULL,
    "energiaConsumidaTotal" DECIMAL(14,3) NOT NULL,
    "balanceTotal" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "ResumenDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumenMensual" (
    "id" BIGSERIAL NOT NULL,
    "sistemaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "energiaGeneradaTotal" DECIMAL(14,3) NOT NULL,
    "energiaConsumidaTotal" DECIMAL(14,3) NOT NULL,
    "balanceTotal" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "ResumenMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispositivos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "DeviceType" NOT NULL,
    "modelo" TEXT NOT NULL,
    "fuenteDatos" "DataSourceType" NOT NULL,
    "estado" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "ultimoContacto" TIMESTAMP(3),
    "intervaloMuestreoSegundos" INTEGER NOT NULL DEFAULT 5,
    "claveIngestaHash" TEXT NOT NULL,
    "metadata" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturasDispositivos" (
    "id" BIGSERIAL NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "fuenteDatos" "DataSourceType" NOT NULL,
    "protocolo" "IngestionProtocol" NOT NULL DEFAULT 'HTTP_REST',
    "voltaje" DECIMAL(12,3),
    "corriente" DECIMAL(12,3),
    "potencia" DECIMAL(12,3),
    "energia" DECIMAL(14,3),
    "promedioReferencia" DECIMAL(12,3),
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LecturasDispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuestrasTemporalesDispositivos" (
    "id" BIGSERIAL NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "potencia" DECIMAL(12,3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuestrasTemporalesDispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UltimasLecturasDispositivos" (
    "id" TEXT NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "fuenteDatos" "DataSourceType" NOT NULL,
    "voltaje" DECIMAL(12,3),
    "corriente" DECIMAL(12,3),
    "potencia" DECIMAL(12,3),
    "energia" DECIMAL(14,3),
    "promedioReferencia" DECIMAL(12,3),
    "fueraRango" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "fechaLectura" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UltimasLecturasDispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialDispositivos" (
    "id" BIGSERIAL NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "lecturaId" BIGINT,
    "fuenteDatos" "DataSourceType" NOT NULL,
    "voltaje" DECIMAL(12,3),
    "corriente" DECIMAL(12,3),
    "potencia" DECIMAL(12,3),
    "energia" DECIMAL(14,3),
    "promedioReferencia" DECIMAL(12,3),
    "fueraRango" BOOLEAN NOT NULL DEFAULT false,
    "motivoGuardado" "HistoryReason" NOT NULL,
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistorialDispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionMonitoreo" (
    "id" TEXT NOT NULL DEFAULT 'monitoring_default',
    "ventanaPromedioMinutos" INTEGER NOT NULL DEFAULT 15,
    "desviacionSuperiorPuntos" DECIMAL(12,3) NOT NULL DEFAULT 4,
    "desviacionInferiorPuntos" DECIMAL(12,3) NOT NULL DEFAULT 4,
    "intervaloGuardadoNormalMinutos" INTEGER NOT NULL DEFAULT 15,
    "intervaloGuardadoAnomaliaSegundos" INTEGER NOT NULL DEFAULT 10,
    "cambioSignificativoPuntos" DECIMAL(12,3) NOT NULL DEFAULT 0.25,
    "retencionLecturasDias" INTEGER NOT NULL DEFAULT 90,
    "retencionHistorialDias" INTEGER NOT NULL DEFAULT 730,
    "retencionResumenesMeses" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionMonitoreo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumenDispositivos" (
    "id" BIGSERIAL NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "fuenteDatos" "DataSourceType" NOT NULL,
    "granularidad" "SummaryGranularity" NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "promedioPotencia" DECIMAL(12,3) NOT NULL,
    "minimoPotencia" DECIMAL(12,3) NOT NULL,
    "maximoPotencia" DECIMAL(12,3) NOT NULL,
    "muestras" INTEGER NOT NULL DEFAULT 0,
    "fueraRango" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumenDispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherStations" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherStations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" BIGSERIAL NOT NULL,
    "usuarioId" TEXT,
    "accion" "AuditAction" NOT NULL,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT,
    "ip" TEXT,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherReadings" (
    "id" BIGSERIAL NOT NULL,
    "weatherStationId" TEXT NOT NULL,
    "temperatura" DECIMAL(8,3),
    "humedad" DECIMAL(8,3),
    "irradiancia" DECIMAL(10,3),
    "velocidadViento" DECIMAL(10,3),
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherReadings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_email_key" ON "Usuarios"("email");

-- CreateIndex
CREATE INDEX "Usuarios_roleId_idx" ON "Usuarios"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_nombre_key" ON "Roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permisos_clave_key" ON "Permisos"("clave");

-- CreateIndex
CREATE INDEX "Permisos_modulo_idx" ON "Permisos"("modulo");

-- CreateIndex
CREATE INDEX "RolesPermisos_permisoId_idx" ON "RolesPermisos"("permisoId");

-- CreateIndex
CREATE INDEX "SistemasFotovoltaicos_ubicacion_idx" ON "SistemasFotovoltaicos"("ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "DatosTiempoReal_sistemaId_key" ON "DatosTiempoReal"("sistemaId");

-- CreateIndex
CREATE INDEX "DatosTiempoReal_fechaLectura_idx" ON "DatosTiempoReal"("fechaLectura");

-- CreateIndex
CREATE INDEX "HistorialLecturas_sistemaId_timestamp_idx" ON "HistorialLecturas"("sistemaId", "timestamp");

-- CreateIndex
CREATE INDEX "HistorialLecturas_timestamp_idx" ON "HistorialLecturas"("timestamp");

-- CreateIndex
CREATE INDEX "ResumenDiario_fecha_idx" ON "ResumenDiario"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ResumenDiario_sistemaId_fecha_key" ON "ResumenDiario"("sistemaId", "fecha");

-- CreateIndex
CREATE INDEX "ResumenMensual_anio_mes_idx" ON "ResumenMensual"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "ResumenMensual_sistemaId_mes_anio_key" ON "ResumenMensual"("sistemaId", "mes", "anio");

-- CreateIndex
CREATE INDEX "Dispositivos_activo_estado_idx" ON "Dispositivos"("activo", "estado");

-- CreateIndex
CREATE INDEX "Dispositivos_activo_fuenteDatos_idx" ON "Dispositivos"("activo", "fuenteDatos");

-- CreateIndex
CREATE INDEX "Dispositivos_tipo_activo_idx" ON "Dispositivos"("tipo", "activo");

-- CreateIndex
CREATE INDEX "LecturasDispositivos_dispositivoId_timestamp_idx" ON "LecturasDispositivos"("dispositivoId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "LecturasDispositivos_fuenteDatos_timestamp_idx" ON "LecturasDispositivos"("fuenteDatos", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "MuestrasTemporalesDispositivos_dispositivoId_timestamp_idx" ON "MuestrasTemporalesDispositivos"("dispositivoId", "timestamp");

-- CreateIndex
CREATE INDEX "UltimasLecturasDispositivos_fuenteDatos_fechaLectura_idx" ON "UltimasLecturasDispositivos"("fuenteDatos", "fechaLectura" DESC);

-- CreateIndex
CREATE INDEX "UltimasLecturasDispositivos_fechaLectura_idx" ON "UltimasLecturasDispositivos"("fechaLectura" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UltimasLecturasDispositivos_dispositivoId_fuenteDatos_key" ON "UltimasLecturasDispositivos"("dispositivoId", "fuenteDatos");

-- CreateIndex
CREATE UNIQUE INDEX "HistorialDispositivos_lecturaId_key" ON "HistorialDispositivos"("lecturaId");

-- CreateIndex
CREATE INDEX "HistorialDispositivos_dispositivoId_timestamp_idx" ON "HistorialDispositivos"("dispositivoId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "HistorialDispositivos_fuenteDatos_timestamp_idx" ON "HistorialDispositivos"("fuenteDatos", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "HistorialDispositivos_timestamp_idx" ON "HistorialDispositivos"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "ResumenDispositivos_granularidad_periodoInicio_idx" ON "ResumenDispositivos"("granularidad", "periodoInicio" DESC);

-- CreateIndex
CREATE INDEX "ResumenDispositivos_fuenteDatos_granularidad_periodoInicio_idx" ON "ResumenDispositivos"("fuenteDatos", "granularidad", "periodoInicio" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ResumenDispositivos_dispositivoId_granularidad_periodoInici_key" ON "ResumenDispositivos"("dispositivoId", "granularidad", "periodoInicio");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_createdAt_idx" ON "Auditoria"("usuarioId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Auditoria_tabla_registroId_idx" ON "Auditoria"("tabla", "registroId");

-- CreateIndex
CREATE INDEX "Auditoria_accion_createdAt_idx" ON "Auditoria"("accion", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Auditoria_createdAt_idx" ON "Auditoria"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "WeatherReadings_weatherStationId_timestamp_idx" ON "WeatherReadings"("weatherStationId", "timestamp");

-- CreateIndex
CREATE INDEX "WeatherReadings_timestamp_idx" ON "WeatherReadings"("timestamp");

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesPermisos" ADD CONSTRAINT "RolesPermisos_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesPermisos" ADD CONSTRAINT "RolesPermisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosTiempoReal" ADD CONSTRAINT "DatosTiempoReal_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "SistemasFotovoltaicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialLecturas" ADD CONSTRAINT "HistorialLecturas_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "SistemasFotovoltaicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumenDiario" ADD CONSTRAINT "ResumenDiario_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "SistemasFotovoltaicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumenMensual" ADD CONSTRAINT "ResumenMensual_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "SistemasFotovoltaicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturasDispositivos" ADD CONSTRAINT "LecturasDispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuestrasTemporalesDispositivos" ADD CONSTRAINT "MuestrasTemporalesDispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltimasLecturasDispositivos" ADD CONSTRAINT "UltimasLecturasDispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialDispositivos" ADD CONSTRAINT "HistorialDispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialDispositivos" ADD CONSTRAINT "HistorialDispositivos_lecturaId_fkey" FOREIGN KEY ("lecturaId") REFERENCES "LecturasDispositivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumenDispositivos" ADD CONSTRAINT "ResumenDispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherReadings" ADD CONSTRAINT "WeatherReadings_weatherStationId_fkey" FOREIGN KEY ("weatherStationId") REFERENCES "WeatherStations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostgreSQL hardening for Solar Monitor IoT workloads.
-- These checks and indexes keep the baseline production-ready without requiring db push.
ALTER TABLE "Dispositivos"
  ADD CONSTRAINT "Dispositivos_intervaloMuestreo_check"
  CHECK ("intervaloMuestreoSegundos" BETWEEN 1 AND 3600);

ALTER TABLE "LecturasDispositivos"
  ADD CONSTRAINT "LecturasDispositivos_medicion_check"
  CHECK ("potencia" IS NOT NULL OR "energia" IS NOT NULL);

ALTER TABLE "LecturasDispositivos"
  ADD CONSTRAINT "LecturasDispositivos_no_negativos_check"
  CHECK (
    ("voltaje" IS NULL OR "voltaje" >= 0) AND
    ("corriente" IS NULL OR "corriente" >= 0) AND
    ("potencia" IS NULL OR "potencia" >= 0) AND
    ("energia" IS NULL OR "energia" >= 0)
  );

ALTER TABLE "UltimasLecturasDispositivos"
  ADD CONSTRAINT "UltimasLecturasDispositivos_medicion_check"
  CHECK ("potencia" IS NOT NULL OR "energia" IS NOT NULL);

ALTER TABLE "HistorialDispositivos"
  ADD CONSTRAINT "HistorialDispositivos_medicion_check"
  CHECK ("potencia" IS NOT NULL OR "energia" IS NOT NULL);

ALTER TABLE "MuestrasTemporalesDispositivos"
  ADD CONSTRAINT "MuestrasTemporalesDispositivos_potencia_check"
  CHECK ("potencia" >= 0);

ALTER TABLE "ResumenDispositivos"
  ADD CONSTRAINT "ResumenDispositivos_metricas_check"
  CHECK (
    "muestras" > 0 AND
    "minimoPotencia" <= "promedioPotencia" AND
    "promedioPotencia" <= "maximoPotencia"
  );

ALTER TABLE "ConfiguracionMonitoreo"
  ADD CONSTRAINT "ConfiguracionMonitoreo_retencion_check"
  CHECK (
    "ventanaPromedioMinutos" BETWEEN 1 AND 1440 AND
    "intervaloGuardadoNormalMinutos" BETWEEN 1 AND 1440 AND
    "intervaloGuardadoAnomaliaSegundos" BETWEEN 1 AND 3600 AND
    "retencionLecturasDias" > 0 AND
    "retencionHistorialDias" > 0 AND
    "retencionResumenesMeses" > 0
  );

CREATE INDEX "LecturasDispositivos_timestamp_brin_idx"
  ON "LecturasDispositivos" USING BRIN ("timestamp") WITH (pages_per_range = 64);

CREATE INDEX "HistorialDispositivos_timestamp_brin_idx"
  ON "HistorialDispositivos" USING BRIN ("timestamp") WITH (pages_per_range = 64);

CREATE INDEX "HistorialDispositivos_anomalias_timestamp_idx"
  ON "HistorialDispositivos" ("timestamp" DESC)
  WHERE "fueraRango" = true;

CREATE INDEX "Auditoria_createdAt_brin_idx"
  ON "Auditoria" USING BRIN ("createdAt") WITH (pages_per_range = 64);
