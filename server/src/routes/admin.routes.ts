import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

import {
  currentUser,
  requireAuth,
  requireAdmin,
} from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  _count: {
    select: {
      books: true,
    },
  },
} as const;

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.email().trim().toLowerCase().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

// GET /api/admin/users
adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(users);
});

// POST /api/admin/users
adminRouter.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0].message,
    });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    res.status(409).json({
      message: "Цей email вже використовується",
    });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    },
    select: userSelect,
  });

  res.status(201).json(user);
});

// PATCH /api/admin/users/:id
adminRouter.patch("/users/:id", async (req, res) => {
  const id = String(req.params.id);

  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0].message,
    });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({
      message: "Користувача не знайдено",
    });
    return;
  }

  if (
    id === currentUser(res).id &&
    parsed.data.role === "USER"
  ) {
    res.status(400).json({
      message: "Не можна зняти власну роль адміністратора",
    });
    return;
  }

  if (parsed.data.email) {
    const taken = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    if (taken && taken.id !== id) {
      res.status(409).json({
        message: "Цей email вже використовується",
      });
      return;
    }
  }

  const { password, ...data } = parsed.data;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      ...(password
        ? {
            passwordHash: await bcrypt.hash(password, 12),
          }
        : {}),
    },
    select: userSelect,
  });

  res.json(user);
});

// DELETE /api/admin/users/:id
adminRouter.delete("/users/:id", async (req, res) => {
  const id = String(req.params.id);

  if (id === currentUser(res).id) {
    res.status(400).json({
      message: "Не можна видалити власний акаунт адміністратора",
    });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({
      message: "Користувача не знайдено",
    });
    return;
  }

  await prisma.user.delete({
    where: { id },
  });

  res.status(204).send();
});