import { z } from "zod";

/**
 * Helper: safely convert value to number
 * - Handles FormData strings ("999")
 * - Handles numbers (999)
 * - Prevents NaN
 */
const toNumber = (val) => {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
};

/**
 * ✅ Create Product Schema
 */
export const createProductSchema = z.object({
  title: z
    .string({ required_error: "Product title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),

  // 🔥 FIX: convert string → number before validation
  price: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Price is required" })
      .positive("Price must be greater than 0")
  ),

  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  // Optional: backend will override this if file is uploaded
  product_image_url: z.string().optional(),

  is_active: z.boolean().optional().default(true),

  // Audit fields
  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

/**
 * ✅ Update Product Schema
 */
export const updateProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),

  // 🔥 FIX: convert string → number before validation
  price: z.preprocess(
    toNumber,
    z
      .number()
      .positive("Price must be greater than 0")
      .optional()
  ),

  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  product_image_url: z.string().optional(),

  is_active: z.boolean().optional(),

  // Audit fields
  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});
