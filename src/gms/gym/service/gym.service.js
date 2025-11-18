import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Gym from "../models/gym.model.js";

const gymService = {
  /**
   * ✅ Create a new Gym
   */
  async create(data, user) {
    try {
      const requiredFields = ["name", "address", "phone", "email"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      const gym = await Gym.create({
        id: uuidv4(),
        ...data,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return gym;
    } catch (error) {
      console.error("❌ Error creating gym:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all gyms with pagination, search & filters
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

    // Active/Inactive filter
    if (typeof is_active !== "undefined") {
      where.is_active = is_active;
    }

    // Search
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Gym.findAndCountAll({
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
   * ✅ Get gym by ID
   */
  async getById(id) {
    const gym = await Gym.findByPk(id);
    if (!gym) throw new Error("Gym not found");
    return gym;
  },

  /**
   * ✅ Update gym
   */
  async update(id, data, user) {
    const gym = await Gym.findByPk(id);
    if (!gym) throw new Error("Gym not found");

    await gym.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return gym;
  },

  /**
   * ❌ Soft delete gym (mark inactive)
   */
  async delete(id, user, hardDelete = false) {
    const gym = await Gym.findByPk(id);
    if (!gym) throw new Error("Gym not found");

    if (hardDelete) {
      await gym.destroy();
      return { message: "Gym permanently deleted" };
    }

    await gym.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Gym deactivated successfully" };
  },

  /**
   * ♻️ Restore gym
   */
  async restore(id, user) {
    const gym = await Gym.findByPk(id);
    if (!gym) throw new Error("Gym not found");

    await gym.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Gym reactivated successfully" };
  },
};

export default gymService;
