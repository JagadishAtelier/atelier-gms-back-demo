import express from "express";
import assignPlanController from "../controller/assignplan.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";

import {
  createAssignPlanSchema,
  updateAssignPlanSchema,
} from "../dto/assignplan.dto.js";

const router = express.Router();

/**
 * ✅ Create Assign Plan
 */
router.post(
  "/assignplan",
  verifyToken(["Admin", "Super Admin"]),
  validate(createAssignPlanSchema),
  assignPlanController.create
);

/**
 * ✅ Get All Assigned Plans (search, filtering, pagination)
 */
router.get("/assignplan", verifyToken(), assignPlanController.getAll);

/**
 * ✅ Get assigned plan by ID
 */
router.get("/assignplan/:id", verifyToken(), assignPlanController.getById);

router.get("/assignplanbymemberid", verifyToken(), assignPlanController.getAssignedPlansByMemberId );

/**
 * ✅ Update assigned plan
 */
router.put(
  "/assignplan/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updateAssignPlanSchema),
  assignPlanController.update
);

/**
 * ❌ Soft Delete assigned plan
 */
router.delete(
  "/assignplan/:id",
  verifyToken(["Admin", "Super Admin"]),
  assignPlanController.delete
);

/**
 * ♻ Restore soft-deleted assigned plan
 */
router.patch(
  "/assignplan/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  assignPlanController.restore
);

export default router;