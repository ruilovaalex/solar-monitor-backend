-- Cada operador es propietario de sus dispositivos y su configuracion de monitoreo.
ALTER TABLE "Dispositivos" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "ConfiguracionMonitoreo" ADD COLUMN "usuarioId" TEXT;

DO $$
DECLARE
  owner_id TEXT;
BEGIN
  SELECT "id"
  INTO owner_id
  FROM "Usuarios"
  WHERE LOWER("email") = 'alexanderruilova81@gmail.com'
  LIMIT 1;

  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el usuario alexanderruilova81@gmail.com para asignar los datos existentes';
  END IF;

  UPDATE "Dispositivos"
  SET "usuarioId" = owner_id
  WHERE "usuarioId" IS NULL;

  UPDATE "ConfiguracionMonitoreo"
  SET "usuarioId" = owner_id
  WHERE "usuarioId" IS NULL;
END $$;

ALTER TABLE "Dispositivos" ALTER COLUMN "usuarioId" SET NOT NULL;
ALTER TABLE "ConfiguracionMonitoreo" ALTER COLUMN "usuarioId" SET NOT NULL;

CREATE INDEX "Dispositivos_usuarioId_activo_estado_idx"
  ON "Dispositivos"("usuarioId", "activo", "estado");

CREATE INDEX "Dispositivos_usuarioId_activo_fuenteDatos_idx"
  ON "Dispositivos"("usuarioId", "activo", "fuenteDatos");

CREATE UNIQUE INDEX "ConfiguracionMonitoreo_usuarioId_key"
  ON "ConfiguracionMonitoreo"("usuarioId");

ALTER TABLE "Dispositivos"
  ADD CONSTRAINT "Dispositivos_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfiguracionMonitoreo"
  ADD CONSTRAINT "ConfiguracionMonitoreo_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
