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
 * ✅ Get All Member-Memberships
 */
router.get(
  "/membermembership",
  verifyToken(),
  membermembershipController.getAll
);

/**
 * ✅ Get Member-Membership by ID
 */
router.get(
  "/membermembership/:id",
  verifyToken(),
  membermembershipController.getById
);

/**
 * ✅ Update Member-Membership
 */
router.put(
  "/membermembership/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updateMemberMembershipSchema),
  membermembershipController.update
);

/**
 * ✅ Soft Delete Member-Membership
 */
router.delete(
  "/membermembership/:id",
  verifyToken(["Admin", "Super Admin"]),
  membermembershipController.delete
);

/**
 * ✅ Restore Deleted Member-Membership
 */
router.patch(
  "/membermembership/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  membermembershipController.restore
);

/**
 * ✅ Active memberships
 */
router.get(
  "/membermembership/member/:member_id/active",
  verifyToken(),
  membermembershipController.getActiveByMemberId
);

/**
 * ✅ All memberships (active + expired)
 */
router.get(
  "/membermembership/member/:member_id/all",
  verifyToken(),
  membermembershipController.getAllByMemberId
);

/**
 * ✅ Pending amount
 */
router.get(
  "/membermembership/member/:member_id/pending",
  verifyToken(),
  membermembershipController.getPendingAmountByMemberId
);

/**
 * ✅ Next payment date
 */
router.get(
  "/membermembership/member/:member_id/next-payment",
  verifyToken(),
  membermembershipController.getNextPaymentDateByMemberId
);

export default router;
