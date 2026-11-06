import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  updateRegistration,
  deleteEvent,
} from "../controllers/adminEvents.controller";
import { listEventParticipants } from "../controllers/adminPeople.controller";
import { listBlasts, sendBlast } from "../controllers/adminBlasts.controller";
import { getInsights } from "../controllers/adminInsights.controller";

const router = Router();

// Test sends count too. The limit is per server instance, so it is a safety net, not a hard wall.
const blastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many emails sent. Try again later." },
});

router.use(requireAdminAuth);

router.get("/", listEvents);
router.post("/", createEvent);
router.get("/:id", getEvent);
router.get("/:id/participants", listEventParticipants);
router.get("/:id/insights", getInsights);
router.get("/:id/blasts", listBlasts);
router.post("/:id/blasts", blastLimiter, sendBlast);
router.patch("/:id/registration", updateRegistration);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;