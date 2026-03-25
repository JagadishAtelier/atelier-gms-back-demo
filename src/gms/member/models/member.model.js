import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';
import User from '../../../user/models/user.model.js';

const Member = sequelize.define("Member", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    member_no: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(60),
        unique: true,
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING(15),
        unique: true,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    workout_batch: {
        type: DataTypes.ENUM('Morning', 'Afternoon', 'Evening'),
        allowNull: true,
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female'),
        allowNull: true,
    },
    dob: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    join_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: User,
            key: 'id',
        },
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    payment_status: {
        type: DataTypes.ENUM('paid', 'unpaid', 'pending', 'not started'),
        allowNull: true,
        defaultValue: 'not started',
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
      // Demo / limited access fields
  demo_start: { type: DataTypes.DATE, allowNull: true },
  demo_end: { type: DataTypes.DATE, allowNull: true },
  demo_expired: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: "member",
    timestamps: true,
});

export default Member;
