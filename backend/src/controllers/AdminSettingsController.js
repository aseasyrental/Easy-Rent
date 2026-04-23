import { AppSettingsModel } from '../models/AppSettingsModel.js';
import { UserModel } from '../models/UserModel.js';
import { GoogleCalendarService } from '../services/GoogleCalendarService.js';
import { EmailService } from '../services/EmailService.js';

export class AdminSettingsController {
  static async getSettings(req, res, next) {
    try {
      const settings = await AppSettingsModel.get();
      const admin = await UserModel.findAdmin();

      res.json({
        working_hours_start: settings?.working_hours_start || '09:00',
        working_hours_end: settings?.working_hours_end || '19:00',
        bill_contact_phone: settings?.bill_contact_phone || null,
        google_connected: !!admin?.google_refresh_token,
        google_email: admin?.google_calendar_id || null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const { working_hours_start, working_hours_end, bill_contact_phone } = req.body;

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (working_hours_start && !timeRegex.test(working_hours_start)) {
        return res.status(400).json({ message: 'working_hours_start must be HH:MM' });
      }
      if (working_hours_end && !timeRegex.test(working_hours_end)) {
        return res.status(400).json({ message: 'working_hours_end must be HH:MM' });
      }

      const settings = await AppSettingsModel.update({
        working_hours_start,
        working_hours_end,
        bill_contact_phone: bill_contact_phone ? bill_contact_phone.replace(/[<>]/g, '').trim().slice(0, 30) : null,
      });

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req, res, next) {
    try {
      const url = GoogleCalendarService.getAuthUrl();
      if (!url) {
        return res.status(503).json({ message: 'Google Calendar integration is not configured.' });
      }
      res.json({ url });
    } catch (error) {
      next(error);
    }
  }

  static async googleCallback(req, res, next) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: 'Authorization code missing' });
      }

      const { refreshToken, calendarId } = await GoogleCalendarService.handleCallback(code);
      const admin = await UserModel.findAdmin();

      if (!admin) {
        return res.status(500).json({ message: 'No admin user found' });
      }

      await UserModel.updateGoogleConnection(admin.id, {
        google_refresh_token: refreshToken,
        google_calendar_id: calendarId,
        google_connected_at: new Date(),
      });

      // Redirect to admin settings page
      res.redirect('https://admin.easy-rental.ca');
    } catch (error) {
      console.error('[AdminSettingsController] Google callback error:', error.message);
      res.status(500).send(`<h1>Connection failed</h1><p>${error.message}</p><a href="https://admin.easy-rental.ca">Back to admin</a>`);
    }
  }

  static async googleDisconnect(req, res, next) {
    try {
      const admin = await UserModel.findAdmin();
      if (!admin) {
        return res.status(500).json({ message: 'No admin user found' });
      }

      await UserModel.clearGoogleConnection(admin.id);
      res.json({ message: 'Google Calendar disconnected' });
    } catch (error) {
      next(error);
    }
  }
}
