import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import {
  currentUser,
  requireAuth,
} from "../middleware/auth.js";

export const meRouter = Router();

meRouter.use(requireAuth);

const bookSchema = z.object({
  name: z.string().trim().min(2).max(150),
  author: z.string().trim().min(2).max(120),
  photoUrl: z.union([
    z.url(),
    z.literal(""),
  ]).optional(),
});

// GET /api/me/books
meRouter.get("/books", async (_req, res) => {
  const books = await prisma.book.findMany({
    where: {
      ownerId: currentUser(res).id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(books);
});

// POST /api/me/books
meRouter.post("/books", async (req, res) => {
  const parsed = bookSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0].message,
    });
    return;
  }

  const { name, author, photoUrl } = parsed.data;

  const book = await prisma.book.create({
    data: {
      name,
      author,
      photoUrl: photoUrl || null,
      ownerId: currentUser(res).id,
    },
  });

  res.status(201).json(book);
});

// PATCH /api/me/books/:id
meRouter.patch("/books/:id", async (req, res) => {
  const parsed = bookSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0].message,
    });
    return;
  }

  const id = String(req.params.id);

  const existing = await prisma.book.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({
      message: "Книгу не знайдено",
    });
    return;
  }

  if (existing.ownerId !== currentUser(res).id) {
    res.status(403).json({
      message: "Ви можете редагувати лише власні книги",
    });
    return;
  }

  const { name, author, photoUrl } = parsed.data;

  const updated = await prisma.book.update({
    where: { id },
    data: {
      name,
      author,
      photoUrl: photoUrl || null,
    },
  });

  res.json(updated);
});

// DELETE /api/me/books/:id
meRouter.delete("/books/:id", async (req, res) => {
  const id = String(req.params.id);

  const existing = await prisma.book.findUnique({
    where: { id },
  });

  if (!existing) {
    res.status(404).json({
      message: "Книгу не знайдено",
    });
    return;
  }

  if (existing.ownerId !== currentUser(res).id) {
    res.status(403).json({
      message: "Ви можете видаляти лише власні книги",
    });
    return;
  }

  await prisma.book.delete({
    where: { id },
  });

  res.status(204).send();
});

// GET /api/me/overview
meRouter.get("/overview", async (_req, res) => {
  const userId = currentUser(res).id;

  const [bookCount, received, sent] =
    await Promise.all([
      prisma.book.count({
        where: { ownerId: userId },
      }),

      prisma.exchangeRequest.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          book: {
            select: {
              id: true,
              name: true,
            },
          },
          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      prisma.exchangeRequest.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          book: {
            select: {
              id: true,
              name: true,
            },
          },
          recipient: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

  res.json({
    bookCount,
    received,
    sent,
  });
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  avatarUrl: z.union([
    z.url(),
    z.literal(""),
  ]).optional(),
});

// PATCH /api/me/profile
meRouter.patch("/profile", async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Перевірте поля профілю",
    });
    return;
  }

  const { name, email, avatarUrl } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (
    existing &&
    existing.id !== currentUser(res).id
  ) {
    res.status(409).json({
      message: "Цей email вже використовується",
    });
    return;
  }

  const user = await prisma.user.update({
    where: {
      id: currentUser(res).id,
    },
    data: {
      name,
      email,
      avatarUrl: avatarUrl || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  res.json(user);
});