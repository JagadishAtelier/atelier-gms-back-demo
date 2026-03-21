import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';
import member from '../models/member.model.js';

const Membermeasurement = sequelize.define("Membermeasurement", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
        company_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    member_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: member,
            key: 'id',
        },
    },
    height: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    weight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    measurement_date: {
        type: DataTypes.DATE,
        allowNull: false,
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
    tableName: "membermeasurement",
    timestamps: true,
});

export default Membermeasurement;
