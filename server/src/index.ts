import "dotenv/config";

import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes.js";
import { booksRouter } from "./routes/books.routes.js";
import { meRouter } from "./routes/me.routes.js";
import { adminRouter } from "./routes/admin.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ||
      "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

// Application routes
app.use("/api/auth", authRouter);
app.use("/api/books", booksRouter);
app.use("/api/me", meRouter);
app.use("/api/admin", adminRouter);

// Unknown routes
app.use((_req, res) => {
  res.status(404).json({
    message: "Маршрут не знайдено",
  });
});

// Global error handler
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);

    res.status(500).json({
      message: "Внутрішня помилка сервера",
    });
  }
);

const port = Number(process.env.PORT || 5001);

app.listen(port, () => {
  console.log(
    `API running at http://localhost:${port}`
  );
});