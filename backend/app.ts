import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import adminEventsRoutes from "./routes/adminEvents.routes";
import adminPeopleRoutes from "./routes/adminPeople.routes";
import publicEventsRoutes from "./routes/publicEvents.routes";
import participationRoutes from "./routes/participation.routes";
import uploadsRoutes from "./routes/uploads.routes";
import userAuthRoutes from "./routes/userAuth.routes";
import usersRoutes from "./routes/users.routes";
import { errorHandler } from "./middleware/errorHandler";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    userId?: string;
  }
}

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(
  session({
    name: "onehype.sid",
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.mongoUri,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: env.isProd,
      sameSite: env.isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use(async (_req, _res, next) => {
  await connectDB();
  next();
});

app.use("/api/admin", authRoutes);
app.use("/api/admin/events", adminEventsRoutes);
app.use("/api/admin/uploads", uploadsRoutes);
app.use("/api/admin", adminPeopleRoutes);
app.use("/api/events", participationRoutes);
app.use("/api/events", publicEventsRoutes);
app.use("/api/auth", userAuthRoutes);
app.use("/api/users", usersRoutes);

app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

export default app;