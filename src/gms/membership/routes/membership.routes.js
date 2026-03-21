import express from "express";
import membershipController from "../controller/membership.controller.js";
import { attachCompany } from "../../../middleware/company.middleware.js";
import { validate } from "../../../middleware/validate.js";
import {
  createMembershipSchema,
  updateMembershipSchema,
} from "../dto/membership.dto.js";

const router = express.Router();

router.post(
  "/membership",
  attachCompany(["Admin", "Super Admin"]),
  validate(createMembershipSchema),
  membershipController.create
);

router.get(
  "/membership",
  attachCompany(),
  membershipController.getAll
);

router.get(
  "/membership/:id",
  attachCompany(),
  membershipController.getById
);


router.put(
  "/membership/:id",
  attachCompany(["Admin", "Super Admin"]),
  validate(updateMembershipSchema),
  membershipController.update
);


router.delete(
  "/membership/:id",
  attachCompany(["Admin", "Super Admin"]),
  membershipController.delete
);

router.patch(
  "/membership/:id/restore",
  attachCompany(["Admin", "Super Admin"]),
  membershipController.restore
);

export default router;