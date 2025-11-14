import express from "express";
import planController from "../controller/plan.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createPlanSchema,
  updatePlanSchema,
} from "../dto/plan.dto.js";

const router = express.Router();

/**
 * ✅ Create Plan
 * Access: Admin, Super Admin
 */
router.post(
  "/plan",
  verifyToken(["Admin", "Super Admin"]),
  validate(createPlanSchema),
  planController.create
);

/**
 * ✅ Get All Plans (filters, pagination, search)
 * Access: All authenticated users
 */
router.get("/plan", verifyToken(), planController.getAll);

/**
 * ✅ Get Plan by ID
 * Access: All authenticated users
 */
router.get("/plan/:id", verifyToken(), planController.getById);

/**
 * ✅ Update Plan
 * Access: Admin, Super Admin
 */
router.put(
  "/plan/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updatePlanSchema),
  planController.update
);

/**
 * ✅ Soft Delete Plan
 * Access: Admin, Super Admin
 */
router.delete(
  "/plan/:id",
  verifyToken(["Admin", "Super Admin"]),
  planController.delete
);

/**
 * ✅ Restore Deleted Plan
 * Access: Admin, Super Admin
 */
router.patch(
  "/plan/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  planController.restore
);

export default router;
