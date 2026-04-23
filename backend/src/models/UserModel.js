import db from '../config/database.js';

export class UserModel {
  static async create({ name, email, password, role = 'tenant', phone = null }) {
    return db.one(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, password, role, phone]
    );
  }

  static async findByEmail(email) {
    return db.oneOrNone('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  }

  static async findById(id) {
    return db.oneOrNone(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [id]
    );
  }

  static async findAdmin() {
    return db.oneOrNone(
      `SELECT id, name, email, role, phone, google_refresh_token, google_calendar_id,
              google_connected_at, google_disconnect_notified_at
       FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`
    );
  }

  static async updateGoogleConnection(id, { google_refresh_token, google_calendar_id, google_connected_at }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (google_refresh_token !== undefined) {
      fields.push(`google_refresh_token = $${idx++}`);
      values.push(google_refresh_token);
    }
    if (google_calendar_id !== undefined) {
      fields.push(`google_calendar_id = $${idx++}`);
      values.push(google_calendar_id);
    }
    if (google_connected_at !== undefined) {
      fields.push(`google_connected_at = $${idx++}`);
      values.push(google_connected_at);
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    return db.oneOrNone(
      `UPDATE users SET ${fields.join(', ')}, google_disconnect_notified_at = NULL, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
  }

  static async clearGoogleConnection(id) {
    return db.oneOrNone(
      `UPDATE users
       SET google_refresh_token = NULL, google_calendar_id = NULL,
           google_connected_at = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
  }

  static async markGoogleDisconnectNotified(id) {
    return db.oneOrNone(
      `UPDATE users SET google_disconnect_notified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
  }
}
