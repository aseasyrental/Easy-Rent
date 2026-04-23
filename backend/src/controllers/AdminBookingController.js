import { BookingModel } from '../models/BookingModel.js';
import { EmailService } from '../services/EmailService.js';
import { GoogleCalendarService } from '../services/GoogleCalendarService.js';

export class AdminBookingController {
  static async list(req, res, next) {
    try {
      const { status, from_date, to_date, property_id } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (from_date) filters.from_date = from_date;
      if (to_date) filters.to_date = to_date;
      if (property_id) filters.property_id = property_id;

      const data = await BookingModel.findAll(filters);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const booking = await BookingModel.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const allowed = ['confirmed', 'completed', 'no_show', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
      }

      const booking = await BookingModel.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({ message: 'Booking is already cancelled' });
      }

      // If cancelling, delete Google event and notify renter
      if (status === 'cancelled') {
        if (booking.google_event_id) {
          try {
            await GoogleCalendarService.deleteEvent(booking.google_event_id);
          } catch (err) {
            console.error('[AdminBookingController] Failed to delete Google event:', err.message);
          }
        }

        await BookingModel.cancelBooking(booking.id);

        await EmailService.sendRenterCancellation({
          to: booking.renter_email,
          renterName: booking.renter_name,
          propertyTitle: booking.property_title,
          scheduledAt: booking.scheduled_at,
        });

        return res.json({ ...booking, status: 'cancelled' });
      }

      const updated = await BookingModel.updateStatus(booking.id, status);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}
