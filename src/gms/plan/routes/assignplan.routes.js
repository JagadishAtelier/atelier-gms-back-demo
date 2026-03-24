import express from "express";
import assignPlanController from "../controller/assignplan.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { attachCompany } from "../../../middleware/company.middleware.js";
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
  attachCompany(),
  validate(createAssignPlanSchema),
  assignPlanController.create
);

/**
 * ✅ Get All Assigned Plans (search, filtering, pagination)
 */
router.get("/assignplan", verifyToken(),attachCompany(), assignPlanController.getAll);

/**
 * ✅ Get assigned plan by ID
 */
router.get("/assignplan/:id", verifyToken(),attachCompany(), assignPlanController.getById);

router.get("/assignplanbymemberid", verifyToken(),attachCompany(), assignPlanController.getAssignedPlansByMemberId );

/**
 * ✅ Update assigned plan
 */
router.put(
  "/assignplan/:id",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  validate(updateAssignPlanSchema),
  assignPlanController.update
);

/**
 * ❌ Soft Delete assigned plan
 */
router.delete(
  "/assignplan/:id",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  assignPlanController.delete
);

/**
 * ♻ Restore soft-deleted assigned plan
 */
router.patch(
  "/assignplan/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  assignPlanController.restore
);

export default router;