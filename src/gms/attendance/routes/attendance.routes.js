import express from "express";
import attendanceController from "../controller/attendance.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
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
  attendanceController.getAll
);

/**
 * ✅ Get Attendance by ID
 * Access: All authenticated users
 */
router.get(
  "/attendance/:id",
  verifyToken(),
  attendanceController.getById
);

/**
 * ✅ Update Attendance
 * Access: Admin, Super Admin
 */
router.put(
  "/attendance/:id",
  verifyToken(["Admin", "Super Admin"]),
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
  attendanceController.delete
);

/**
 * ✅ Mark Member Sign In
 */
router.post(
  "/attendance/signin",
  verifyToken(),
  attendanceController.signIn
);

/**
 * ✅ Mark Member Sign Out
 */
router.post(
  "/attendance/signout",
  verifyToken(),
  attendanceController.signOut
);


/**
 * ✅ Restore Soft Deleted Attendance
 * Access: Admin, Super Admin
 */
router.patch(
  "/attendance/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  attendanceController.restore
);

/**
 * ✅ Get Attendance by Member ID
 * Access: All authenticated users
 */
router.get(
  "/attendance/member/:member_id",
  verifyToken(),
  attendanceController.getByMemberId
);

/**
 * ✅ Get Today's Attendance for a Member
 */
router.get(
  "/attendance/member/:member_id/today",
  verifyToken(),
  attendanceController.getTodayAttendance
);

/**
 * ✅ Get Attendance Summary (Monthly / Weekly / Yearly)
 */
router.get(
  "/attendance/member/:member_id/summary",
  verifyToken(),
  attendanceController.getSummary
);

export default router;
