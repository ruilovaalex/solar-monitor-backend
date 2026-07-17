CREATE TABLE `Dispositivos` (
  `id` VARCHAR(191) NOT NULL,
  `nombre` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `modelo` VARCHAR(191) NOT NULL,
  `fuenteDatos` VARCHAR(191) NOT NULL,
  `estado` VARCHAR(191) NOT NULL DEFAULT 'OFFLINE',
  `ultimoContacto` DATETIME(3) NULL,
  `intervaloMuestreoSegundos` INTEGER NOT NULL DEFAULT 5,
  `claveIngestaHash` VARCHAR(191) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `Dispositivos_tipo_idx`(`tipo`),
  INDEX `Dispositivos_fuenteDatos_idx`(`fuenteDatos`),
  INDEX `Dispositivos_estado_idx`(`estado`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UltimasLecturasDispositivos` (
  `id` VARCHAR(191) NOT NULL,
  `dispositivoId` VARCHAR(191) NOT NULL,
  `voltaje` DECIMAL(12, 3) NULL,
  `corriente` DECIMAL(12, 3) NULL,
  `potencia` DECIMAL(12, 3) NOT NULL,
  `promedioReferencia` DECIMAL(12, 3) NULL,
  `fueraRango` BOOLEAN NOT NULL DEFAULT false,
  `payload` JSON NULL,
  `fechaLectura` DATETIME(3) NOT NULL,
  UNIQUE INDEX `UltimasLecturasDispositivos_dispositivoId_key`(`dispositivoId`),
  INDEX `UltimasLecturasDispositivos_fechaLectura_idx`(`fechaLectura`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HistorialDispositivos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `dispositivoId` VARCHAR(191) NOT NULL,
  `voltaje` DECIMAL(12, 3) NULL,
  `corriente` DECIMAL(12, 3) NULL,
  `potencia` DECIMAL(12, 3) NOT NULL,
  `promedioReferencia` DECIMAL(12, 3) NULL,
  `fueraRango` BOOLEAN NOT NULL DEFAULT false,
  `motivoGuardado` VARCHAR(191) NOT NULL,
  `payload` JSON NULL,
  `timestamp` DATETIME(3) NOT NULL,
  INDEX `HistorialDispositivos_dispositivoId_timestamp_idx`(`dispositivoId`, `timestamp`),
  INDEX `HistorialDispositivos_timestamp_idx`(`timestamp`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ConfiguracionMonitoreo` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'monitoring_default',
  `ventanaPromedioMinutos` INTEGER NOT NULL DEFAULT 15,
  `desviacionSuperiorPuntos` DECIMAL(12, 3) NOT NULL DEFAULT 4,
  `desviacionInferiorPuntos` DECIMAL(12, 3) NOT NULL DEFAULT 4,
  `intervaloGuardadoNormalMinutos` INTEGER NOT NULL DEFAULT 15,
  `intervaloGuardadoAnomaliaSegundos` INTEGER NOT NULL DEFAULT 10,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UltimasLecturasDispositivos`
  ADD CONSTRAINT `UltimasLecturasDispositivos_dispositivoId_fkey`
  FOREIGN KEY (`dispositivoId`) REFERENCES `Dispositivos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `HistorialDispositivos`
  ADD CONSTRAINT `HistorialDispositivos_dispositivoId_fkey`
  FOREIGN KEY (`dispositivoId`) REFERENCES `Dispositivos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `Permisos` (`id`, `clave`, `descripcion`, `modulo`, `updatedAt`) VALUES
  ('perm_devices_read', 'devices:read', 'Consultar dispositivos', 'devices', CURRENT_TIMESTAMP(3)),
  ('perm_monitoring_read', 'monitoring:read', 'Consultar configuracion de monitoreo', 'monitoring', CURRENT_TIMESTAMP(3)),
  ('perm_monitoring_manage', 'monitoring:manage', 'Modificar configuracion de monitoreo', 'monitoring', CURRENT_TIMESTAMP(3));

DELETE FROM `RolesPermisos`
WHERE `rolId` IN ('role_admin', 'role_operador');

INSERT INTO `RolesPermisos` (`rolId`, `permisoId`)
SELECT 'role_admin', `id`
FROM `Permisos`
WHERE `clave` IN ('users:read', 'users:create');

INSERT INTO `RolesPermisos` (`rolId`, `permisoId`)
SELECT 'role_operador', `id`
FROM `Permisos`
WHERE `clave` IN (
  'systems:read',
  'dashboard:read',
  'history:read',
  'stats:read',
  'realtime:read',
  'devices:read',
  'monitoring:read',
  'monitoring:manage'
);
