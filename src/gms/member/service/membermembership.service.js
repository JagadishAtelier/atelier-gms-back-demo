// src/modules/memberMembership/service/membermembership.service.js
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Membermembership from "../models/membermembership.model.js";
import Member from "../models/member.model.js";
import Membership from "../../membership/models/membership.model.js";
import "../models/index.js"

const memberMembershipService = {
  /**
   * ✅ Create Member-Membership Relation (Assign membership to member)
   */
  async create(data, user) {
    try {
      const requiredFields = ["member_id", "membership_id", "start_date", "end_date"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      // Validate member and membership existence
      const member = await Member.findByPk(data.member_id);
      if (!member) throw new Error("Invalid member_id (Member not found)");

      const membership = await Membership.findByPk(data.membership_id);
      if (!membership) throw new Error("Invalid membership_id (Membership not found)");

      // Create record
      const memberMembership = await Membermembership.create({
        id: uuidv4(),
        ...data,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return memberMembership;
    } catch (error) {
      console.error("❌ Error creating member-membership:", error.message);
      throw error;
    }
  },

  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      payment_status,
      status,
      is_active,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (payment_status) where.payment_status = payment_status;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Membermembership.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Membership,
          attributes: ["id", "name", "price", "duration_months"],
        },
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
   * ✅ Get Member-Membership by ID
   */
  async getById(id) {
    const record = await Membermembership.findByPk(id, {
      include: [
        { model: Member, attributes: ["id", "name", "email", "phone"] },
        { model: Membership, attributes: ["id", "name", "price", "duration_months"] },
      ],
    });
    if (!record) throw new Error("Member-Membership record not found");
    return record;
  },

  /**
   * ✅ Update Member-Membership
   */
  async update(id, data, user) {
    const record = await Membermembership.findByPk(id);
    if (!record) throw new Error("Member-Membership record not found");

    await record.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return record;
  },

  /**
   * ✅ Soft Delete (Deactivate)
   */
  async delete(id, user, hardDelete = false) {
    const record = await Membermembership.findByPk(id);
    if (!record) throw new Error("Member-Membership record not found");

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
   * ✅ Restore a deactivated record
   */
  async restore(id, user) {
    const record = await Membermembership.findByPk(id);
    if (!record) throw new Error("Member-Membership record not found");

    await record.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Record reactivated successfully" };
  },
};

export default memberMembershipService;
