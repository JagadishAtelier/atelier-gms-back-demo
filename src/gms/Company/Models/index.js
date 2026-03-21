import User from "../../../user/models/user.model.js";
import Company from "./Company.js";

// 🔹 Define relationships
User.belongsTo(Company, { foreignKey: "company_id" });
Company.hasMany(User, { foreignKey: "company_id" });

export { User, Company };