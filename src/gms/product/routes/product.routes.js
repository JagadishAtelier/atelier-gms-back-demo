import express from "express";
import productController from "../controller/product.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../dto/product.dto.js";

// ✅ DigitalOcean Spaces upload middleware
import uploadToSpacesSingle from "../../../middleware/uploadProductImage.js";

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
  ...uploadToSpacesSingle("image"),     // <-- note spread operator to use the array
  validate(createProductSchema),
  productController.create
);

/**
 * ✅ Bulk Upload Products
 * Access: Admin, Super Admin
 * (CSV / Excel – no image upload here)
 */
router.post(
  "/product-bulk-upload",
  verifyToken(["Admin", "Super Admin"]),
  productController.bulkUpload
);

/**
 * ✅ Get All Products
 */
router.get(
  "/product",
  productController.getAll
);

/**
 * ✅ Get Product by ID
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
  ...uploadToSpacesSingle("image"),  // ✅ Upload to DO Spaces
  validate(updateProductSchema),
  productController.update
);

/**
 * ✅ Soft Delete Product
 */
router.delete(
  "/product/:id",
  verifyToken(["Admin", "Super Admin"]),
  productController.delete
);

/**
 * ✅ Restore Deleted Product
 */
router.patch(
  "/product/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  productController.restore
);

export default router;
