import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';

const Plan = sequelize.define("Plan", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    plan_type: {
        type: DataTypes.ENUM('Workout Plan', 'Diet Plan'),
        allowNull: false,
    },
    difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: false,
    },
    goals: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    Description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    monday_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tuesday_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    wednesday_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    thursday_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    friday_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    saturday_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    sunday_plan: {
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
    tableName: "plan",
    timestamps: true,
});

export default Plan;