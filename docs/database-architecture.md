# Arquitectura de base de datos

## 1. Problemas encontrados

- `Dispositivos.tipo`, `Dispositivos.fuenteDatos`, `Dispositivos.estado`, `LecturasDispositivos.protocolo` y `HistorialDispositivos.motivoGuardado` eran `String`. Eso permitia valores invalidos y hacia mas fragil el codigo.
- Existian tres tablas de resumen casi iguales: horario, diario y mensual. Esa duplicacion aumentaba mantenimiento y repetia logica de upsert.
- `UltimasLecturasDispositivos` era unica solo por dispositivo. Eso impedia que un mismo monitor futuro registrara generacion y consumo a la vez.
- El historico no tenia relacion directa con la lectura original. Se podia consultar, pero no trazar exactamente de que lectura cruda salio un historico.
- No existia estrategia de retencion para lecturas crudas, historicos y resumenes.
- No existia auditoria estructurada para operaciones administrativas.
- Las migraciones antiguas estaban orientadas a MySQL. Para PostgreSQL se necesitaba una linea limpia separada.
- Faltaban constraints de PostgreSQL para proteger datos no negativos, mediciones vacias y rangos de configuracion.

## 2. Cambios realizados

- Se agregaron ENUMs PostgreSQL/Prisma para tipos de dispositivo, fuente de dato, estado, protocolo, motivo historico, granularidad y auditoria.
- Se unificaron los resumenes en `ResumenDispositivos` con `granularidad`: `HOUR`, `DAY`, `MONTH`.
- `UltimasLecturasDispositivos` ahora es unica por `dispositivoId + fuenteDatos`.
- `LecturasDispositivos` ahora soporta `potencia` o `energia` medida.
- Se agrego `LecturasUnificadas` para guardar en una sola fila la transmision completa del sistema fotovoltaico.
- `HistorialDispositivos` ahora guarda `fuenteDatos`, `energia` y `lecturaId` opcional hacia la lectura original.
- `ConfiguracionMonitoreo` ahora incluye parametros de retencion.
- Se agrego tabla `Auditoria`.
- Se agrego SQL de hardening en `prisma/sql/postgres-hardening.sql`.
- Se genero baseline PostgreSQL limpio en `prisma/postgresql-migrations/202606270001_iot_postgresql_baseline.sql`.
- Se agrego script de retencion `scripts/apply-retention.js`.

## 3. Justificacion tecnica

- Los ENUM reducen errores de integridad y hacen mas claras las consultas.
- Una tabla de resumen unificada evita tres modelos repetidos sin perder historicos horario/diario/mensual.
- La ultima lectura por fuente permite dispositivos bidireccionales sin cambiar tablas despues.
- La relacion historico -> lectura cruda mejora trazabilidad y auditoria tecnica.
- Los resumenes protegen el dashboard de tener que escanear millones de lecturas crudas.
- La retencion evita crecimiento indefinido sin afectar metricas agregadas.
- Auditoria queda fuera del flujo de ingestion de alta frecuencia para no afectar rendimiento.

## 4. Diagrama de relaciones

```txt
Usuario 1---N Auditoria
Usuario N---1 Rol
Rol 1---N RolPermiso N---1 Permiso

Dispositivo 1---N LecturaDispositivo
Dispositivo 1---N LecturaUnificada
Dispositivo 1---N UltimaLecturaDispositivo
Dispositivo 1---N HistorialDispositivo
Dispositivo 1---N MuestraTemporalDispositivo
Dispositivo 1---N ResumenDispositivo

LecturaDispositivo 0..1---0..1 HistorialDispositivo

SistemaFotovoltaico 1---1 DatosTiempoReal
SistemaFotovoltaico 1---N HistorialLectura
SistemaFotovoltaico 1---N ResumenDiario
SistemaFotovoltaico 1---N ResumenMensual
```

Los modelos `SistemaFotovoltaico`, `DatosTiempoReal`, `HistorialLectura`, `ResumenDiario` y `ResumenMensual` se conservan por compatibilidad legacy y deben tratarse como deprecados. No deben recibir inserciones nuevas.

## 5. Indices principales

- `Dispositivos`: `[activo, estado]`, `[activo, fuenteDatos]`, `[tipo, activo]`.
- `LecturasDispositivos`: `[dispositivoId, timestamp DESC]`, `[fuenteDatos, timestamp DESC]`, BRIN por `timestamp`.
- `LecturasUnificadas`: `[dispositivoId, timestamp DESC]`, `[timestamp DESC]`, BRIN por `timestamp`.
- `UltimasLecturasDispositivos`: unique `[dispositivoId, fuenteDatos]`, `[fuenteDatos, fechaLectura DESC]`.
- `HistorialDispositivos`: `[dispositivoId, timestamp DESC]`, `[fuenteDatos, timestamp DESC]`, `[timestamp DESC]`, BRIN por `timestamp`, parcial para anomalías.
- `ResumenDispositivos`: unique `[dispositivoId, granularidad, periodoInicio]`, `[granularidad, periodoInicio DESC]`, `[fuenteDatos, granularidad, periodoInicio DESC]`.
- `Auditoria`: `[usuarioId, createdAt DESC]`, `[tabla, registroId]`, `[accion, createdAt DESC]`, BRIN por `createdAt`.

## 6. ENUMs nuevos

- `DeviceType`: `ESP32`, `RASPBERRY`, `OTHER`.
- `DataSourceType`: `GENERATION`, `CONSUMPTION`, `BIDIRECTIONAL`.
- `DeviceStatus`: `ONLINE`, `OFFLINE`, `MAINTENANCE`, `DISABLED`.
- `IngestionProtocol`: `HTTP_REST`, `MQTT`, `WEBSOCKET`, `TCP`, `LORA`, `UNKNOWN`.
- `HistoryReason`: `INITIAL`, `AVERAGE_CHANGE`, `OUT_OF_RANGE`, `REGULAR_INTERVAL`, `MANUAL_IMPORT`.
- `SummaryGranularity`: `HOUR`, `DAY`, `MONTH`.
- `AuditAction`: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `INGEST`, `CONFIG_CHANGE`, `RBAC_CHANGE`, `DEVICE_REGISTER`.

## 7. Estrategia de particionado

No se implemento particionado fisico todavia para no sobreingenierizar ni pelear con Prisma.

Recomendacion por escala:

- Menos de 5-10 millones de lecturas: tabla normal con indices btree/BRIN y retencion.
- Mas de 10 millones de lecturas o alto volumen sostenido: particionar `LecturasDispositivos` por rango mensual usando `timestamp`.
- Si hay muchisimos dispositivos con volumen desigual: evaluar subparticionado por hash de `dispositivoId`.

Ventajas del particionado mensual:

- limpieza por `DROP PARTITION`, mucho mas barato que `DELETE` masivo.
- consultas por fecha leen menos datos.
- mantenimiento de indices por particion.

Desventajas:

- Prisma no administra particiones de forma nativa.
- requiere SQL operacional adicional.
- complica migraciones si se aplica antes de necesitarlo.

## 8. Estrategia de retencion

Configuracion actual:

- `retencionLecturasDias`: lecturas crudas.
- `retencionHistorialDias`: historicos significativos.
- `retencionResumenesMeses`: resumenes horario/diario.

Script:

```bash
npm run db:retention
```

La idea es conservar resumenes mensuales por mas tiempo y limpiar datos de alta granularidad cuando ya no aporten al dashboard.

## 9. Estrategia de auditoria

Tabla: `Auditoria`.

Registra:

- usuario
- accion
- tabla
- registro
- IP
- detalle JSON
- fecha

Se auditan operaciones administrativas como login, registro de dispositivos y cambios de configuracion. No se audita cada lectura IoT para no afectar rendimiento.

## 10. Estrategia para millones de registros

- Lecturas crudas en `LecturasDispositivos` como tabla append-only.
- Dashboard lee `UltimasLecturasDispositivos` y `ResumenDispositivos`, no la tabla cruda completa.
- Historicos significativos separados de lecturas crudas.
- Indices compuestos por dispositivo/fuente + tiempo.
- BRIN en timestamps para recorridos grandes por fecha.
- Retencion configurable.
- Particionado mensual recomendado cuando el volumen lo justifique.

## 11. Riesgos

- Las migraciones Prisma antiguas son MySQL legacy; no deben usarse para PostgreSQL nuevo.
- `prisma db push` sirve en esta fase, pero produccion deberia pasar a migraciones PostgreSQL versionadas.
- Si se particiona, Prisma no lo modela completamente; se debe administrar con SQL controlado.
- Cambiar de una sola ultima lectura a ultima lectura por fuente requiere que consultas antiguas usen `ultimaLecturas`.

## 12. Beneficios

- Modelo IoT mas consistente.
- Menos duplicacion en resumenes.
- Mejor integridad por ENUM y CHECK constraints.
- Trazabilidad entre lectura original e historico.
- Preparado para dispositivos bidireccionales.
- Preparado para HTTP, MQTT, WebSocket, TCP y LoRa como origenes.
- Mejor rendimiento para dashboard y estadisticas.
- Retencion y auditoria profesional.

## 13. Recomendaciones futuras

- Implementar migraciones PostgreSQL formales con `prisma migrate` cuando el modelo se estabilice.
- Agregar job programado para `npm run db:retention`.
- Evaluar particionado mensual cuando haya volumen real.
- Crear vistas/materialized views si las comparaciones historicas crecen.
- Mantener la logica de protocolo en adaptadores, nunca en servicios de negocio.
- Agregar auditoria para cambios RBAC y usuarios si se habilitan esas pantallas.
