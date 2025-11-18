import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';

const Gym = sequelize.define("Gym", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING(15),
        unique: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(60),
        unique: true,
        allowNull: false,
    },
    logo_url: {
        type: DataTypes.STRING,
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
    tableName: "gym",
    timestamps: true,
});

export default Gym;
