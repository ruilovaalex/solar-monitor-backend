# SolarMonitor Backend

API Express + Prisma + PostgreSQL para recibir y consultar datos fotovoltaicos enviados por ESP32 o Raspberry Pi.

## Requisitos

- Node.js compatible con las dependencias del proyecto.
- PostgreSQL local en ejecucion.
- Variables `DATABASE_URL` y `JWT_SECRET` configuradas en `.env`.

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/solar_monitor?schema=public"
JWT_SECRET="<secreto-local-seguro>"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

Para ejecutar detras de Caddy en la PC institucional:

```env
NODE_ENV="production"
HOST="127.0.0.1"
TRUST_PROXY="loopback"
CORS_ORIGIN="https://<direccion-publica>"
```

`HOST=127.0.0.1` evita publicar Express directamente. Caddy debe ser el unico punto de entrada y reenviar `/api` hacia `127.0.0.1:3000`. `TRUST_PROXY=loopback` permite obtener la IP original para los limites de login e ingesta sin confiar en proxies externos.

## Arranque

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

API canonica: `http://localhost:3000/api`

## Seed

El seed siempre sincroniza roles, permisos y configuracion base. Los datos demo estan desactivados por defecto.

Para habilitarlos deliberadamente:

```env
SEED_DEMO_USERS=true
SEED_DEMO_PASSWORD="<password-de-al-menos-8-caracteres>"
SEED_DEMO_DEVICES=true
SEED_DEMO_READINGS=true
```

No se publican contrasenas ni claves demo en la interfaz o documentacion.

## Autenticacion y seguridad

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@dominio.local",
  "password": "<password>"
}
```

Las rutas protegidas requieren `Authorization: Bearer <token>`. El login permite por defecto cinco intentos por IP cada quince minutos. Puede configurarse con:

```env
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
```

### Aislamiento por usuario

- Cada dispositivo pertenece al usuario que lo registra.
- Dashboard, estadisticas, historicos y tiempo real se filtran por propietario.
- Cada operador dispone de su propia configuracion de monitoreo.
- Una cuenta nueva comienza sin dispositivos ni datos energeticos.
- La ingesta obtiene el propietario desde el dispositivo autenticado mediante `x-device-key`.
- El administrador gestiona cuentas y no recibe acceso al monitoreo de los operadores.

## Ingesta HTTP

```http
POST /api/ingestion/devices/:deviceId/readings
Content-Type: application/json
x-device-key: <clave-generada>
```

```json
{
  "timestamp": "2026-07-09T14:22:39.000Z",
  "generation": { "power": 3.13, "voltage": 119.11, "current": 26.27 },
  "consumption": { "power": 0.75, "voltage": 119.11, "current": 6.27 }
}
```

Un ESP32 o Raspberry Pi puede enviar generacion, consumo o ambos. En payloads bidireccionales todas las escrituras se confirman en una unica transaccion; si una falla, se revierte la recepcion completa.

## Dashboard

```http
GET /api/dashboard?range=30d&granularity=minute
```

Valores permitidos:

- `range`: `today`, `24h`, `7d`, `30d`.
- `granularity`: `minute`, `hour`, `day`, `month`.

Sin parametros conserva el contrato predeterminado. El balance es `null` cuando no existen generacion y consumo comparables en el mismo intervalo.

## Endpoints activos

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/users`
- `DELETE /api/users/:id`
- `GET|POST /api/devices`
- `GET /api/devices/:id`
- `GET /api/dashboard`
- `GET /api/statistics`
- `GET /api/realtime/devices`
- `GET /api/history/devices`
- `GET|PUT /api/monitoring/config`
- `POST /api/ingestion/devices/:deviceId/readings`

No se publican rutas funcionales sin `/api`.

## Legacy

Los modelos y endpoints heredados permanecen disponibles solo para compatibilidad controlada. Los endpoints legacy estan desactivados por defecto:

```env
LEGACY_API_ENABLED=true
```

No usar esta opcion para nuevas integraciones.

## Verificacion

```bash
npm run lint
npm test
npm run prisma:status
npm run validate:mvp
```

`validate:mvp` no modifica datos. Verifica PostgreSQL y la coherencia del dashboard.

## Respaldos y restauracion

Crear un respaldo en formato PostgreSQL custom, con archivo SHA-256 y retencion predeterminada de 14 dias:

```powershell
npm run db:backup
```

Cambiar carpeta o retencion:

```powershell
npm run db:backup -- -OutputDirectory "D:\SolarMonitorBackups" -RetentionDays 30
```

Antes de restaurar, detenga el backend. La restauracion exige `-Force` porque reemplaza los datos actuales:

```powershell
npm run db:restore -- -BackupFile "D:\SolarMonitorBackups\solar_monitor_YYYYMMDD_HHMMSS.dump" -Force
npm run prisma:status
```

Los respaldos creados dentro de `backups/` no se publican en Git. Para produccion, programe `npm run db:backup` mediante el Programador de tareas de Windows y copie periodicamente los archivos a una unidad diferente.

## Pendientes

- Formulas oficiales de energia.
- MQTT, WebSocket y TCP.
- Estacion meteorologica funcional.

Estas capacidades no estan implementadas en el MVP actual.
