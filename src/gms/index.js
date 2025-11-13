import express from "express";
import membershipRoutes from "./membership/routes/index.js";
import memberRoutes from "./member/routes/index.js";
import dashboardRoutes from "./dashboard/routes/index.js";

const router = express.Router();

router.use("/gms", membershipRoutes);
router.use("/gms", memberRoutes);
router.use("/gms", dashboardRoutes);

export default router;