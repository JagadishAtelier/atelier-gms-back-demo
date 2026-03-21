import express from "express";
import membermeasurementController from "../controller/membermeasurement.contrroller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { attachCompany  } from "../../../middleware/company.middleware.js";
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
  attachCompany (),
  validate(createMemberMeasurementSchema),
  membermeasurementController.create
);

/**
 * ✅ Get All Measurements (with filters + pagination)
 * Access: All authenticated users
 */
router.get(
  "/membermeasurement",
  attachCompany (),
  membermeasurementController.getAll
);

/**
 * ✅ Get Measurement by ID
 * Access: All authenticated users
 */
router.get(
  "/membermeasurement/:id",
  attachCompany (),
  membermeasurementController.getById
);

/**
 * ✅ Get All Measurements for a Member
 * Access: All authenticated users
 */
router.get(
  "/membermeasurement/member/:member_id",
  attachCompany (),
  membermeasurementController.getByMemberId
);

/**
 * ✅ Update Measurement
 * Access: Admin, Super Admin
 */
router.put(
  "/membermeasurement/:id",
  attachCompany (["Admin", "Super Admin"]),
  validate(updateMemberMeasurementSchema),
  membermeasurementController.update
);

/**
 * ✅ Soft Delete Measurement
 * Access: Admin, Super Admin
 */
router.delete(
  "/membermeasurement/:id",
  attachCompany (["Admin", "Super Admin"]),
  membermeasurementController.delete
);

/**
 * ✅ Restore Measurement
 * Access: Admin, Super Admin
 */
router.patch(
  "/membermeasurement/:id/restore",
  attachCompany (["Admin", "Super Admin"]),
  membermeasurementController.restore
);

export default router;
