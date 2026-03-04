import dotenv from 'dotenv';
dotenv.config();

import db from '../config/database.js';

const DEMO_PROPERTIES = [
  {
    title: 'Cozy 1BR in Kitsilano',
    description: 'Bright ground-floor apartment steps from Kits Beach. In-suite laundry, shared backyard.',
    address: '2145 W 4th Ave',
    city: 'Vancouver',
    province: 'BC',
    postal_code: 'V6K 1N7',
    latitude: 49.2685,
    longitude: -123.1639,
    price: 1850,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 550,
    property_type: 'apartment',
    amenities: ['in-suite laundry', 'backyard', 'bike storage'],
    availability_date: '2026-04-01',
    lease_term_months: 12,
    deposit_amount: 1850,
  },
  {
    title: 'Spacious 2BR Townhouse in Burnaby',
    description: 'End unit with private patio. Close to Metrotown and transit.',
    address: '4520 Kingsway',
    city: 'Burnaby',
    province: 'BC',
    postal_code: 'V5H 2B1',
    latitude: 49.2276,
    longitude: -123.0076,
    price: 2600,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1100,
    property_type: 'townhouse',
    amenities: ['patio', 'parking', 'dishwasher'],
    availability_date: '2026-04-15',
    lease_term_months: 12,
    deposit_amount: 2600,
  },
  {
    title: 'Modern 3BR House in New Westminster',
    description: 'Renovated home with mountain views. Large fenced yard, perfect for families.',
    address: '312 Queens Ave',
    city: 'New Westminster',
    province: 'BC',
    postal_code: 'V3L 1K3',
    latitude: 49.2057,
    longitude: -122.9110,
    price: 3200,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    property_type: 'house',
    amenities: ['fenced yard', 'garage', 'mountain views', 'renovated kitchen'],
    availability_date: '2026-05-01',
    lease_term_months: 12,
    deposit_amount: 3200,
  },
  {
    title: 'Bright Basement Suite in Surrey',
    description: 'Separate entrance, newly finished. Quiet neighborhood near parks.',
    address: '8912 140th St',
    city: 'Surrey',
    province: 'BC',
    postal_code: 'V3V 5Z4',
    latitude: 49.1913,
    longitude: -122.8490,
    price: 1400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    property_type: 'basement_suite',
    amenities: ['separate entrance', 'parking', 'utilities included'],
    availability_date: '2026-03-15',
    lease_term_months: 6,
    deposit_amount: 1400,
  },
  {
    title: 'Downtown Vancouver Condo',
    description: 'High-rise living with concierge. Walk to everything — Seawall, restaurants, transit.',
    address: '1055 Homer St',
    city: 'Vancouver',
    province: 'BC',
    postal_code: 'V6B 0G3',
    latitude: 49.2750,
    longitude: -123.1216,
    price: 2200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 520,
    property_type: 'condo',
    amenities: ['concierge', 'gym', 'rooftop deck', 'bike room'],
    availability_date: '2026-04-01',
    lease_term_months: 12,
    deposit_amount: 2200,
  },
  {
    title: 'Family Duplex in Port Moody',
    description: 'Upper unit of a quiet duplex. Backs onto Shoreline Trail. Great school district.',
    address: '2234 Clarke St',
    city: 'Port Moody',
    province: 'BC',
    postal_code: 'V3H 1Y8',
    latitude: 49.2838,
    longitude: -122.8317,
    price: 2800,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1400,
    property_type: 'duplex',
    amenities: ['trail access', 'parking', 'storage', 'pet-friendly'],
    availability_date: '2026-05-01',
    lease_term_months: 12,
    deposit_amount: 2800,
  },
];

async function seedDemoProperties() {
  try {
    // Find or require admin user
    const admin = await db.oneOrNone("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!admin) {
      console.error('No admin user found. Run npm run seed first.');
      process.exit(1);
    }

    for (const p of DEMO_PROPERTIES) {
      const existing = await db.oneOrNone(
        'SELECT id FROM properties WHERE title = $1 AND address = $2',
        [p.title, p.address]
      );
      if (existing) {
        console.log(`  Skipping "${p.title}" (already exists)`);
        continue;
      }

      await db.one(
        `INSERT INTO properties (
          title, description, address, city, province, postal_code,
          latitude, longitude, price, bedrooms, bathrooms, sqft,
          property_type, amenities, availability_date, lease_term_months,
          deposit_amount, owner_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14::jsonb, $15, $16, $17, $18
        ) RETURNING id`,
        [
          p.title, p.description, p.address, p.city, p.province, p.postal_code,
          p.latitude, p.longitude, p.price, p.bedrooms, p.bathrooms, p.sqft,
          p.property_type, JSON.stringify(p.amenities), p.availability_date,
          p.lease_term_months, p.deposit_amount, admin.id,
        ]
      );
      console.log(`  Added "${p.title}"`);
    }

    console.log('Demo properties seeded.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seedDemoProperties();
