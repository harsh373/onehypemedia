import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    bio: { type: String, trim: true, maxlength: 500, default: "" },
    location: { type: String, trim: true, maxlength: 150, default: "" },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);