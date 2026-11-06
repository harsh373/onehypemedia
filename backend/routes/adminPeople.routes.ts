import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import {
  listUsers,
  getUser,
  updateParticipation,
  checkInParticipation,
  deleteParticipation,
} from "../controllers/adminPeople.controller";

const router = Router();

router.get("/users", requireAdminAuth, listUsers);
router.get("/users/:id", requireAdminAuth, getUser);
router.patch("/participations/:id", requireAdminAuth, updateParticipation);
router.patch(
  "/participations/:id/check-in",
  requireAdminAuth,
  checkInParticipation
);
router.delete("/participations/:id", requireAdminAuth, deleteParticipation);

export default router;