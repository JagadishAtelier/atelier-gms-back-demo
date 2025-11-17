import express from "express";
import planController from "../controller/plan.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import { createPlanSchema, updatePlanSchema } from "../dto/plan.dto.js";

import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

/* ---------------------------------------------------
   📂 Ensure Upload Folder Exists
--------------------------------------------------- */

const uploadDir = path.join(process.cwd(), "uploads", "plan");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created folder:", uploadDir);
}

/* ---------------------------------------------------
   📂 Multer Storage Config
--------------------------------------------------- */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // folder guaranteed to exist
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname)); // keep original extension
  },
});

const upload = multer({ storage });

/* ---------------------------------------------------
   🛡 Wrapper → Makes File Upload OPTIONAL
--------------------------------------------------- */

const optionalUpload = (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) return res.sendError("Image upload failed");
    next();
  });
};

/* ---------------------------------------------------
   📝 ROUTES
--------------------------------------------------- */

/**
 * ✅ Create Plan (optional image upload)
 */
router.post(
  "/plan",
  verifyToken(["Admin", "Super Admin"]),
  optionalUpload,          // <-- FIXED ✔
  validate(createPlanSchema),
  planController.create
);

/**
 * ✅ Get All Plans (search, filter, pagination)
 */
router.get("/plan", verifyToken(), planController.getAll);

/**
 * ✅ Get Plan by ID
 */
router.get("/plan/:id", verifyToken(), planController.getById);

/**
 * ✅ Update Plan (optional image upload)
 */
router.put(
  "/plan/:id",
  verifyToken(["Admin", "Super Admin"]),
  optionalUpload,          // <-- FIXED ✔
  validate(updatePlanSchema),
  planController.update
);

/**
 * ❌ Soft Delete Plan
 */
router.delete(
  "/plan/:id",
  verifyToken(["Admin", "Super Admin"]),
  planController.delete
);

/**
 * ♻ Restore Deleted Plan
 */
router.patch(
  "/plan/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  planController.restore
);

export default router;
