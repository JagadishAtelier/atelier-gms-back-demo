import express from "express";
import membershipRoutes from "./membership/routes/index.js";
import memberRoutes from "./member/routes/index.js";

const router = express.Router();

router.use("/gms", membershipRoutes);
router.use("/gms", memberRoutes);

export default router;