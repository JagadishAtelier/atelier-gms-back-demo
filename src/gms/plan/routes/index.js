import express from "express";
import planRouter from "./plan.routes.js";

const router = express.Router();

router.use("/plan", planRouter);

export default router;