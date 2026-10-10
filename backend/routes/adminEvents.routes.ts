import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/adminEvents.controller";
import { listEventParticipants } from "../controllers/adminPeople.controller";

const router = Router();

router.use(requireAdminAuth);

router.get("/", listEvents);
router.post("/", createEvent);
router.get("/:id", getEvent);
router.get("/:id/participants", listEventParticipants);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;