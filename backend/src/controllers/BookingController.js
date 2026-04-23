import { randomUUID } from 'crypto';
// No DOMPurify — strict string sanitization instead
import { BookingModel } from '../models/BookingModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { AppSettingsModel } from '../models/AppSettingsModel.js';
import { UserModel } from '../models/UserModel.js';
import { BookingSlotService } from '../services/BookingSlotService.js';
import { EmailService } from '../services/EmailService.js';
import { GoogleCalendarService } from '../services/GoogleCalendarService.js';
import { verifyRecaptcha } from '../middleware/recaptcha.js';

function sanitizeName(name) {
  return name.replace(/[<>]/g, '').trim().slice(0, 80);
}

function sanitizeNote(note) {
  return note.replace(/[<>]/g, '').trim().slice(0, 500);
}

function ptDateTime(date) {
  return new Date(date).toLocaleString('en-CA', {
    timeZone: 'America/Vancouver',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' PT';
}

function renderPage({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Easy Rental</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      background: #14120f;
      color: #f5f0e8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 24px;
    }
    .card {
      background: rgba(30, 27, 22, 0.98);
      border: 1px solid rgba(232, 168, 124, 0.15);
      border-radius: 20px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 16px 60px rgba(0, 0, 0, 0.5);
    }
    h1 { font-size: 1.5rem; margin: 0 0 16px; color: #f5f0e8; }
    p { margin: 8px 0; line-height: 1.5; color: #d4c4a8; }
    .detail { background: rgba(210, 165, 105, 0.08); padding: 16px; border-radius: 12px; margin: 16px 0; }
    .detail strong { color: #e8a87c; }
    form { margin-top: 20px; }
    .actions { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
    button, .btn {
      flex: 1;
      min-width: 120px;
      padding: 14px 20px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
    }
    .btn-primary { background: #e8a87c; color: #1a120a; font-weight: 600; }
    .btn-secondary { background: rgba(255,255,255,0.08); color: #d4c4a8; }
    .btn-danger { background: #c44; color: #fff; }
    .hint { font-size: 0.875rem; color: #a09078; margin-top: 16px; }
    .success { color: #8fbc8f; }
    .error { color: #e57373; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`;
}

export class BookingController {
  static async config(req, res, next) {
    try {
      const admin = await UserModel.findAdmin();
      res.json({ enabled: !!admin?.google_refresh_token });
    } catch (error) {
      next(error);
    }
  }
  static async availability(req, res, next) {
    try {
      const { property_id, from, to } = req.query;
      if (!property_id) {
        return res.status(400).json({ message: 'property_id is required' });
      }

      const property = await PropertyModel.findById(property_id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Check if Google Calendar is connected
      const admin = await UserModel.findAdmin();
      if (!admin?.google_refresh_token) {
        return res.status(503).json({ message: 'Booking is not available right now.' });
      }

      const slots = await BookingSlotService.getAvailability({
        propertyId: property_id,
        fromDate: from,
        toDate: to,
      });

      res.json({ slots });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { property_id, scheduled_at, renter_name, renter_email, renter_phone, renter_note, captcha_token } = req.body;

      // Verify captcha
      const captcha = await verifyRecaptcha(captcha_token);
      if (!captcha.success) {
        return res.status(400).json({ message: 'Verification failed. Please try again.' });
      }

      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(renter_email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }

      const name = sanitizeName(renter_name);
      const note = sanitizeNote(renter_note || '');
      const phone = renter_phone ? renter_phone.replace(/\s/g, '').slice(0, 20) : null;

      if (!name || name.length < 1) {
        return res.status(400).json({ message: 'Name is required.' });
      }

      const property = await PropertyModel.findById(property_id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      if (property.status !== 'available') {
        return res.status(400).json({ message: 'This property is not available for viewings.' });
      }

      // Check for duplicate pending/confirmed booking
      const existing = await BookingModel.findExistingPendingOrConfirmed({
        renter_email,
        property_id,
        scheduled_at,
      });
      if (existing) {
        return res.status(200).json({
          status: existing.status,
          message: existing.status === 'confirmed'
            ? 'You already have a confirmed booking for this time.'
            : 'Check your email to confirm your viewing.',
        });
      }

      // Server-side availability re-check
      const slotDate = new Date(scheduled_at);
      const fromDate = new Date(Date.UTC(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate()));
      const toDate = new Date(Date.UTC(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate() + 1));
      const slots = await BookingSlotService.getAvailability({
        propertyId: property_id,
        fromDate,
        toDate,
      });
      const requestedSlot = new Date(scheduled_at).toISOString();
      if (!slots.includes(requestedSlot)) {
        return res.status(409).json({
          message: 'That time slot is no longer available. Please choose another.',
          slots,
        });
      }

      const verificationToken = randomUUID();
      const verificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const booking = await BookingModel.create({
        property_id,
        scheduled_at,
        renter_name: name,
        renter_email,
        renter_phone: phone,
        renter_note: note,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt,
      });

      const verifyUrl = `https://easy-rental.ca/api/bookings/verify/${verificationToken}`;

      await EmailService.sendVerification({
        to: renter_email,
        renterName: name,
        propertyTitle: property.title,
        verifyUrl,
        expiresAt: verificationExpiresAt,
      });

      res.status(201).json({
        status: 'pending_verification',
        message: 'Check your email to confirm your viewing.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPage(req, res, next) {
    try {
      const { token } = req.params;
      const booking = await BookingModel.findByVerificationToken(token);

      if (!booking) {
        return res.send(renderPage({
          title: 'Link expired',
          body: `<h1>Link expired</h1><p>This verification link is no longer valid.</p><a href="/listings" class="btn btn-primary">Browse listings</a>`,
        }));
      }

      if (booking.status !== 'pending_verification') {
        return res.send(renderPage({
          title: 'Already confirmed',
          body: `<h1>Already confirmed</h1><p class="success">Your viewing is already booked for ${ptDateTime(booking.scheduled_at)}.</p>`,
        }));
      }

      if (new Date() > new Date(booking.verification_expires_at)) {
        return res.send(renderPage({
          title: 'Link expired',
          body: `<h1>Link expired</h1><p>This verification link has expired. <a href="/listings" class="btn btn-primary">Browse listings</a></p>`,
        }));
      }

      const body = `
        <h1>Confirm your viewing</h1>
        <div class="detail">
          <p><strong>${booking.property_title || 'Property'}</strong></p>
          <p>${booking.property_address || ''}</p>
          <p>${ptDateTime(booking.scheduled_at)}</p>
        </div>
        <form method="POST" action="/api/bookings/verify/${token}">
          <div class="actions">
            <button type="submit" class="btn-primary">Confirm my viewing</button>
            <a href="/api/bookings/cancel/${token}" class="btn btn-secondary">Cancel</a>
          </div>
        </form>
      `;
      res.send(renderPage({ title: 'Confirm viewing', body }));
    } catch (error) {
      next(error);
    }
  }

  static async verify(req, res, next) {
    try {
      const { token } = req.params;
      const booking = await BookingModel.findByVerificationToken(token);

      if (!booking || booking.status !== 'pending_verification') {
        return res.send(renderPage({
          title: 'Link expired',
          body: `<h1>Link expired</h1><p>This verification link is no longer valid.</p>`,
        }));
      }

      if (new Date() > new Date(booking.verification_expires_at)) {
        return res.send(renderPage({
          title: 'Link expired',
          body: `<h1>Link expired</h1><p>This verification link has expired.</p>`,
        }));
      }

      // Re-check availability before confirming
      const slotDate = new Date(booking.scheduled_at);
      const fromDate = new Date(Date.UTC(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate()));
      const toDate = new Date(Date.UTC(slotDate.getUTCFullYear(), slotDate.getUTCMonth(), slotDate.getUTCDate() + 1));
      const slots = await BookingSlotService.getAvailability({
        propertyId: booking.property_id,
        fromDate,
        toDate,
      });
      const requestedSlot = new Date(booking.scheduled_at).toISOString();
      if (!slots.includes(requestedSlot)) {
        return res.send(renderPage({
          title: 'Slot no longer available',
          body: `<h1>Slot no longer available</h1><p>Someone else booked this time. <a href="/listings" class="btn btn-primary">Browse listings</a></p>`,
        }));
      }

      const cancelToken = randomUUID();
      let googleEventId = null;

      try {
        const start = new Date(booking.scheduled_at);
        const end = new Date(start.getTime() + 30 * 60000);
        googleEventId = await GoogleCalendarService.createEvent({
          summary: `Viewing: ${booking.renter_name} — ${booking.property_title || 'Property'}`,
          description: `Renter: ${booking.renter_name} <${booking.renter_email}>${booking.renter_phone ? ` — ${booking.renter_phone}` : ''}\nProperty: ${booking.property_title || ''}\nAdmin: https://admin.easy-rental.ca`,
          start,
          end,
          attendeeEmail: booking.renter_email,
        });
      } catch (err) {
        console.error('[BookingController] Failed to create Google event:', err.message);
        // Continue without Google event — booking is still valid
      }

      const confirmed = await BookingModel.confirmBooking(booking.id, {
        cancel_token: cancelToken,
        google_event_id: googleEventId,
      });

      const settings = await AppSettingsModel.get();
      const cancelUrl = `https://easy-rental.ca/api/bookings/cancel/${cancelToken}`;

      await EmailService.sendConfirmation({
        to: booking.renter_email,
        renterName: booking.renter_name,
        propertyTitle: booking.property_title,
        propertyAddress: booking.property_address,
        scheduledAt: booking.scheduled_at,
        cancelUrl,
        billPhone: settings?.bill_contact_phone,
      });

      await EmailService.sendNewBookingAlert({
        propertyTitle: booking.property_title,
        propertyAddress: booking.property_address,
        renterName: booking.renter_name,
        renterEmail: booking.renter_email,
        renterPhone: booking.renter_phone,
        scheduledAt: booking.scheduled_at,
      });

      res.send(renderPage({
        title: 'Viewing confirmed',
        body: `<h1 class="success">Viewing confirmed</h1><p>Your viewing is booked for ${ptDateTime(confirmed.scheduled_at)}.</p><p class="hint">A confirmation email has been sent to ${confirmed.renter_email}.</p>`,
      }));
    } catch (error) {
      next(error);
    }
  }

  static async cancelPage(req, res, next) {
    try {
      const { token } = req.params;
      const booking = await BookingModel.findByCancelToken(token);

      if (!booking) {
        return res.send(renderPage({
          title: 'Booking not found',
          body: `<h1>Booking not found</h1><p>This cancellation link is no longer valid.</p>`,
        }));
      }

      if (booking.status === 'cancelled') {
        return res.send(renderPage({
          title: 'Already cancelled',
          body: `<h1>Already cancelled</h1><p>This booking was already cancelled.</p>`,
        }));
      }

      const body = `
        <h1>Cancel your viewing</h1>
        <div class="detail">
          <p><strong>${booking.property_title || 'Property'}</strong></p>
          <p>${booking.property_address || ''}</p>
          <p>${ptDateTime(booking.scheduled_at)}</p>
        </div>
        <form method="POST" action="/api/bookings/cancel/${token}">
          <div class="actions">
            <button type="submit" class="btn-danger">Cancel this booking</button>
            <a href="/listings" class="btn btn-secondary">Keep booking</a>
          </div>
        </form>
        <p class="hint">Need a different time? Cancel and pick a new slot.</p>
      `;
      res.send(renderPage({ title: 'Cancel viewing', body }));
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const { token } = req.params;
      const booking = await BookingModel.findByCancelToken(token);

      if (!booking) {
        return res.send(renderPage({
          title: 'Booking not found',
          body: `<h1>Booking not found</h1><p>This cancellation link is no longer valid.</p>`,
        }));
      }

      if (booking.status === 'cancelled') {
        return res.send(renderPage({
          title: 'Already cancelled',
          body: `<h1>Already cancelled</h1><p>This booking was already cancelled.</p>`,
        }));
      }

      if (booking.google_event_id) {
        try {
          await GoogleCalendarService.deleteEvent(booking.google_event_id);
        } catch (err) {
          console.error('[BookingController] Failed to delete Google event:', err.message);
        }
      }

      await BookingModel.cancelBooking(booking.id);

      await EmailService.sendBillCancellationAlert({
        renterName: booking.renter_name,
        propertyTitle: booking.property_title,
        scheduledAt: booking.scheduled_at,
      });

      res.send(renderPage({
        title: 'Booking cancelled',
        body: `<h1 class="success">Booking cancelled</h1><p>Your viewing has been cancelled.</p><p class="hint">You can <a href="/listings" style="color:#e8a87c;">browse listings</a> to book another time.</p>`,
      }));
    } catch (error) {
      next(error);
    }
  }
}
