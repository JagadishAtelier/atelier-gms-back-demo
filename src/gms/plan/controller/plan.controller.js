// plan.controller.js
import planService from "../service/plan.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import { createPlanSchema, updatePlanSchema } from "../dto/plan.dto.js";
import path from "path";

/**
 * Build public URL for uploaded file (matches uploads/plan folder)
 */
function buildFileUrl(req, file) {
  if (!file) return null;
  // use relative URL; ensure your express app serves `/uploads` statically
  return `/uploads/plan/${file.filename}`;
}

/**
 * Normalize incoming "goals" to a JS array.
 * Accepts:
 * - array (returned as-is)
 * - JSON string like '["a","b"]'
 * - comma separated string 'a,b'
 * - undefined -> []
 */
function ensureArrayGoals(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    // Try JSON first
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    } catch (e) {
      // not JSON — fallback to comma separated
      return input
        .split(",")
        .map((g) => String(g).trim())
        .filter(Boolean);
    }
  }
  // If object but not array - stringify fields? For safety, return empty
  return [];
}

const planController = {
  /**
   * Create Plan (supports optional file upload under field name 'image')
   */
  async create(req, res) {
  try {
    const body = req.body || {};

    // ✅ get correct Zod validation format
    const normalized = {
      title: body.title?.trim() || "",
      plan_type: body.plan_type || body.plan_type || "Workout Plan", // fallback
      difficulty: body.difficulty || "Beginner",
      Description: body.Description || undefined,
      goals: ensureArrayGoals(body.goals),
      monday_plan: body.monday_plan || undefined,
      tuesday_plan: body.tuesday_plan || undefined,
      wednesday_plan: body.wednesday_plan || undefined,
      thursday_plan: body.thursday_plan || undefined,
      friday_plan: body.friday_plan || undefined,
      saturday_plan: body.saturday_plan || undefined,
      sunday_plan: body.sunday_plan || undefined,
    };

    const planData = await parseZodSchema(createPlanSchema, normalized);

    planData.created_by = req.user?.id ?? null;
    planData.created_by_name = req.user?.username ?? null;
    planData.created_by_email = req.user?.email ?? null;

    const plan = await planService.create(planData, req.user);
    return res.sendSuccess(plan, "Plan created successfully");
  } catch (error) {
    console.error("❌ Error:", error);
    return res.sendError(error.message || "Failed to create plan");
  }
},


  /**
   * Get all plans (supports filters/pagination via query)
   */
  async getAll(req, res) {
    try {
      const plans = await planService.getAll(req.query);
      return res.sendSuccess(plans, "Plans fetched successfully");
    } catch (error) {
      console.error("Error in planController.getAll:", error);
      return res.sendError(error.message || "Failed to fetch plans");
    }
  },

  /**
   * Get plan by id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const plan = await planService.getById(id);
      return res.sendSuccess(plan, "Plan fetched successfully");
    } catch (error) {
      console.error("Error in planController.getById:", error);
      return res.sendError(error.message || "Failed to fetch plan");
    }
  },

  /**
   * Update plan (supports optional file upload)
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      // Normalize goals if present
      const normalizedBody = {
        ...req.body,
        // only normalize if provided
        ...(typeof req.body?.goals !== "undefined" && { goals: ensureArrayGoals(req.body.goals) }),
      };

      const data = await parseZodSchema(updatePlanSchema, normalizedBody);

      // Audit
      data.updated_by = req.user?.id ?? null;
      data.updated_by_name = req.user?.username ?? null;
      data.updated_by_email = req.user?.email ?? null;

      // If uploaded file present, set URL
      if (req.file) {
        data.pdf_url = buildFileUrl(req, req.file);
      }

      const updatedPlan = await planService.update(id, data, req.user);
      return res.sendSuccess(updatedPlan, "Plan updated successfully");
    } catch (error) {
      if (error && error.errors) {
        return res.sendError("Validation failed", { details: error.errors });
      }
      console.error("Error in planController.update:", error);
      return res.sendError(error.message || "Failed to update plan");
    }
  },

  /**
   * Soft delete
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await planService.delete(id, req.user);
      return res.sendSuccess(result, "Plan deleted successfully");
    } catch (error) {
      console.error("Error in planController.delete:", error);
      return res.sendError(error.message || "Failed to delete plan");
    }
  },

  /**
   * Restore soft deleted
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await planService.restore(id, req.user);
      return res.sendSuccess(result, "Plan restored successfully");
    } catch (error) {
      console.error("Error in planController.restore:", error);
      return res.sendError(error.message || "Failed to restore plan");
    }
  },
};

export default planController;

