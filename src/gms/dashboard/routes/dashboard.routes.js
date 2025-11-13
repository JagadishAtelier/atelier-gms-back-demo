import express from "express";
import dashboardController from "../controller/dashboard.controller.js";
import { verifyToken } from "../../../middleware/auth.js";

const router = express.Router();

router.get(
  "/dashboard",
  verifyToken(),
  dashboardController.getDashboard
);

export default router;
