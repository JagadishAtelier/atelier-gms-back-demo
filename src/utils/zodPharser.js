import { ZodError } from "zod";

async function tryParse(schema, data) {
  try {
    // ✅ Return only the parsed data directly (controller expects plain object)
    const parsed = schema.parse(data);
    return parsed;
  } catch (err) {
    if (err instanceof ZodError) {
      // Collect validation error messages
      const message = err.issues.map((issue) => issue.message).join(", ");
      throw new Error(message);
    }
    throw err;
  }
}

export default tryParse;
