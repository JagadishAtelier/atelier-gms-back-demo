// src/modules/attendance/service/attendance.service.js
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Attendance from "../models/attendance.models.js";
import Member from "../../member/models/member.model.js";
import Membermembership from "../../member/models/membermembership.model.js";

function getStartOfDay(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Helper: return end of day (23:59:59.999) for a Date or date-string
 */
function getEndOfDay(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

const attendanceService = {
  /**
   * Create attendance record
   * required: member_id, date (date-only or JS Date)
   * optional: sign_in, sign_out
   */
  async create(data, user) {
    try {
      const requiredFields = ["member_id", "date"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      const member = await Member.findByPk(data.member_id);
      if (!member) throw new Error("Invalid member_id (Member not found)");

      // Normalize date to start of the provided date (store as DATE)
      const dateOnly = getStartOfDay(data.date);

      // Optionally prevent duplicate same-day attendance for same member
      const existing = await Attendance.findOne({
        where: {
          member_id: data.member_id,
          date: {
            [Op.gte]: getStartOfDay(dateOnly),
            [Op.lte]: getEndOfDay(dateOnly),
          },
        },
      });

      if (existing) {
        throw new Error("Attendance for this member on the provided date already exists");
      }

      const attendance = await Attendance.create({
        id: uuidv4(),
        member_id: data.member_id,
        date: dateOnly,
        sign_in: data.sign_in || null,
        sign_out: data.sign_out || null,
        is_active: typeof data.is_active === "boolean" ? data.is_active : true,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return attendance;
    } catch (error) {
      console.error("❌ Error creating attendance:", error.message);
      throw error;
    }
  },

  /**
   * Sign in helper: creates or updates today's attendance for a member with sign_in = now
   */
  // 📌 src/services/attendanceService.js  (BACKEND service)
async signIn(member_id, sign_in_time) {
  try {
    if (!member_id) throw new Error("member_id is required");

    // 1️⃣ Check Member Exists
    const member = await Member.findByPk(member_id);
    if (!member) throw new Error("Invalid member_id (Member not found)");

    // 2️⃣ Validate active membership for today
    const today = new Date();
    const validMembership = await Membermembership.findOne({
      where: {
        member_id,
        status: "active",
        is_active: true,
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today }
      }
    });

    if (!validMembership) {
      throw new Error("Member has no valid ACTIVE membership for today!");
    }

    // 3️⃣ Attendance logic
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();

    let attendance = await Attendance.findOne({
      where: {
        member_id,
        date: { [Op.gte]: todayStart, [Op.lte]: todayEnd }
      }
    });

    const nowTime = sign_in_time || new Date().toISOString();

    if (!attendance) {
      attendance = await Attendance.create({
        id: uuidv4(),
        member_id,
        date: todayStart,
        sign_in: nowTime,
        is_active: true,
        membership_id: validMembership.membership_id // optional but useful link
      });
    } else {
      await attendance.update({
        sign_out: null,
        sign_in: nowTime
      });
    }

    return attendance;
  } catch (error) {
    console.error("❌ Error in service signIn:", error.message);
    throw error;
  }
},



  /**
   * Sign out helper: updates today's attendance for a member with sign_out = now
   */
  async signOut(member_id, user) {
    try {
      if (!member_id) throw new Error("member_id is required");

      const todayStart = getStartOfDay();
      const todayEnd = getEndOfDay();

      const attendance = await Attendance.findOne({
        where: {
          member_id,
          date: { [Op.gte]: todayStart, [Op.lte]: todayEnd },
        },
      });

      if (!attendance) throw new Error("Attendance record not found for today. Sign-in first.");

      const nowTime = new Date();

      // Optionally: if sign_out already exists, overwrite or keep earliest — we overwrite here.
      await attendance.update({
        sign_out: nowTime,
        updated_by: user?.id || null,
        updated_by_name: user?.username || null,
        updated_by_email: user?.email || null,
      });

      return attendance;
    } catch (error) {
      console.error("❌ Error in signOut:", error.message);
      throw error;
    }
  },

  /**
   * Get all attendances with pagination and filters:
   * options: page, limit, member_id, from_date, to_date, is_active, sort_by, sort_order
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      member_id,
      from_date,
      to_date,
      is_active,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (member_id) where.member_id = member_id;

    if (from_date && to_date) {
      where.date = {
        [Op.gte]: getStartOfDay(from_date),
        [Op.lte]: getEndOfDay(to_date),
      };
    } else if (from_date) {
      where.date = { [Op.gte]: getStartOfDay(from_date) };
    } else if (to_date) {
      where.date = { [Op.lte]: getEndOfDay(to_date) };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [
        { model: Member,as: "member", attributes: ["id", "name", "email", "phone"] },
      ],
      limit: Number(limit),
      offset,
      order: [[sort_by, sort_order]],
    });

    return {
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  },

  /**
   * Get attendance by id
   */
  async getById(id) {
    const record = await Attendance.findByPk(id, {
      include: [{ model: Member, attributes: ["id", "name", "email", "phone"] }],
    });
    if (!record) throw new Error("Attendance record not found");
    return record;
  },

  /**
   * Update attendance record
   */
  async update(id, data, user) {
    const record = await Attendance.findByPk(id);
    if (!record) throw new Error("Attendance record not found");

    // Only allow certain fields to be updated
    const updatable = {
      date: typeof data.date !== "undefined" ? getStartOfDay(data.date) : record.date,
      sign_in: typeof data.sign_in !== "undefined" ? data.sign_in : record.sign_in,
      sign_out: typeof data.sign_out !== "undefined" ? data.sign_out : record.sign_out,
      is_active: typeof data.is_active !== "undefined" ? data.is_active : record.is_active,
      updated_by: user?.id || record.updated_by,
      updated_by_name: user?.username || record.updated_by_name,
      updated_by_email: user?.email || record.updated_by_email,
    };

    await record.update(updatable);
    return record;
  },

  /**
   * Soft delete (deactivate) or hard delete
   */
  async delete(id, user, hardDelete = false) {
    const record = await Attendance.findByPk(id);
    if (!record) throw new Error("Attendance record not found");

    if (hardDelete) {
      await record.destroy();
      return { message: "Record permanently deleted" };
    }

    await record.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Record deactivated successfully" };
  },

  /**
   * Restore a soft-deleted record
   */
  async restore(id, user) {
    const record = await Attendance.findByPk(id);
    if (!record) throw new Error("Attendance record not found");

    await record.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Record reactivated successfully" };
  },

  /**
   * Get today's attendance (all members)
   */
  async getTodayAttendance() {
    const start = getStartOfDay();
    const end = getEndOfDay();
    const rows = await Attendance.findAll({
      where: {
        date: { [Op.gte]: start, [Op.lte]: end },
        is_active: true,
      },
      include: [{ model: Member, attributes: ["id", "name", "email", "phone"] }],
      order: [["sign_in", "ASC"]],
    });
    return rows;
  },

  /**
   * Get attendance history for a member (with optional date range)
   */
  async getByMemberId(member_id, options = {}) {
    try {
      const { page = 1, limit = 50, from_date, to_date } = options;

      const where = { member_id };

      if (from_date && to_date) {
        where.date = { [Op.gte]: getStartOfDay(from_date), [Op.lte]: getEndOfDay(to_date) };
      } else if (from_date) {
        where.date = { [Op.gte]: getStartOfDay(from_date) };
      } else if (to_date) {
        where.date = { [Op.lte]: getEndOfDay(to_date) };
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Attendance.findAndCountAll({
        where,
        include: [{ model: Member, attributes: ["id", "name", "email", "phone"] }],
        limit: Number(limit),
        offset,
        order: [["date", "DESC"]],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        data: rows,
      };
    } catch (error) {
      console.error("❌ Error fetching member attendance:", error.message);
      throw error;
    }
  },
};

export default attendanceService;
