import membershipService from "../service/membership.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import {
  createMembershipSchema,
  updateMembershipSchema,
} from "../dto/membership.dto.js";

const membershipController = {
  /**
   * ✅ Create Membership
   */
  async create(req, res) {
    try {
      const membershipData = await parseZodSchema(createMembershipSchema, req.body);

      // Add audit info
      membershipData.created_by = req.user?.id;
      membershipData.created_by_name = req.user?.username;
      membershipData.created_by_email = req.user?.email;
membershipData.company_id = req.company_id;
      const membership = await membershipService.create(membershipData, req.user);
      return res.sendSuccess(membership, "Membership created successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create membership");
    }
  },

  /**
   * ✅ Get All Memberships (with filters, pagination)
   */
  async getAll(req, res) {
    try {
    const memberships = await membershipService.getAll({
      ...req.query,
      company_id: req.company_id, // ✅ inject
    });

      return res.sendSuccess(memberships, "Memberships fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch memberships");
    }
  },

  /**
   * ✅ Get Membership by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const membership = await membershipService.getById(id, req.company_id);
      return res.sendSuccess(membership, "Membership fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch membership");
    }
  },

  /**
   * ✅ Update Membership
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updateMembershipSchema, req.body);

      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;

      const updatedMembership = await membershipService.update(id, data, req.user, req.company_id);
      return res.sendSuccess(updatedMembership, "Membership updated successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to update membership");
    }
  },

  /**
   * ✅ Soft Delete Membership
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await membershipService.delete(id, req.user, false, req.company_id);
      return res.sendSuccess(result, "Membership deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete membership");
    }
  },

  /**
   * ✅ Restore Soft Deleted Membership
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
      const result = await membershipService.restore(id, req.user, req.company_id);
      return res.sendSuccess(result, "Membership restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore membership");
    }
  },
};

export default membershipController;
