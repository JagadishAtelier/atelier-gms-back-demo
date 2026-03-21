import memberDashboardService from "../service/memberdashboard.service.js";

const memberDashboardController = {
  async getMemberDashboard(req, res) {
    try {
      const userEmail = req.user?.email || null;
      const userPhone = req.user?.phone || null;
const companyId = req.company_id;

      const dashboard = await memberDashboardService.getDashboardByMemberId(userEmail, userPhone,companyId);
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
