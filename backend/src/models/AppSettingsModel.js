import db from '../config/database.js';

export class AppSettingsModel {
  static async get() {
    return db.oneOrNone('SELECT * FROM app_settings WHERE id = 1');
  }

  static async update({ working_hours_start, working_hours_end, bill_contact_phone }) {
    return db.one(
      `UPDATE app_settings
       SET working_hours_start = COALESCE($1, working_hours_start),
           working_hours_end = COALESCE($2, working_hours_end),
           bill_contact_phone = COALESCE($3, bill_contact_phone),
           updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [working_hours_start, working_hours_end, bill_contact_phone]
    );
  }
}
