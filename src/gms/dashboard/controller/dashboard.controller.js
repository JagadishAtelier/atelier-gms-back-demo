// src/modules/dashboard/controller/dashboard.controller.js
import { getDashboardStats } from "../service/dashboard.service.js";

const dashboardController = {
  /**
   * ✅ Fetch complete dashboard statistics
   * Includes: members, renewals, dues, revenue, charts, recent members, etc.
   */
  async getDashboard(req, res) {
    try {
      // frontend can pass ?limit=10
      const limit = req.query.limit ? Number(req.query.limit) : 8;

      // IMPORTANT: service expects recentMembersLimit
      const stats = await getDashboardStats({
        recentMembersLimit: limit,
      });

      return res.sendSuccess(stats, "Dashboard statistics fetched successfully");
    } catch (error) {
      console.error("Error in dashboardController.getDashboard:", error);
      return res.sendError(
        error.message || "Failed to fetch dashboard statistics"
      );
    }
  },
};

export default dashboardController;
