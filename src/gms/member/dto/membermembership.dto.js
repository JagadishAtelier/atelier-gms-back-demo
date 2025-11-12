import { z } from "zod";

// ✅ Enums for validation
const paymentStatusEnum = z.enum(["paid", "unpaid"], {
  required_error: "Payment status must be either 'paid' or 'unpaid'",
});

const membershipStatusEnum = z.enum(["active", "expired", "cancelled"], {
  required_error: "Status must be 'active', 'expired', or 'cancelled'",
});

// ✅ Create MemberMembership Schema
export const createMemberMembershipSchema = z.object({
  member_id: z
    .string({ required_error: "Member ID is required" })
    .uuid("Invalid Member ID format"),

  membership_id: z
    .string({ required_error: "Membership ID is required" })
    .uuid("Invalid Membership ID format"),

  start_date: z.preprocess(
    (val) => (val ? new Date(val) : undefined),
    z.date({ required_error: "Start date is required" })
  ),

  end_date: z.preprocess(
    (val) => (val ? new Date(val) : undefined),
    z.date({ required_error: "End date is required" })
  ),

  payment_status: paymentStatusEnum.default("unpaid"),
  status: membershipStatusEnum.default("active"),
  is_active: z.boolean().optional().default(true),

  // Optional metadata for audit trail
  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// ✅ Update MemberMembership Schema
export const updateMemberMembershipSchema = z.object({
  start_date: z
    .preprocess((val) => (val ? new Date(val) : undefined), z.date().optional())
    .optional(),

  end_date: z
    .preprocess((val) => (val ? new Date(val) : undefined), z.date().optional())
    .optional(),

  payment_status: paymentStatusEnum.optional(),
  status: membershipStatusEnum.optional(),
  is_active: z.boolean().optional(),

  // Audit fields
  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
