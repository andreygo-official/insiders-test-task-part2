import type {
    Request,
    Response,
    NextFunction,
  } from "express";
  
  import jwt from "jsonwebtoken";
  import { prisma } from "../lib/prisma.js";
  
  export type SessionUser = {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
  };
  
  export function currentUser(res: Response): SessionUser {
    return res.locals.user as SessionUser;
  }
  
  export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authorization = req.header("Authorization");
  
      const token = authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;
  
      if (!token) {
        res.status(401).json({
          message: "Авторизуйтеся, щоб продовжити",
        });
        return;
      }
  
      const secret = process.env.JWT_SECRET;
  
      if (!secret) {
        throw new Error("JWT_SECRET is missing");
      }
  
      const decoded = jwt.verify(token, secret);
  
      if (
        typeof decoded === "string" ||
        typeof decoded.userId !== "string"
      ) {
        res.status(401).json({
          message: "Недійсний токен",
        });
        return;
      }
  
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
  
      if (!user) {
        res.status(401).json({
          message: "Користувача не знайдено",
        });
        return;
      }
  
      res.locals.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          message: "Недійсний або прострочений токен",
        });
        return;
      }
  
      next(error);
    }
  }
  
  export function requireAdmin(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (currentUser(res).role !== "ADMIN") {
      res.status(403).json({
        message: "Доступ дозволений лише адміністратору",
      });
      return;
    }
  
    next();
  }