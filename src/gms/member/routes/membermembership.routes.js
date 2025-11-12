import express from "express";
import membermembershipController from "../controller/membermembership.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createMemberMembershipSchema,
  updateMemberMembershipSchema,
} from "../dto/membermembership.dto.js";

const router = express.Router();

/**
 * ✅ Create Member-Membership Relation
 * Access: Admin, Super Admin
 */
router.post(
  "/membermembership",
  verifyToken(["Admin", "Super Admin"]),
  validate(createMemberMembershipSchema),
  membermembershipController.create
);

/**
 * ✅ Get All Member-Memberships (with filters, pagination)
 * Access: All authenticated users
 */
router.get(
  "/membermembership",
  verifyToken(),
  membermembershipController.getAll
);

/**
 * ✅ Get Member-Membership by ID
 * Access: All authenticated users
 */
router.get(
  "/membermembership/:id",
  verifyToken(),
  membermembershipController.getById
);

/**
 * ✅ Update Member-Membership
 * Access: Admin, Super Admin
 */
router.put(
  "/membermembership/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updateMemberMembershipSchema),
  membermembershipController.update
);

/**
 * ✅ Soft Delete Member-Membership
 * Access: Admin, Super Admin
 */
router.delete(
  "/membermembership/:id",
  verifyToken(["Admin", "Super Admin"]),
  membermembershipController.delete
);

/**
 * ✅ Restore Deleted Member-Membership
 * Access: Admin, Super Admin
 */
router.patch(
  "/membermembership/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  membermembershipController.restore
);

export default router;
