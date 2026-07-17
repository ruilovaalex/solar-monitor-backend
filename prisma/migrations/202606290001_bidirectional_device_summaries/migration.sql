-- Keep hourly/daily/monthly summaries separated by data source.
-- A single ESP32 or Raspberry Pi can send both generation and consumption.

DROP INDEX IF EXISTS "ResumenDispositivos_dispositivoId_granularidad_periodoInici_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ResumenDispositivo_fuente_periodo_key"
  ON "ResumenDispositivos" ("dispositivoId", "fuenteDatos", "granularidad", "periodoInicio");
