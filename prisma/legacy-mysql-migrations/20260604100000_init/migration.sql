CREATE TABLE `Usuarios` (
  `id` VARCHAR(191) NOT NULL,
  `nombre` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'OPERADOR') NOT NULL DEFAULT 'OPERADOR',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Usuarios_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SistemasFotovoltaicos` (
  `id` VARCHAR(191) NOT NULL,
  `nombreSistema` VARCHAR(191) NOT NULL,
  `ubicacion` VARCHAR(191) NOT NULL,
  `potenciaInstalada` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `SistemasFotovoltaicos_ubicacion_idx`(`ubicacion`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DatosTiempoReal` (
  `id` VARCHAR(191) NOT NULL,
  `sistemaId` VARCHAR(191) NOT NULL,
  `energiaGenerada` DECIMAL(12, 3) NOT NULL,
  `energiaConsumida` DECIMAL(12, 3) NOT NULL,
  `potenciaInstantanea` DECIMAL(12, 3) NOT NULL,
  `balanceEnergetico` DECIMAL(12, 3) NOT NULL,
  `fechaLectura` DATETIME(3) NOT NULL,
  UNIQUE INDEX `DatosTiempoReal_sistemaId_key`(`sistemaId`),
  INDEX `DatosTiempoReal_fechaLectura_idx`(`fechaLectura`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HistorialLecturas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sistemaId` VARCHAR(191) NOT NULL,
  `energiaGenerada` DECIMAL(12, 3) NOT NULL,
  `energiaConsumida` DECIMAL(12, 3) NOT NULL,
  `potenciaInstantanea` DECIMAL(12, 3) NOT NULL,
  `balanceEnergetico` DECIMAL(12, 3) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL,
  INDEX `HistorialLecturas_sistemaId_timestamp_idx`(`sistemaId`, `timestamp`),
  INDEX `HistorialLecturas_timestamp_idx`(`timestamp`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ResumenDiario` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sistemaId` VARCHAR(191) NOT NULL,
  `fecha` DATE NOT NULL,
  `energiaGeneradaTotal` DECIMAL(14, 3) NOT NULL,
  `energiaConsumidaTotal` DECIMAL(14, 3) NOT NULL,
  `balanceTotal` DECIMAL(14, 3) NOT NULL,
  UNIQUE INDEX `ResumenDiario_sistemaId_fecha_key`(`sistemaId`, `fecha`),
  INDEX `ResumenDiario_fecha_idx`(`fecha`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ResumenMensual` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sistemaId` VARCHAR(191) NOT NULL,
  `mes` INTEGER NOT NULL,
  `anio` INTEGER NOT NULL,
  `energiaGeneradaTotal` DECIMAL(14, 3) NOT NULL,
  `energiaConsumidaTotal` DECIMAL(14, 3) NOT NULL,
  `balanceTotal` DECIMAL(14, 3) NOT NULL,
  UNIQUE INDEX `ResumenMensual_sistemaId_mes_anio_key`(`sistemaId`, `mes`, `anio`),
  INDEX `ResumenMensual_anio_mes_idx`(`anio`, `mes`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DatosTiempoReal`
  ADD CONSTRAINT `DatosTiempoReal_sistemaId_fkey`
  FOREIGN KEY (`sistemaId`) REFERENCES `SistemasFotovoltaicos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `HistorialLecturas`
  ADD CONSTRAINT `HistorialLecturas_sistemaId_fkey`
  FOREIGN KEY (`sistemaId`) REFERENCES `SistemasFotovoltaicos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ResumenDiario`
  ADD CONSTRAINT `ResumenDiario_sistemaId_fkey`
  FOREIGN KEY (`sistemaId`) REFERENCES `SistemasFotovoltaicos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ResumenMensual`
  ADD CONSTRAINT `ResumenMensual_sistemaId_fkey`
  FOREIGN KEY (`sistemaId`) REFERENCES `SistemasFotovoltaicos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
