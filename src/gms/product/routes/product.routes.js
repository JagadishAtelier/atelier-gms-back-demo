import express from "express";
import productController from "../controller/product.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../dto/product.dto.js";
import multer from "multer";

// use memory storage (controller writes file to directory)
const upload = multer();

const router = express.Router();

/**
 * ✅ Create Product
 * Access: Admin, Super Admin
 * Accepts multipart/form-data
 * Image field name: "image"
 */
router.post(
  "/product",
  verifyToken(["Admin", "Super Admin"]),
  upload.single("image"),          // 🔹 image upload
  validate(createProductSchema),   // 🔹 validate body fields
  productController.create
);

/**
 * ✅ Bulk Upload Products
 * Access: Admin, Super Admin
 */
router.post(
  "/product-bulk-upload",
  verifyToken(["Admin", "Super Admin"]),
  upload.single("file"),
  productController.bulkUpload
);

/**
 * ✅ Get All Products (with filters, pagination)
 * Access: All authenticated users
 */
router.get(
  "/product",
  productController.getAll
);

/**
 * ✅ Get Product by ID
 * Access: All authenticated users
 */
router.get(
  "/product/:id",
  productController.getById
);

/**
 * ✅ Update Product
 * Access: Admin, Super Admin
 * Accepts multipart/form-data
 * Image field name: "image"
 */
router.put(
  "/product/:id",
  verifyToken(["Admin", "Super Admin"]),
  upload.single("image"),          // 🔹 image upload
  validate(updateProductSchema),
  productController.update
);

/**
 * ✅ Soft Delete Product
 * Access: Admin, Super Admin
 */
router.delete(
  "/product/:id",
  verifyToken(["Admin", "Super Admin"]),
  productController.delete
);

/**
 * ✅ Restore Deleted Product
 * Access: Admin, Super Admin
 */
router.patch(
  "/product/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  productController.restore
);

export default router;
