import express from "express";
import membermembershipController from "../controller/membermembership.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { attachCompany  } from "../../../middleware/company.middleware.js";
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
  attachCompany(["Admin", "Super Admin"]),
  validate(createMemberMembershipSchema),
  membermembershipController.create
);

/**
 * ✅ Get All Member-Memberships
 */
router.get(
  "/membermembership",
  attachCompany(),
  membermembershipController.getAll
);

/**
 * ✅ Get Member-Membership by ID
 */
router.get(
  "/membermembership/:id",
  attachCompany(),
  membermembershipController.getById
);

/**
 * ✅ Update Member-Membership
 */
router.put(
  "/membermembership/:id",
  attachCompany(["Admin", "Super Admin"]),
  validate(updateMemberMembershipSchema),
  membermembershipController.update
);

/**
 * ✅ Soft Delete Member-Membership
 */
router.delete(
  "/membermembership/:id",
  attachCompany(["Admin", "Super Admin"]),
  membermembershipController.delete
);

/**
 * ✅ Restore Deleted Member-Membership
 */
router.patch(
  "/membermembership/:id/restore",
  attachCompany(["Admin", "Super Admin"]),
  membermembershipController.restore
);

/**
 * ✅ Active memberships
 */
router.get(
  "/membermembership/member/:member_id/active",
  attachCompany(),
  membermembershipController.getActiveByMemberId
);

/**
 * ✅ All memberships (active + expired)
 */
router.get(
  "/membermembership/member/:member_id/all",
  attachCompany(),
  membermembershipController.getAllByMemberId
);

/**
 * ✅ Pending amount
 */
router.get(
  "/membermembership/member/:member_id/pending",
  attachCompany(),
  membermembershipController.getPendingAmountByMemberId
);

/**
 * ✅ Next payment date
 */
router.get(
  "/membermembership/member/:member_id/next-payment",
  attachCompany(),
  membermembershipController.getNextPaymentDateByMemberId
);

export default router;
