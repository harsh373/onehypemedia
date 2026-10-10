import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  register,
  login,
  googleLogin,
  logout,
  me,
} from "../controllers/userAuth.controller";
import { requireUserAuth } from "../middleware/requireUserAuth";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again in 15 minutes.",
  },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/logout", logout);
router.get("/me", requireUserAuth, me);

export default router;