// src/modules/attendance/dto/attendance.dto.js
import { z } from "zod";

/**
 * Small reusable validators
 */
const uuidSchema = (name = "ID") =>
  z.string({ required_error: `${name} is required` }).uuid(`Invalid ${name} format`);

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/; // HH:MM or HH:MM:SS
const timeString = z
  .string()
  .regex(timeRegex, "Time must be in HH:MM or HH:MM:SS format")
  .optional();

/**
 * Preprocess helper to convert incoming date-like values to Date objects.
 * Accepts Date, timestamp, or ISO date string.
 */
const toDate = z.preprocess((val) => {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}, z.date());

/**
 * Create Attendance DTO
 * required: member_id, date
 * optional: sign_in, sign_out (as time strings HH:MM[:SS]), is_active, created_by metadata
 */
export const createAttendanceSchema = z.object({
  member_id: uuidSchema("Member ID"),

  // date should be a date (we'll treat it as date-only in service)
  date: z.preprocess((val) => {
    // Accept date-only strings like '2025-11-28', full ISO strings, timestamps or Date objects
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }, z.date({ required_error: "Date is required" })),

  // sign_in / sign_out: accept time strings (HH:MM or HH:MM:SS) or full datetime strings.
  // For simplicity we validate time-string format if user passes short time.
  sign_in: z
    .union([
      timeString,
      z.preprocess((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      }, z.date()),
    ])
    .optional(),

  sign_out: z
    .union([
      timeString,
      z.preprocess((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      }, z.date()),
    ])
    .optional(),

  is_active: z.boolean().optional().default(true),

  // Audit metadata (optional)
  created_by: z.string().uuid().optional(),
  created_by_name: z.string().optional(),
  created_by_email: z.string().email().optional(),
});

/**
 * Update Attendance DTO
 * All fields optional; date will be normalized to Date if provided.
 */
export const updateAttendanceSchema = z.object({
  date: toDate.optional(),

  // allow replacing sign_in / sign_out using time string or Date/ISO
  sign_in: z
    .union([
      timeString,
      z.preprocess((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      }, z.date()),
    ])
    .optional(),

  sign_out: z
    .union([
      timeString,
      z.preprocess((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      }, z.date()),
    ])
    .optional(),

  is_active: z.boolean().optional(),

  // Audit fields
  updated_by: z.string().uuid().optional(),
  updated_by_name: z.string().optional(),
  updated_by_email: z.string().email().optional(),
});

/**
 * Sign-in / Sign-out DTOs (simple)
 */
export const signInSchema = z.object({
  member_id: uuidSchema("Member ID"),
  // optional: allow passing a timestamp or time-string; service can use `new Date()` when absent
  sign_in: z
    .union([
      timeString,
      z.preprocess((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      }, z.date()),
    ])
    .optional(),
});

export const signOutSchema = z.object({
  member_id: uuidSchema("Member ID"),
  sign_out: z
    .union([
      timeString,
      z.preprocess((val) => {
        if (!val) return undefined;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      }, z.date()),
    ])
    .optional(),
});

/**
 * Query / Pagination DTO for listing attendances
 */
export const getAttendancesQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(10),

  member_id: z.string().uuid().optional(),

  from_date: toDate.optional(),
  to_date: toDate.optional(),

  is_active: z.boolean().optional(),

  sort_by: z.string().optional().default("createdAt"),
  sort_order: z.enum(["ASC", "DESC"]).optional().default("DESC"),
});

/**
 * Bulk import DTO (array of createAttendanceSchema)
 */
export const bulkImportAttendanceSchema = z
  .array(createAttendanceSchema)
  .nonempty("Attendance array must contain at least one record");


