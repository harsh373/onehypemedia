import { Request, Response, NextFunction } from "express";

export function requireUserAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session?.userId) {
    next();
    return;
  }
  res.status(401).json({ success: false, message: "Please log in." });
}