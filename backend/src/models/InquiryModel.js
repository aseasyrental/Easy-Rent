import db from '../config/database.js';

export class InquiryModel {
  static async create({ property_id, name, email, message }) {
    return db.one(
      `INSERT INTO inquiries (property_id, name, email, message, type, status)
       VALUES ($1, $2, $3, $4, 'question', 'new') RETURNING *`,
      [property_id, name, email, message]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      'SELECT * FROM inquiries WHERE property_id = $1 ORDER BY created_at DESC',
      [propertyId]
    );
  }
}
