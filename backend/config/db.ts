import mongoose from "mongoose";
import { env } from "./env";

let connection: Promise<typeof mongoose> | null = null;

export function connectDB(): Promise<typeof mongoose> {
  if (!connection) {
    connection = mongoose.connect(env.mongoUri).catch((err) => {
      connection = null;
      throw err;
    });
  }
  return connection;
}