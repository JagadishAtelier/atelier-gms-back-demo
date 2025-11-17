import express from "express";
import path from "path";
import planRouter from "./plan.routes.js";

const router = express.Router();

router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
router.use("/plan", planRouter);


export default router;