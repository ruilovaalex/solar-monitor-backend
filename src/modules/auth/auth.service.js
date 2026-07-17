const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { env } = require("../../config/env");
const { AppError } = require("../../shared/errors");
const { mapUser } = require("../users/user.mapper");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  async login(payload) {
    const parsed = loginSchema.parse(payload);
    const user = await this.repository.findByEmail(parsed.email);

    if (!user || !user.role.activo || !(await bcrypt.compare(parsed.password, user.password))) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    const token = jwt.sign(
      {
        roleId: user.roleId,
        role: user.role.nombre,
        type: "access",
      },
      env.jwtSecret,
      {
        subject: user.id,
        expiresIn: env.jwtExpiresIn,
      },
    );
    const decoded = jwt.decode(token);

    return {
      token,
      user: mapUser(user),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    };
  }

  async me(userId) {
    const user = await this.repository.findById(userId);
    if (!user) throw new AppError("Usuario no encontrado", 404);
    return mapUser(user);
  }
}

module.exports = { AuthService };
