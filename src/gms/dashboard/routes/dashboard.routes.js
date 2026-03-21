import express from "express";
import dashboardController from "../controller/dashboard.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { attachCompany } from "../../../middleware/company.middleware.js";
const router = express.Router();

router.get(
  "/dashboard",
  verifyToken(),
  attachCompany(),
  dashboardController.getDashboard
);

export default router;
