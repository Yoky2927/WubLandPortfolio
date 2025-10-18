import cron from 'node-cron';
import EmailService from './emailService.js';

class PaymentScheduler {
  constructor() {
    this.initSchedules();
  }

  initSchedules() {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      await this.sendPaymentReminders();
    });

    console.log('Payment reminder scheduler initialized');
  }

  async sendPaymentReminders() {
    try {
      // Get renters with due payments (you'll need to implement this)
      const duePayments = await this.getDuePayments();
      
      for (const payment of duePayments) {
        await EmailService.sendPaymentReminder(payment);
      }
      
      console.log(`Sent ${duePayments.length} payment reminders`);
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }

  async getDuePayments() {
    // Implement your logic to get renters with due payments
    // This should query your database for active leases with upcoming due dates
    return [
      // Example data structure
      {
        email: 'renter@example.com',
        fullName: 'John Doe',
        amount: 1500,
        dueDate: '2024-01-15',
        propertyAddress: '123 Main St, City, State',
        leaseId: 'LEASE001'
      }
    ];
  }
}

export default new PaymentScheduler();