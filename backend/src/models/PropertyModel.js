import db from '../config/database.js';

export class PropertyModel {
  static async create(data) {
    return db.one(
      `INSERT INTO properties (
        title, description, address, city, province, postal_code,
        latitude, longitude, price, bedrooms, bathrooms, sqft,
        amenities, availability_date, lease_term_months,
        deposit_amount, neighborhood_info, status, owner_id, property_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14, $15, $16, $17, $18, $19, $20
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
        data.property_type || null,
      ]
    );
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM properties WHERE id = $1', [id]);
  }

  static async findFiltered(filters = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    // Status: public locked to 'available', admin can filter or see all
    if (filters.isAdmin && filters.status) {
      conditions.push(`status = $${idx++}`);
      values.push(filters.status);
    } else if (!filters.isAdmin) {
      conditions.push(`status = 'available'`);
    }

    if (filters.min_price !== undefined) {
      conditions.push(`price >= $${idx++}`);
      values.push(filters.min_price);
    }
    if (filters.max_price !== undefined) {
      conditions.push(`price <= $${idx++}`);
      values.push(filters.max_price);
    }
    if (filters.bedrooms !== undefined) {
      conditions.push(`bedrooms >= $${idx++}`);
      values.push(filters.bedrooms);
    }
    if (filters.bathrooms !== undefined) {
      conditions.push(`bathrooms >= $${idx++}`);
      values.push(filters.bathrooms);
    }
    if (filters.min_sqft !== undefined) {
      conditions.push(`sqft >= $${idx++}`);
      values.push(filters.min_sqft);
    }
    if (filters.max_sqft !== undefined) {
      conditions.push(`sqft <= $${idx++}`);
      values.push(filters.max_sqft);
    }
    if (filters.city) {
      conditions.push(`LOWER(city) = LOWER($${idx++})`);
      values.push(filters.city);
    }
    if (filters.property_type) {
      conditions.push(`property_type = $${idx++}`);
      values.push(filters.property_type);
    }
    if (filters.available_by) {
      conditions.push(`availability_date <= $${idx++}`);
      values.push(filters.available_by);
    }

    const where = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Sort
    const sortMap = {
      price_asc: 'price ASC',
      price_desc: 'price DESC',
      newest: 'created_at DESC',
      availability: 'availability_date ASC NULLS LAST',
      title_asc: 'title ASC',
    };
    const orderBy = sortMap[filters.sort] || sortMap.newest;

    // Pagination
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
    const offset = (page - 1) * limit;

    // Count total matching rows
    const countResult = await db.one(
      `SELECT COUNT(*)::int AS total FROM properties ${where}`,
      values
    );

    // Fetch page
    const data = await db.any(
      `SELECT * FROM properties ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total: countResult.total,
        total_pages: Math.ceil(countResult.total / limit),
      },
    };
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      'title', 'description', 'address', 'city', 'province', 'postal_code',
      'latitude', 'longitude', 'price', 'bedrooms', 'bathrooms', 'sqft',
      'amenities', 'availability_date', 'lease_term_months',
      'deposit_amount', 'neighborhood_info', 'status', 'property_type',
    ];

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx}`);
        values.push(field === 'amenities' ? JSON.stringify(data[field]) : data[field]);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    return db.oneOrNone(
      `UPDATE properties SET ${fields.join(', ')}
       WHERE id = $${idx} RETURNING *`,
      values
    );
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM properties WHERE id = $1', [id]);
    return result.rowCount;
  }
}
