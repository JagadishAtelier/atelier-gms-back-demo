import planService from "../service/plan.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import { createPlanSchema, updatePlanSchema } from "../dto/plan.dto.js";

const planController = {
  /**
   * ✅ Create Plan
   */
  async create(req, res) {
    try {
      const planData = await parseZodSchema(createPlanSchema, req.body);

      // Add audit info
      planData.created_by = req.user?.id;
      planData.created_by_name = req.user?.username;
      planData.created_by_email = req.user?.email;

      const plan = await planService.create(planData, req.user);
      return res.sendSuccess(plan, "Plan created successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create plan");
    }
  },

  /**
   * ✅ Get All Plans (with filters, pagination, search)
   */
  async getAll(req, res) {
    try {
      const plans = await planService.getAll(req.query);
      return res.sendSuccess(plans, "Plans fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch plans");
    }
  },

  /**
   * ✅ Get Plan by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const plan = await planService.getById(id);
      return res.sendSuccess(plan, "Plan fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch plan");
    }
  },

  /**
   * ✅ Update Plan
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updatePlanSchema, req.body);

      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;

      const updatedPlan = await planService.update(id, data, req.user);
      return res.sendSuccess(updatedPlan, "Plan updated successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to update plan");
    }
  },

  /**
   * ✅ Soft Delete Plan
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await planService.delete(id, req.user);
      return res.sendSuccess(result, "Plan deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete plan");
    }
  },

  /**
   * ✅ Restore Soft Deleted Plan
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await planService.restore(id, req.user);
      return res.sendSuccess(result, "Plan restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore plan");
    }
  },
};

export default planController;
