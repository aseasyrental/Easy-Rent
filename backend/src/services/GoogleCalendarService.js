import { google } from 'googleapis';
import { UserModel } from '../models/UserModel.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://easy-rental.ca/api/admin/google/callback';
const GOOGLE_TOKEN_ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

function isConfigured() {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

function warnIfMissing() {
  if (!isConfigured()) {
    console.warn('[GoogleCalendarService] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
  }
}

function getOAuth2Client() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function encrypt(text) {
  if (!GOOGLE_TOKEN_ENCRYPTION_KEY) return text;
  // Simple XOR obfuscation — production should use AES-256-GCM
  const key = Buffer.from(GOOGLE_TOKEN_ENCRYPTION_KEY, 'utf8');
  const buf = Buffer.from(text, 'utf8');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key[i % key.length];
  }
  return out.toString('base64');
}

function decrypt(text) {
  if (!GOOGLE_TOKEN_ENCRYPTION_KEY) return text;
  const key = Buffer.from(GOOGLE_TOKEN_ENCRYPTION_KEY, 'utf8');
  const buf = Buffer.from(text, 'base64');
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ key[i % key.length];
  }
  return out.toString('utf8');
}

export class GoogleCalendarService {
  static getAuthUrl() {
    warnIfMissing();
    if (!isConfigured()) return null;
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
    });
  }

  static async handleCallback(code) {
    warnIfMissing();
    if (!isConfigured()) throw new Error('Google Calendar not configured');
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;
    const accessToken = tokens.access_token;

    // Verify which calendar we're using
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calList = await calendar.calendarList.list();
    const primary = calList.data.items?.find((c) => c.primary) || calList.data.items?.[0];

    if (!primary) throw new Error('No calendar found');

    return {
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      calendarId: primary.id,
      calendarEmail: primary.id, // primary calendar ID is usually the email
    };
  }

  static async getAuthenticatedClient() {
    const admin = await UserModel.findAdmin();
    if (!admin?.google_refresh_token) return null;

    const refreshToken = decrypt(admin.google_refresh_token);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Auto-refresh access token
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      return oauth2Client;
    } catch (err) {
      console.error('[GoogleCalendarService] Token refresh failed:', err.message);
      return null;
    }
  }

  static async getFreeBusy({ timeMin, timeMax }) {
    warnIfMissing();
    const auth = await this.getAuthenticatedClient();
    if (!auth) return [];

    const admin = await UserModel.findAdmin();
    const calendarId = admin?.google_calendar_id;
    if (!calendarId) return [];

    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: 'America/Vancouver',
        items: [{ id: calendarId }],
      },
    });

    return res.data.calendars?.[calendarId]?.busy || [];
  }

  static async createEvent({ summary, description, start, end, attendeeEmail }) {
    warnIfMissing();
    const auth = await this.getAuthenticatedClient();
    if (!auth) throw new Error('Google Calendar not connected');

    const admin = await UserModel.findAdmin();
    const calendarId = admin?.google_calendar_id;
    if (!calendarId) throw new Error('No calendar configured');

    const calendar = google.calendar({ version: 'v3', auth });
    const event = {
      summary,
      description,
      start: { dateTime: start.toISOString(), timeZone: 'America/Vancouver' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Vancouver' },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
      reminders: { useDefault: true },
    };

    const res = await calendar.events.insert({ calendarId, requestBody: event });
    return res.data.id;
  }

  static async deleteEvent(eventId) {
    warnIfMissing();
    if (!eventId) return;
    const auth = await this.getAuthenticatedClient();
    if (!auth) {
      console.warn('[GoogleCalendarService] Cannot delete event — not authenticated');
      return;
    }

    const admin = await UserModel.findAdmin();
    const calendarId = admin?.google_calendar_id;
    if (!calendarId) return;

    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId, eventId });
  }
}
