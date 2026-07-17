-- Nueva tabla aditiva para guardar una transmision fotovoltaica completa
-- sin romper el modelo actual basado en LecturasDispositivos por fuente.

CREATE TABLE "LecturasUnificadas" (
  "id" BIGSERIAL NOT NULL,
  "dispositivoId" TEXT NOT NULL,
  "protocolo" "IngestionProtocol" NOT NULL DEFAULT 'HTTP_REST',
  "voltaje" DECIMAL(12,3),
  "corriente" DECIMAL(12,3),
  "potenciaGeneracion" DECIMAL(12,3),
  "potenciaConsumo" DECIMAL(12,3),
  "energiaGeneracion" DECIMAL(14,3),
  "energiaConsumo" DECIMAL(14,3),
  "balanceEnergetico" DECIMAL(12,3),
  "promedioRefGeneracion" DECIMAL(12,3),
  "promedioRefConsumo" DECIMAL(12,3),
  "payload" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LecturasUnificadas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LecturasUnificadas_dispositivoId_fkey"
    FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LecturasUnificadas_dispositivoId_timestamp_idx"
  ON "LecturasUnificadas"("dispositivoId", "timestamp" DESC);

CREATE INDEX "LecturasUnificadas_timestamp_idx"
  ON "LecturasUnificadas"("timestamp" DESC);
