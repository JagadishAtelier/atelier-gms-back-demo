// gym.controller.js
import gymService from "../service/gym.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import { createGymSchema, updateGymSchema } from "../dto/gym.dto.js";

/**
 * Build public URL for uploaded logo file
 * (uploaded under uploads/gym folder)
 */
function buildLogoUrl(req, file) {
  if (!file) return null;
  return `/uploads/gym/${file.filename}`;
}

const gymController = {
  /**
   * ===========================
   * ✅ CREATE GYM
   * ===========================
   * Supports optional file upload under field name "logo"
   */
  async create(req, res) {
    try {
      const body = req.body || {};

      // Validate with Zod
      const gymData = await parseZodSchema(createGymSchema, body);

      // Audit fields
      gymData.created_by = req.user?.id ?? null;
      gymData.created_by_name = req.user?.username ?? null;
      gymData.created_by_email = req.user?.email ?? null;

      // File upload (logo)
      if (req.file) {
        gymData.logo_url = buildLogoUrl(req, req.file);
      }

      const gym = await gymService.create(gymData, req.user);
      return res.sendSuccess(gym, "Gym created successfully");
    } catch (error) {
      if (error && error.errors) {
        return res.sendError("Validation failed", { details: error.errors });
      }
      console.error("Error in gymController.create:", error);
      return res.sendError(error.message || "Failed to create gym");
    }
  },

  /**
   * ===========================
   * ✅ GET ALL GYMS
   * ===========================
   */
  async getAll(req, res) {
    try {
      const gyms = await gymService.getAll(req.query);
      return res.sendSuccess(gyms, "Gyms fetched successfully");
    } catch (error) {
      console.error("Error in gymController.getAll:", error);
      return res.sendError(error.message || "Failed to fetch gyms");
    }
  },

  /**
   * ===========================
   * ✅ GET GYM BY ID
   * ===========================
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const gym = await gymService.getById(id);
      return res.sendSuccess(gym, "Gym fetched successfully");
    } catch (error) {
      console.error("Error in gymController.getById:", error);
      return res.sendError(error.message || "Failed to fetch gym");
    }
  },

  /**
   * ===========================
   * ✅ UPDATE GYM
   * ===========================
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};

      // Validate only provided fields
      const updateData = await parseZodSchema(updateGymSchema, body);

      // Audit info
      updateData.updated_by = req.user?.id ?? null;
      updateData.updated_by_name = req.user?.username ?? null;
      updateData.updated_by_email = req.user?.email ?? null;

      // Logo file upload
      if (req.file) {
        updateData.logo_url = buildLogoUrl(req, req.file);
      }

      const updated = await gymService.update(id, updateData, req.user);
      return res.sendSuccess(updated, "Gym updated successfully");
    } catch (error) {
      if (error && error.errors) {
        return res.sendError("Validation failed", { details: error.errors });
      }
      console.error("Error in gymController.update:", error);
      return res.sendError(error.message || "Failed to update gym");
    }
  },

  /**
   * ===========================
   * ❌ SOFT DELETE GYM
   * ===========================
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await gymService.delete(id, req.user);
      return res.sendSuccess(result, "Gym deleted successfully");
    } catch (error) {
      console.error("Error in gymController.delete:", error);
      return res.sendError(error.message || "Failed to delete gym");
    }
  },

  /**
   * ===========================
   * ♻️ RESTORE SOFT-DELETED GYM
   * ===========================
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await gymService.restore(id, req.user);
      return res.sendSuccess(result, "Gym restored successfully");
    } catch (error) {
      console.error("Error in gymController.restore:", error);
      return res.sendError(error.message || "Failed to restore gym");
    }
  },
};

export default gymController;
