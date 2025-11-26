import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Member from "../models/member.model.js";
import User from "../../../user/models/user.model.js";
import bcrypt from "bcrypt";

const memberService = {
  /**
   * ✅ Create a new member
   */
  async create(data, user) {
  try {
    // Required fields
    const requiredFields = ["name", "email", "phone"];
    for (const field of requiredFields) {
      if (!data[field]) throw new Error(`${field} is required`);
    }

    // 1️⃣ Create new member
    const member = await Member.create({
      id: uuidv4(),
      ...data,
      created_by: user?.id || null,
      created_by_name: user?.username || null,
      created_by_email: user?.email || null,
    });

    // 2️⃣ Create User account for this member
    const hashedPassword = await bcrypt.hash(data.phone, 10);

    await User.create({
      id: uuidv4(),
      role: "member",
      username: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      created_by: user?.id || null,
    });

    return member;

  } catch (error) {
    console.error("❌ Error creating member:", error.message);
    throw error;
  }
},

  /**
   * ✅ Get all members with pagination, search, and filters
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      is_active,
      gender,
      workout_batch,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (gender) where.gender = gender;
    if (workout_batch) where.workout_batch = workout_batch;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Member.findAndCountAll({
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
   * ✅ Get member by ID
   */
  async getById(id) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");
    return member;
  },

  /**
   * ✅ Update member
   */
  async update(id, data, user) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");

    await member.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return member;
  },

  /**
   * ✅ Soft delete or permanently delete a member
   */
  async delete(id, user, hardDelete = false) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");

    if (hardDelete) {
      await member.destroy();
      return { message: "Member permanently deleted" };
    }

    await member.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Member deactivated successfully" };
  },

  /**
   * ✅ Restore a deactivated member
   */
  async restore(id, user) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");

    await member.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Member reactivated successfully" };
  },
};

export default memberService;
