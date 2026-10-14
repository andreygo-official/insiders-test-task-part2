import { Router } from "express";

import { prisma } from "../lib/prisma.js";

import {
  currentUser,
  requireAdmin,
  requireAuth,
} from "../middleware/auth.js";

import { sendExchangeEmail } from "../services/email.service.js";

export const booksRouter = Router();

// GET /api/books
booksRouter.get("/", async (req, res) => {
  const search = String(req.query.search ?? "")
    .trim()
    .slice(0, 100);

  const sort = req.query.sort === "desc"
    ? "desc"
    : "asc";

  const requestedPage = Number(req.query.page ?? 1);
  const requestedLimit = Number(req.query.limit ?? 8);

  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(24, Math.max(1, Math.floor(requestedLimit)))
    : 8;

  const where = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            author: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      orderBy: [
        { name: sort },
        { id: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.book.count({ where }),
  ]);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /api/books/:id
booksRouter.get("/:id", async (req, res) => {
  const book = await prisma.book.findUnique({
    where: {
      id: String(req.params.id),
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!book) {
    res.status(404).json({
      message: "Книгу не знайдено",
    });
    return;
  }

  res.json(book);
});

// POST /api/books/:id/exchange
booksRouter.post(
  "/:id/exchange",
  requireAuth,
  async (req, res) => {
    const sender = currentUser(res);

    const book = await prisma.book.findUnique({
      where: {
        id: String(req.params.id),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!book) {
      res.status(404).json({
        message: "Книгу не знайдено",
      });
      return;
    }

    if (book.ownerId === sender.id) {
      res.status(403).json({
        message: "Не можна запросити обмін власної книги",
      });
      return;
    }

    const offeredBooks = await prisma.book.findMany({
      where: {
        ownerId: sender.id,
      },
      select: {
        name: true,
        author: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    try {
      await sendExchangeEmail({
        recipientEmail: book.owner.email,
        recipientName: book.owner.name,
        senderEmail: sender.email,
        senderName: sender.name,
        requestedBook: {
          name: book.name,
          author: book.author,
        },
        offeredBooks,
      });
    } catch (error) {
      console.error("Email sending failed:", error);

      res.status(502).json({
        message: "Не вдалося надіслати email власнику книги",
      });
      return;
    }

    const exchangeRequest =
      await prisma.exchangeRequest.create({
        data: {
          senderId: sender.id,
          recipientId: book.ownerId,
          bookId: book.id,
        },
      });

    res.status(201).json({
      message: "Запит на обмін успішно надіслано",
      request: exchangeRequest,
    });
  }
);

// DELETE /api/books/:id
// Admin may delete any user's book.
booksRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const id = String(req.params.id);

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      res.status(404).json({
        message: "Книгу не знайдено",
      });
      return;
    }

    await prisma.book.delete({
      where: { id },
    });

    res.status(204).send();
  }
);