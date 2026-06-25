import db from '../config/database.js';

export class PropertyModel {
  static async create(data) {
    return db.one(
      `INSERT INTO properties (
        title, description, address, city, province, postal_code,
        latitude, longitude, price, bedrooms, bathrooms, sqft,
        amenities, availability_date, lease_term_months,
        deposit_amount, neighborhood_info, status, owner_id, property_type,
        listing_type, is_furnished, price_daily, price_weekly, price_monthly, min_stay_nights
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26
      ) RETURNING *`,
      [
        data.title,
        data.description || null,
        data.address,
        data.city || null,
        data.province || null,
        data.postal_code || null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.price ?? null,
        data.bedrooms ?? null,
        data.bathrooms ?? null,
        data.sqft ?? null,
        JSON.stringify(data.amenities || []),
        data.availability_date || null,
        data.lease_term_months ?? null,
        data.deposit_amount ?? null,
        data.neighborhood_info || null,
        data.status || 'available',
        data.owner_id,
        data.property_type || null,
        data.listing_type || 'long_term',
        data.is_furnished ?? false,
        data.price_daily ?? null,
        data.price_weekly ?? null,
        data.price_monthly ?? null,
        data.min_stay_nights ?? null,
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

    if (typeof filters.ids === 'string') {
      filters.ids = filters.ids.split(',').map(Number).filter(n => n > 0);
    }

    // featured_first means "the public page wants Bill's curation to win." Status + listing_type
    // become *presentation* filters that featured slots can punch through (so a featured furnished
    // home or a featured leased home still appears on the homepage). Bedrooms/baths/price/etc.
    // are *renter* filters and stay strict for everyone — a 1-bedroom doesn't leak past a
    // 3-bedroom filter just because Bill featured it.
    const featureOverride = filters.featured_first && !filters.isAdmin;
    const presentation = [];

    // Status: public sees 'available' + 'occupied' (occupied = leased, shown as social proof),
    // but may narrow to available-only (e.g. the homepage "Available now" section). Public can
    // never see 'maintenance'. Admin can filter or see all.
    if (filters.isAdmin && filters.status) {
      conditions.push(`status = $${idx++}`);
      values.push(filters.status);
    } else if (!filters.isAdmin && filters.status === 'available') {
      (featureOverride ? presentation : conditions).push(`status = 'available'`);
    } else if (!filters.isAdmin) {
      (featureOverride ? presentation : conditions).push(`status IN ('available', 'occupied')`);
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
      conditions.push(`LOWER(city) LIKE LOWER($${idx++})`);
      values.push(`%${filters.city}%`);
    }
    if (filters.property_type) {
      conditions.push(`property_type = $${idx++}`);
      values.push(filters.property_type);
    }
    if (filters.listing_type) {
      (featureOverride ? presentation : conditions).push(`listing_type = $${idx++}`);
      values.push(filters.listing_type);
    }
    if (filters.available_by) {
      conditions.push(`availability_date <= $${idx++}`);
      values.push(filters.available_by);
    }

    if (filters.ids && filters.ids.length > 0) {
      conditions.push(`p.id = ANY($${idx++}::int[])`);
      values.push(filters.ids);
    }

    if (filters.featured) {
      conditions.push(`featured_position IS NOT NULL`);
    }

    if (filters.min_lat !== undefined && filters.max_lat !== undefined &&
        filters.min_lng !== undefined && filters.max_lng !== undefined) {
      conditions.push(`latitude >= $${idx++}`);
      values.push(filters.min_lat);
      conditions.push(`latitude <= $${idx++}`);
      values.push(filters.max_lat);
      conditions.push(`longitude >= $${idx++}`);
      values.push(filters.min_lng);
      conditions.push(`longitude <= $${idx++}`);
      values.push(filters.max_lng);
    }

    // Featured override: presentation filters apply EXCEPT for featured slots — Bill's
    // curated picks bypass status/listing_type (maintenance stays out, always).
    if (featureOverride && presentation.length > 0) {
      conditions.push(
        `((${presentation.join(' AND ')}) OR (featured_position IS NOT NULL AND status <> 'maintenance'))`
      );
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
    // featured=true forces position-order so slot 1, 2, 3 come back in that sequence (featured-only views).
    // featured_first=true: Bill's curated picks pin to the top in slot order regardless of status or
    //   listing_type (paired with the WHERE override above). Non-featured rows then sort available-first
    //   (a leased home never sits above an available non-featured one) and finally by the user's sort.
    // Otherwise (e.g. admin management list), available homes sort before occupied, then the user's sort.
    const userSort = sortMap[filters.sort] || sortMap.newest;
    let orderBy;
    if (filters.featured) {
      orderBy = 'featured_position ASC';
    } else if (filters.featured_first) {
      orderBy = `featured_position ASC NULLS LAST, (status = 'available') DESC, ${userSort}`;
    } else {
      orderBy = `(status = 'available') DESC, ${userSort}`;
    }

    // Pagination
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
    const offset = (page - 1) * limit;

    // Count total matching rows
    const countResult = await db.one(
      `SELECT COUNT(*)::int AS total FROM properties p ${where}`,
      values
    );

    // Fetch page
    const data = await db.any(
      `SELECT p.*, COALESCE(ic.cnt, 0)::int AS inquiry_count,
         COALESCE(
           (SELECT json_agg(sub ORDER BY sub.sort_order, sub.created_at)
            FROM (SELECT id, property_id, type, url, sort_order, is_primary, created_at
                  FROM property_media WHERE property_id = p.id) sub),
           '[]'::json
         ) AS images
       FROM properties p
       LEFT JOIN (SELECT property_id, COUNT(*)::int AS cnt FROM inquiries GROUP BY property_id) ic
         ON ic.property_id = p.id
       ${where} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`,
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

    // Keep pricing consistent with the listing type whenever it's being set, so
    // toggling long<->short can't strand the other type's price/rates on the row.
    // Only fires when listing_type is part of this update — partial updates like a
    // status flip leave pricing untouched.
    if (data.listing_type === 'long_term') {
      data.price_daily = null;
      data.price_weekly = null;
      data.price_monthly = null;
      data.min_stay_nights = null;
      data.is_furnished = false;
    } else if (data.listing_type === 'short_term') {
      data.price = null;
    }

    const allowed = [
      'title', 'description', 'address', 'city', 'province', 'postal_code',
      'latitude', 'longitude', 'price', 'bedrooms', 'bathrooms', 'sqft',
      'amenities', 'availability_date', 'lease_term_months',
      'deposit_amount', 'neighborhood_info', 'status', 'property_type',
      'featured_position',
      'listing_type', 'is_furnished', 'price_daily', 'price_weekly', 'price_monthly', 'min_stay_nights',
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

  /**
   * Atomically place a property into a featured slot (1, 2, or 3) or clear it (null).
   * If another property already holds the target slot, that property is kicked out
   * (its featured_position set to NULL) inside the same transaction. Returns the
   * updated row, or null if the property doesn't exist.
   */
  static async setFeaturedPosition(id, position) {
    return db.tx(async t => {
      const exists = await t.oneOrNone('SELECT id FROM properties WHERE id = $1', [id]);
      if (!exists) return null;

      if (position === null) {
        return t.one(
          'UPDATE properties SET featured_position = NULL WHERE id = $1 RETURNING *',
          [id]
        );
      }

      // Kick out whoever currently holds this slot (excluding self — no-op if it's already us).
      await t.none(
        'UPDATE properties SET featured_position = NULL WHERE featured_position = $1 AND id <> $2',
        [position, id]
      );

      return t.one(
        'UPDATE properties SET featured_position = $1 WHERE id = $2 RETURNING *',
        [position, id]
      );
    });
  }
}
