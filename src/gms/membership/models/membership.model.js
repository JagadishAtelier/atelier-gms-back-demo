import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';

const Membership = sequelize.define("Membership", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
  type: DataTypes.UUID,
  allowNull: true,
},
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  duration_months: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
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

}, {
  tableName: "membership",
  timestamps: true,
});

export default Membership;