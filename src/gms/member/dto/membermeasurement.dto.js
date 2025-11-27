import { z } from "zod";

// 📌 Create Schema
export const createMemberMeasurementSchema = z.object({
  member_id: z
    .string({ required_error: "Member ID is required" })
    .uuid("Invalid Member ID format"),

  height: z
    .number({
      invalid_type_error: "Height must be a number",
    })
    .optional(),

  weight: z
    .number({
      invalid_type_error: "Weight must be a number",
    })
    .optional(),

  measurement_date: z.preprocess(
    (val) => (val ? new Date(val) : undefined),
    z.date({
      required_error: "Measurement date is required",
      invalid_type_error: "Invalid date format",
    })
  ),

  is_active: z.boolean().optional().default(true),

  // Audit logs
  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// 📌 Update Schema
export const updateMemberMeasurementSchema = z.object({
  height: z
    .number({
      invalid_type_error: "Height must be a number",
    })
    .optional(),

  weight: z
    .number({
      invalid_type_error: "Weight must be a number",
    })
    .optional(),

  measurement_date: z
    .preprocess((val) => (val ? new Date(val) : undefined), z.date().optional())
    .optional(),

  is_active: z.boolean().optional(),

  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
