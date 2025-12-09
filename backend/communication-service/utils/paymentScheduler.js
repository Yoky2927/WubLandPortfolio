import cron from "node-cron";
import axios from "axios";
import EmailService from "./emailService.js";
import NotificationService from "./notificationService.js";

class PaymentScheduler {
  constructor() {
    this.PAYMENT_SERVICE_URL =
      process.env.PAYMENT_SERVICE_URL || "http://localhost:5004";
    this.INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;
    this.initSchedules();
  }

  initSchedules() {
    // Run every day at 9:00 AM for payment reminders
    cron.schedule("0 9 * * *", async () => {
      console.log("Running payment reminder scheduler...");
      await this.sendPaymentReminders();
    });

    // Run every hour for overdue payments
    cron.schedule("0 * * * *", async () => {
      console.log("Running overdue payment scheduler...");
      await this.sendOverduePaymentNotifications();
    });

    console.log("Payment scheduler initialized");
  }

  async sendPaymentReminders() {
    try {
      // Fetch due payments from Payment Service via API
      const duePayments = await this.getDuePayments();

      // Send email reminders
      for (const payment of duePayments) {
        try {
          await EmailService.sendPaymentReminder(payment);

          // Also create in-app notification
          await NotificationService.createNotification({
            userId: payment.userId || payment.renterId,
            title: "Payment Reminder",
            message: `Your payment of ${payment.amount} ${payment.currency} for ${payment.propertyAddress} is due on ${payment.dueDate}`,
            type: "reminder",
            relatedEntityType: "payment",
            relatedEntityId: payment.id,
            priority: "medium",
          });
        } catch (error) {
          console.error(
            `Failed to send reminder for payment ${payment.id}:`,
            error.message
          );
        }
      }

      console.log(`Sent ${duePayments.length} payment reminders`);
    } catch (error) {
      console.error("Error in payment reminder scheduler:", error);
    }
  }

  async sendOverduePaymentNotifications() {
    try {
      // Fetch overdue payments from Payment Service
      const overduePayments = await this.getOverduePayments();

      for (const payment of overduePayments) {
        try {
          // Create high priority notification
          await NotificationService.createNotification({
            userId: payment.userId || payment.renterId,
            title: "Overdue Payment",
            message: `Your payment of ${payment.amount} ${payment.currency} for ${payment.propertyAddress} is overdue. Please make payment immediately.`,
            type: "warning",
            relatedEntityType: "payment",
            relatedEntityId: payment.id,
            priority: "high",
          });

          // Also notify admin/broker if configured
          if (payment.brokerId) {
            await NotificationService.createNotification({
              userId: payment.brokerId,
              title: "Client Payment Overdue",
              message: `Payment from ${payment.renterName} for ${payment.propertyAddress} is overdue.`,
              type: "warning",
              relatedEntityType: "payment",
              relatedEntityId: payment.id,
              priority: "medium",
            });
          }
        } catch (error) {
          console.error(
            `Failed to send overdue notification for payment ${payment.id}:`,
            error.message
          );
        }
      }

      console.log(
        `Created notifications for ${overduePayments.length} overdue payments`
      );
    } catch (error) {
      console.error("Error in overdue payment scheduler:", error);
    }
  }

  async getDuePayments() {
    try {
      // Make API call to Payment Service
      const response = await axios.get(
        `${this.PAYMENT_SERVICE_URL}/api/payments/due-reminders`,
        {
          headers: {
            "X-Service-Auth": this.INTERNAL_SERVICE_KEY,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      return response.data.duePayments || [];
    } catch (error) {
      console.error("Failed to fetch due payments via API:", error.message);

      // Fallback to empty array to avoid breaking the scheduler
      return [];
    }
  }

  async getOverduePayments() {
    try {
      // Make API call to Payment Service for overdue payments
      const response = await axios.get(
        `${this.PAYMENT_SERVICE_URL}/api/payments/overdue`,
        {
          headers: {
            "X-Service-Auth": this.INTERNAL_SERVICE_KEY,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.data.overduePayments || [];
    } catch (error) {
      console.error("Failed to fetch overdue payments via API:", error.message);
      return [];
    }
  }
}

export default new PaymentScheduler();
