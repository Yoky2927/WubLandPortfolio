// communication-service/services/reminderService.js
import AppointmentModel from '../models/appointment.model.js';
import NotificationService from './notificationService.js';
import EmailService from '../utils/emailService.js'; // Use your existing EmailService
import db from '../../shared/db.js';
import cron from 'node-cron';

class ReminderService {
  constructor() {
    this.isRunning = false;
  }

  // Start the reminder service
  async start() {
    if (this.isRunning) {
      console.log('🔔 Reminder service is already running');
      return;
    }

    console.log('🚀 Starting comprehensive reminder service...');
    this.isRunning = true;

    // Schedule appointment reminders (every 30 minutes)
    cron.schedule('*/30 * * * *', async () => {
      await this.sendAppointmentReminders();
    });

    // Schedule rent reminders (daily at 9 AM)
    cron.schedule('0 9 * * *', async () => {
      await this.sendRentReminders();
    });

    // Schedule overdue reminders (daily at 10 AM)
    cron.schedule('0 10 * * *', async () => {
      await this.sendOverdueReminders();
    });

    // Schedule todo reminders (every hour)
    cron.schedule('0 * * * *', async () => {
      await this.sendTodoReminders();
    });

    // Run initial checks
    await this.initializeReminders();

    console.log('✅ Reminder service started successfully');
  }

  // Send appointment reminders
  async sendAppointmentReminders() {
    try {
      console.log('🔔 Running appointment reminder check...');
      
      // Get appointments happening in the next 24 hours
      const query = `
        SELECT a.*, 
          u.id as user_id, u.email as user_email, u.first_name, u.last_name, u.phone_number,
          p.title as property_title, p.address as property_address, p.city, p.state,
          b.id as broker_id, b.email as broker_email, b.first_name as broker_first_name, 
          b.last_name as broker_last_name, b.phone_number as broker_phone
        FROM appointments a
        JOIN appointment_attendees aa ON a.id = aa.appointment_id
        JOIN users u ON aa.user_id = u.id
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN users b ON a.broker_id = b.id
        WHERE a.deleted_at IS NULL
          AND a.status IN ('scheduled', 'confirmed')
          AND a.start_time BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR) AND DATE_ADD(NOW(), INTERVAL 25 HOUR)
          AND aa.send_reminder = TRUE
          AND aa.attendee_status IN ('invited', 'confirmed')
          AND a.reminder_sent = FALSE
      `;
      
      const [appointments] = await db.execute(query);
      
      console.log(`📅 Found ${appointments.length} appointments needing reminders`);
      
      for (const appointment of appointments) {
        await this.handleAppointmentReminder(appointment);
      }
      
    } catch (error) {
      console.error('❌ Error in appointment reminders:', error);
    }
  }

  // Send rent reminders
  async sendRentReminders() {
    try {
      console.log('💰 Running rent reminder check...');
      
      // Get active rental transactions that need reminders
      const query = `
        SELECT 
          t.*,
          p.title as property_title,
          p.address as property_address,
          p.city as property_city,
          u.id as tenant_id,
          u.email as tenant_email,
          u.first_name as tenant_first_name,
          u.last_name as tenant_last_name,
          u.phone_number as tenant_phone,
          o.id as owner_id,
          o.email as owner_email,
          o.first_name as owner_first_name,
          o.last_name as owner_last_name,
          -- Calculate next payment date
          DATE_ADD(
            COALESCE(t.lease_start_date, t.created_at),
            INTERVAL 
              TIMESTAMPDIFF(MONTH, COALESCE(t.lease_start_date, t.created_at), CURDATE()) + 1 
            MONTH
          ) as next_payment_date
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users u ON t.buyer_user_id = u.id AND u.role IN ('renter', 'tenant', 'user')
        JOIN users o ON t.seller_user_id = o.id
        WHERE t.deleted_at IS NULL
          AND t.transaction_type IN ('rental', 'lease')
          AND t.transaction_status = 'approved'
          AND (t.lease_end_date IS NULL OR t.lease_end_date >= CURDATE())
          -- Check if payment is due in 3-7 days
          AND DATE_ADD(
            COALESCE(t.lease_start_date, t.created_at),
            INTERVAL 
              TIMESTAMPDIFF(MONTH, COALESCE(t.lease_start_date, t.created_at), CURDATE()) + 1 
            MONTH
          ) BETWEEN DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          AND (t.last_rent_reminder_sent IS NULL OR t.last_rent_reminder_sent < DATE_SUB(CURDATE(), INTERVAL 25 DAY))
      `;
      
      const [transactions] = await db.execute(query);
      
      console.log(`💰 Found ${transactions.length} rent payments needing reminders`);
      
      for (const transaction of transactions) {
        await this.handleRentReminder(transaction);
      }
      
    } catch (error) {
      console.error('❌ Error in rent reminders:', error);
    }
  }

  // Send overdue reminders
  async sendOverdueReminders() {
    try {
      console.log('⚠️ Running overdue reminder check...');
      
      // Get overdue appointments (missed appointments)
      const appointmentQuery = `
        SELECT a.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.phone_number
        FROM appointments a
        JOIN appointment_attendees aa ON a.id = aa.appointment_id
        JOIN users u ON aa.user_id = u.id
        WHERE a.deleted_at IS NULL
          AND a.status = 'scheduled'
          AND a.start_time < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
          AND a.overdue_reminder_sent = FALSE
      `;
      
      const [overdueAppointments] = await db.execute(appointmentQuery);
      
      for (const appointment of overdueAppointments) {
        await this.handleOverdueAppointment(appointment);
      }

      // Get overdue invoices (rent payments)
      const invoiceQuery = `
        SELECT i.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.phone_number,
          p.title as property_title
        FROM invoices i
        JOIN users u ON i.to_user_id = u.id
        LEFT JOIN properties p ON i.property_id = p.id
        WHERE i.deleted_at IS NULL
          AND i.invoice_status = 'overdue'
          AND i.overdue_reminder_sent = FALSE
          AND i.due_date < CURDATE()
      `;
      
      const [overdueInvoices] = await db.execute(invoiceQuery);
      
      for (const invoice of overdueInvoices) {
        await this.handleOverdueInvoice(invoice);
      }
      
    } catch (error) {
      console.error('❌ Error in overdue reminders:', error);
    }
  }

  // Send todo reminders
  async sendTodoReminders() {
    try {
      console.log('📝 Running todo reminder check...');
      
      const query = `
        SELECT t.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.phone_number,
          a.email as assigned_email,
          a.first_name as assigned_first_name,
          a.last_name as assigned_last_name
        FROM todos t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        WHERE t.deleted_at IS NULL
          AND t.status IN ('pending', 'in_progress')
          AND t.reminder_date = CURDATE()
          AND t.reminder_sent = FALSE
      `;
      
      const [todos] = await db.execute(query);
      
      console.log(`📝 Found ${todos.length} todos needing reminders`);
      
      for (const todo of todos) {
        await this.handleTodoReminder(todo);
      }
      
    } catch (error) {
      console.error('❌ Error in todo reminders:', error);
    }
  }

  // Handle appointment reminder
  async handleAppointmentReminder(appointment) {
    try {
      const startTime = new Date(appointment.start_time);
      const endTime = new Date(appointment.end_time);
      
      // Format appointment details
      const appointmentDate = startTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const appointmentTime = startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Send in-app notification
      await NotificationService.createNotification({
        userId: appointment.user_id,
        title: 'Appointment Reminder',
        message: `Reminder: ${appointment.title} is scheduled for ${appointmentDate} at ${appointmentTime}`,
        type: 'reminder',
        actionUrl: `/appointments/${appointment.id}`,
        priority: 'medium',
        relatedEntityType: 'appointment',
        relatedEntityId: appointment.id
      });

      // Send email reminder using your existing EmailService
      // Create a payment reminder style email for appointments
      await EmailService.sendPaymentReminder({
        email: appointment.user_email,
        fullName: `${appointment.first_name} ${appointment.last_name}`,
        amount: '0.00', // Not a payment, but using same template
        dueDate: appointmentDate,
        propertyAddress: appointment.property_address || appointment.location_address || 'Appointment Location'
      });

      // Mark reminder as sent
      await db.execute(
        'UPDATE appointments SET reminder_sent = TRUE, reminder_sent_at = NOW() WHERE id = ?',
        [appointment.id]
      );

      console.log(`✅ Sent reminder for appointment: ${appointment.title}`);
      
    } catch (error) {
      console.error(`❌ Error sending reminder for appointment ${appointment.id}:`, error.message);
    }
  }

  // Handle rent reminder
  async handleRentReminder(transaction) {
    try {
      const amount = transaction.final_price || transaction.monthly_rent || 0;
      const dueDate = new Date(transaction.next_payment_date);
      const formattedDueDate = dueDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Send notification to tenant
      await NotificationService.createNotification({
        userId: transaction.tenant_id,
        title: 'Rent Payment Due Soon',
        message: `Your monthly rent of ETB ${amount.toLocaleString()} for ${transaction.property_title} is due on ${formattedDueDate}.`,
        type: 'reminder',
        actionUrl: `/transactions/${transaction.id}`,
        priority: 'high',
        relatedEntityType: 'transaction',
        relatedEntityId: transaction.id
      });

      // Send email reminder to tenant using your existing EmailService
      await EmailService.sendPaymentReminder({
        email: transaction.tenant_email,
        fullName: `${transaction.tenant_first_name} ${transaction.tenant_last_name}`,
        amount: amount.toLocaleString(),
        dueDate: formattedDueDate,
        propertyAddress: `${transaction.property_title} - ${transaction.property_address}, ${transaction.property_city}`
      });

      // Send notification to owner about upcoming payment
      await NotificationService.createNotification({
        userId: transaction.owner_id,
        title: 'Upcoming Rent Payment',
        message: `${transaction.tenant_first_name} ${transaction.tenant_last_name}'s rent of ETB ${amount.toLocaleString()} is due on ${formattedDueDate}.`,
        type: 'reminder',
        priority: 'medium',
        relatedEntityType: 'transaction',
        relatedEntityId: transaction.id
      });

      // Update last reminder timestamp
      await db.execute(
        'UPDATE transactions SET last_rent_reminder_sent = NOW() WHERE id = ?',
        [transaction.id]
      );

      console.log(`✅ Sent rent reminder for transaction: ${transaction.id}`);
      
    } catch (error) {
      console.error(`❌ Error sending rent reminder for ${transaction.id}:`, error.message);
    }
  }

  // Handle overdue appointment
  async handleOverdueAppointment(appointment) {
    try {
      // Send notification
      await NotificationService.createNotification({
        userId: appointment.user_id,
        title: 'Missed Appointment',
        message: `Your appointment "${appointment.title}" was scheduled for the past. Please reschedule.`,
        type: 'warning',
        priority: 'high',
        relatedEntityType: 'appointment',
        relatedEntityId: appointment.id
      });

      // Update appointment status to no-show
      await AppointmentModel.updateAppointmentStatus(appointment.id, 'no_show');

      // Mark reminder as sent
      await db.execute(
        'UPDATE appointments SET overdue_reminder_sent = TRUE WHERE id = ?',
        [appointment.id]
      );

      // Send security alert style email
      await EmailService.sendSecurityAlert({
        type: 'Missed Appointment',
        severity: 'medium',
        description: `Appointment "${appointment.title}" was not attended.`,
        ip: 'System Generated',
        userAgent: 'Reminder Service',
        actionTaken: 'Marked as no-show and notification sent',
        timestamp: new Date().toISOString()
      });

      console.log(`⚠️ Handled overdue appointment: ${appointment.title}`);
      
    } catch (error) {
      console.error(`❌ Error handling overdue appointment ${appointment.id}:`, error.message);
    }
  }

  // Handle overdue invoice
  async handleOverdueInvoice(invoice) {
    try {
      const daysOverdue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
      
      // Send notification to debtor
      await NotificationService.createNotification({
        userId: invoice.to_user_id,
        title: 'Overdue Payment',
        message: `Your payment of ETB ${invoice.total_amount?.toLocaleString() || '0'} for ${invoice.property_title || 'invoice'} is ${daysOverdue} days overdue.`,
        type: 'warning',
        priority: 'urgent',
        relatedEntityType: 'invoice',
        relatedEntityId: invoice.id
      });

      // Send security alert email for overdue payment
      await EmailService.sendSecurityAlert({
        type: 'Overdue Payment',
        severity: 'high',
        description: `Invoice ${invoice.invoice_number} for ${invoice.total_amount?.toLocaleString() || '0'} is ${daysOverdue} days overdue.`,
        ip: 'System Generated',
        userAgent: 'Reminder Service',
        actionTaken: 'Overdue notification sent',
        timestamp: new Date().toISOString()
      });

      // Mark reminder as sent
      await db.execute(
        'UPDATE invoices SET overdue_reminder_sent = TRUE WHERE id = ?',
        [invoice.id]
      );

      console.log(`⚠️ Handled overdue invoice: ${invoice.invoice_number}`);
      
    } catch (error) {
      console.error(`❌ Error handling overdue invoice ${invoice.id}:`, error.message);
    }
  }

  // Handle todo reminder
  async handleTodoReminder(todo) {
    try {
      // Send notification to assigned user
      if (todo.assigned_to) {
        await NotificationService.createNotification({
          userId: todo.assigned_to,
          title: 'Todo Due Today',
          message: `"${todo.title}" is due today. Priority: ${todo.priority}`,
          type: 'reminder',
          actionUrl: `/todos/${todo.id}`,
          priority: todo.priority === 'urgent' ? 'high' : 'medium',
          relatedEntityType: 'todo',
          relatedEntityId: todo.id
        });

        // Also notify the creator if different from assignee
        if (todo.user_id !== todo.assigned_to) {
          await NotificationService.createNotification({
            userId: todo.user_id,
            title: 'Todo Follow-up',
            message: `Reminder sent to ${todo.assigned_first_name} about "${todo.title}"`,
            type: 'reminder',
            priority: 'low'
          });
        }
      }

      // Mark reminder as sent
      await db.execute(
        'UPDATE todos SET reminder_sent = TRUE, reminder_sent_at = NOW() WHERE id = ?',
        [todo.id]
      );

      console.log(`✅ Sent reminder for todo: ${todo.title}`);
      
    } catch (error) {
      console.error(`❌ Error sending todo reminder for ${todo.id}:`, error.message);
    }
  }

  // Send recurring payment reminders for subscriptions
  async sendSubscriptionReminders() {
    try {
      console.log('🔄 Running subscription reminder check...');
      
      const query = `
        SELECT 
          u.*,
          up.*
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.deleted_at IS NULL
          AND u.status = 'active'
          AND u.privilege_tier IN ('premium', 'enterprise')
          AND u.subscription_ends_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          AND (u.last_subscription_reminder IS NULL OR u.last_subscription_reminder < DATE_SUB(CURDATE(), INTERVAL 20 DAY))
      `;
      
      const [users] = await db.execute(query);
      
      console.log(`🔄 Found ${users.length} subscriptions needing reminders`);
      
      for (const user of users) {
        await this.handleSubscriptionReminder(user);
      }
      
    } catch (error) {
      console.error('❌ Error in subscription reminders:', error);
    }
  }

  // Handle subscription reminder
  async handleSubscriptionReminder(user) {
    try {
      const daysUntilExpiry = Math.ceil((new Date(user.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
      
      // Send notification
      await NotificationService.createNotification({
        userId: user.id,
        title: 'Subscription Renewal',
        message: `Your ${user.privilege_tier} subscription expires in ${daysUntilExpiry} days. Renew to continue enjoying premium features.`,
        type: 'reminder',
        priority: 'medium',
        relatedEntityType: 'subscription'
      });

      // Send email reminder
      await EmailService.sendPaymentReminder({
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        amount: 'Subscription Renewal',
        dueDate: new Date(user.subscription_ends_at).toLocaleDateString('en-US'),
        propertyAddress: `${user.privilege_tier.toUpperCase()} Subscription`
      });

      // Update last reminder timestamp
      await db.execute(
        'UPDATE users SET last_subscription_reminder = NOW() WHERE id = ?',
        [user.id]
      );

      console.log(`✅ Sent subscription reminder to user: ${user.id}`);
      
    } catch (error) {
      console.error(`❌ Error sending subscription reminder for user ${user.id}:`, error.message);
    }
  }

  // Initialize reminders on service start
  async initializeReminders() {
    try {
      console.log('🔍 Initializing reminder checks...');
      
      // Check for missed reminders during downtime
      await this.sendAppointmentReminders();
      await this.sendRentReminders();
      await this.sendOverdueReminders();
      await this.sendTodoReminders();
      await this.sendSubscriptionReminders();
      
      console.log('✅ Reminder initialization complete');
      
    } catch (error) {
      console.error('❌ Error initializing reminders:', error);
    }
  }

  // Stop the reminder service
  stop() {
    this.isRunning = false;
    console.log('🛑 Reminder service stopped');
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: new Date().toISOString(),
      services: {
        appointments: 'active',
        rent_reminders: 'active',
        overdue: 'active',
        todos: 'active',
        subscriptions: 'active'
      }
    };
  }

  // Manual trigger for testing
  async triggerManualReminder(type) {
    console.log(`🔧 Manual trigger for ${type} reminders`);
    
    switch (type) {
      case 'appointments':
        await this.sendAppointmentReminders();
        break;
      case 'rent':
        await this.sendRentReminders();
        break;
      case 'overdue':
        await this.sendOverdueReminders();
        break;
      case 'todos':
        await this.sendTodoReminders();
        break;
      case 'subscriptions':
        await this.sendSubscriptionReminders();
        break;
      case 'all':
        await this.sendAppointmentReminders();
        await this.sendRentReminders();
        await this.sendOverdueReminders();
        await this.sendTodoReminders();
        await this.sendSubscriptionReminders();
        break;
      default:
        console.log(`❌ Unknown reminder type: ${type}`);
    }
  }
}

// Create singleton instance
const reminderService = new ReminderService();

export default reminderService;