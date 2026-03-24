import express from "express";
import attendanceController from "../controller/attendance.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import { attachCompany } from "../../../middleware/company.middleware.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../dto/attendance.dto.js";

const router = express.Router();

/**
 * ============================================
 *  Attendance Routes
 * ============================================
 */

/**
 * ✅ Create Attendance Record
 * Access: Admin, Super Admin
 */
router.post(
  "/attendance",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  validate(createAttendanceSchema),
  attendanceController.create
);

/**
 * ✅ Get All Attendance Records (with filters, pagination)
 * Access: All authenticated users
 */
router.get(
  "/attendance",
  verifyToken(),
  attachCompany(),
  attendanceController.getAll
);

/**
 * ✅ Get Attendance by ID
 * Access: All authenticated users
 */
router.get(
  "/attendance/:id",
  verifyToken(),
  attachCompany(),
  attendanceController.getById
);

/**
 * ✅ Update Attendance
 * Access: Admin, Super Admin
 */
router.put(
  "/attendance/:id",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  validate(updateAttendanceSchema),
  attendanceController.update
);

/**
 * ✅ Soft Delete Attendance
 * Access: Admin, Super Admin
 */
router.delete(
  "/attendance/:id",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  attendanceController.delete
);

/**
 * ✅ Mark Member Sign In
 */
router.post(
  "/attendance/signin",
  verifyToken(),
  attachCompany(),
  attendanceController.signIn
);

/**
 * ✅ Mark Member Sign Out
 */
router.post(
  "/attendance/signout",
  verifyToken(),
  attachCompany(),
  attendanceController.signOut
);


/**
 * ✅ Restore Soft Deleted Attendance
 * Access: Admin, Super Admin
 */
router.patch(
  "/attendance/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  attachCompany(),
  attendanceController.restore
);

/**
 * ✅ Get Attendance by Member ID
 * Access: All authenticated users
 */
router.get(
  "/attendance/member/:member_id",
  verifyToken(),
  attachCompany(),
  attendanceController.getByMemberId
);

/**
 * ✅ Get Today's Attendance for a Member
 */
router.get(
  "/attendance/member/:member_id/today",
  verifyToken(),
  attachCompany(),
  attendanceController.getTodayAttendance
);

/**
 * ✅ Get Attendance Summary (Monthly / Weekly / Yearly)
 */
router.get(
  "/attendance/member/:member_id/summary",
  verifyToken(),
  attachCompany(),
  attendanceController.getSummary
);

export default router;
