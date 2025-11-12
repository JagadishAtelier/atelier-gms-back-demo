import { z } from "zod";

// ✅ Create Membership Schema
export const createMembershipSchema = z.object({
  name: z
    .string({ required_error: "Membership name is required" })
    .min(3, "Membership name must be at least 3 characters")
    .max(100, "Membership name cannot exceed 100 characters"),

  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be a positive number"),

  duration_months: z
    .number({ required_error: "Duration (in months) is required" })
    .int("Duration must be an integer")
    .positive("Duration must be greater than 0"),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  is_active: z.boolean().optional().default(true),

  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// ✅ Update Membership Schema
export const updateMembershipSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  price: z.number().positive().optional(),
  duration_months: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),

  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
