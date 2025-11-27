import membermeasurementService from "../service/membermeasurement.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import {
  createMemberMeasurementSchema,
  updateMemberMeasurementSchema,
} from "../dto/membermeasurement.dto.js";

const membermeasurementController = {
  /**
   * ✅ Create Member Measurement
   */
  async create(req, res) {
    try {
      const data = await parseZodSchema(createMemberMeasurementSchema, req.body);

      // Audit Information
      data.created_by = req.user?.id;
      data.created_by_name = req.user?.username;
      data.created_by_email = req.user?.email;

      const result = await membermeasurementService.create(data, req.user);
      return res.sendSuccess(result, "Member measurement added successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create member measurement");
    }
  },

  /**
   * ✅ Get All Measurements (with pagination & filters)
   */
  async getAll(req, res) {
    try {
      const measurements = await membermeasurementService.getAll(req.query);
      return res.sendSuccess(measurements, "Member measurements fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch member measurements");
    }
  },

  /**
   * ✅ Get Measurement by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const record = await membermeasurementService.getById(id);
      return res.sendSuccess(record, "Member measurement fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch member measurement");
    }
  },

  /**
   * ✅ Get All Measurements of a Member
   */
  async getByMemberId(req, res) {
    try {
      const { member_id } = req.params;
      if (!member_id) return res.sendError("member_id is required");

      const records = await membermeasurementService.getMeasurementsByMemberId(member_id);
      return res.sendSuccess(records, "Measurements fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch member measurements");
    }
  },

  /**
   * ✅ Update Measurement
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updateMemberMeasurementSchema, req.body);

      // Audit Info
      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;

      const updated = await membermeasurementService.update(id, data, req.user);
      return res.sendSuccess(updated, "Member measurement updated successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to update member measurement");
    }
  },

  /**
   * ✅ Soft Delete Measurement
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await membermeasurementService.delete(id, req.user);
      return res.sendSuccess(result, "Member measurement deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete member measurement");
    }
  },

  /**
   * ✅ Restore Soft Deleted Measurement
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await membermeasurementService.restore(id, req.user);
      return res.sendSuccess(result, "Member measurement restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore member measurement");
    }
  },
};

export default membermeasurementController;
