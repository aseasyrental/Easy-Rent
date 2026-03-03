import db from '../config/database.js';

export class PropertyMediaModel {
  static async create({ property_id, type, url, sort_order, is_primary }) {
    return db.one(
      `INSERT INTO property_media (property_id, type, url, sort_order, is_primary)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [property_id, type || 'photo', url, sort_order || 0, is_primary || false]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      `SELECT * FROM property_media WHERE property_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [propertyId]
    );
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM property_media WHERE id = $1', [id]);
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM property_media WHERE id = $1', [id]);
    return result.rowCount;
  }

  static async setPrimary(propertyId, mediaId) {
    await db.tx(async t => {
      await t.none('UPDATE property_media SET is_primary = false WHERE property_id = $1', [propertyId]);
      await t.none('UPDATE property_media SET is_primary = true WHERE id = $1 AND property_id = $2', [mediaId, propertyId]);
    });
  }
}
