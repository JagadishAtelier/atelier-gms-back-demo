import express from "express";
import attendanceRoutes from "./attendance.routes.js";

const router = express.Router();

router.use("/attendance", attendanceRoutes);

export default router;