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

  membership_name: z
    .string({ required_error: "Membership name is required" })
    .min(3, "Membership name must be at least 3 characters")
    .max(100, "Membership name cannot exceed 100 characters")
    .optional(),

  membership_id: z
    .string({ required_error: "Membership ID is required" })
    .uuid("Invalid Membership ID format"),

  start_date: z.preprocess(
    (val) => (val ? new Date(val) : undefined),
    z.date({ required_error: "Start date is required" }).optional()
  ),

  end_date: z.preprocess(
    (val) => (val ? new Date(val) : undefined),
    z.date({ required_error: "End date is required" }).optional()
  ),

  payment_type: z.enum(["cash", "card", "online", "upi"], {
    required_error: "Payment type must be one of: cash, card, online, upi",
  }),

  amount_paid: z.number({
    required_error: "Amount paid is required",
    invalid_type_error: "Amount paid must be a number",
  })
  .optional(),

  pending_amount: z.number({
    invalid_type_error: "Pending amount must be a number",
  })
  .optional(),

  payment_status: paymentStatusEnum.default("paid"),
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

  payment_type: z
    .enum(["cash", "card", "online", "upi"])
    .optional(),
  
  amount_paid: z
    .number({
      invalid_type_error: "Amount paid must be a number",
    })
    .optional(),

  pending_amount: z
    .number({
      invalid_type_error: "Pending amount must be a number",
    })
    .optional(),

  membership_name: z
    .string({ required_error: "Membership name is required" })
    .min(3, "Membership name must be at least 3 characters")
    .max(100, "Membership name cannot exceed 100 characters")
    .optional(),

  payment_status: paymentStatusEnum.optional(),
  status: membershipStatusEnum.optional(),
  is_active: z.boolean().optional(),


  // Audit fields
  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
