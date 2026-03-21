// src/modules/memberMeasurement/service/membermeasurement.service.js
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Membermeasurement from "../models/membermeasurement.models.js";
import Member from "../models/member.model.js"; // ensure associations are registered if you use that pattern

const memberMeasurementService = {
  /**
   * ✅ Create a new measurement for a member
   * required: member_id, measurement_date (height/weight optional)
   */
  async create(data, user) {
    try {
      const requiredFields = ["member_id", "measurement_date"];
      for (const f of requiredFields) {
        if (!data[f]) throw new Error(`${f} is required`);
      }

      const member = await Member.findByPk(data.member_id);
      if (!member) throw new Error("Invalid member_id (Member not found)");

      // normalize values
      const measurementDate = new Date(data.measurement_date);
      if (isNaN(measurementDate.getTime())) throw new Error("Invalid measurement_date");

      const height = typeof data.height !== "undefined" && data.height !== null ? Number(data.height) : null;
      const weight = typeof data.weight !== "undefined" && data.weight !== null ? Number(data.weight) : null;

      const record = await Membermeasurement.create({
        id: uuidv4(),
        member_id: data.member_id,
        company_id: data.company_id,
        height: height !== null ? height : null,
        weight: weight !== null ? weight : null,
        measurement_date: measurementDate,
        is_active: typeof data.is_active !== "undefined" ? data.is_active : true,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return record;
    } catch (error) {
      console.error("❌ Error creating measurement:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all measurements (with pagination, search and filters)
   * options: page, limit, search (member name / email), member_id, from_date, to_date, is_active, sort_by, sort_order
   */
  async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        member_id,
        from_date,
        to_date,
        is_active,
        sort_by = "measurement_date",
        sort_order = "DESC",
      } = options;

      const where = {};
if (options.company_id) {
  where.company_id = options.company_id; // ✅ REQUIRED
}
      if (typeof is_active !== "undefined") where.is_active = is_active;
      if (member_id) where.member_id = member_id;

      // date range filter
      if (from_date || to_date) {
        where.measurement_date = {};
        if (from_date) {
          const d = new Date(from_date);
          if (!isNaN(d.getTime())) where.measurement_date[Op.gte] = d;
        }
        if (to_date) {
          const d = new Date(to_date);
          if (!isNaN(d.getTime())) where.measurement_date[Op.lte] = d;
        }
      }

      // include Member and allow searching by name/email/phone
      const include = [
        {
          model: Member,
          attributes: ["id", "name", "email", "phone"],
          where: undefined,
          required: false,
        },
      ];

      if (search) {
        // perform search on joined Member fields
        include[0].where = {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
          ],
        };
        include[0].required = true; // make join required when searching by member fields
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Membermeasurement.findAndCountAll({
        where,
        include,
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
    } catch (error) {
      console.error("❌ Error fetching measurements:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get measurement by ID
   */
  async getById(id,company_id) {
    try {
const record = await Membermeasurement.findOne({
  where: { id, company_id }, // ✅ correct
  include: [{ model: Member, attributes: ["id", "name", "email", "phone"] }],
});
      if (!record) throw new Error("Measurement record not found");
      return record;
    } catch (error) {
      console.error("❌ Error getting measurement by id:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Update a measurement record
   */
  async update(id, data, user, company_id) {
    try {
        const record = await Membermeasurement.findOne({
    where: { id, company_id }, // ✅ enforce
  });
      if (!record) throw new Error("Measurement record not found");

      const updatePayload = {};

      if (typeof data.height !== "undefined") updatePayload.height = data.height === null ? null : Number(data.height);
      if (typeof data.weight !== "undefined") updatePayload.weight = data.weight === null ? null : Number(data.weight);
      if (typeof data.measurement_date !== "undefined") {
        const d = new Date(data.measurement_date);
        if (isNaN(d.getTime())) throw new Error("Invalid measurement_date");
        updatePayload.measurement_date = d;
      }
      if (typeof data.is_active !== "undefined") updatePayload.is_active = data.is_active;

      updatePayload.updated_by = user?.id || null;
      updatePayload.updated_by_name = user?.username || null;
      updatePayload.updated_by_email = user?.email || null;

      await record.update(updatePayload);
      return record;
    } catch (error) {
      console.error("❌ Error updating measurement:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Soft delete (deactivate) or hard delete a measurement
   */
  async delete(id, user, hardDelete = false,company_id) {
    try {
        const record = await Membermeasurement.findOne({
    where: { id, company_id },
  });
      if (!record) throw new Error("Measurement record not found");

      if (hardDelete) {
        await record.destroy();
        return { message: "Measurement permanently deleted" };
      }

      await record.update({
        is_active: false,
        deleted_by: user?.id || null,
        deleted_by_name: user?.username || null,
        deleted_by_email: user?.email || null,
      });

      return { message: "Measurement deactivated successfully" };
    } catch (error) {
      console.error("❌ Error deleting measurement:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Restore a deactivated measurement
   */
  async restore(id, user,company_id) {
    try {
        const record = await Membermeasurement.findOne({
    where: { id, company_id },
  });
      if (!record) throw new Error("Measurement record not found");

      await record.update({
        is_active: true,
        updated_by: user?.id || null,
        updated_by_name: user?.username || null,
        updated_by_email: user?.email || null,
      });

      return { message: "Measurement reactivated successfully" };
    } catch (error) {
      console.error("❌ Error restoring measurement:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get latest measurement for a member (by measurement_date desc)
   */
  async getLatestMeasurementByMemberId(member_id,company_id) {
    try {
      const list = await Membermeasurement.findAll({
        where: { member_id, is_active: true,company_id },
        order: [["measurement_date", "DESC"]],
        limit: 1,
        include: [{ model: Member, attributes: ["id", "name", "email", "phone"] }],
      });

      return Array.isArray(list) && list.length > 0 ? list[0] : null;
    } catch (error) {
      console.error("❌ Error fetching latest measurement:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all measurements for a member (ordered by measurement_date desc)
   */
  async getMeasurementsByMemberId(member_id, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      const rows = await Membermeasurement.findAll({
        where: { member_id,company_id: options.company_id },
        include: [{ model: Member, as: "member", attributes: ["id", "name", "email", "phone"] }],
        order: [["measurement_date", "DESC"]],
        limit: Number(limit),
        offset,
      });

      return rows;
    } catch (error) {
      console.error("❌ Error fetching measurements by member id:", error.message);
      throw error;
    }
  },
};

export default memberMeasurementService;
