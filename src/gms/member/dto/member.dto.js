import { z } from "zod";

// Enums for validation
const genderEnum = z.enum(["Male", "Female"], {
  required_error: "Gender must be either Male or Female",
});

const batchEnum = z.enum(["Morning", "Afternoon", "Evening"], {
  required_error: "Workout batch must be Morning, Afternoon, or Evening",
});

// ✅ Create Member Schema
export const createMemberSchema = z.object({
  name: z
    .string({ required_error: "Member name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),

  phone: z
    .string()
    .regex(/^[0-9]{10,15}$/, "Phone number must be 10–15 digits")
    .optional(),

  gender: genderEnum.optional(),

  dob: z
    .preprocess(
      (val) => (val ? new Date(val) : undefined),
      z.date().optional()
    )
    .optional(),

  join_date: z
    .preprocess(
      (val) => (val ? new Date(val) : undefined),
      z.date().optional()
    )
    .optional(),

  start_date: z
    .preprocess(
      (val) => (val ? new Date(val) : undefined),
      z.date().optional()
    )
    .optional(),

  workout_batch: batchEnum.optional(),

  image_url: z.string().url("Invalid image URL").optional(),

  is_active: z.boolean().optional().default(true),

  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// ✅ Update Member Schema
export const updateMemberSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^[0-9]{10,15}$/).optional(),
  gender: genderEnum.optional(),
  dob: z.preprocess((val) => (val ? new Date(val) : undefined), z.date().optional()),
  join_date: z.preprocess((val) => (val ? new Date(val) : undefined), z.date().optional()),
  start_date: z.preprocess((val) => (val ? new Date(val) : undefined), z.date().optional()),
  workout_batch: batchEnum.optional(),
  image_url: z.string().url("Invalid image URL").optional(),
  is_active: z.boolean().optional(),

  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
