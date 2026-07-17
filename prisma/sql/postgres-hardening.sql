-- PostgreSQL hardening for Solar Monitor IoT workloads.
-- Safe to run more than once: duplicate constraints are ignored by the DO blocks.

DO $$ BEGIN
  ALTER TABLE "Dispositivos"
    ADD CONSTRAINT "Dispositivos_intervaloMuestreo_check"
    CHECK ("intervaloMuestreoSegundos" BETWEEN 1 AND 3600);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LecturasDispositivos"
    ADD CONSTRAINT "LecturasDispositivos_medicion_check"
    CHECK ("potencia" IS NOT NULL OR "energia" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LecturasDispositivos"
    ADD CONSTRAINT "LecturasDispositivos_no_negativos_check"
    CHECK (
      ("voltaje" IS NULL OR "voltaje" >= 0) AND
      ("corriente" IS NULL OR "corriente" >= 0) AND
      ("potencia" IS NULL OR "potencia" >= 0) AND
      ("energia" IS NULL OR "energia" >= 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LecturasUnificadas"
    ADD CONSTRAINT "LecturasUnificadas_medicion_check"
    CHECK (
      "potenciaGeneracion" IS NOT NULL OR
      "potenciaConsumo" IS NOT NULL OR
      "energiaGeneracion" IS NOT NULL OR
      "energiaConsumo" IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LecturasUnificadas"
    ADD CONSTRAINT "LecturasUnificadas_no_negativos_check"
    CHECK (
      ("voltaje" IS NULL OR "voltaje" >= 0) AND
      ("corriente" IS NULL OR "corriente" >= 0) AND
      ("potenciaGeneracion" IS NULL OR "potenciaGeneracion" >= 0) AND
      ("potenciaConsumo" IS NULL OR "potenciaConsumo" >= 0) AND
      ("energiaGeneracion" IS NULL OR "energiaGeneracion" >= 0) AND
      ("energiaConsumo" IS NULL OR "energiaConsumo" >= 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UltimasLecturasDispositivos"
    ADD CONSTRAINT "UltimasLecturasDispositivos_medicion_check"
    CHECK ("potencia" IS NOT NULL OR "energia" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "HistorialDispositivos"
    ADD CONSTRAINT "HistorialDispositivos_medicion_check"
    CHECK ("potencia" IS NOT NULL OR "energia" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MuestrasTemporalesDispositivos"
    ADD CONSTRAINT "MuestrasTemporalesDispositivos_potencia_check"
    CHECK ("potencia" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ResumenDispositivos"
    ADD CONSTRAINT "ResumenDispositivos_metricas_check"
    CHECK (
      "muestras" > 0 AND
      "minimoPotencia" <= "promedioPotencia" AND
      "promedioPotencia" <= "maximoPotencia"
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "LecturasDispositivos_timestamp_brin_idx"
  ON "LecturasDispositivos" USING BRIN ("timestamp") WITH (pages_per_range = 64);

CREATE INDEX IF NOT EXISTS "LecturasUnificadas_timestamp_brin_idx"
  ON "LecturasUnificadas" USING BRIN ("timestamp") WITH (pages_per_range = 64);

CREATE INDEX IF NOT EXISTS "HistorialDispositivos_timestamp_brin_idx"
  ON "HistorialDispositivos" USING BRIN ("timestamp") WITH (pages_per_range = 64);

CREATE INDEX IF NOT EXISTS "HistorialDispositivos_anomalias_timestamp_idx"
  ON "HistorialDispositivos" ("timestamp" DESC)
  WHERE "fueraRango" = true;

CREATE INDEX IF NOT EXISTS "HistorialDispositivos_anomalias_dispositivo_idx"
  ON "HistorialDispositivos" ("dispositivoId", "timestamp" DESC)
  WHERE "fueraRango" = true;

CREATE INDEX IF NOT EXISTS "Auditoria_createdAt_brin_idx"
  ON "Auditoria" USING BRIN ("createdAt") WITH (pages_per_range = 64);
