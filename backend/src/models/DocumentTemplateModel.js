import db from '../config/database.js';

export class DocumentTemplateModel {
  static async create({ title, category, file_url, file_name, file_size }) {
    return db.one(
      `INSERT INTO document_templates (title, category, file_url, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, category, file_url, file_name, file_size]
    );
  }

  static async findAll() {
    return db.any('SELECT * FROM document_templates ORDER BY created_at DESC');
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM document_templates WHERE id = $1', [id]);
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM document_templates WHERE id = $1', [id]);
    return result.rowCount;
  }
}
