import express from "express";
import remainderMailController from "../controller/remaindermail.controller.js";
import { verifyToken } from "../../../middleware/auth.js";

const router = express.Router();

router.post(
  "/remaindermail/send-all",
  verifyToken(["Admin", "Super Admin"]),
  remainderMailController.sendAllReminders
);

router.post(
  "/remaindermail/send/:id",
  verifyToken(["Admin", "Super Admin"]),
  remainderMailController.sendSingleReminder
);


router.post(
  "/remaindermail/member/:member_id/next-payment",
  verifyToken(["Admin", "Super Admin"]),
  remainderMailController.sendNextPaymentReminderByMemberId
);

export default router;
