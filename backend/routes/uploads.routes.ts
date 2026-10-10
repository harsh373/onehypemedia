import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { signUpload } from "../controllers/uploads.controller";

const router = Router();

router.use(requireAdminAuth);
router.post("/sign", signUpload);

export default router;