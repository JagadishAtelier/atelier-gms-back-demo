import express from "express";
import {
  sendOTP,
  verifyOTPAndCreateCompany,
} from "../Controller/company.controller.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTPAndCreateCompany);

export default router;