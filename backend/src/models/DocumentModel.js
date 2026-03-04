import db from '../config/database.js';

export class DocumentModel {
  static async create({ property_id, title, file_url, type }) {
    return db.one(
      `INSERT INTO documents (property_id, title, file_url, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [property_id, title, file_url, type]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      'SELECT * FROM documents WHERE property_id = $1 ORDER BY created_at DESC',
      [propertyId]
    );
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM documents WHERE id = $1', [id]);
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM documents WHERE id = $1', [id]);
    return result.rowCount;
  }
}
