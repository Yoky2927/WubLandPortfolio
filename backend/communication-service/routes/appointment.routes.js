// communication-service/routes/appointment.routes.js
import express from 'express';
import AppointmentController from '../controllers/appointment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create a new appointment
router.post('/', AppointmentController.createAppointment);

// Get user's appointments
router.get('/', AppointmentController.getUserAppointments);

// Get upcoming appointments
router.get('/upcoming', AppointmentController.getUpcomingAppointments);

// Get appointment statistics
router.get('/stats', AppointmentController.getAppointmentStats);

// Get appointment by ID
router.get('/:id', AppointmentController.getAppointmentById);

// Update appointment
router.put('/:id', AppointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', AppointmentController.deleteAppointment);

// Update appointment status
router.put('/:id/status', AppointmentController.updateAppointmentStatus);

// Get appointments for a property
router.get('/property/:propertyId', AppointmentController.getPropertyAppointments);

// Get appointments for a broker
router.get('/broker/:brokerId', AppointmentController.getBrokerAppointments);

// Add attendee to appointment
router.post('/:id/attendees', AppointmentController.addAttendee);

// Update attendee status (accept/decline invitation)
router.put('/:appointmentId/attendees/:userId', AppointmentController.updateAttendeeStatus);

// Mark attendee as attended (for organizer/broker)
router.put('/:appointmentId/attendees/:userId/attended', AppointmentController.markAttendeeAsAttended);

export default router;