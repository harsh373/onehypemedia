import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, logout, me } from "../controllers/auth.controller";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});

router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAdminAuth, me);

export default router;


//aZGSJgUpzRzVaA64
//harshsrivastava_db_user