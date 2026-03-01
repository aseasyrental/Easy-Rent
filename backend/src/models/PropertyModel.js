import db from '../config/database.js';

export class PropertyModel {
  static async create(data) {
    return db.one(
      `INSERT INTO properties (
        title, description, address, city, province, postal_code,
        latitude, longitude, price, bedrooms, bathrooms, sqft,
        amenities, availability_date, lease_term_months,
        deposit_amount, neighborhood_info, status, owner_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        data.title,
        data.description || null,
        data.address,
        data.city || null,
        data.province || null,
        data.postal_code || null,
        data.latitude || null,
        data.longitude || null,
        data.price,
        data.bedrooms || null,
        data.bathrooms || null,
        data.sqft || null,
        JSON.stringify(data.amenities || []),
        data.availability_date || null,
        data.lease_term_months || null,
        data.deposit_amount || null,
        data.neighborhood_info || null,
        data.status || 'available',
        data.owner_id,
      ]
    );
  }
}
