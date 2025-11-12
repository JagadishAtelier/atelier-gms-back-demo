import express from "express";
import membershipController from "../controller/membership.controller.js";
import { verifyToken } from "../../../middleware/auth.js";
import { validate } from "../../../middleware/validate.js";
import {
  createMembershipSchema,
  updateMembershipSchema,
} from "../dto/membership.dto.js";

const router = express.Router();

router.post(
  "/membership",
  verifyToken(["Admin", "Super Admin"]),
  validate(createMembershipSchema),
  membershipController.create
);

router.get(
  "/membership",
  verifyToken(),
  membershipController.getAll
);

router.get(
  "/membership/:id",
  verifyToken(),
  membershipController.getById
);


router.put(
  "/membership/:id",
  verifyToken(["Admin", "Super Admin"]),
  validate(updateMembershipSchema),
  membershipController.update
);


router.delete(
  "/membership/:id",
  verifyToken(["Admin", "Super Admin"]),
  membershipController.delete
);

router.patch(
  "/membership/:id/restore",
  verifyToken(["Admin", "Super Admin"]),
  membershipController.restore
);

export default router;