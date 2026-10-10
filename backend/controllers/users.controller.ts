import { Request, Response } from "express";
import { User } from "../models/User";
import { parseProfileUpdate } from "../utils/validateUser";
import { publicUser, publicProfile } from "../utils/publicUser";

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.session.userId);
  if (!user) {
    res.status(401).json({ success: false, message: "Not logged in." });
    return;
  }
  res.json({ success: true, data: publicUser(user) });
}

export async function updateMyProfile(req: Request, res: Response): Promise<void> {
  const { data, error } = parseProfileUpdate(req.body);
  if (!data) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  // The target user comes ONLY from the session, never from the request body.
  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(401).json({ success: false, message: "Not logged in." });
    return;
  }

  res.json({ success: true, data: publicUser(user), message: "Profile updated." });
}

export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const username = String(req.params.username).trim().toLowerCase();

  const user = await User.findOne({ username }).select("name username bio location");
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  res.json({ success: true, data: publicProfile(user) });
}