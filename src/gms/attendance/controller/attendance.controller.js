import attendanceService from "../service/attendance.service.js";
import parseZodSchema from "../../../utils/zodPharser.js";

import {
  createAttendanceSchema,
  updateAttendanceSchema,
  signInSchema,
  signOutSchema,
  getAttendancesQuerySchema,
  bulkImportAttendanceSchema,
} from "../dto/attendance.dto.js";

const attendanceController = {
  /**
   * ✅ Create Attendance Record
   */
  async create(req, res) {
    try {
      const data = await parseZodSchema(createAttendanceSchema, req.body);
data.company_id = req.user?.company_id;
      // Audit info
      data.created_by = req.user?.id;
      data.created_by_name = req.user?.username;
      data.created_by_email = req.user?.email;

      const result = await attendanceService.create(data, req.user);
      return res.sendSuccess(result, "Attendance created successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to create attendance");
    }
  },

  /**
   * ✅ Get All Attendance Records (with filters + pagination)
   */
  async getAll(req, res) {
    try {
      const query = await parseZodSchema(getAttendancesQuerySchema, req.query);
query.company_id = req.user?.company_id;
      const result = await attendanceService.getAll(query);
      return res.sendSuccess(result, "Attendance records fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch attendance records");
    }
  },

  /**
   * ✅ Get Single Attendance Record by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const record = await attendanceService.getById(id,req.user);
      return res.sendSuccess(record, "Attendance record fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch attendance record");
    }
  },

  /**
   * ✅ Update Attendance Record
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await parseZodSchema(updateAttendanceSchema, req.body);

      // Audit info
      data.updated_by = req.user?.id;
      data.updated_by_name = req.user?.username;
      data.updated_by_email = req.user?.email;

      const result = await attendanceService.update(id, data, req.user);
      return res.sendSuccess(result, "Attendance updated successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to update attendance");
    }
  },

  /**
   * ✅ Soft Delete Attendance Record
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await attendanceService.delete(id, req.user);
      return res.sendSuccess(result, "Attendance deleted successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to delete attendance");
    }
  },

  /**
   * ✅ Restore Soft Deleted Attendance
   */
  async restore(req, res) {
    try {
      const { id } = req.params;

      const result = await attendanceService.restore(id, req.user);
      return res.sendSuccess(result, "Attendance restored successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to restore attendance");
    }
  },

  /**
   * ✅ Sign In (Auto Create / Update Today's Attendance)
   */
  async signIn(req, res) {
  try {
    const data = await parseZodSchema(signInSchema, req.body);

    const result = await attendanceService.signIn(data.member_id, data.sign_in,req.user);
    return res.sendSuccess(result, "Sign-in recorded successfully");
  } catch (error) {
    return res.sendError(error.message || "Failed to process sign-in");
  }
},


  /**
   * ✅ Sign Out (Updates latest open attendance record)
   */
  async signOut(req, res) {
    try {
      const data = await parseZodSchema(signOutSchema, req.body);

      const result = await attendanceService.signOut(
  data.member_id,
  req.user
);
      return res.sendSuccess(result, "Sign-out recorded successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to process sign-out");
    }
  },

  /**
   * ✅ Bulk Import Attendance
   */
  async bulkImport(req, res) {
    try {
      const data = await parseZodSchema(bulkImportAttendanceSchema, req.body);

      const result = await attendanceService.bulkImport(data, req.user);
      return res.sendSuccess(result, "Attendance imported successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to import attendance");
    }
  },

  /**
   * ✅ Get Attendance by Member ID
   */
  async getByMemberId(req, res) {
    try {
      const { member_id } = req.params;
      if (!member_id) return res.sendError("member_id is required");

      const result = await attendanceService.getByMemberId(
  member_id,
  { company_id: req.user?.company_id }
);
      return res.sendSuccess(result, "Attendance fetched successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to fetch attendance by member");
    }
  },

  async getTodayAttendance(req, res) {
  try {
    const { member_id } = req.params;
    if (!member_id) return res.sendError("member_id is required");

    const result = await attendanceService.getTodayAttendance(req.user);
    return res.sendSuccess(result, "Today's attendance fetched successfully");
  } catch (error) {
    return res.sendError(error.message || "Failed to fetch today's attendance");
  }
},

async getSummary(req, res) {
  try {
    const { member_id } = req.params;
    if (!member_id) return res.sendError("member_id is required");

    const result = await attendanceService.getSummary(member_id);
    return res.sendSuccess(result, "Attendance summary fetched successfully");
  } catch (error) {
    return res.sendError(error.message || "Failed to fetch attendance summary");
  }
}


};

export default attendanceController;
