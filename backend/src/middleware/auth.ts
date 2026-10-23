
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone: string;
      };
    }
  }
}

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  try {
    const token = authorization.slice(7);
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.phone !== "string"
    ) {
      throw new Error("Invalid token payload");
    }

    req.user = {
      id: payload.sub,
      phone: payload.phone
    };

    next();
  } catch {
    next(new AppError(401, "Invalid or expired session"));
  }
};
