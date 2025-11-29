import express from "express";
import dashboardRoutes from "./dashboard.routes.js";
import memberdashboardRoutes from "./memberdashboard.routes.js";

const router = express.Router();

router.use("/dashboard", dashboardRoutes);
router.use("/memberdashboard", memberdashboardRoutes);

export default router;
