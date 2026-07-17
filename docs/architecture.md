# Arquitectura tecnica

## Objetivo

SolarMonitor es una plataforma de monitoreo fotovoltaico. Un ESP32 o Raspberry Pi puede enviar generacion, consumo o ambos, y el operador consulta potencia actual, balance, historicos y resumenes temporales.

## Capas

- `routes`: endpoints bajo el prefijo canonico `/api` y autorizacion.
- `controller`: adaptacion HTTP.
- `protocol-adapters`: transformacion del protocolo a un formato comun.
- `service`: validacion, promedios y reglas de negocio.
- `repository`: persistencia Prisma/PostgreSQL.
- `shared`: errores, logging, JWT, RBAC y middlewares.

## Seguridad

- Personas: JWT y permisos RBAC consultados desde PostgreSQL.
- Dispositivos: clave `x-device-key` almacenada como hash.
- Propiedad: cada `Dispositivo` y `ConfiguracionMonitoreo` pertenece a un `Usuario`.
- Consultas: dashboard, historicos, estadisticas y tiempo real filtran por `req.user.id`.
- Login: limite predeterminado de cinco intentos por IP cada quince minutos.
- Seed demo: desactivado salvo habilitacion explicita mediante variables de entorno.

## Flujo de ingesta

1. El adaptador HTTP normaliza el payload.
2. Se valida dispositivo, estado y clave.
3. Se validan fuente de datos y timestamp.
4. La configuracion se obtiene desde el propietario del dispositivo.
5. Generacion y consumo se procesan dentro de una unica transaccion Prisma.
6. Se guardan lecturas originales y ultima lectura por fuente.
7. Se calculan promedio movil, rango y cambio significativo.
8. Se registra historico cuando corresponde.
9. Se actualizan resumenes `HOUR`, `DAY` y `MONTH`.
10. Se guarda la lectura unificada cuando el payload contiene mediciones compatibles.

Si falla cualquier escritura de un payload bidireccional, PostgreSQL revierte toda la recepcion.

## Dashboard

`GET /api/dashboard` acepta:

- `range`: `today`, `24h`, `7d`, `30d`.
- `granularity`: `minute`, `hour`, `day`, `month`.

Los minutos se obtienen desde lecturas reales. Las granularidades mayores utilizan resumenes. El balance solo existe cuando generacion y consumo pertenecen al mismo intervalo; de lo contrario es `null`.

## Rutas y compatibilidad

La API funcional se publica unicamente bajo `/api`. Los endpoints heredados estan desactivados por defecto y pueden habilitarse temporalmente con:

```env
LEGACY_API_ENABLED=true
```

Los modelos legacy permanecen en Prisma para conservar datos, pero no forman parte del flujo recomendado del MVP.

## Extensiones futuras

MQTT, WebSocket, TCP, LoRa y la estacion meteorologica no estan implementados. Para añadir un protocolo se debe crear otro adaptador que entregue `deviceId`, `deviceKey`, `protocol` y `payload` al mismo servicio de ingesta.

## Verificacion

```bash
npm run lint
npm test
npm run prisma:status
npm run validate:mvp
```

`validate:mvp` es de solo lectura y comprueba la conexion PostgreSQL, conteos de tablas actuales y coherencia del contrato del dashboard.
