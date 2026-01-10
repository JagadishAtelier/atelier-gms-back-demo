import { Op } from "sequelize";
import MemberAssignPlan from "../../plan/models/assignplan.model.js";
import Member from "../../member/models/member.model.js";
import Plan from "../../plan/models/plan.model.js";
import Membermembership from "../../member/models/membermembership.model.js";
import Membership from "../../membership/models/membership.model.js";

const memberDashboardService = {
  /**
   * ✅ Get simplified dashboard using member email (token based)
   */
  async getDashboardByMemberId(userEmail, userPhone) {
  try {
    // ✅ Validate input
    if (!userEmail && !userPhone) {
      throw new Error("Email or phone is required");
    }

    // ✅ Find member by email OR phone
    const member = await Member.findOne({
      where: {
        [Op.or]: [
          userEmail ? { email: userEmail } : null,
          userPhone ? { phone: userPhone } : null,
        ].filter(Boolean),
      },
    });

    if (!member) throw new Error("Member not found");

    const memberId = member.id;

    // ✅ Active membership
    const activeMembership = await Membermembership.findOne({
      where: {
        member_id: memberId,
        is_active: true,
        end_date: { [Op.gte]: new Date() },
      },
      include: [
        {
          model: Membership,
          as: "Membership",
          attributes: ["id", "name", "price", "duration_months"],
        },
      ],
      order: [["end_date", "DESC"]],
      limit: 1,
    });

    // ✅ Workout plan
    const workoutPlan = await MemberAssignPlan.findOne({
      where: { member_id: memberId, is_active: true },
      include: [
        {
          model: Plan,
          as: "plan",
          attributes: ["plan_type"],
          where: { plan_type: { [Op.like]: "%workout%" } },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    // ✅ Diet plan
    const dietPlan = await MemberAssignPlan.findOne({
      where: { member_id: memberId, is_active: true },
      include: [
        {
          model: Plan,
          as: "plan",
          attributes: ["plan_type"],
          where: { plan_type: { [Op.like]: "%diet%" } },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    return {
      status: "success",
      message: "Dashboard fetched successfully",
      data: {
        membershipStatus:
          activeMembership?.is_active ? "Active" : "Inactive",
        planName: activeMembership?.Membership?.name || "—",
        nextPaymentDate: activeMembership?.end_date
          ? new Date(activeMembership.end_date).toISOString().split("T")[0]
          : "—",
        plans: {
          workout: workoutPlan?.plan ? "Available" : "Not available",
          diet: dietPlan?.plan ? "Available" : "Not available",
        },
      },
    };
  } catch (err) {
    console.error("❌ getDashboardByMemberId error:", err.message);
    throw err;
  }
}
};

export default memberDashboardService;
