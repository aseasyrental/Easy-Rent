import db from '../config/database.js';

export class InquiryModel {
  static async create({ property_id, name, email, phone, message }) {
    return db.one(
      `INSERT INTO inquiries (property_id, name, email, phone, message, type, status)
       VALUES ($1, $2, $3, $4, $5, 'question', 'new') RETURNING *`,
      [property_id, name, email, phone || null, message]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      'SELECT * FROM inquiries WHERE property_id = $1 ORDER BY created_at DESC',
      [propertyId]
    );
  }

  static async findAll(filters = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`i.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.property_id) {
      conditions.push(`i.property_id = $${idx++}`);
      values.push(filters.property_id);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return db.any(
      `SELECT i.*, p.title AS property_title, p.address AS property_address
       FROM inquiries i
       LEFT JOIN properties p ON p.id = i.property_id
       ${where}
       ORDER BY i.created_at DESC`,
      values
    );
  }

  static async findById(id) {
    return db.oneOrNone(
      `SELECT i.*, p.title AS property_title, p.address AS property_address
       FROM inquiries i
       LEFT JOIN properties p ON p.id = i.property_id
       WHERE i.id = $1`,
      [id]
    );
  }

  static async updateStatus(id, status) {
    return db.oneOrNone(
      'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
  }
}
