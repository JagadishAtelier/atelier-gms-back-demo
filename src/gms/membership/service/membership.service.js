import { Op } from "sequelize";
import { sequelize } from "../../../db/index.js";
import Membership from "../models/membership.model.js";
import { v4 as uuidv4 } from "uuid";

const membershipService = {
  /**
   * ✅ Create a new membership
   */
  async create(data, user) {
    try {
      // Validate required fields
      const requiredFields = ["name", "price", "duration_months"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      // Create membership record
      const membership = await Membership.create({
        id: uuidv4(),
        ...data,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return membership;
    } catch (error) {
      console.error("❌ Error creating membership:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all memberships with pagination, filters, and search
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      is_active,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Membership.findAndCountAll({
      where,
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
   * ✅ Get membership by ID
   */
  async getById(id) {
    const membership = await Membership.findByPk(id);
    if (!membership) throw new Error("Membership not found");
    return membership;
  },

  /**
   * ✅ Update membership
   */
  async update(id, data, user) {
    const membership = await Membership.findByPk(id);
    if (!membership) throw new Error("Membership not found");

    await membership.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return membership;
  },

  /**
   * ✅ Soft delete or permanently delete membership
   */
  async delete(id, user, hardDelete = false) {
    const membership = await Membership.findByPk(id);
    if (!membership) throw new Error("Membership not found");

    if (hardDelete) {
      await membership.destroy();
      return { message: "Membership permanently deleted" };
    }

    await membership.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Membership deactivated successfully" };
  },

  /**
   * ✅ Restore deactivated membership
   */
  async restore(id, user) {
    const membership = await Membership.findByPk(id);
    if (!membership) throw new Error("Membership not found");

    await membership.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Membership reactivated successfully" };
  },
};

export default membershipService;
