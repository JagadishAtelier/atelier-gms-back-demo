import memberDashboardService from "../service/memberdashboard.service.js";

const memberDashboardController = {
  async getMemberDashboard(req, res) {
    try {
      const userEmail = req.user?.email || null;

      if (!userEmail) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized - No email found in token",
        });
      }

      const dashboard = await memberDashboardService.getDashboardByMemberId(userEmail);
      return res.json(dashboard);

    } catch (error) {
      console.error("❌ Member Dashboard fetch error:", error.message);
      return res.status(400).json({
        status: "error",
        message: error.message || "Failed to fetch Member Dashboard",
      });
    }
  }
};

export default memberDashboardController;
