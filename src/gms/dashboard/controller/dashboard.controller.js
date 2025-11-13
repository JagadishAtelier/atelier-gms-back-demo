import { getDashboardStats } from "../service/dashboard.service.js";

const dashboardController = {
  /**
   * ✅ Fetch complete dashboard statistics
   * Includes: members, renewals, dues, revenue, checkins, charts, etc.
   */
  async getDashboard(req, res) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const stats = await getDashboardStats({ recentLimit: limit });

      return res.sendSuccess(stats, "Dashboard statistics fetched successfully");
    } catch (error) {
      console.error("Error in dashboardController.getDashboard:", error);
      return res.sendError(error.message || "Failed to fetch dashboard statistics");
    }
  },
};

export default dashboardController;
