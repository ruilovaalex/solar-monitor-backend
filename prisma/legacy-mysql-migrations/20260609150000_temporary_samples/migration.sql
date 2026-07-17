CREATE TABLE `MuestrasTemporalesDispositivos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `dispositivoId` VARCHAR(191) NOT NULL,
  `potencia` DECIMAL(12, 3) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL,
  INDEX `MuestrasTemporalesDispositivos_dispositivoId_timestamp_idx`(`dispositivoId`, `timestamp`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MuestrasTemporalesDispositivos`
  ADD CONSTRAINT `MuestrasTemporalesDispositivos_dispositivoId_fkey`
  FOREIGN KEY (`dispositivoId`) REFERENCES `Dispositivos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
