import express from "express";
import membermeasurementController from "../controller/membermeasurement.contrroller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createMemberMeasurementSchema,
  updateMemberMeasurementSchema,
} from "../dto/membermeasurement.dto.js";

const router = express.Router();

/**
 * ✅ Create Member Measurement
 * Access: Admin, Super Admin
 */
router.post(
  "/membermeasurement",
  verifyToken(),
  validate(createMemberMeasurementSchema),
  membermeasurementController.create
);

/**
 * ✅ Get All Measurements (with filters + pagination)
 * Access: All authenticated users
 */
router.get(
  "/membermeasurement",
  verifyToken(),
  membermeasurementController.getAll
);

/**
 * ✅ Get Measurement by ID
 * Access: All authenticated users
 */
router.get(
  "/membermeasurement/:id",
  verifyToken(),
  membermeasurementController.getById
);

/**
 * ✅ Get All Measurements for a Member
 * Access: All authenticated users
 */
router.get(
  "/membermeasurement/member/:member_id",
  verifyToken(),
  membermeasurementController.getByMemberId
);

/**
 * ✅ Update Measurement
 * Access: Admin, Super Admin
 */
router.put(
  "/membermeasurement/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updateMemberMeasurementSchema),
  membermeasurementController.update
);

/**
 * ✅ Soft Delete Measurement
 * Access: Admin, Super Admin
 */
router.delete(
  "/membermeasurement/:id",
  verifyToken(["Admin", "Super Admin"]),
  membermeasurementController.delete
);

/**
 * ✅ Restore Measurement
 * Access: Admin, Super Admin
 */
router.patch(
  "/membermeasurement/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  membermeasurementController.restore
);

export default router;
