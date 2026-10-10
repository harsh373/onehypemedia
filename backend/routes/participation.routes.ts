import { Router } from "express";
import { requireUserAuth } from "../middleware/requireUserAuth";
import {
  participate,
  cancelParticipation,
  getMyParticipation,
} from "../controllers/participation.controller";

const router = Router();

router.post("/:id/participate", requireUserAuth, participate);
router.delete("/:id/participate", requireUserAuth, cancelParticipation);
router.get("/:id/participation", requireUserAuth, getMyParticipation);

export default router;