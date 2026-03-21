// models/otp.model.js
import { sequelize } from "../../../db/index.js";
import { DataTypes } from "sequelize";

const OTP = sequelize.define("OTP", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export default OTP;