import { sequelize } from '../../../db/index.js';
import { DataTypes } from 'sequelize';

const Membermembership = sequelize.define("Membermembership", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    member_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'member',
            key: 'id',
        },
    },
    membership_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'membership',
            key: 'id',
        },
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    payment_status: {
        type: DataTypes.ENUM('paid', 'unpaid'),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('active', 'expired', 'cancelled'),
        defaultValue: 'active',
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
    tableName: "member_membership",
    timestamps: true,
});

export default Membermembership;
