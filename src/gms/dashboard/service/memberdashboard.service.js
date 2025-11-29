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
  async getDashboardByMemberId(userEmail) {
    try {
      if (!userEmail) throw new Error("userEmail is required");

      // ✔ Get member record by email
      const member = await Member.findOne({ where: { email: userEmail } });
      if (!member) throw new Error("Member not found");
      const memberId = member.id;

      // ✔ Get active membership plan
      const activeMembership = await Membermembership.findOne({
        where: {
          member_id: memberId,
          is_active: true,
          end_date: { [Op.gte]: new Date() } // ensure not expired
        },
        include: [
          { model: Membership,as: "Membership", attributes: ["id", "name", "price", "duration_months"] }
        ],
        order: [["end_date", "DESC"]],
        limit: 1
      });
      console.log("activeMembership", activeMembership);

      // Workout plan availability
      const workoutPlan = await MemberAssignPlan.findOne({
        where: { member_id: memberId, is_active: true },
        include: [
          {
            model: Plan,
            as: "plan",
            attributes: ["plan_type"],
            required: false,
            where: { plan_type: { [Op.like]: "%workout%" } }
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: 1
      });

      // Diet plan availability
      const dietPlan = await MemberAssignPlan.findOne({
        where: { member_id: memberId, is_active: true },
        include: [
          {
            model: Plan,
            as: "plan",
            attributes: ["plan_type"],
            required: false,
            where: { plan_type: { [Op.like]: "%diet%" } }
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: 1
      });

      return {
        status: "success",
        message: "Dashboard fetched successfully",
        data: {
          membershipStatus: activeMembership?.status === "active" ? "Active" : "Inactive",
          planName: activeMembership?.Membership?.name || "—",
          nextPaymentDate: activeMembership?.end_date
            ? new Date(activeMembership.end_date).toISOString().split("T")[0]
            : "—",
          plans: {
            workout: workoutPlan?.plan ? "Available" : "Not available",
            diet: dietPlan?.plan ? "Available" : "Not available"
          }
        }
      };
    } catch (err) {
      console.error("❌ getDashboardByMemberId error:", err.message);
      throw err;
    }
  }
};

export default memberDashboardService;
