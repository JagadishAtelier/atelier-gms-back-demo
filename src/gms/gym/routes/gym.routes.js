import express from "express";
import gymController from "../controller/gym.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import { createGymSchema, updateGymSchema } from "../dto/gym.dto.js";

import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

/* ---------------------------------------------------
   📂 Ensure Upload Folder Exists (Gym Images)
--------------------------------------------------- */

const uploadDir = path.join(process.cwd(), "uploads", "gym");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created folder:", uploadDir);
}

/* ---------------------------------------------------
   📂 Multer Storage Config
--------------------------------------------------- */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ---------------------------------------------------
   🛡 Optional Upload (image is optional)
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
 * ✅ Create Gym
 */
router.post(
  "/gym",
  verifyToken(["Admin", "Super Admin"]),
  optionalUpload,
  validate(createGymSchema),
  gymController.create
);

/**
 * 📄 Get All Gyms (pagination, search, filters)
 */
router.get("/gym", verifyToken(), gymController.getAll);

/**
 * 📄 Get Gym by ID
 */
router.get("/gym/:id", verifyToken(), gymController.getById);

/**
 * ♻ Update Gym (optional image upload)
 */
router.put(
  "/gym/:id",
  verifyToken(["Admin", "Super Admin"]),
  optionalUpload,
  validate(updateGymSchema),
  gymController.update
);

/**
 * ❌ Soft Delete Gym
 */
router.delete(
  "/gym/:id",
  verifyToken(["Admin", "Super Admin"]),
  gymController.delete
);

/**
 * ♻ Restore Gym
 */
router.patch(
  "/gym/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  gymController.restore
);

export default router;
