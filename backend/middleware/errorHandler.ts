import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  const e = err as { code?: number; name?: string; message?: string };

  if (e?.code === 11000) {
    res.status(409).json({
      success: false,
      message: "An event with this title already exists. Please try again.",
    });
    return;
  }
  if (e?.name === "CastError") {
    res.status(400).json({ success: false, message: "Invalid ID." });
    return;
  }
  if (e?.name === "ValidationError") {
    res.status(400).json({ success: false, message: "Invalid input." });
    return;
  }

  const message = env.isProd
    ? "Something went wrong. Please try again."
    : e?.message ?? "Unknown error";
  res.status(500).json({ success: false, message });
}