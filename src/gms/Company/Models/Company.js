// models/company.model.js
import { sequelize } from "../../../db/index.js";
import { DataTypes } from "sequelize";

const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ✅ REQUIRED
    company_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    owner_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    // 🔓 OPTIONAL
    business_type: {
      type: DataTypes.ENUM("Retail", "Wholesale", "Pharmacy", "Distributor"),
      allowNull: true,
    },

    gst_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // 🔥 Demo fields
    is_demo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    demo_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // 🔐 Common fields
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    created_by_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    updated_by_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    deleted_by_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    created_by_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    updated_by_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    deleted_by_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "companies",
    timestamps: true,
  }
);

export default Company;