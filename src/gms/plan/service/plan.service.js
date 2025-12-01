import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Plan from "../models/plan.model.js";

const planService = {
  /**
   * ✅ Create a new plan
   */
  async create(data, user) {
    try {
      const requiredFields = ["title", "plan_type", "difficulty"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      const plan = await Plan.create({
        id: uuidv4(),
        ...data,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return plan;
    } catch (error) {
      console.error("❌ Error creating plan:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all plans with pagination, search & filters
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      plan_type,
      difficulty,
      is_active,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (plan_type) where.plan_type = plan_type;
    if (difficulty) where.difficulty = difficulty;
    if (typeof is_active !== "undefined") where.is_active = is_active;

    // Search filtering
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { duration: { [Op.like]: `%${search}%` } },
        { Description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Plan.findAndCountAll({
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
   * ✅ Get plan by ID
   */
  async getById(id) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new Error("Plan not found");
    return plan;
  },

  /**
   * ✅ Update plan
   */
  async update(id, data, user) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new Error("Plan not found");

    await plan.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return plan;
  },

  /**
   * ✅ Soft delete or hard delete plan
   */
  async delete(id, user, hardDelete = false) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new Error("Plan not found");

    if (hardDelete) {
      await plan.destroy();
      return { message: "Plan permanently deleted" };
    }

    await plan.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Plan deactivated successfully" };
  },

  /**
   * ✅ Restore soft deleted plan
   */
  async restore(id, user) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new Error("Plan not found");

    await plan.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Plan reactivated successfully" };
  },
};

export default planService;
