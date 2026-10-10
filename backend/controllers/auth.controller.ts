import { Request, Response } from "express";
import { compare } from "bcryptjs";
import { env } from "../config/env";

const COOKIE_NAME = "onehype.sid";

export async function login(req: Request, res: Response): Promise<void> {
  const password = req.body?.password;

  if (typeof password !== "string" || password.length === 0) {
    res.status(400).json({ success: false, message: "Password is required." });
    return;
  }

  const valid = await compare(password, env.adminPasswordHash);
  if (!valid) {
    res.status(401).json({ success: false, message: "Invalid password." });
    return;
  }

  req.session.regenerate((regenErr) => {
    if (regenErr) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    req.session.isAdmin = true;
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({
          success: false,
          message: "Something went wrong. Please try again.",
        });
        return;
      }
      res.json({ success: true, message: "Logged in." });
    });
  });
}

export function logout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: env.isProd ? "none" : "lax",
    });
    res.json({ success: true, message: "Logged out." });
  });
}

export function me(_req: Request, res: Response): void {
  res.json({ success: true, data: { isAdmin: true } });
}