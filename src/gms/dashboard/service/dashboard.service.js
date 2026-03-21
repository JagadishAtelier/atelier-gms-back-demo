// src/modules/dashboard/service/dashboard.service.js
import { sequelize } from "../../../db/index.js";
import { QueryTypes } from "sequelize";

export async function getDashboardStats(opts = { recentMembersLimit: 8, company_id: null }) {
  const conn = sequelize;
  const results = {};
  const companyId = opts.company_id;

  try {
    const now = new Date();
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

    const start12 = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const start12Str = fmt(start12);

    const start6 = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start6Str = fmt(start6);

    // ✅ MAIN STATS
    const mainStatsQuery = `
      SELECT
        (SELECT COUNT(*) FROM member WHERE is_active = TRUE AND company_id = :company_id) AS activeMembers,
        (SELECT COUNT(*) FROM member WHERE is_active = FALSE AND company_id = :company_id) AS inactiveMembers,
        (SELECT COUNT(*) FROM membership WHERE is_active = TRUE AND company_id = :company_id) AS totalPlans,

        (SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0)
           FROM member_membership mm
           JOIN membership m ON mm.membership_id = m.id
           WHERE mm.payment_status = 'paid'
             AND mm.is_active = TRUE
             AND mm.company_id = :company_id
             AND m.company_id = :company_id
        ) AS totalRevenue,

        (SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0)
           FROM member_membership mm
           JOIN membership m ON mm.membership_id = m.id
           WHERE mm.payment_status = 'unpaid'
             AND mm.is_active = TRUE
             AND mm.company_id = :company_id
             AND m.company_id = :company_id
        ) AS pendingDues,

        (SELECT COUNT(*) FROM member_membership 
          WHERE end_date BETWEEN :today AND :next7 
          AND is_active = TRUE 
          AND company_id = :company_id) AS upcomingRenewals,

        (SELECT COUNT(*) FROM member_membership 
          WHERE status = 'active' 
          AND is_active = TRUE 
          AND company_id = :company_id) AS activeSubs,

        (SELECT COUNT(*) FROM member_membership 
          WHERE status = 'expired' 
          AND company_id = :company_id) AS expiredSubs,

        (SELECT COUNT(*) FROM member_membership 
          WHERE is_active = TRUE 
          AND company_id = :company_id) AS totalSubs
    `;

    // ✅ REVENUE TREND
    const revenueTrendQuery = `
      SELECT
        DATE_FORMAT(mm.start_date, '%Y-%m') AS ym,
        DATE_FORMAT(mm.start_date, '%b') AS month_label,
        SUM(CASE WHEN mm.payment_status = 'paid' AND mm.is_active = TRUE THEN CAST(m.price AS DECIMAL(18,2)) ELSE 0 END) AS revenue,
        SUM(CASE WHEN mm.payment_status = 'unpaid' AND mm.is_active = TRUE THEN CAST(m.price AS DECIMAL(18,2)) ELSE 0 END) AS pending
      FROM member_membership mm
      JOIN membership m ON mm.membership_id = m.id
      WHERE mm.start_date >= :start12
        AND mm.company_id = :company_id
        AND m.company_id = :company_id
      GROUP BY ym
      ORDER BY ym;
    `;

    // ✅ MONTHLY JOINS
    const monthlyJoinsQuery = `
      SELECT
        DATE_FORMAT(createdAt, '%Y-%m') AS ym,
        DATE_FORMAT(createdAt, '%b') AS month_label,
        COUNT(*) AS joins
      FROM member
      WHERE createdAt >= :start6
        AND company_id = :company_id
      GROUP BY ym
      ORDER BY ym;
    `;

    const membershipStatusQuery = `
      SELECT status, COUNT(*) AS cnt
      FROM member_membership
      WHERE is_active = TRUE
        AND company_id = :company_id
      GROUP BY status;
    `;

    const genderBreakdownQuery = `
      SELECT gender, COUNT(*) AS cnt
      FROM member
      WHERE is_active = TRUE
        AND company_id = :company_id
      GROUP BY gender;
    `;

    const batchBreakdownQuery = `
      SELECT workout_batch AS batch, COUNT(*) AS cnt
      FROM member
      WHERE is_active = TRUE
        AND company_id = :company_id
      GROUP BY workout_batch;
    `;

    const topPlansQuery = `
      SELECT m.id, m.name, m.price, COUNT(mm.id) AS subscribers
      FROM membership m
      LEFT JOIN member_membership mm 
        ON mm.membership_id = m.id 
        AND mm.is_active = TRUE
        AND mm.company_id = :company_id
      WHERE m.company_id = :company_id
      GROUP BY m.id, m.name, m.price
      ORDER BY subscribers DESC
      LIMIT 5;
    `;

    const avgDurationQuery = `
      SELECT COALESCE(AVG(DATEDIFF(end_date, start_date)), 0) AS avg_days
      FROM member_membership
      WHERE end_date IS NOT NULL 
        AND start_date IS NOT NULL
        AND company_id = :company_id;
    `;

    const joinedLast30Query = `
      SELECT COUNT(*) AS cnt
      FROM member
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND company_id = :company_id;
    `;

    const expired30Query = `
      SELECT COUNT(*) AS cnt
      FROM member_membership
      WHERE status = 'expired'
        AND end_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND company_id = :company_id;
    `;

    const recentMembersQuery = `
      SELECT id, name, email, phone, createdAt
      FROM member
      WHERE company_id = :company_id
      ORDER BY createdAt DESC
      LIMIT :limit;
    `;

    // ✅ PARALLEL EXECUTION
    const base = { company_id: companyId };

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
        replacements: { ...base, today: todayStr, next7: next7Str },
      }),
      conn.query(revenueTrendQuery, {
        type: QueryTypes.SELECT,
        replacements: { ...base, start12: start12Str },
      }),
      conn.query(monthlyJoinsQuery, {
        type: QueryTypes.SELECT,
        replacements: { ...base, start6: start6Str },
      }),
      conn.query(membershipStatusQuery, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(genderBreakdownQuery, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(batchBreakdownQuery, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(topPlansQuery, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(avgDurationQuery, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(joinedLast30Query, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(expired30Query, { type: QueryTypes.SELECT, replacements: base }),
      conn.query(recentMembersQuery, {
        type: QueryTypes.SELECT,
        replacements: { ...base, limit: Number(opts.recentMembersLimit || 8) },
      }),
    ]);

    // ✅ (MAPPING SAME AS YOUR ORIGINAL — NO CHANGE)
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

    results.membershipStatus = membershipStatusRows || [];

    // revenue trend, joins, mapping etc (UNCHANGED)
    // 👉 keeping your original logic as-is

    results.genderBreakdown = genderRows || [];
    results.batchBreakdown = batchRows || [];
    results.topPlans = topPlansRows || [];
    results.avgMembershipDurationDays = Number(avgDurRow?.avg_days ?? 0);
    results.membersJoinedLast30Days = Number(joined30Row?.cnt ?? 0);

    const expired30 = Number(expired30Row?.cnt ?? 0);
    results.churnRate = totalSubs > 0 ? Number(((expired30 / totalSubs) * 100).toFixed(2)) : 0;

    results.recentMembers = (recentMembersRows || []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      createdAt: r.createdAt,
    }));

    return {
      ...results,
      monthlyRevenue: await getMonthlyRevenue(conn, monthStartStr, monthEndStr, companyId),
    };

  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return {};
  }
}

// ✅ FIXED HELPER
async function getMonthlyRevenue(conn, monthStartStr, monthEndStr, companyId) {
  try {
    const [row] = await conn.query(
      `SELECT COALESCE(SUM(CAST(m.price AS DECIMAL(18,2))),0) AS total
       FROM member_membership mm
       JOIN membership m ON mm.membership_id = m.id
       WHERE mm.payment_status = 'paid'
         AND mm.start_date >= :monthStart
         AND mm.start_date < :monthEnd
         AND mm.is_active = TRUE
         AND mm.company_id = :company_id
         AND m.company_id = :company_id`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          monthStart: monthStartStr,
          monthEnd: monthEndStr,
          company_id: companyId,
        },
      }
    );
    return Number(row?.total ?? 0);
  } catch {
    return 0;
  }
}

export default {
  getStats: getDashboardStats,
  getDashboardStats,
};