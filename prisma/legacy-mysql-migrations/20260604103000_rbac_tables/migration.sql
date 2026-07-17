CREATE TABLE `Roles` (
  `id` VARCHAR(191) NOT NULL,
  `nombre` VARCHAR(191) NOT NULL,
  `descripcion` VARCHAR(191) NULL,
  `activo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Roles_nombre_key`(`nombre`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Permisos` (
  `id` VARCHAR(191) NOT NULL,
  `clave` VARCHAR(191) NOT NULL,
  `descripcion` VARCHAR(191) NULL,
  `modulo` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Permisos_clave_key`(`clave`),
  INDEX `Permisos_modulo_idx`(`modulo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RolesPermisos` (
  `rolId` VARCHAR(191) NOT NULL,
  `permisoId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `RolesPermisos_permisoId_idx`(`permisoId`),
  PRIMARY KEY (`rolId`, `permisoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Roles` (`id`, `nombre`, `descripcion`, `activo`, `updatedAt`) VALUES
  ('role_admin', 'ADMIN', 'Administrador con acceso completo', true, CURRENT_TIMESTAMP(3)),
  ('role_operador', 'OPERADOR', 'Operador con acceso de lectura operativa', true, CURRENT_TIMESTAMP(3));

INSERT INTO `Permisos` (`id`, `clave`, `descripcion`, `modulo`, `updatedAt`) VALUES
  ('perm_users_read', 'users:read', 'Consultar usuarios', 'users', CURRENT_TIMESTAMP(3)),
  ('perm_users_create', 'users:create', 'Crear usuarios', 'users', CURRENT_TIMESTAMP(3)),
  ('perm_users_update', 'users:update', 'Editar usuarios', 'users', CURRENT_TIMESTAMP(3)),
  ('perm_users_delete', 'users:delete', 'Eliminar usuarios', 'users', CURRENT_TIMESTAMP(3)),
  ('perm_systems_read', 'systems:read', 'Consultar sistemas fotovoltaicos', 'systems', CURRENT_TIMESTAMP(3)),
  ('perm_systems_create', 'systems:create', 'Crear sistemas fotovoltaicos', 'systems', CURRENT_TIMESTAMP(3)),
  ('perm_systems_update', 'systems:update', 'Editar sistemas fotovoltaicos', 'systems', CURRENT_TIMESTAMP(3)),
  ('perm_systems_delete', 'systems:delete', 'Eliminar sistemas fotovoltaicos', 'systems', CURRENT_TIMESTAMP(3)),
  ('perm_dashboard_read', 'dashboard:read', 'Consultar dashboard', 'dashboard', CURRENT_TIMESTAMP(3)),
  ('perm_history_read', 'history:read', 'Consultar historial', 'history', CURRENT_TIMESTAMP(3)),
  ('perm_stats_read', 'stats:read', 'Consultar estadisticas', 'stats', CURRENT_TIMESTAMP(3)),
  ('perm_comparisons_read', 'comparisons:read', 'Consultar comparaciones', 'comparisons', CURRENT_TIMESTAMP(3)),
  ('perm_settings_manage', 'settings:manage', 'Gestionar configuraciones', 'settings', CURRENT_TIMESTAMP(3)),
  ('perm_realtime_read', 'realtime:read', 'Consultar tiempo real', 'realtime', CURRENT_TIMESTAMP(3)),
  ('perm_ingestion_create', 'ingestion:create', 'Registrar lecturas simuladas o IoT', 'ingestion', CURRENT_TIMESTAMP(3));

INSERT INTO `RolesPermisos` (`rolId`, `permisoId`)
SELECT 'role_admin', `id` FROM `Permisos`;

INSERT INTO `RolesPermisos` (`rolId`, `permisoId`)
SELECT 'role_operador', `id`
FROM `Permisos`
WHERE `clave` IN (
  'systems:read',
  'dashboard:read',
  'history:read',
  'stats:read',
  'comparisons:read',
  'realtime:read'
);

ALTER TABLE `Usuarios` ADD COLUMN `roleId` VARCHAR(191) NULL;

UPDATE `Usuarios`
SET `roleId` = CASE
  WHEN `role` = 'ADMIN' THEN 'role_admin'
  ELSE 'role_operador'
END;

ALTER TABLE `Usuarios` MODIFY `roleId` VARCHAR(191) NOT NULL;
ALTER TABLE `Usuarios` DROP COLUMN `role`;
CREATE INDEX `Usuarios_roleId_idx` ON `Usuarios`(`roleId`);

ALTER TABLE `Usuarios`
  ADD CONSTRAINT `Usuarios_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `RolesPermisos`
  ADD CONSTRAINT `RolesPermisos_rolId_fkey`
  FOREIGN KEY (`rolId`) REFERENCES `Roles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RolesPermisos`
  ADD CONSTRAINT `RolesPermisos_permisoId_fkey`
  FOREIGN KEY (`permisoId`) REFERENCES `Permisos`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
