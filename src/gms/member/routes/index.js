import express from "express";
import memberRouter from "./member.routes.js";
import membermembershipRouter from "./membermembership.routes.js";
import memberMeasurementRouter from "./membermeasurement.routes.js";

const router = express.Router();

router.use("/member", memberRouter);
router.use("/uploads", express.static("uploads"));
router.use("/member", membermembershipRouter);
router.use("/member", memberMeasurementRouter);


export default router;