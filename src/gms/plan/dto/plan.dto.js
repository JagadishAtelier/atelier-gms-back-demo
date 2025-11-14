import { z } from "zod";

// Enums for validation
const planTypeEnum = z.enum(["Workout Plan", "Diet Plan"], {
  required_error: "Plan type must be either Workout Plan or Diet Plan",
});

const difficultyEnum = z.enum(["Beginner", "Intermediate", "Advanced"], {
  required_error: "Difficulty must be Beginner, Intermediate, or Advanced",
});

// ===========================
// ✅ CREATE PLAN SCHEMA
// ===========================
export const createPlanSchema = z.object({
  title: z
    .string({ required_error: "Plan title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),

  plan_type: planTypeEnum,

  difficulty: difficultyEnum,

  duration: z
    .string({ required_error: "Duration is required" })
    .min(2, "Duration must be at least 2 characters")
    .max(100, "Duration cannot exceed 100 characters"),

  goals: z.array(z.string()).optional(),

  Description: z.string().optional(),

  is_active: z.boolean().optional().default(true),

  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// ===========================
// ✅ UPDATE PLAN SCHEMA
// ===========================
export const updatePlanSchema = z.object({
  title: z.string().min(3).max(100).optional(),

  plan_type: planTypeEnum.optional(),

  difficulty: difficultyEnum.optional(),

  duration: z.string().min(2).max(100).optional(),

  goals: z.array(z.string()).optional(),

  Description: z.string().optional(),

  is_active: z.boolean().optional(),

  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
