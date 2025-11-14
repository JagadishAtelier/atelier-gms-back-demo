// src/modules/reminder/controller/remaindermail.controller.js

import remainderMailService from "../service/remaindermail.service.js";

const remainderMailController = {

  /**
   * =========================================================================
   *  📩 Send Payment Reminder Emails to ALL unpaid members
   * =========================================================================
   */
  async sendAllReminders(req, res) {
    try {
      const result = await remainderMailService.sendPaymentReminders();
      return res.sendSuccess(result, "Payment reminder emails sent successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to send reminder emails");
    }
  },

  /**
   * =========================================================================
   *  📩 Send Reminder to ONE Member by member_membership_id
   * =========================================================================
   */
  async sendSingleReminder(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.sendError("member_membership_id is required");

      const result = await remainderMailService.sendReminderToSingle(id);
      return res.sendSuccess(result, "Reminder email sent successfully");
    } catch (error) {
      return res.sendError(error.message || "Failed to send single reminder");
    }
  },

  /**
   * =========================================================================
   *  📩 NEW — Send Next Payment Reminder by Member ID
   * =========================================================================
   */
  async sendNextPaymentReminderByMemberId(req, res) {
    try {
      const { member_id } = req.params;

      if (!member_id) return res.sendError("member_id is required");

      const result = await remainderMailService.sendNextPaymentReminderByMemberId(member_id);

      return res.sendSuccess(result, "Next payment reminder sent successfully");

    } catch (error) {
      return res.sendError(error.message || "Failed to send next payment reminder");
    }
  },

};

export default remainderMailController;
