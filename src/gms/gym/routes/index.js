import express from "express";
import path from "path";
import gymRouter from "./gym.routes.js";

const router = express.Router();

router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
router.use("/gym", gymRouter);

export default router;