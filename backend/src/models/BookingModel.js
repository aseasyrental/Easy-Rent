import db from '../config/database.js';

export class BookingModel {
  static async create({ property_id, scheduled_at, renter_name, renter_email, renter_phone, renter_note, verification_token, verification_expires_at }) {
    return db.one(
      `INSERT INTO bookings (property_id, scheduled_at, renter_name, renter_email, renter_phone, renter_note, status, verification_token, verification_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending_verification', $7, $8)
       RETURNING *`,
      [property_id, scheduled_at, renter_name, renter_email, renter_phone || null, renter_note || null, verification_token, verification_expires_at]
    );
  }

  static async findByVerificationToken(token) {
    return db.oneOrNone(
      `SELECT b.*, p.title as property_title, p.address as property_address
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE b.verification_token = $1`,
      [token]
    );
  }

  static async findByCancelToken(token) {
    return db.oneOrNone(
      `SELECT b.*, p.title as property_title, p.address as property_address
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE b.cancel_token = $1`,
      [token]
    );
  }

  static async confirmBooking(id, { cancel_token, google_event_id }) {
    return db.oneOrNone(
      `UPDATE bookings
       SET status = 'confirmed', cancel_token = $2, google_event_id = $3, verification_token = NULL, verification_expires_at = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'pending_verification'
       RETURNING *`,
      [id, cancel_token, google_event_id]
    );
  }

  static async cancelBooking(id) {
    return db.oneOrNone(
      `UPDATE bookings
       SET status = 'cancelled', cancel_token = NULL, updated_at = NOW()
       WHERE id = $1 AND status IN ('pending_verification', 'confirmed')
       RETURNING *`,
      [id]
    );
  }

  static async updateStatus(id, status) {
    return db.oneOrNone(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
  }

  static async findById(id) {
    return db.oneOrNone(
      `SELECT b.*, p.title as property_title, p.address as property_address
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE b.id = $1`,
      [id]
    );
  }

  static async findAll(filters = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`b.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.property_id) {
      conditions.push(`b.property_id = $${idx++}`);
      values.push(filters.property_id);
    }
    if (filters.from_date) {
      conditions.push(`b.scheduled_at >= $${idx++}`);
      values.push(filters.from_date);
    }
    if (filters.to_date) {
      conditions.push(`b.scheduled_at <= $${idx++}`);
      values.push(filters.to_date);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return db.any(
      `SELECT b.*, p.title as property_title, p.address as property_address
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       ${where}
       ORDER BY b.scheduled_at ASC`,
      values
    );
  }

  static async findActiveByPropertyId(propertyId) {
    return db.any(
      `SELECT * FROM bookings
       WHERE property_id = $1 AND status IN ('pending_verification', 'confirmed')
       ORDER BY scheduled_at ASC`,
      [propertyId]
    );
  }

  static async findUpcomingConfirmed() {
    return db.any(
      `SELECT b.*, p.title as property_title
       FROM bookings b
       LEFT JOIN properties p ON p.id = b.property_id
       WHERE b.status = 'confirmed' AND b.scheduled_at >= NOW()
       ORDER BY b.scheduled_at ASC`
    );
  }

  static async findPendingVerificationsExpiringBefore(date) {
    return db.any(
      `SELECT * FROM bookings
       WHERE status = 'pending_verification' AND verification_expires_at <= $1`,
      [date]
    );
  }

  static async deleteExpiredPending() {
    return db.result(
      `DELETE FROM bookings
       WHERE status = 'pending_verification' AND verification_expires_at <= NOW()`
    );
  }

  static async findExistingPendingOrConfirmed({ renter_email, property_id, scheduled_at }) {
    return db.oneOrNone(
      `SELECT * FROM bookings
       WHERE renter_email = $1 AND property_id = $2 AND scheduled_at = $3
       AND status IN ('pending_verification', 'confirmed')`,
      [renter_email, property_id, scheduled_at]
    );
  }
}
