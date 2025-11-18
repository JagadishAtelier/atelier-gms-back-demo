import { z } from "zod";

// ===========================
// ✅ CREATE GYM SCHEMA
// ===========================
export const createGymSchema = z.object({
  name: z
    .string({ required_error: "Gym name is required" })
    .min(3, "Gym name must be at least 3 characters")
    .max(100, "Gym name cannot exceed 100 characters"),

  address: z
    .string({ required_error: "Address is required" })
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address cannot exceed 255 characters"),

  phone: z
    .string({ required_error: "Phone number is required" })
    .min(6, "Phone number must be at least 6 digits")
    .max(15, "Phone number cannot exceed 15 digits"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .max(60, "Email cannot exceed 60 characters"),

  logo_url: z.string().url().optional(),

  is_active: z.boolean().optional().default(true),

  // Metadata fields
  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

// ===========================
// ✅ UPDATE GYM SCHEMA
// ===========================
export const updateGymSchema = z.object({
  name: z.string().min(3).max(100).optional(),

  address: z.string().min(5).max(255).optional(),

  phone: z.string().min(6).max(15).optional(),

  email: z.string().email().max(60).optional(),

  logo_url: z.string().url().optional(),

  is_active: z.coerce.boolean().optional(),


  // Metadata
  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),

  deleted_by: z.string().uuid().optional(),
  deleted_by_name: z.string().optional(),
  deleted_by_email: z.string().email().optional(),
});
