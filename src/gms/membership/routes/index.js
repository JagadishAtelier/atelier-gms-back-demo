import express from "express";
import membershipRoutes from "./membership.routes.js";

const router = express.Router();

router.use("/membership", membershipRoutes);

export default router;