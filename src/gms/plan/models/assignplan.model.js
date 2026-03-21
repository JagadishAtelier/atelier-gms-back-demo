import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';

const AssignPlan = sequelize.define("AssignPlan", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    member_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    assigned_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    notes: {
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
    company_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
}, {
    tableName: "assign_plan",
    timestamps: true,
});

export default AssignPlan;