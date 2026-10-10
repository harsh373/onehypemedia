import { Router } from "express";
import { requireUserAuth } from "../middleware/requireUserAuth";
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
} from "../controllers/users.controller";
import { listMyParticipations } from "../controllers/participation.controller";

const router = Router();

router.get("/me/profile", requireUserAuth, getMyProfile);
router.put("/me/profile", requireUserAuth, updateMyProfile);
router.get("/me/participations", requireUserAuth, listMyParticipations);
router.get("/:username", getPublicProfile);

export default router;