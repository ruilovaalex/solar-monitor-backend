const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { AppError } = require("../../shared/errors");
const { mapUser } = require("./user.mapper");

const createUserSchema = z.object({
  nombre: z.string().min(2),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

const updateUserSchema = z.object({
  nombre: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.string().min(2).optional(),
  roleId: z.string().min(1).optional(),
});

class UserService {
  constructor(repository) {
    this.repository = repository;
  }

  normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  async getAll() {
    const users = await this.repository.findAll();
    return users.map(mapUser);
  }

  async getById(id) {
    const user = await this.repository.findById(id);
    if (!user) throw new AppError("Usuario no encontrado", 404);
    return mapUser(user);
  }

  async create(payload) {
    const parsed = createUserSchema.parse({
      ...payload,
      nombre: payload.nombre || payload.name,
    });
    const normalizedEmail = this.normalizeEmail(parsed.email);
    const existingUsers = await this.repository.findAll();
    const exists = existingUsers.find((user) => this.normalizeEmail(user.email) === normalizedEmail);
    if (exists) throw new AppError("El email ya esta registrado", 409);

    const roleId = (await this.getRoleId("OPERADOR")).id;
    const user = await this.repository.create({
      nombre: parsed.nombre,
      email: normalizedEmail,
      password: await bcrypt.hash(parsed.password, 10),
      roleId,
    });

    return mapUser(user);
  }

  async update(id, payload) {
    const parsed = updateUserSchema.parse({
      ...payload,
      nombre: payload.nombre || payload.name,
    });
    const data = { ...parsed };
    delete data.name;
    delete data.role;

    if (parsed.password) {
      data.password = await bcrypt.hash(parsed.password, 10);
    }
    if (parsed.role && !parsed.roleId) {
      data.roleId = (await this.getRoleId(parsed.role)).id;
    }

    const user = await this.repository.update(id, data);
    return mapUser(user);
  }

  async delete(id) {
    await this.repository.delete(id);
    return { id };
  }

  async getRoleId(roleName) {
    const normalized = this.normalizeRoleName(roleName);
    const role = await this.repository.findRoleByName(normalized);
    if (!role) throw new AppError("Rol no encontrado en la base de datos", 400);
    return role;
  }

  normalizeRoleName(roleName) {
    const value = roleName.toUpperCase();
    if (value === "ADMIN") return "ADMIN";
    if (value === "OPERATOR" || value === "OPERADOR") return "OPERADOR";
    return value;
  }
}

module.exports = { UserService };
