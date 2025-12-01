// assignplan.controller.js
import assignPlanService from "../service/assignplan.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import {
  createAssignPlanSchema,
  updateAssignPlanSchema,
} from "../dto/assignplan.dto.js";

const assignPlanController = {
  /**
   * Create AssignPlan
   */
  async create(req, res) {
    try {
      // Validate request body
      const assignPlanData = await parseZodSchema(
        createAssignPlanSchema,
        req.body
      );

      // Audit fields
      assignPlanData.created_by = req.user?.id ?? null;
      assignPlanData.created_by_name = req.user?.username ?? null;
      assignPlanData.created_by_email = req.user?.email ?? null;

      const result = await assignPlanService.create(assignPlanData, req.user);

      return res.sendSuccess(
        result,
        result?.updated
          ? "Existing assigned plan updated (same plan type)"
          : "Assign plan created successfully"
      );
    } catch (error) {
      if (error && error.errors) {
        return res.sendError("Validation failed", { details: error.errors });
      }
      console.error("Error in assignPlanController.create:", error);
      return res.sendError(error.message || "Failed to create assign plan");
    }
  },

  /**
   * Get all Assigned Plans
   */
  async getAll(req, res) {
    try {
      const result = await assignPlanService.getAll(req.query);
      return res.sendSuccess(result, "Assign plans fetched successfully");
    } catch (error) {
      console.error("Error in assignPlanController.getAll:", error);
      return res.sendError(error.message || "Failed to fetch assign plans");
    }
  },

  /**
   * Get assigned plan by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await assignPlanService.getById(id);
      return res.sendSuccess(result, "Assign plan fetched successfully");
    } catch (error) {
      console.error("Error in assignPlanController.getById:", error);
      return res.sendError(error.message || "Failed to fetch assign plan");
    }
  },

  /**
   * Update assigned plan
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const validatedData = await parseZodSchema(
        updateAssignPlanSchema,
        req.body
      );

      validatedData.updated_by = req.user?.id ?? null;
      validatedData.updated_by_name = req.user?.username ?? null;
      validatedData.updated_by_email = req.user?.email ?? null;

      const updatedPlan = await assignPlanService.update(id, validatedData, req.user);

      return res.sendSuccess(updatedPlan, "Assign plan updated successfully");
    } catch (error) {
      if (error && error.errors) {
        return res.sendError("Validation failed", { details: error.errors });
      }
      console.error("Error in assignPlanController.update:", error);
      return res.sendError(error.message || "Failed to update assign plan");
    }
  },

  /**
   * Soft delete (Deactivate)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await assignPlanService.delete(id, req.user);
      return res.sendSuccess(result, "Assign plan deleted successfully");
    } catch (error) {
      console.error("Error in assignPlanController.delete:", error);
      return res.sendError(error.message || "Failed to delete assign plan");
    }
  },

  /**
   * Restore soft deleted assigned plan
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await assignPlanService.restore(id, req.user);
      return res.sendSuccess(result, "Assign plan restored successfully");
    } catch (error) {
      console.error("Error in assignPlanController.restore:", error);
      return res.sendError(error.message || "Failed to restore assign plan");
    }
  },

  async getAssignedPlansByMemberId(req, res) {
    try {
      const userEmail  = req.user.email;
      const result = await assignPlanService.getassignPlanByMemberId(userEmail);
      return res.sendSuccess(result, "Assigned plans fetched successfully");
    } catch (error) {
      console.error("Error in assignPlanController.getAssignedPlansByMemberId:", error);
      return res.sendError(error.message || "Failed to fetch assigned plans");
    }
  },
};

export default assignPlanController;
