// src/modules/dashboard/service/dashboard.service.js
import { sequelize } from "../../../db/index.js";
import { QueryTypes } from "sequelize";

/**
 * Faster dashboard stats:
 * - reduces DB round-trips by combining many counts into one subquery-row
 * - uses aggregated queries for revenueTrend / monthlyJoins (no per-month queries)
 * - runs independent queries in parallel with Promise.all
 * - maps results to the original output shape
 */
export async function getDashboardStats(opts = { recentMembersLimit: 8 }) {
  const conn = sequelize;
  const results = {};

  try {
    const now = new Date();

    // helper to format YYYY-MM-DD
    const fmt = (d) => d.toISOString().slice(0, 10);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = fmt(today);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthStartStr = fmt(monthStart);
    const monthEndStr = fmt(monthEnd);

    const next7 = new Date();
    next7.setDate(next7.getDate() + 7);
    const next7Str = fmt(next7);

    // date ranges for aggregated queries
    const start12 = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 months ago (first day)
    const start12Str = fmt(start12);

    const start6 = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6 months ago
    const start6Str = fmt(start6);

    // main single-row stats query (subqueries) to reduce round-trips
    const mainStatsQuery = `
      SELECT
        (SELECT COUNT(*) FROM member WHERE is_active = TRUE) AS activeMembers,
        (SELECT COUNT(*) FROM member WHERE is_active = FALSE) AS inactiveMembers,
        (SELECT COUNT(*) FROM membership WHERE is_active = TRUE) AS totalPlans,

        (SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0)
           FROM member_membership mm
           JOIN membership m ON mm.membership_id = m.id
           WHERE mm.payment_status = 'paid' AND mm.is_active = TRUE
        ) AS totalRevenue,

        (SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0)
           FROM member_membership mm
           JOIN membership m ON mm.membership_id = m.id
           WHERE mm.payment_status = 'unpaid' AND mm.is_active = TRUE
        ) AS pendingDues,

        (SELECT COUNT(*) FROM member_membership WHERE end_date BETWEEN :today AND :next7 AND is_active = TRUE) AS upcomingRenewals,

        (SELECT COUNT(*) FROM member_membership WHERE status = 'active' AND is_active = TRUE) AS activeSubs,
        (SELECT COUNT(*) FROM member_membership WHERE status = 'expired') AS expiredSubs,
        (SELECT COUNT(*) FROM member_membership WHERE is_active = TRUE) AS totalSubs
    `;

    // aggregated revenue for last 12 months (grouped by year-month)
    const revenueTrendQuery = `
      SELECT
        DATE_FORMAT(mm.start_date, '%Y-%m') AS ym,
        DATE_FORMAT(mm.start_date, '%b') AS month_label,
        SUM(CASE WHEN mm.payment_status = 'paid' AND mm.is_active = TRUE THEN CAST(m.price AS DECIMAL(18,2)) ELSE 0 END) AS revenue,
        SUM(CASE WHEN mm.payment_status = 'unpaid' AND mm.is_active = TRUE THEN CAST(m.price AS DECIMAL(18,2)) ELSE 0 END) AS pending
      FROM member_membership mm
      JOIN membership m ON mm.membership_id = m.id
      WHERE mm.start_date >= :start12
      GROUP BY ym
      ORDER BY ym;
    `;

    // monthly joins for last 6 months
    const monthlyJoinsQuery = `
      SELECT
        DATE_FORMAT(createdAt, '%Y-%m') AS ym,
        DATE_FORMAT(createdAt, '%b') AS month_label,
        COUNT(*) AS joins
      FROM member
      WHERE createdAt >= :start6
      GROUP BY ym
      ORDER BY ym;
    `;

    // membershipStatus (active member_membership grouped by status)
    const membershipStatusQuery = `
      SELECT status, COUNT(*) AS cnt
      FROM member_membership
      WHERE is_active = TRUE
      GROUP BY status;
    `;

    // gender and batch breakdowns
    const genderBreakdownQuery = `
      SELECT gender, COUNT(*) AS cnt
      FROM member
      WHERE is_active = TRUE
      GROUP BY gender;
    `;
    const batchBreakdownQuery = `
      SELECT workout_batch AS batch, COUNT(*) AS cnt
      FROM member
      WHERE is_active = TRUE
      GROUP BY workout_batch;
    `;

    // top plans
    const topPlansQuery = `
      SELECT m.id, m.name, m.price, COUNT(mm.id) AS subscribers
      FROM membership m
      LEFT JOIN member_membership mm ON mm.membership_id = m.id AND mm.is_active = TRUE
      GROUP BY m.id, m.name, m.price
      ORDER BY subscribers DESC
      LIMIT 5;
    `;

    // avg membership duration
    const avgDurationQuery = `
      SELECT COALESCE(AVG(DATEDIFF(end_date, start_date)), 0) AS avg_days
      FROM member_membership
      WHERE end_date IS NOT NULL AND start_date IS NOT NULL;
    `;

    // members joined last 30 days
    const joinedLast30Query = `
      SELECT COUNT(*) AS cnt
      FROM member
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    `;

    // expired last 30 days
    const expired30Query = `
      SELECT COUNT(*) AS cnt
      FROM member_membership
      WHERE status = 'expired' AND end_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    `;

    // recent members
    const recentMembersQuery = `
      SELECT id, name, email, phone, createdAt
      FROM member
      ORDER BY createdAt DESC
      LIMIT :limit;
    `;

    // run independent queries in parallel
    const [
      [mainStatsRow],
      revenueRows,
      monthlyJoinsRows,
      membershipStatusRows,
      genderRows,
      batchRows,
      topPlansRows,
      avgDurRow,
      joined30Row,
      expired30Row,
      recentMembersRows,
    ] = await Promise.all([
      conn.query(mainStatsQuery, {
        type: QueryTypes.SELECT,
        replacements: { today: todayStr, next7: next7Str },
      }),
      conn.query(revenueTrendQuery, {
        type: QueryTypes.SELECT,
        replacements: { start12: start12Str },
      }),
      conn.query(monthlyJoinsQuery, { type: QueryTypes.SELECT, replacements: { start6: start6Str } }),
      conn.query(membershipStatusQuery, { type: QueryTypes.SELECT }),
      conn.query(genderBreakdownQuery, { type: QueryTypes.SELECT }),
      conn.query(batchBreakdownQuery, { type: QueryTypes.SELECT }),
      conn.query(topPlansQuery, { type: QueryTypes.SELECT }),
      conn.query(avgDurationQuery, { type: QueryTypes.SELECT }),
      conn.query(joinedLast30Query, { type: QueryTypes.SELECT }),
      conn.query(expired30Query, { type: QueryTypes.SELECT }),
      conn.query(recentMembersQuery, { type: QueryTypes.SELECT, replacements: { limit: Number(opts.recentMembersLimit || 8) } }),
    ]);

    // map simple main stats
    results.activeMembers = Number(mainStatsRow?.activeMembers ?? 0);
    results.inactiveMembers = Number(mainStatsRow?.inactiveMembers ?? 0);
    results.totalPlans = Number(mainStatsRow?.totalPlans ?? 0);
    results.totalRevenue = Number(mainStatsRow?.totalRevenue ?? 0);
    results.pendingDues = Number(mainStatsRow?.pendingDues ?? 0);
    results.upcomingRenewals = Number(mainStatsRow?.upcomingRenewals ?? 0);
    results.activeVsExpired = {
      active: Number(mainStatsRow?.activeSubs ?? 0),
      expired: Number(mainStatsRow?.expiredSubs ?? 0),
    };
    const totalSubs = Number(mainStatsRow?.totalSubs ?? 0);

    // membershipStatus
    results.membershipStatus = membershipStatusRows || [];

    // revenueTrend: build full 12-month series (fill months with zeros)
    const months12 = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months12.push({
        ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        month: d.toLocaleString("default", { month: "short" }),
      });
    }

    const revenueMap = {};
    (revenueRows || []).forEach((r) => {
      revenueMap[r.ym] = {
        revenue: Number(r.revenue ?? 0),
        pending: Number(r.pending ?? 0),
        month: r.month_label,
      };
    });

    const revenueTrend = months12.map((m) => ({
      month: m.month,
      revenue: revenueMap[m.ym] ? revenueMap[m.ym].revenue : 0,
      pending: revenueMap[m.ym] ? revenueMap[m.ym].pending : 0,
    }));
    results.revenueTrend = revenueTrend;

    // revenueData (compatibility: last 3 months)
    results.revenueData = revenueTrend.slice(-3).map((r) => ({
      month: r.month,
      revenue: r.revenue,
      pending: r.pending,
    }));

    // monthlyJoins (6 months) - fill missing months
    const months6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months6.push({
        ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        month: d.toLocaleString("default", { month: "short" }),
      });
    }
    const joinsMap = {};
    (monthlyJoinsRows || []).forEach((r) => {
      joinsMap[r.ym] = Number(r.joins ?? 0);
    });
    results.monthlyJoins = months6.map((m) => ({
      month: m.month,
      joins: joinsMap[m.ym] || 0,
    }));

    // gender & batch breakdowns
    results.genderBreakdown = genderRows || [];
    results.batchBreakdown = batchRows || [];

    // top plans
    results.topPlans = topPlansRows || [];

    // avg duration
    results.avgMembershipDurationDays = Number(avgDurRow?.avg_days ?? 0);

    // members joined last 30 days
    results.membersJoinedLast30Days = Number(joined30Row?.cnt ?? 0);

    // churn rate: expired in last 30days / totalSubs
    const expired30 = Number(expired30Row?.cnt ?? 0);
    results.churnRate = totalSubs > 0 ? Number(((expired30 / totalSubs) * 100).toFixed(2)) : 0;

    // active vs expired already set above - ensure default
    results.activeVsExpired = results.activeVsExpired || { active: 0, expired: 0 };

    // recent members mapping
    results.recentMembers = (recentMembersRows || []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      joinDate: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));

    // Return same shape as original API
    return {
      activeMembers: results.activeMembers || 0,
      inactiveMembers: results.inactiveMembers || 0,
      totalPlans: results.totalPlans || 0,
      totalRevenue: results.totalRevenue || 0,
      monthlyRevenue: await getMonthlyRevenue(conn, monthStartStr, monthEndStr), // small separate query kept for exact current-month revenue
      pendingDues: results.pendingDues || 0,
      upcomingRenewals: results.upcomingRenewals || 0,
      membershipStatus: results.membershipStatus || [],
      revenueData: results.revenueData || [],
      revenueTrend: results.revenueTrend || [],
      monthlyJoins: results.monthlyJoins || [],
      topPlans: results.topPlans || [],
      avgMembershipDurationDays: results.avgMembershipDurationDays || 0,
      membersJoinedLast30Days: results.membersJoinedLast30Days || 0,
      churnRate: results.churnRate || 0,
      activeVsExpired: results.activeVsExpired || { active: 0, expired: 0 },
      genderBreakdown: results.genderBreakdown || [],
      batchBreakdown: results.batchBreakdown || [],
      recentMembers: results.recentMembers || [],
    };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    // safe defaults
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

/**
 * Small helper to fetch exact current month revenue (kept as single lightweight query).
 * This is separate because frontend expects `monthlyRevenue` field.
 */
async function getMonthlyRevenue(conn, monthStartStr, monthEndStr) {
  try {
    const [row] = await conn.query(
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
    return Number(row?.total ?? 0);
  } catch (err) {
    return 0;
  }
}

// default export kept for compatibility
export default {
  getStats: getDashboardStats,
  getDashboardStats,
};
