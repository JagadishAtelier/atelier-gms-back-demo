import express from "express";
import memberController from "../controller/member.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { attachCompany } from "../../../middleware/company.middleware.js";
import { validate } from "../../../middleware/validate.js";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../dto/member.dto.js";
import multer from "multer";
const upload = multer();

const router = express.Router();

/**
 * ✅ Create Member
 * Access: Admin, Super Admin
 */
router.post(
  "/member",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  validate(createMemberSchema),
  memberController.create
);

router.post("/member-bulk-upload", verifyToken(["Admin", "Super Admin"]),attachCompany(),
 upload.single("file"), memberController.bulkUpload);

/**
 * ✅ Get All Members (with filters, pagination)
 * Access: All authenticated users
 */
router.get("/member", verifyToken(),attachCompany(), memberController.getAll);

/**
 * ✅ Get Member by ID
 * Access: All authenticated users
 */
router.get("/member/:id", verifyToken(),attachCompany(), memberController.getById);

/**
 * ✅ Update Member
 * Access: Admin, Super Admin
 */
router.put(
  "/member/:id",
  verifyToken(),
  attachCompany(),
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
  attachCompany(),
  memberController.delete
);

router.get(
  "/memberbyemail",
  verifyToken(),
  attachCompany(),
  memberController.getMembersbyEmail
)

/**
 * ✅ Restore Deleted Member
 * Access: Admin, Super Admin
 */
router.patch(
  "/member/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  memberController.restore
);

export default router;
