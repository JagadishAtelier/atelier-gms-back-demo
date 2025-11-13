// src/modules/dashboard/service/dashboard.service.js
import { sequelize } from "../../../db/index.js";
import { QueryTypes } from "sequelize";

/**
 * Returns a rich set of dashboard stats and chart-ready series.
 * Uses only: member, membership, member_membership tables.
 */
export async function getDashboardStats(opts = { recentMembersLimit: 8 }) {
  const conn = sequelize;
  const results = {};

  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const monthEndStr = monthEnd.toISOString().slice(0, 10);

    // --- Basic counts & sums (existing fields) ---
    const [activeRow] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM member WHERE is_active = TRUE;`,
      { type: QueryTypes.SELECT }
    );
    results.activeMembers = Number(activeRow?.cnt ?? 0);

    const [inactiveRow] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM member WHERE is_active = FALSE;`,
      { type: QueryTypes.SELECT }
    );
    results.inactiveMembers = Number(inactiveRow?.cnt ?? 0);

    const [membershipRow] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM membership WHERE is_active = TRUE;`,
      { type: QueryTypes.SELECT }
    );
    results.totalPlans = Number(membershipRow?.cnt ?? 0);

    const [revenueRow] = await conn.query(
      `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
       FROM member_membership mm
       JOIN membership m ON mm.membership_id = m.id
       WHERE mm.payment_status = 'paid' AND mm.is_active = TRUE;`,
      { type: QueryTypes.SELECT }
    );
    results.totalRevenue = Number(revenueRow?.total ?? 0);

    const [monthRevenueRow] = await conn.query(
      `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
       FROM member_membership mm
       JOIN membership m ON mm.membership_id = m.id
       WHERE mm.payment_status = 'paid'
         AND mm.start_date >= :monthStart
         AND mm.start_date < :monthEnd
         AND mm.is_active = TRUE;`,
      {
        type: QueryTypes.SELECT,
        replacements: { monthStart: monthStartStr, monthEnd: monthEndStr },
      }
    );
    results.monthlyRevenue = Number(monthRevenueRow?.total ?? 0);

    const [pendingRow] = await conn.query(
      `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
       FROM member_membership mm
       JOIN membership m ON mm.membership_id = m.id
       WHERE mm.payment_status = 'unpaid' AND mm.is_active = TRUE;`,
      { type: QueryTypes.SELECT }
    );
    results.pendingDues = Number(pendingRow?.total ?? 0);

    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    const next7Str = next7.toISOString().slice(0, 10);
    const [renewalRow] = await conn.query(
      `SELECT COUNT(*) AS cnt 
       FROM member_membership
       WHERE end_date BETWEEN :today AND :next7
         AND is_active = TRUE;`,
      {
        type: QueryTypes.SELECT,
        replacements: { today: todayStr, next7: next7Str },
      }
    );
    results.upcomingRenewals = Number(renewalRow?.cnt ?? 0);

    const membershipStatus = await conn.query(
      `SELECT status, COUNT(*) AS cnt
       FROM member_membership
       WHERE is_active = TRUE
       GROUP BY status;`,
      { type: QueryTypes.SELECT }
    );
    results.membershipStatus = membershipStatus;

    // --- revenueData (last 3 months) - kept for compatibility ---
    const revenueData = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      const [paidRow] = await conn.query(
        `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
         FROM member_membership mm
         JOIN membership m ON mm.membership_id = m.id
         WHERE mm.payment_status = 'paid'
           AND mm.start_date >= :start
           AND mm.start_date < :end
           AND mm.is_active = TRUE;`,
        { type: QueryTypes.SELECT, replacements: { start: startStr, end: endStr } }
      );

      const [unpaidRow] = await conn.query(
        `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
         FROM member_membership mm
         JOIN membership m ON mm.membership_id = m.id
         WHERE mm.payment_status = 'unpaid'
           AND mm.start_date >= :start
           AND mm.start_date < :end
           AND mm.is_active = TRUE;`,
        { type: QueryTypes.SELECT, replacements: { start: startStr, end: endStr } }
      );

      const label = start.toLocaleString("default", { month: "short" });
      revenueData.push({
        month: label,
        revenue: Number(paidRow?.total ?? 0),
        pending: Number(unpaidRow?.total ?? 0),
      });
    }
    results.revenueData = revenueData;

    // --- Gender & batch breakdowns (existing) ---
    const genderCount = await conn.query(
      `SELECT gender, COUNT(*) AS cnt
       FROM member
       WHERE is_active = TRUE
       GROUP BY gender;`,
      { type: QueryTypes.SELECT }
    );
    results.genderBreakdown = genderCount;

    const batchCount = await conn.query(
      `SELECT workout_batch AS batch, COUNT(*) AS cnt
       FROM member
       WHERE is_active = TRUE
       GROUP BY workout_batch;`,
      { type: QueryTypes.SELECT }
    );
    results.batchBreakdown = batchCount;

    // ---------------- New: Graph / Chart friendly datasets ----------------

    // 1) revenueTrend - last 12 months (useful for charts)
    const revenueTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      const [paidRow] = await conn.query(
        `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
         FROM member_membership mm
         JOIN membership m ON mm.membership_id = m.id
         WHERE mm.payment_status = 'paid'
           AND mm.start_date >= :start
           AND mm.start_date < :end
           AND mm.is_active = TRUE;`,
        { type: QueryTypes.SELECT, replacements: { start: startStr, end: endStr } }
      );

      const [unpaidRow] = await conn.query(
        `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
         FROM member_membership mm
         JOIN membership m ON mm.membership_id = m.id
         WHERE mm.payment_status = 'unpaid'
           AND mm.start_date >= :start
           AND mm.start_date < :end
           AND mm.is_active = TRUE;`,
        { type: QueryTypes.SELECT, replacements: { start: startStr, end: endStr } }
      );

      revenueTrend.push({
        month: start.toLocaleString("default", { month: "short" }),
        revenue: Number(paidRow?.total ?? 0),
        pending: Number(unpaidRow?.total ?? 0),
      });
    }
    results.revenueTrend = revenueTrend;

    // 2) monthlyJoins - last 6 months (for join trend chart)
    const monthlyJoins = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      const [joinRow] = await conn.query(
        `SELECT COUNT(*) AS cnt
         FROM member
         WHERE createdAt >= :start AND createdAt < :end;`,
        { type: QueryTypes.SELECT, replacements: { start: startStr, end: endStr } }
      );

      monthlyJoins.push({
        month: start.toLocaleString("default", { month: "short" }),
        joins: Number(joinRow?.cnt ?? 0),
      });
    }
    results.monthlyJoins = monthlyJoins;

    // 3) topPlans - top 5 plans by active subscribers (active member_membership)
    const topPlans = await conn.query(
      `SELECT m.id, m.name, m.price, COUNT(mm.id) AS subscribers
       FROM membership m
       LEFT JOIN member_membership mm ON mm.membership_id = m.id AND mm.is_active = TRUE
       GROUP BY m.id, m.name, m.price
       ORDER BY subscribers DESC
       LIMIT 5;`,
      { type: QueryTypes.SELECT }
    );
    results.topPlans = topPlans;

    // 4) avgMembershipDurationDays - average (end_date - start_date) in days
    try {
      const [avgDurRow] = await conn.query(
        `SELECT COALESCE(AVG(DATEDIFF(end_date, start_date)), 0) AS avg_days
         FROM member_membership
         WHERE end_date IS NOT NULL AND start_date IS NOT NULL;`,
        { type: QueryTypes.SELECT }
      );
      results.avgMembershipDurationDays = Number(avgDurRow?.avg_days ?? 0);
    } catch (err) {
      results.avgMembershipDurationDays = 0;
    }

    // 5) membersJoinedLast30Days
    const [joined30Row] = await conn.query(
      `SELECT COUNT(*) AS cnt
       FROM member
       WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);`,
      { type: QueryTypes.SELECT }
    );
    results.membersJoinedLast30Days = Number(joined30Row?.cnt ?? 0);

    // 6) churnRate - expired memberships in last 30 days / total subscriptions (as percent)
    const [expired30Row] = await conn.query(
      `SELECT COUNT(*) AS cnt
       FROM member_membership
       WHERE status = 'expired' AND end_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);`,
      { type: QueryTypes.SELECT }
    );
    const [totalSubsRow] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM member_membership WHERE is_active = TRUE;`,
      { type: QueryTypes.SELECT }
    );
    const expired30 = Number(expired30Row?.cnt ?? 0);
    const totalSubs = Number(totalSubsRow?.cnt ?? 0);
    results.churnRate = totalSubs > 0 ? Number(((expired30 / totalSubs) * 100).toFixed(2)) : 0;

    // 7) activeVsExpiredCounts (useful for donut charts)
    const [activeSubsRow] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM member_membership WHERE status = 'active' AND is_active = TRUE;`,
      { type: QueryTypes.SELECT }
    );
    const [expiredSubsRow] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM member_membership WHERE status = 'expired';`,
      { type: QueryTypes.SELECT }
    );
    results.activeVsExpired = {
      active: Number(activeSubsRow?.cnt ?? 0),
      expired: Number(expiredSubsRow?.cnt ?? 0),
    };

    // 8) recentMembers (latest signups) - helpful for activity feed
    const recentLimit = Number(opts.recentMembersLimit || 8);
    const recentMembers = await conn.query(
      `SELECT id, name, email, phone, createdAt, createdAt
       FROM member
       ORDER BY createdAt DESC
       LIMIT :limit;`,
      { type: QueryTypes.SELECT, replacements: { limit: recentLimit } }
    );
    results.recentMembers = (recentMembers || []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      joinDate: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));

    // return a well-structured object for frontend consumption
    return {
      // core
      activeMembers: results.activeMembers || 0,
      inactiveMembers: results.inactiveMembers || 0,
      totalPlans: results.totalPlans || 0,
      totalRevenue: results.totalRevenue || 0,
      monthlyRevenue: results.monthlyRevenue || 0,
      pendingDues: results.pendingDues || 0,
      upcomingRenewals: results.upcomingRenewals || 0,
      membershipStatus: results.membershipStatus || [],

      // compatibility revenue series (3 months)
      revenueData: results.revenueData || [],

      // new/graph data
      revenueTrend: results.revenueTrend || [],
      monthlyJoins: results.monthlyJoins || [],
      topPlans: results.topPlans || [],
      avgMembershipDurationDays: results.avgMembershipDurationDays || 0,
      membersJoinedLast30Days: results.membersJoinedLast30Days || 0,
      churnRate: results.churnRate || 0,
      activeVsExpired: results.activeVsExpired || { active: 0, expired: 0 },

      // demographic
      genderBreakdown: results.genderBreakdown || [],
      batchBreakdown: results.batchBreakdown || [],

      // cards / list
      recentMembers: results.recentMembers || [],
    };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    // return safe defaults (frontend will still work)
    return {
      activeMembers: 0,
      inactiveMembers: 0,
      totalPlans: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingDues: 0,
      upcomingRenewals: 0,
      membershipStatus: [],
      revenueData: [],
      revenueTrend: [],
      monthlyJoins: [],
      topPlans: [],
      avgMembershipDurationDays: 0,
      membersJoinedLast30Days: 0,
      churnRate: 0,
      activeVsExpired: { active: 0, expired: 0 },
      genderBreakdown: [],
      batchBreakdown: [],
      recentMembers: [],
    };
  }
}

// default export with getStats alias to be compatible with controllers expecting dashboardService.getStats(...)
export default {
  getStats: getDashboardStats,
  getDashboardStats,
};
