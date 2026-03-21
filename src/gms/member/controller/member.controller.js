import memberService from "../service/member.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../dto/member.dto.js";

const memberController = {
  /**
   * ✅ Create Member
   */
  async create(req, res) {
    try {
      const memberData = await parseZodSchema(createMemberSchema, req.body);

      // Add audit info
      memberData.created_by = req.user?.id;
      memberData.created_by_name = req.user?.username;
      memberData.created_by_email = req.user?.email;
memberData.company_id = req.company_id;
      const member = await memberService.create(memberData, req.user);
      return res.sendSuccess(member, "Member created successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create member");
    }
  },


  /**
   * ✅ Get All Members (with filters, pagination)
   */
  async getAll(req, res) {
    try {
      const members = await memberService.getAll(req.query,req.company_id);
      return res.sendSuccess(members, "Members fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch members");
    }
  },

  async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res.sendError("Please upload a file");
      }

      const result = await memberService.bulkUpload(
        req.file.buffer,
        req.user,
        true, // send emails
        req.company_id
      );

      return res.sendSuccess(result, "Bulk upload completed");
    } catch (error) {
      return res.sendError(error.message || "Bulk upload failed");
    }
  },

  /**
   * ✅ Get Member by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const member = await memberService.getById(id,req.company_id);
      return res.sendSuccess(member, "Member fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch member");
    }
  },

  /**
   * ✅ Update Member
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updateMemberSchema, req.body);

      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;
data.company_id = req.company_id;
      const updatedMember = await memberService.update(id, data, req.user);
      return res.sendSuccess(updatedMember, "Member updated successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to update member");
    }
  },

  /**
   * ✅ Soft Delete Member
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
const result = await memberService.delete(id, req.user, false, req.company_id);
      return res.sendSuccess(result, "Member deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete member");
    }
  },

  async getMembersbyEmail(req, res) {
  try {
    const email = req.user?.email || null;
    const phone = req.user?.phone || null;
    console.log("Fetching members for email:", req.user);
    const members = await memberService.getMembersbyuserEmail(email, phone);

    return res.sendSuccess(members, "Members fetched successfully");
  } catch (error) {
    return res.sendError(error.message || "Failed to fetch members");
  }
},

  /**
   * ✅ Restore Soft Deleted Member
   */
  async restore(req, res) {
    try {
      const { id } = req.params;
const result = await memberService.restore(id, req.user, req.company_id);
      return res.sendSuccess(result, "Member restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore member");
    }
  },
};

export default memberController;
