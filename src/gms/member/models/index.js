// in index.js or after defining all models
import Member from "./member.model.js";
import Membership from "../../membership/models/membership.model.js";
import Membermembership from "./membermembership.model.js";

Membermembership.belongsTo(Member, { foreignKey: "member_id" });
Membermembership.belongsTo(Membership, { foreignKey: "membership_id" });
