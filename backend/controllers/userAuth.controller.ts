import { Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { User } from "../models/User";
import { parseRegisterInput, parseLoginInput } from "../utils/validateUser";
import { publicUser } from "../utils/publicUser";

const googleClient = new OAuth2Client();

export async function register(req: Request, res: Response): Promise<void> {
  const { data, error } = parseRegisterInput(req.body);
  if (!data) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  const existing = await User.findOne({
    $or: [{ email: data.email }, { username: data.username }],
  }).select("email username");

  if (existing) {
    const message =
      existing.email === data.email
        ? "An account with this email already exists."
        : "That username is already taken.";
    res.status(409).json({ success: false, message });
    return;
  }

  const passwordHash = await hash(data.password, 10);
  const user = await User.create({
    name: data.name,
    username: data.username,
    email: data.email,
    passwordHash,
  });

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    req.session.userId = String(user._id);
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({
          success: false,
          message: "Something went wrong. Please try again.",
        });
        return;
      }
      res.status(201).json({
        success: true,
        data: publicUser(user),
        message: "Account created successfully.",
      });
    });
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, error } = parseLoginInput(req.body);
  if (!email || !password) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid email or password." });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({
      success: false,
      message: "This account uses Google sign-in.",
    });
    return;
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, message: "Invalid email or password." });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    req.session.userId = String(user._id);
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({
          success: false,
          message: "Something went wrong. Please try again.",
        });
        return;
      }
      res.json({ success: true, data: publicUser(user), message: "Logged in." });
    });
  });
}

async function makeUsername(seed: string): Promise<string> {
  const base = seed.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 22) || "user";
  for (let i = 0; i < 8; i++) {
    const candidate =
      i === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const taken = await User.exists({ username: candidate });
    if (!taken) return candidate;
  }
  throw new Error("Could not generate a username.");
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  if (!env.googleClientId) {
    res.status(500).json({
      success: false,
      message: "Google sign-in is not configured.",
    });
    return;
  }

  const credential: unknown = req.body?.credential;
  if (typeof credential !== "string" || !credential) {
    res.status(400).json({ success: false, message: "Missing Google credential." });
    return;
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ success: false, message: "Google sign-in failed." });
    return;
  }

  if (!payload || !payload.sub || !payload.email) {
    res.status(401).json({ success: false, message: "Google sign-in failed." });
    return;
  }

  if (!payload.email_verified) {
    res.status(401).json({
      success: false,
      message: "Your Google email is not verified.",
    });
    return;
  }

  const googleId = payload.sub;
  const email = payload.email.trim().toLowerCase();

  let user = await User.findOne({ googleId });

  if (!user) {
    const byEmail = await User.findOne({ email });
    if (byEmail) {
      // Same verified email as an existing account: link Google to it.
      byEmail.googleId = googleId;
      await byEmail.save();
      user = byEmail;
    } else {
      const displayName = (payload.name || email.split("@")[0]).trim().slice(0, 100);
      const username = await makeUsername(payload.name || email.split("@")[0]);
      try {
        user = await User.create({ name: displayName, username, email, googleId });
      } catch (err) {
        throw new Error("Could not create account.", { cause: err });
      }
    }
  }

  const loggedIn = user;

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    req.session.userId = String(loggedIn._id);
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({
          success: false,
          message: "Something went wrong. Please try again.",
        });
        return;
      }
      res.json({ success: true, data: publicUser(loggedIn), message: "Logged in." });
    });
  });
}

export function logout(req: Request, res: Response): void {
  // Only clears userId. Does NOT destroy the whole session, because the
  // same cookie can also carry an admin session (see app.ts). A full
  // destroy here would silently log out an admin on the same browser too.
  req.session.userId = undefined;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    res.json({ success: true, message: "Logged out." });
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.session.userId);
  if (!user) {
    res.status(401).json({ success: false, message: "Not logged in." });
    return;
  }
  res.json({ success: true, data: publicUser(user) });
}