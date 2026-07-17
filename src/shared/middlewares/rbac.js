const { prisma } = require("../../config/prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { AppError } = require("../errors");

const rbacCache = new Map();

const userWithRole = {
  role: {
    include: {
      permisos: {
        include: {
          permiso: true,
        },
      },
    },
  },
};

function mapRbacUser(user) {
  const permissions = user.role.permisos.map((item) => item.permiso.clave);

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role.nombre,
    roleId: user.roleId,
    permissions,
  };
}

function getCachedUser(userId) {
  const cached = rbacCache.get(userId);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    rbacCache.delete(userId);
    return null;
  }
  return cached.user;
}

function setCachedUser(userId, user) {
  if (env.rbacCacheTtlMs <= 0) return;
  rbacCache.set(userId, {
    user,
    expiresAt: Date.now() + env.rbacCacheTtlMs,
  });
}

function clearRbacCache() {
  rbacCache.clear();
}

function invalidateRbacUser(userId) {
  if (userId) rbacCache.delete(userId);
}

async function attachUser(req, res, next) {
  try {
    const authorization = req.header("authorization");
    if (!authorization) {
      req.user = null;
      return next();
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError("Formato de autorizacion invalido", 401);
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const cachedUser = getCachedUser(payload.sub);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: userWithRole,
    });

    if (!user || !user.role.activo) {
      throw new AppError("Usuario no autorizado", 401);
    }

    req.user = mapRbacUser(user);
    setCachedUser(user.id, req.user);
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token invalido o expirado", 401));
    }
    next(error);
  }
}

function authorize(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario no autenticado para RBAC", 401));
    }

    if (!requiredPermission) {
      return next();
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return next(new AppError("No tienes permisos para ejecutar esta accion", 403));
    }

    return next();
  };
}

module.exports = {
  attachUser,
  authorize,
  mapRbacUser,
  userWithRole,
  clearRbacCache,
  invalidateRbacUser,
};
