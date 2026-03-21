import express from "express";
import memberDashboardController from "../controller/memberdashboard.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { attachCompany  } from "../../../middleware/company.middleware.js";
import { validate } from "../../../middleware/validate.js";

const router = express.Router();

/**
 * ✅ Get Member Dashboard
 * Access: Member (token-based), Admin, Super Admin
 * Returns: latest workout, latest diet, membership stats, notices, attendance
 */
router.get(
  "/dashboard",
  verifyToken(), // any authenticated user
  attachCompany(),
  memberDashboardController.getMemberDashboard
);

/**
 * ✅ Get all Assigned Plans by Member ID
 * Access: Member (from token), Admin, Super Admin
 */
// router.get(
//   "/dashboard/assignplans",
//   verifyToken(),
//   memberDashboardController.getAllAssignPlans
// );

export default router;
