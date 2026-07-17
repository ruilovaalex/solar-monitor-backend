require("dotenv").config();

const DEVELOPMENT_JWT_FALLBACK = "dev-local-jwt-secret-change-before-production";

function configurationError(message) {
  const error = new Error(`[env] ${message}`);
  error.name = "ConfigurationError";
  return error;
}

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw configurationError(
      'DATABASE_URL no esta definida. Configura la conexion PostgreSQL, por ejemplo: DATABASE_URL="postgresql://postgres:password@localhost:5432/solar_monitor?schema=public"',
    );
  }

  return databaseUrl;
}

function parsePort() {
  const rawPort = process.env.PORT?.trim();
  if (!rawPort) return 3000;

  const parsedPort = Number(rawPort);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw configurationError(`PORT invalido: "${rawPort}". Usa un numero entero positivo.`);
  }

  return parsedPort;
}

function parsePositiveInteger(name, fallback) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw configurationError(`${name} invalido: "${rawValue}". Usa un numero entero positivo.`);
  }

  return parsedValue;
}

function parseTrustProxy(nodeEnv) {
  const rawValue = process.env.TRUST_PROXY?.trim();
  if (!rawValue) return nodeEnv === "production" ? "loopback" : false;

  if (["false", "0", "off"].includes(rawValue.toLowerCase())) return false;
  if (/^\d+$/.test(rawValue)) return Number(rawValue);
  return rawValue;
}

function resolveJwtSecret(nodeEnv) {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    if (nodeEnv === "production") {
      throw configurationError("JWT_SECRET no esta definida. En produccion es obligatoria y no puede quedar vacia.");
    }

    console.warn(
      "[env] JWT_SECRET no esta definida. Se usara un fallback temporal solo para desarrollo local. Configura JWT_SECRET antes de desplegar.",
    );
    return DEVELOPMENT_JWT_FALLBACK;
  }

  if (nodeEnv === "production" && jwtSecret === DEVELOPMENT_JWT_FALLBACK) {
    throw configurationError("JWT_SECRET usa el fallback de desarrollo. Debes configurar un secreto real antes de produccion.");
  }

  if (nodeEnv === "production" && jwtSecret === "change_this_secret") {
    throw configurationError('JWT_SECRET usa un placeholder inseguro ("change_this_secret"). Debes reemplazarlo antes de produccion.');
  }

  if (nodeEnv !== "production" && jwtSecret === "change_this_secret") {
    console.warn("[env] JWT_SECRET sigue con el placeholder \"change_this_secret\". Cambialo antes de compartir o desplegar.");
  }

  return jwtSecret;
}

const nodeEnv = process.env.NODE_ENV || "development";

const env = {
  port: parsePort(),
  host: process.env.HOST?.trim() || (nodeEnv === "production" ? "127.0.0.1" : "0.0.0.0"),
  nodeEnv,
  databaseUrl: requireDatabaseUrl(),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  trustProxy: parseTrustProxy(nodeEnv),
  legacyApiEnabled: process.env.LEGACY_API_ENABLED === "true",
  simulationEnabled: process.env.SIMULATION_ENABLED === "true",
  simulationIntervalMs: Number(process.env.SIMULATION_INTERVAL_MS || 3000),
  jwtSecret: resolveJwtSecret(nodeEnv),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  loginRateLimitWindowMs: parsePositiveInteger("LOGIN_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  loginRateLimitMax: parsePositiveInteger("LOGIN_RATE_LIMIT_MAX", 5),
  rbacCacheTtlMs: Number(process.env.RBAC_CACHE_TTL_MS || 30000),
  deviceIngestionRateLimitWindowMs: Number(process.env.DEVICE_INGESTION_RATE_LIMIT_WINDOW_MS || 60000),
  deviceIngestionRateLimitMax: Number(process.env.DEVICE_INGESTION_RATE_LIMIT_MAX || 120),
};

module.exports = { env };
