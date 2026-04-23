import { BookingModel } from '../models/BookingModel.js';
import { AppSettingsModel } from '../models/AppSettingsModel.js';
import { GoogleCalendarService } from './GoogleCalendarService.js';

const SLOT_MINUTES = 30;
const PADDING_MINUTES = 60;
const LEAD_TIME_MINUTES = 120;
const BOOKING_WINDOW_DAYS = 30;

/**
 * Convert a date to Pacific Time components { year, month, day, hour, minute }
 * using the browser/server's Intl API.
 */
function toPTParts(date) {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  };
}

function makeUTCFromPT(year, month, day, hour, minute) {
  // Build an ISO string in PT, then let the constructor interpret it
  const pad = (n) => String(n).padStart(2, '0');
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-07:00`;
  return new Date(iso);
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h, minute: m };
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Generate available booking slots for a property.
 */
export class BookingSlotService {
  static async getAvailability({ propertyId, fromDate, toDate }) {
    const settings = await AppSettingsModel.get();
    if (!settings) {
      throw new Error('App settings not found');
    }

    const workStart = parseTime(settings.working_hours_start);
    const workEnd = parseTime(settings.working_hours_end);

    // Ensure we don't look past the 30-day window
    const now = new Date();
    const maxDate = addMinutes(now, BOOKING_WINDOW_DAYS * 24 * 60);
    const queryTo = toDate ? new Date(Math.min(new Date(toDate).getTime(), maxDate.getTime())) : maxDate;
    const queryFrom = fromDate ? new Date(fromDate) : now;

    // Get existing bookings for this property (and all properties for padding around Bill's time)
    const existingBookings = await BookingModel.findAll({
      from_date: queryFrom.toISOString(),
      to_date: queryTo.toISOString(),
      status: null, // we'll filter manually to include both pending and confirmed
    });

    // Filter to active statuses only
    const activeBookings = (existingBookings || []).filter(
      (b) => b.status === 'confirmed' || b.status === 'pending_verification'
    );

    // Get busy blocks from Google Calendar
    let busyBlocks = [];
    try {
      busyBlocks = await GoogleCalendarService.getFreeBusy({
        timeMin: queryFrom,
        timeMax: queryTo,
      });
    } catch (err) {
      console.warn('[BookingSlotService] freebusy failed:', err.message);
      // If Google Calendar fails, we still return slots but log the warning
    }

    // Combine busy blocks + active bookings into blocked ranges (with padding)
    const blockedRanges = [];

    for (const block of busyBlocks) {
      blockedRanges.push({
        start: addMinutes(new Date(block.start), -PADDING_MINUTES),
        end: addMinutes(new Date(block.end), PADDING_MINUTES),
      });
    }

    for (const booking of activeBookings) {
      // Only consider bookings for this property OR any confirmed booking (Bill can't be in two places)
      if (booking.property_id !== parseInt(propertyId, 10) && booking.status !== 'confirmed') continue;
      blockedRanges.push({
        start: addMinutes(new Date(booking.scheduled_at), -PADDING_MINUTES),
        end: addMinutes(new Date(booking.scheduled_at), booking.duration_minutes + PADDING_MINUTES),
      });
    }

    const slots = [];

    // Iterate day by day
    let currentDay = new Date(queryFrom);
    while (currentDay < queryTo) {
      const pt = toPTParts(currentDay);

      // Generate slots for this day from workStart to workEnd
      let slotTime = makeUTCFromPT(pt.year, pt.month, pt.day, workStart.hour, workStart.minute);
      const dayEnd = makeUTCFromPT(pt.year, pt.month, pt.day, workEnd.hour, workEnd.minute);

      while (slotTime < dayEnd) {
        const slotEnd = addMinutes(slotTime, SLOT_MINUTES);

        // Must end on or before workEnd
        if (slotEnd > dayEnd) break;

        // Must be at least 2 hours in the future
        if (addMinutes(slotTime, -LEAD_TIME_MINUTES) > now) {
          // Check against blocked ranges
          const isBlocked = blockedRanges.some((range) =>
            rangesOverlap(slotTime, slotEnd, range.start, range.end)
          );

          if (!isBlocked) {
            slots.push(slotTime.toISOString());
          }
        }

        slotTime = slotEnd;
      }

      // Advance to next day (add 24 hours)
      currentDay = addMinutes(currentDay, 24 * 60);
    }

    return slots;
  }
}
