import Plan from "./plan.model.js";
import AssignPlan from "./assignplan.model.js";
import Member from "../../member/models/member.model.js";

// Define associations
AssignPlan.belongsTo(Plan, { foreignKey: "plan_id", as: "plan" });
Plan.hasMany(AssignPlan, { foreignKey: "plan_id", as: "assignedPlans" });
AssignPlan.belongsTo(Member, { foreignKey: "member_id", as: "member" });