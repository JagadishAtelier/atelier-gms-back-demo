// src/modules/memberMembership/service/membermembership.service.js
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Membermembership from "../models/membermembership.model.js";
import Member from "../models/member.model.js";
import Membership from "../../membership/models/membership.model.js";
import "../models/index.js";

const memberMembershipService = {
  /**
   * ✅ Create Member-Membership Relation (Assign membership to member)
   * Accepts optional: amount_paid, payment_type, membership_name, pending_amount
   * If pending_amount is not provided and membership.price exists, pending_amount will be
   * membership.price - (amount_paid || 0)
   */
  async create(data, user) {
    try {
      const requiredFields = ["member_id", "membership_id", "payment_status", "status"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      const member = await Member.findByPk(data.member_id);
      if (!member) throw new Error("Invalid member_id (Member not found)");

      const membership = await Membership.findByPk(data.membership_id);
      if (!membership) throw new Error("Invalid membership_id (Membership not found)");

      // Check if member already has memberships
      const existingMembership = await Membermembership.findOne({
        where: { member_id: data.member_id },
        order: [["end_date", "DESC"]],
      });

      let startDate;
      const today = new Date();

      if (existingMembership && existingMembership.end_date) {
        const lastEndDate = new Date(existingMembership.end_date);
        if (lastEndDate >= today) {
          // If last membership still active, start next day
          startDate = new Date(lastEndDate);
          startDate.setDate(startDate.getDate() + 1);
        } else {
          // If expired, start today
          startDate = today;
        }
      } else {
        // No previous membership
        startDate = today;
      }

      // Calculate end date automatically based on duration_months
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (membership.duration_months || 1));

      // Numeric conversions & defaults
      const amountPaid = typeof data.amount_paid !== "undefined" && data.amount_paid !== null
        ? Number(data.amount_paid)
        : 0;
      const paymentType = data.payment_type || null;
      const membershipName = data.membership_name || membership.name || null;

      // If pending_amount provided, use it; otherwise calculate from membership.price
      let pendingAmount = null;
      if (typeof data.pending_amount !== "undefined" && data.pending_amount !== null) {
        pendingAmount = Number(data.pending_amount);
      } else if (typeof membership.price !== "undefined" && membership.price !== null) {
        const priceNum = Number(membership.price) || 0;
        pendingAmount = priceNum - (amountPaid || 0);
        if (pendingAmount < 0) pendingAmount = 0;
      }

      // Create record
      const memberMembership = await Membermembership.create({
        id: uuidv4(),
        member_id: data.member_id,
        membership_id: data.membership_id,
        payment_status: data.payment_status,
        status: data.status,
        start_date: startDate,
        end_date: endDate,
        // new fields
        amount_paid: amountPaid,
        payment_type: paymentType,
        membership_name: membershipName,
        pending_amount: pendingAmount,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      return memberMembership;
    } catch (error) {
      console.error("❌ Error creating member-membership:", error.message);
      throw error;
    }
  },

  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      payment_status,
      status,
      is_active,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (payment_status) where.payment_status = payment_status;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Membermembership.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Membership,
          attributes: ["id", "name", "price", "duration_months"],
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sort_by, sort_order]],
    });

    return {
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  },

  /**
   * ✅ Get Member-Membership by ID
   */
  async getById(id) {
    const record = await Membermembership.findByPk(id, {
      include: [
        { model: Member, attributes: ["id", "name", "email", "phone"] },
        { model: Membership, attributes: ["id", "name", "price", "duration_months"] },
      ],
    });
    if (!record) throw new Error("Member-Membership record not found");
    return record;
  },

  /**
   * ✅ Update Member-Membership
   *
   * Special behavior:
   * - If `data.amount_paid` is provided, it's treated as an incremental payment to be applied to the record.
   *   The service will add that amount to existing amount_paid and subtract it from pending_amount (or
   *   compute pending_amount from membership.price if pending_amount was null).
   */
  async update(id, data, user) {
  const record = await Membermembership.findByPk(id, {
    include: [{ model: Membership, attributes: ["id", "name", "price", "duration_months"] }],
  });
  if (!record) throw new Error("Member-Membership record not found");

  // clone incoming data so we can modify
  const updatePayload = { ...data };

  try {
    let finalPending = record.pending_amount;

    // ✅ Handle incremental payment logic
    if (typeof data.amount_paid !== "undefined" && data.amount_paid !== null) {
      // Treat data.amount_paid as incremental payment
      const incrementalPayment = Number(data.amount_paid) || 0;
      const previousPaid = Number(record.amount_paid) || 0;
      const newPaidTotal = previousPaid + incrementalPayment;

      // Determine base price
      let basePrice = null;
      if (record.Membership?.price != null) {
        basePrice = Number(record.Membership.price) || 0;
      } else if (record.amount != null) {
        basePrice = Number(record.amount) || 0;
      }

      // Determine previous pending
      let previousPending =
        record.pending_amount != null ? Number(record.pending_amount) : null;

      if (previousPending === null && basePrice !== null) {
        previousPending = basePrice - previousPaid;
        if (previousPending < 0) previousPending = 0;
      }

      if (previousPending !== null) {
        finalPending = previousPending - incrementalPayment;
        if (finalPending < 0) finalPending = 0;
      } else if (basePrice !== null) {
        finalPending = basePrice - newPaidTotal;
        if (finalPending < 0) finalPending = 0;
      } else {
        finalPending = null;
      }

      updatePayload.amount_paid = newPaidTotal;
      updatePayload.pending_amount = finalPending;
    }

    // ✅ AUTO-UPDATE payment_status
    // If pending becomes 0 → PAID
    if (finalPending !== null && Number(finalPending) === 0) {
      updatePayload.payment_status = "paid";
    } 
    // Optional: if payment done but pending still exists → unpaid / partial
    else if (typeof finalPending === "number" && finalPending > 0) {
      updatePayload.payment_status = "unpaid";
    }

    // Allow updating optional fields
    if (typeof data.payment_type !== "undefined") {
      updatePayload.payment_type = data.payment_type;
    }

    if (typeof data.membership_name !== "undefined") {
      updatePayload.membership_name = data.membership_name;
    }

    // audit fields
    updatePayload.updated_by = user?.id || null;
    updatePayload.updated_by_name = user?.username || null;
    updatePayload.updated_by_email = user?.email || null;

    await record.update(updatePayload);

    await record.reload({
      include: [
        { model: Member, attributes: ["id", "name", "email", "phone"] },
        { model: Membership, attributes: ["id", "name", "price", "duration_months"] },
      ],
    });

    return record;
  } catch (error) {
    console.error("❌ Error updating member-membership:", error.message);
    throw error;
  }
},


  /**
   * ✅ Soft Delete (Deactivate)
   */
  async delete(id, user, hardDelete = false) {
    const record = await Membermembership.findByPk(id);
    if (!record) throw new Error("Member-Membership record not found");

    if (hardDelete) {
      await record.destroy();
      return { message: "Record permanently deleted" };
    }

    await record.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Record deactivated successfully" };
  },

  /**
   * ✅ Restore a deactivated record
   */
  async restore(id, user) {
    const record = await Membermembership.findByPk(id);
    if (!record) throw new Error("Member-Membership record not found");

    await record.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Record reactivated successfully" };
  },

  async getActiveMembershipsByMemberId(member_id) {
    try {
      const today = new Date();

      const activeMemberships = await Membermembership.findAll({
        where: {
          member_id,
          start_date: { [Op.lte]: today },
          end_date: { [Op.gte]: today },
          is_active: true, // optional if you use a flag
        },
        include: [
          { model: Member, attributes: ["id", "name", "email", "phone"] },
          { model: Membership, attributes: ["id", "name", "price", "duration_months"] },
        ],
        order: [["end_date", "DESC"]],
      });

      return activeMemberships;
    } catch (error) {
      console.error("❌ Error fetching active memberships:", error.message);
      throw error;
    }
  },

  /**
   * Get all memberships by member id (recent first)
   * Note: keeping a properly cased function name for other callers (React code expects getAllMembershipsByMemberId).
   */
  async getAllMembershipsByMemberId(member_id) {
    try {
      const memberships = await Membermembership.findAll({
        where: { member_id },
        include: [
          { model: Member, attributes: ["id", "name", "email", "phone"] },
          { model: Membership, attributes: ["id", "name", "price", "duration_months"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      return memberships;
    } catch (error) {
      console.error("❌ Error fetching memberships:", error.message);
      throw error;
    }
  },

  // legacy-typo alias for backward compatibility (some code might call this name)
  async getallMenbershipsByMemberId(member_id) {
    return this.getAllMembershipsByMemberId(member_id);
  },

  /**
   * ✅ Get total pending_amount for a member across their memberships
   *
   * Returns an object { member_id, pending_amount } where pending_amount is the sum of
   * pending_amount fields (if present) or computed as membership.price - amount_paid when pending_amount is null.
   *
   * By default only considers records that are is_active === true (you can change this behavior by passing includeInactive = true)
   */
  async getPendingAmountByMemberId(member_id, includeInactive = false) {
  try {
    const whereClause = { member_id };
    if (!includeInactive) whereClause.is_active = true;

    const rows = await Membermembership.findAll({
      where: whereClause,
      include: [
        {
          model: Membership,
          attributes: ["id", "name", "price"],
        },
      ],
    });

    let totalPending = 0;
    const pendingBreakdown = [];

    for (const r of rows) {
      let pendingForThisMembership = 0;

      // 1️⃣ If pending_amount already stored, use it
      if (typeof r.pending_amount !== "undefined" && r.pending_amount !== null) {
        pendingForThisMembership = Number(r.pending_amount) || 0;
      } else {
        // 2️⃣ Otherwise calculate from membership.price - amount_paid
        const price =
          r.Membership && r.Membership.price != null
            ? Number(r.Membership.price) || 0
            : 0;

        const paid =
          typeof r.amount_paid !== "undefined" && r.amount_paid !== null
            ? Number(r.amount_paid) || 0
            : 0;

        pendingForThisMembership = price - paid;
        if (pendingForThisMembership < 0) pendingForThisMembership = 0;
      }

      totalPending += pendingForThisMembership;

      pendingBreakdown.push({
        member_membership_id: r.id,
        membership_id: r.membership_id,
        membership_name: r.membership_name || r.Membership?.name || null,
        price: r.Membership?.price || null,
        amount_paid: r.amount_paid || 0,
        pending_amount: pendingForThisMembership,
        is_active: r.is_active,
        start_date: r.start_date,
        end_date: r.end_date,
      });
    }

    return {
      member_id,
      total_pending_amount: totalPending,
      memberships: pendingBreakdown,
    };
  } catch (error) {
    console.error("❌ Error calculating pending amount:", error.message);
    throw error;
  }
},

/**
 * ✅ Get next payment date by member_id
 *
 * Logic:
 * 1. Prefer latest ACTIVE membership (end_date >= today)
 * 2. Else take most recent membership (by end_date)
 * 3. next_payment_date = end_date + 1 day
 */
async getNextPaymentDateByMemberId(member_id) {
  try {
    const today = new Date();

    // Fetch all memberships for this member
    const rows = await Membermembership.findAll({
      where: { member_id },
      order: [["end_date", "DESC"]],
    });

    if (!rows || rows.length === 0) {
      return {
        member_id,
        next_payment_date: null,
        source: "no_memberships",
      };
    }

    // 1️⃣ Find active memberships
    const activeMemberships = rows.filter(
      (r) =>
        r.is_active === true &&
        r.end_date &&
        new Date(r.end_date) >= today
    );

    let selectedMembership = null;
    let source = "latest_membership";

    if (activeMemberships.length > 0) {
      // pick the one with latest end_date
      activeMemberships.sort(
        (a, b) => new Date(b.end_date) - new Date(a.end_date)
      );
      selectedMembership = activeMemberships[0];
      source = "active_membership";
    } else {
      // fallback to latest membership
      selectedMembership = rows[0];
      source = "latest_membership";
    }

    if (!selectedMembership || !selectedMembership.end_date) {
      return {
        member_id,
        next_payment_date: null,
        source,
      };
    }

    // 2️⃣ Next payment = end_date + 1 day
    const endDate = new Date(selectedMembership.end_date);
    const nextPaymentDate = new Date(endDate);
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);

    return {
      member_id,
      next_payment_date: nextPaymentDate.toISOString(),
      based_on_membership_id: selectedMembership.id,
      membership_name: selectedMembership.membership_name || null,
      end_date: selectedMembership.end_date,
      source,
    };
  } catch (error) {
    console.error("❌ Error fetching next payment date:", error.message);
    throw error;
  }
},

};

export default memberMembershipService;
