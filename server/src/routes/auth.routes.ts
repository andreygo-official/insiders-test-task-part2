import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import {
  currentUser,
  requireAuth,
} from "../middleware/auth.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(100),
});

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;

function createToken(userId: string) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0].message,
    });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    res.status(409).json({
      message: "Цей email вже зареєстрований",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
    },
    select: publicUserSelect,
  });

  res.status(201).json({
    user,
    token: createToken(user.id),
  });
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Перевірте email та пароль",
    });
    return;
  }

  const { email, password } = parsed.data;

  const account = await prisma.user.findUnique({
    where: { email },
  });

  if (
    !account ||
    !(await bcrypt.compare(
      password,
      account.passwordHash
    ))
  ) {
    res.status(401).json({
      message: "Неправильний email або пароль",
    });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: account.id },
    select: publicUserSelect,
  });

  res.json({
    user,
    token: createToken(user.id),
  });
});

// GET /api/auth/me
authRouter.get("/me", requireAuth, async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: currentUser(res).id,
    },
    select: publicUserSelect,
  });

  res.json(user);
});