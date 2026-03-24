import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import AssignPlan from "../models/assignplan.model.js";
import Plan from "../models/plan.model.js";
import Member from "../../member/models/member.model.js";
import "../models/index.js"; 

const assignPlanService = {
async create(data, user) {
  try {
    const requiredFields = ["plan_id", "member_id", "assigned_date"];
    for (const field of requiredFields) {
      if (!data[field]) throw new Error(`${field} is required`);
    }

    // 1️⃣ Get incoming plan (to know the plan_type)
    const newPlan = await Plan.findByPk(data.plan_id);
    if (!newPlan) throw new Error("Plan not found");

    // 2️⃣ Find existing assigned plan for this member
    const existingAssignPlan = await AssignPlan.findOne({
      where: { member_id: data.member_id, is_active: true,company_id: data.company_id  },
      include: [
        {
          model: Plan,
          as: "plan",
          attributes: ["id", "plan_type"],
          required: false,
        },
      ],
    });

    // 3️⃣ If exists → check if plan_type matches
    if (existingAssignPlan) {
      const existingPlan = await Plan.findByPk(existingAssignPlan.plan_id);

      if (existingPlan?.plan_type === newPlan.plan_type) {
        // 4️⃣ Same plan_type → UPDATE instead of creating new
        await existingAssignPlan.update({
          ...data,
          company_id: existingAssignPlan.company_id,
          updated_by: user?.id || null,
          updated_by_name: user?.username || null,
          updated_by_email: user?.email || null,
        });

        return {
          updated: true,
          message: "Existing assigned plan updated (same plan type)",
          data: existingAssignPlan,
        };
      }
    }

    // 5️⃣ Different plan type → Create a new record
    const assignPlan = await AssignPlan.create({
      id: uuidv4(),
      ...data,
      company_id: data.company_id,
      created_by: user?.id || null,
      created_by_name: user?.username || null,
      created_by_email: user?.email || null,
    });

    return {
      created: true,
      message: "New assign plan created",
      data: assignPlan,
    };

  } catch (error) {
    console.error("❌ Error creating assigned plan:", error.message);
    throw error;
  }
},
  /**
   * ✅ Get All Assigned Plans (pagination, search & filters)
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      is_active,
      member_id,
      plan_id,
      company_id,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};
if (company_id) where.company_id = company_id;
    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (member_id) where.member_id = member_id;
    if (plan_id) where.plan_id = plan_id;

    // Search notes
    if (search) {
      where[Op.or] = [
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await AssignPlan.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sort_by, sort_order]],
      include: [
        {
          model: Plan,
          as: "plan",
          required: false,
        },
        {
          model: Member,
          as: "member",
          required: false,
        },
      ],
    });

    return {
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  },

  /**
   * ✅ Get Assigned Plan by ID
   */
  async getById(id,company_id) {
      const assignPlan = await AssignPlan.findOne({
    where: { id, company_id } // ✅
  });
    if (!assignPlan) throw new Error("Assigned plan not found");
    return assignPlan;
  },

  /**
   * ✅ Update Assigned Plan
   */
  async update(id, data, user,company_id) {
      const assignPlan = await AssignPlan.findOne({
    where: { id, company_id } // ✅
  });

    if (!assignPlan) throw new Error("Assigned plan not found");

    await assignPlan.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return assignPlan;
  },

  /**
   * ✅ Soft Delete / Hard Delete Assigned Plan
   */
  async delete(id, user, hardDelete = false, company_id) {
      const assignPlan = await AssignPlan.findOne({
    where: { id, company_id } // ✅
  });
    if (!assignPlan) throw new Error("Assigned plan not found");

    if (hardDelete) {
      await assignPlan.destroy();
      return { message: "Assigned plan permanently deleted" };
    }

    await assignPlan.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Assigned plan deactivated successfully" };
  },

  /**
   * ✅ Restore Soft Deleted Assigned Plan
   */
  async restore(id, user,company_id) {
      const assignPlan = await AssignPlan.findOne({
    where: { id, company_id } // ✅
  });
    if (!assignPlan) throw new Error("Assigned plan not found");

    await assignPlan.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Assigned plan restored successfully" };
  },

  async getassignPlanByMemberId(userEmail,company_id) {
    const member = await Member.findOne({
      where: {
        email: userEmail,
        company_id, 
      }
    })


    if (!member) throw new Error("Member not found");

  const memberId = member.id;

    const assignPlan = await AssignPlan.findAll({
      where: {
        member_id: memberId,
        company_id,
      },
      include: [
        {
          model: Plan,
          as: "plan",
          required: false,
        },
        {
          model: Member,
          as: "member",
          required: false,
        },
      ],
    });
    return assignPlan;
  },
};

export default assignPlanService;
