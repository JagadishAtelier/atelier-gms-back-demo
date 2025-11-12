import express from "express";
import memberRouter from "./member.routes.js";
import membermembershipRouter from "./membermembership.routes.js";

const router = express.Router();

router.use("/member", memberRouter);
router.use("/uploads", express.static("uploads"));
router.use("/member", membermembershipRouter);


export default router;