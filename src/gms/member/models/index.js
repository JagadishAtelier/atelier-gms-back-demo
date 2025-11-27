// in index.js or after defining all models
import Member from "./member.model.js";
import Membership from "../../membership/models/membership.model.js";
import Membermembership from "./membermembership.model.js";
import Membermeasurement from "./membermeasurement.models.js";


Membermembership.belongsTo(Member, { foreignKey: "member_id" });
Membermembership.belongsTo(Membership, { foreignKey: "membership_id" });

Member.hasMany(Membermeasurement, {
  foreignKey: "member_id",
  as: "measurements",
});

Membermeasurement.belongsTo(Member, {
  foreignKey: "member_id",
  as: "member",
});
