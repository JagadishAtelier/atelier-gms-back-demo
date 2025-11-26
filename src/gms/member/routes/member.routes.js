import express from "express";
import memberController from "../controller/member.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../dto/member.dto.js";

const router = express.Router();

/**
 * ✅ Create Member
 * Access: Admin, Super Admin
 */
router.post(
  "/member",
  verifyToken(["Admin", "Super Admin"]),
  validate(createMemberSchema),
  memberController.create
);

/**
 * ✅ Get All Members (with filters, pagination)
 * Access: All authenticated users
 */
router.get("/member", verifyToken(), memberController.getAll);

/**
 * ✅ Get Member by ID
 * Access: All authenticated users
 */
router.get("/member/:id", verifyToken(), memberController.getById);

/**
 * ✅ Update Member
 * Access: Admin, Super Admin
 */
router.put(
  "/member/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updateMemberSchema),
  memberController.update
);

/**
 * ✅ Soft Delete Member
 * Access: Admin, Super Admin
 */
router.delete(
  "/member/:id",
  verifyToken(["Admin", "Super Admin"]),
  memberController.delete
);

router.get(
  "/memberbyemail",
  verifyToken(),
  memberController.getMembersbyEmail
)

/**
 * ✅ Restore Deleted Member
 * Access: Admin, Super Admin
 */
router.patch(
  "/member/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  memberController.restore
);

export default router;
