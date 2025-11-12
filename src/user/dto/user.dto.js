import { z } from "zod";

export const registerSchema = {
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(255),
    phone: z.string().regex(/^\d{10}$/),
    role: z.enum(["Super Admin", "Admin", "Doctor", "Patient", "Nurse", "Receptionist", "Pharmacist", "Lab Technician", "Accountant"]),
  }),
};

export const userLoginSchema = {
  body: z.object({
    identifier: z
      .string()
      .min(3)
      .refine((val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^\d{10}$/.test(val);
        return isEmail || isPhone;
      }, {
        message: "Identifier must be a valid email or 10-digit phone number",
      }),
    password: z.string().min(6).max(255),
  }),
};

export const updateUserSchema = {
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\d{10}$/).optional(),
    role: z.enum(["Super Admin", "Admin", "Doctor", "Patient", "Nurse", "Receptionist", "Pharmacist", "Lab Technician", "Accountant"]).optional(),
  }),
};




