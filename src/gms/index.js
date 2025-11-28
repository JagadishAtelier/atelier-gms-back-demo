import express from "express";
import path from "path";
import membershipRoutes from "./membership/routes/index.js";
import memberRoutes from "./member/routes/index.js";
import dashboardRoutes from "./dashboard/routes/index.js";
import mailRoutes from "./mail/routes/index.js";
import planRoutes from "./plan/routes/index.js";
import gymRoutes from "./gym/routes/index.js";
import attendanceRoutes from "./attendance/routes/index.js";

const router = express.Router();

router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
router.use("/gms", membershipRoutes);
router.use("/gms", memberRoutes);
router.use("/gms", dashboardRoutes);
router.use("/gms", mailRoutes);
router.use("/gms", planRoutes);
router.use("/gms", gymRoutes);
router.use("/gms", attendanceRoutes);

export default router;