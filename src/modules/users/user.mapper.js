function toFrontendRole(roleName) {
  if (roleName === "ADMIN") return "admin";
  if (roleName === "OPERADOR") return "user";
  return roleName.toLowerCase();
}

function mapUser(user) {
  const roleName = user.role?.nombre || "OPERADOR";
  const permissions = user.role?.permisos?.map((item) => item.permiso.clave) || [];

  return {
    id: user.id,
    name: user.nombre,
    nombre: user.nombre,
    email: user.email,
    role: toFrontendRole(roleName),
    dbRole: roleName,
    roleId: user.roleId,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = { mapUser };
