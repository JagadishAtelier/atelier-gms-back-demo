import membermembershipService from "../service/membermembership.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import {
  createMemberMembershipSchema,
  updateMemberMembershipSchema,
} from "../dto/membermembership.dto.js";

const membermembershipController = {
  /**
   * ✅ Create Member Membership
   */
  async create(req, res) {
    try {
      const data = await parseZodSchema(createMemberMembershipSchema, req.body);

      // Audit info
      data.created_by = req.user?.id;
      data.created_by_name = req.user?.username;
      data.created_by_email = req.user?.email;

      const result = await membermembershipService.create(data, req.user);
      return res.sendSuccess(result, "Member membership created successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create member membership");
    }
  },

  /**
   * ✅ Get All Member Memberships
   */
  async getAll(req, res) {
    try {
      const memberships = await membermembershipService.getAll(req.query);
      return res.sendSuccess(memberships, "Member memberships fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch member memberships");
    }
  },

  /**
   * ✅ Get Member Membership by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const record = await membermembershipService.getById(id);
      return res.sendSuccess(record, "Member membership fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch member membership");
    }
  },

  /**
   * ✅ Update Member Membership
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updateMemberMembershipSchema, req.body);

      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;

      const updated = await membermembershipService.update(id, data, req.user);
      return res.sendSuccess(updated, "Member membership updated successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to update member membership");
    }
  },

  /**
   * ✅ Soft Delete Member Membership
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await membermembershipService.delete(id, req.user);
      return res.sendSuccess(result, "Member membership deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete member membership");
    }
  },

  /**
   * ✅ Restore Soft Deleted Member Membership
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await membermembershipService.restore(id, req.user);
      return res.sendSuccess(result, "Member membership restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore member membership");
    }
  },
};

export default membermembershipController;
