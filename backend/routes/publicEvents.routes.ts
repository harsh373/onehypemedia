import { Router } from "express";
import {
  listPublicEvents,
  getPublicEvent,
} from "../controllers/publicEvents.controller";

const router = Router();

router.get("/", listPublicEvents);
router.get("/:slug", getPublicEvent);

export default router;