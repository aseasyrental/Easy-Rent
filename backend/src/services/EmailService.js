import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_ADDRESS || 'bookings@easy-rental.ca';
const BILL_EMAIL = process.env.BILL_EMAIL || 'aseasyrental@gmail.com';

function isConfigured() {
  return !!resend;
}

function warnIfMissing() {
  if (!isConfigured()) {
    console.warn('[EmailService] RESEND_API_KEY not configured — email logged to console only');
  }
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

export class EmailService {
  static async sendVerification({ to, renterName, propertyTitle, verifyUrl, expiresAt }) {
    warnIfMissing();
    const subject = `Confirm your viewing — ${propertyTitle || 'Easy Rental'}`;
    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a120a;">
        <h2 style="color: #1a120a;">Hi ${renterName},</h2>
        <p>You requested a viewing for <strong>${propertyTitle || 'a property'}</strong>.</p>
        <p>Click the link below to confirm your booking. This link expires in 30 minutes.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#e8a87c;color:#1a120a;text-decoration:none;border-radius:8px;margin:16px 0;">Confirm my viewing</a>
        <p style="color:#666;font-size:14px;">Expires at ${new Date(expiresAt).toLocaleString('en-CA', { timeZone: 'America/Vancouver' })} PT</p>
        <p style="color:#666;font-size:14px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    if (!isConfigured()) {
      console.log('[EmailService] VERIFICATION', { to, subject, verifyUrl });
      return { id: 'logged' };
    }

    return resend.emails.send({ from: FROM, to, subject, html, reply_to: BILL_EMAIL });
  }

  static async sendConfirmation({ to, renterName, propertyTitle, propertyAddress, scheduledAt, cancelUrl, billPhone }) {
    warnIfMissing();
    const subject = `Your viewing is booked — ${propertyTitle || 'Easy Rental'}`;
    const when = ptDateTime(scheduledAt);
    const contactLine = billPhone
      ? `Reach Bill at ${BILL_EMAIL} or ${billPhone}.`
      : `Reach Bill at ${BILL_EMAIL}.`;

    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a120a;">
        <h2 style="color: #1a120a;">Hi ${renterName},</h2>
        <p>Your viewing is confirmed.</p>
        <div style="background:#faf7f2;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>${propertyTitle || 'Property'}</strong></p>
          <p style="margin:4px 0;">${propertyAddress || ''}</p>
          <p style="margin:4px 0;color:#8b6914;">${when}</p>
        </div>
        <p>${contactLine}</p>
        <p style="margin-top:16px;"><a href="${cancelUrl}" style="color:#c44;">Cancel or reschedule this viewing</a></p>
      </div>
    `;

    if (!isConfigured()) {
      console.log('[EmailService] CONFIRMATION', { to, subject, when });
      return { id: 'logged' };
    }

    return resend.emails.send({ from: FROM, to, subject, html, reply_to: BILL_EMAIL });
  }

  static async sendNewBookingAlert({ propertyTitle, propertyAddress, renterName, renterEmail, renterPhone, scheduledAt }) {
    warnIfMissing();
    const subject = `New booking — ${renterName} wants to see ${propertyTitle || 'a property'}`;
    const when = ptDateTime(scheduledAt);
    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a120a;">
        <h2 style="color: #1a120a;">New viewing booked</h2>
        <div style="background:#faf7f2;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>${propertyTitle || 'Property'}</strong></p>
          <p style="margin:4px 0;">${propertyAddress || ''}</p>
          <p style="margin:4px 0;color:#8b6914;">${when}</p>
        </div>
        <p>Renter: ${renterName} &lt;${renterEmail}&gt;${renterPhone ? ` — ${renterPhone}` : ''}</p>
      </div>
    `;

    if (!isConfigured()) {
      console.log('[EmailService] NEW_BOOKING_ALERT', { to: BILL_EMAIL, subject });
      return { id: 'logged' };
    }

    return resend.emails.send({ from: FROM, to: BILL_EMAIL, subject, html });
  }

  static async sendRenterCancellation({ to, renterName, propertyTitle, scheduledAt }) {
    warnIfMissing();
    const subject = `Your viewing has been cancelled — ${propertyTitle || 'Easy Rental'}`;
    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a120a;">
        <h2 style="color: #1a120a;">Hi ${renterName},</h2>
        <p>Your viewing for <strong>${propertyTitle || 'a property'}</strong> has been cancelled.</p>
        <p>Contact Bill at ${BILL_EMAIL} with any questions.</p>
      </div>
    `;

    if (!isConfigured()) {
      console.log('[EmailService] RENTER_CANCELLATION', { to, subject });
      return { id: 'logged' };
    }

    return resend.emails.send({ from: FROM, to, subject, html, reply_to: BILL_EMAIL });
  }

  static async sendBillCancellationAlert({ renterName, propertyTitle, scheduledAt }) {
    warnIfMissing();
    const subject = `Booking cancelled — ${renterName}'s viewing`;
    const when = ptDateTime(scheduledAt);
    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a120a;">
        <h2 style="color: #1a120a;">Booking cancelled</h2>
        <p>${renterName} cancelled their viewing for <strong>${propertyTitle || 'a property'}</strong> on ${when}.</p>
      </div>
    `;

    if (!isConfigured()) {
      console.log('[EmailService] BILL_CANCELLATION', { to: BILL_EMAIL, subject });
      return { id: 'logged' };
    }

    return resend.emails.send({ from: FROM, to: BILL_EMAIL, subject, html });
  }

  static async sendGoogleDisconnectAlert() {
    warnIfMissing();
    const subject = 'Easy Rental — Google Calendar disconnected';
    const reconnectUrl = `https://admin.easy-rental.ca`;
    const html = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a120a;">
        <h2 style="color: #1a120a;">Google Calendar disconnected</h2>
        <p>Easy Rental can't reach your Google Calendar. Viewings are paused until you reconnect.</p>
        <a href="${reconnectUrl}" style="display:inline-block;padding:12px 24px;background:#e8a87c;color:#1a120a;text-decoration:none;border-radius:8px;margin:16px 0;">Reconnect</a>
      </div>
    `;

    if (!isConfigured()) {
      console.log('[EmailService] GOOGLE_DISCONNECT', { to: BILL_EMAIL, subject });
      return { id: 'logged' };
    }

    return resend.emails.send({ from: FROM, to: BILL_EMAIL, subject, html });
  }
}
