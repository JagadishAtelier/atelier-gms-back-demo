import { z } from "zod";

export const createAssignPlanSchema = z.object({
  plan_id: z
    .string({ required_error: "Plan ID is required" })
    .uuid("Invalid Plan ID format"),

  member_id: z
    .string({ required_error: "Member ID is required" })
    .uuid("Invalid Member ID format"),

  assigned_date: z
    .string({ required_error: "Assigned date is required" })
    .datetime("Assigned date must be a valid datetime"),

  notes: z.string().optional(),

  is_active: z.boolean().optional().default(true),

  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// ==========================================
// 🔹 UPDATE ASSIGN PLAN SCHEMA
// ==========================================
export const updateAssignPlanSchema = z.object({
  plan_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),

  assigned_date: z.string().datetime().optional(),

  notes: z.string().optional(),

  is_active: z.boolean().optional(),

  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
