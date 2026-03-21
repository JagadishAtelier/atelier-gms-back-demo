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
  attachCompany(["Admin", "Super Admin"]),
  validate(createMemberSchema),
  memberController.create
);

router.post("/member-bulk-upload", attachCompany(["Admin", "Super Admin"]),
 upload.single("file"), memberController.bulkUpload);

/**
 * ✅ Get All Members (with filters, pagination)
 * Access: All authenticated users
 */
router.get("/member", attachCompany(), memberController.getAll);

/**
 * ✅ Get Member by ID
 * Access: All authenticated users
 */
router.get("/member/:id", attachCompany(), memberController.getById);

/**
 * ✅ Update Member
 * Access: Admin, Super Admin
 */
router.put(
  "/member/:id",
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
  attachCompany(["Admin", "Super Admin"]),
  memberController.delete
);

router.get(
  "/memberbyemail",
  attachCompany(),
  memberController.getMembersbyEmail
)

/**
 * ✅ Restore Deleted Member
 * Access: Admin, Super Admin
 */
router.patch(
  "/member/:id/restore",
  attachCompany(["Admin", "Super Admin"]),
  memberController.restore
);

export default router;
